#!/usr/bin/env tsx
/**
 * ingest-from-issue.ts
 *
 * Scaffolds skills/<N-category>/<slug>/SKILL.md from a triaged GitHub issue
 * in peter-tu-zynkr/zynkr-skill-idea. Designed to run inside the
 * pickup-approved-issue workflow (repository_dispatch from /skill-triager).
 *
 * Usage:
 *   ISSUE_NUMBER=12 ISSUE_REPO=peter-tu-zynkr/zynkr-skill-idea \
 *     SLUG=video-use CATEGORY=engineer \
 *     npx tsx scripts/ingest-from-issue.ts
 *
 * Or via CLI:
 *   npx tsx scripts/ingest-from-issue.ts \
 *     --issue 12 --repo peter-tu-zynkr/zynkr-skill-idea \
 *     --slug video-use --category engineer
 *
 * Outputs the relative path of the new SKILL.md on stdout's last line —
 * the wrapping workflow reads it to decide commit/PR title.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");

// Numeric prefix → on-disk folder name (must already exist).
// Mirrors the actual `skills/` tree, not just the schema TAXONOMY.
const FOLDER_BY_NUMBER: Record<string, string> = {
  "0": "0-strategy",
  "1": "1-brand-marketing",
  "2": "2-sales-consultant",
  "3": "3-operations",
  "4": "4-training",
  "5": "5-product",
  "6": "6-engineer",
  "7": "7-people-talent",
  "8": "8-finance-admin",
  "9": "9-legal",
};

// Slug → numeric prefix. Used when category arrives as a slug instead of a digit.
// Canonical slugs match scripts/validate-skill.ts TAXONOMY (taxonomy.md SOT).
// Legacy aliases preserved so older [Skill Proposal] issue bodies still resolve.
const NUMBER_BY_SLUG: Record<string, string> = {
  strategy: "0",
  "brand-marketing": "1",
  "sales-consultant": "2",
  // legacy alias
  "business-consulting": "2",
  operations: "3",
  training: "4",
  product: "5",
  engineer: "6",
  "people-talent": "7",
  // legacy aliases
  "talent-development": "7",
  people: "7",
  "finance-admin": "8",
  legal: "9",
};

// Schema-compliant frontmatter `category` value for each number.
// Must align with scripts/validate-skill.ts TAXONOMY.
const SCHEMA_CATEGORY_BY_NUMBER: Record<string, string> = {
  "0": "strategy",
  "1": "brand-marketing",
  "2": "sales-consultant",
  "3": "operations",
  "4": "training",
  "5": "product",
  "6": "engineer",
  "7": "people-talent",
  "8": "finance-admin",
  "9": "legal",
};

type Args = {
  issueNumber: string;
  issueRepo: string;
  slug: string;
  category: string; // either a digit "0".."9" or a slug
  specUrl?: string;
  mode: "rescaffold" | "lift-and-shift";
  upstreamUrl?: string; // required when mode === "lift-and-shift"
  upstreamAuthor?: string; // optional override; falls back to org from upstreamUrl
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const rawMode = (get("--mode") ?? process.env.MODE ?? "rescaffold").trim();
  const mode: Args["mode"] = rawMode === "lift-and-shift" ? "lift-and-shift" : "rescaffold";
  const args: Args = {
    issueNumber: get("--issue") ?? process.env.ISSUE_NUMBER ?? "",
    issueRepo: get("--repo") ?? process.env.ISSUE_REPO ?? "peter-tu-zynkr/zynkr-skill-idea",
    slug: get("--slug") ?? process.env.SLUG ?? "",
    category: get("--category") ?? process.env.CATEGORY ?? "",
    specUrl: get("--spec-url") ?? process.env.SPEC_URL,
    mode,
    upstreamUrl: get("--upstream-url") ?? process.env.UPSTREAM_URL,
    upstreamAuthor: get("--upstream-author") ?? process.env.UPSTREAM_AUTHOR,
  };
  if (mode === "lift-and-shift" && !args.upstreamUrl) {
    console.error("Missing --upstream-url / UPSTREAM_URL — required when mode=lift-and-shift");
    process.exit(2);
  }
  const missing = (["issueNumber", "slug", "category"] as const).filter((k) => !args[k]);
  if (missing.length) {
    console.error(`Missing required args: ${missing.join(", ")}`);
    console.error("See header comment for usage.");
    process.exit(2);
  }
  return args;
}

function resolveCategory(input: string): { number: string; folder: string; slug: string } {
  // Accept "0", "strategy", or combined "0-strategy" form (the form used in labels and Build Target Path).
  const trimmed = input.trim().toLowerCase();
  let digit: string | undefined;
  if (/^\d$/.test(trimmed)) {
    digit = trimmed;
  } else if (/^\d-/.test(trimmed)) {
    digit = trimmed.charAt(0);
  } else {
    digit = NUMBER_BY_SLUG[trimmed];
  }
  if (!digit) throw new Error(`Unknown category: "${input}". Expected digit 0-9, known slug, or "N-slug" combined form.`);
  const folder = FOLDER_BY_NUMBER[digit];
  if (!folder) throw new Error(`No on-disk folder for category number ${digit}.`);
  const schemaSlug = SCHEMA_CATEGORY_BY_NUMBER[digit];
  if (!schemaSlug) throw new Error(`No schema-compliant slug for category number ${digit}.`);
  return { number: digit, folder, slug: schemaSlug };
}

type IssueFields = {
  title: string;
  body: string;
  url: string;
  author: string;
};

function fetchIssue(repo: string, number: string): IssueFields {
  const raw = execSync(
    `gh api repos/${repo}/issues/${number} --jq '{title, body, html_url, user: .user.login}'`,
    { encoding: "utf-8" }
  );
  const parsed = JSON.parse(raw);
  return {
    title: parsed.title ?? "",
    body: parsed.body ?? "",
    url: parsed.html_url ?? "",
    author: parsed.user ?? "unknown",
  };
}

function fetchSpec(repo: string, slug: string): string | null {
  // Spec lives at skills/approved/{slug}.md in the idea repo (per skill-sourcer).
  try {
    const raw = execSync(
      `gh api repos/${repo}/contents/skills/approved/${slug}.md --jq '.content'`,
      { encoding: "utf-8" }
    );
    const decoded = Buffer.from(raw.trim(), "base64").toString("utf-8");
    return decoded;
  } catch {
    return null;
  }
}

function parseGithubOwnerRepo(url: string): { owner: string; repo: string } | null {
  // https://github.com/owner/repo  (trailing slash, .git, or path are tolerated)
  const m = url.match(/^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:[\/?#].*)?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

type ParsedGithubUrl = {
  owner: string;
  repo: string;
  // "blob" or "tree" if the URL drills into a path within the repo; null otherwise.
  pathType: "blob" | "tree" | null;
  // Branch / tag / commit ref following /blob/ or /tree/. null when pathType is null.
  ref: string | null;
  // Path inside the repo (no leading slash). Empty string when pathType is null.
  path: string;
};

function parseGithubUrl(url: string): ParsedGithubUrl | null {
  // Tolerate trailing slash / .git / query / fragment.
  // Accepts:
  //   https://github.com/owner/repo
  //   https://github.com/owner/repo/tree/<ref>/<path>
  //   https://github.com/owner/repo/blob/<ref>/<path/to/file>
  const cleaned = url.replace(/[?#].*$/, "").replace(/\/$/, "");
  const repoOnly = cleaned.match(/^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/i);
  if (repoOnly) {
    return { owner: repoOnly[1], repo: repoOnly[2], pathType: null, ref: null, path: "" };
  }
  const withPath = cleaned.match(
    /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?\/(tree|blob)\/([^\/]+)(?:\/(.*))?$/i
  );
  if (withPath) {
    return {
      owner: withPath[1],
      repo: withPath[2],
      pathType: withPath[3].toLowerCase() as "blob" | "tree",
      ref: withPath[4],
      path: withPath[5] ?? "",
    };
  }
  return null;
}

function fetchUpstreamReadme(upstreamUrl: string): { content: string; sourceUrl: string } | null {
  // Honors three URL shapes:
  //   1. Repo root             https://github.com/owner/repo
  //      → calls the GitHub /readme endpoint (autodetects README.md, .rst, etc.)
  //   2. Subdirectory          https://github.com/owner/repo/tree/<ref>/skills/<slug>
  //      → looks for SKILL.md inside the directory first, then README.md, then any *.md.
  //        This matches the canonical layout of multi-skill upstreams (vercel-labs/skills,
  //        anthropics/skills) so lift-and-shift no longer falls back to the CLI README.
  //   3. Specific file         https://github.com/owner/repo/blob/<ref>/path/to/SKILL.md
  //      → fetches that file directly.
  // If the deeper fetch fails for any reason, falls back to the repo-root README so we
  // never produce zero content — better to attribute imperfectly than to ship empty.
  const parsed = parseGithubUrl(upstreamUrl) ?? (() => {
    const legacy = parseGithubOwnerRepo(upstreamUrl);
    return legacy ? { ...legacy, pathType: null as null, ref: null, path: "" } : null;
  })();
  if (!parsed) return null;

  const { owner, repo, pathType, ref, path: subpath } = parsed;

  // Helper: fetch a specific file via the contents API. Returns null on any failure.
  const fetchFile = (filePath: string, refForUrl: string): { content: string; sourceUrl: string } | null => {
    try {
      const refQuery = refForUrl ? `?ref=${encodeURIComponent(refForUrl)}` : "";
      const meta = execSync(
        `gh api "repos/${owner}/${repo}/contents/${filePath}${refQuery}"`,
        { encoding: "utf-8" }
      );
      const obj = JSON.parse(meta);
      const content = Buffer.from(obj.content ?? "", "base64").toString("utf-8");
      return { content, sourceUrl: obj.html_url ?? `https://github.com/${owner}/${repo}/blob/${refForUrl || "main"}/${filePath}` };
    } catch {
      return null;
    }
  };

  // Helper: list directory contents, pick the best candidate file. Returns null on any failure.
  const fetchFromDir = (dirPath: string, refForUrl: string): { content: string; sourceUrl: string } | null => {
    try {
      const refQuery = refForUrl ? `?ref=${encodeURIComponent(refForUrl)}` : "";
      const listing = execSync(
        `gh api "repos/${owner}/${repo}/contents/${dirPath}${refQuery}"`,
        { encoding: "utf-8" }
      );
      const entries = JSON.parse(listing) as Array<{ name: string; path: string; type: string }>;
      if (!Array.isArray(entries)) return null;
      // Preference order: SKILL.md > README.md > first *.md found.
      const byName = (target: string) =>
        entries.find((e) => e.type === "file" && e.name.toLowerCase() === target.toLowerCase());
      const chosen =
        byName("SKILL.md") ??
        byName("README.md") ??
        entries.find((e) => e.type === "file" && e.name.toLowerCase().endsWith(".md"));
      if (!chosen) return null;
      return fetchFile(chosen.path, refForUrl);
    } catch {
      return null;
    }
  };

  // Repo-root README — the canonical autodetect path. Used both as the primary path
  // when there's no subpath, and as a safety net when subpath fetches fail.
  const fetchRepoReadme = (): { content: string; sourceUrl: string } | null => {
    try {
      const meta = execSync(
        `gh api repos/${owner}/${repo}/readme`,
        { encoding: "utf-8" }
      );
      const obj = JSON.parse(meta);
      const content = Buffer.from(obj.content ?? "", "base64").toString("utf-8");
      return { content, sourceUrl: obj.html_url ?? `https://github.com/${owner}/${repo}/blob/main/README.md` };
    } catch {
      return null;
    }
  };

  if (pathType === "blob" && subpath) {
    return fetchFile(subpath, ref ?? "main") ?? fetchRepoReadme();
  }
  if (pathType === "tree" && subpath) {
    return fetchFromDir(subpath, ref ?? "main") ?? fetchRepoReadme();
  }
  return fetchRepoReadme();
}

function extractField(body: string, label: string): string | undefined {
  // Issue template uses "### Label\n\nvalue\n\n" blocks. Tolerant match.
  const re = new RegExp(`^###\\s*${label}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|\\n*$)`, "im");
  const m = body.match(re);
  return m ? m[1].trim() : undefined;
}

function buildSkillMd(args: {
  slug: string;
  schemaCategorySlug: string;
  description: string;
  input: string;
  process: string;
  output: string;
  specBody: string;
  issueUrl: string;
  mode: Args["mode"];
  upstreamUrl?: string;
  upstreamAuthor?: string;
  upstreamReadme?: { content: string; sourceUrl: string } | null;
}): string {
  if (args.mode === "lift-and-shift") {
    return buildLiftAndShift(args);
  }
  return buildRescaffold(args);
}

function buildRescaffold(args: {
  slug: string;
  schemaCategorySlug: string;
  description: string;
  input: string;
  process: string;
  output: string;
  specBody: string;
  issueUrl: string;
}): string {
  // Note: upstream_repo intentionally omitted here. If the human discovers
  // during build that this skill is actually externally-sourced, they should
  // add the full attribution trio (upstream_repo / original_source_url /
  // original_author) — the validator enforces all-or-nothing.
  const fm = [
    "---",
    `name: ${args.slug}`,
    `category: ${args.schemaCategorySlug}`,
    `project: ${args.slug}`,
    "platform: claude",
    "status: Not started",
    "author: Peter Tu",
    `description: ${JSON.stringify(args.description || "TODO: one-line description")}`,
    `input: ${JSON.stringify(args.input || "TODO")}`,
    `process: ${JSON.stringify(args.process || "TODO")}`,
    `output: ${JSON.stringify(args.output || "TODO")}`,
    "synergy: []",
    "---",
    "",
  ].join("\n");

  const body = [
    `# ${args.slug}`,
    "",
    `> Scaffolded from [issue](${args.issueUrl}) via \`/skill-triager\` (mode: rescaffold). Status: \`Not started\`.`,
    "",
    "<!-- TODO: implement steps. Spec from skill-sourcer below for reference. -->",
    "",
    "## Spec (from skill-sourcer)",
    "",
    args.specBody.trim() || "_No spec md found at `skills/approved/<slug>.md` in the idea repo._",
    "",
  ].join("\n");

  return fm + body;
}

function buildLiftAndShift(args: {
  slug: string;
  schemaCategorySlug: string;
  description: string;
  input: string;
  process: string;
  output: string;
  specBody: string;
  issueUrl: string;
  upstreamUrl?: string;
  upstreamAuthor?: string;
  upstreamReadme?: { content: string; sourceUrl: string } | null;
}): string {
  const upstreamUrl = args.upstreamUrl!;
  const parsed = parseGithubOwnerRepo(upstreamUrl);
  const author = args.upstreamAuthor || parsed?.owner || "unknown";
  const sourceUrl = args.upstreamReadme?.sourceUrl || `${upstreamUrl}/blob/main/README.md`;
  const description = args.description || `Mirror of ${parsed?.owner}/${parsed?.repo}`;

  // Lift-and-shift sets the attribution trio by construction. Validator passes.
  const fm = [
    "---",
    `name: ${args.slug}`,
    `category: ${args.schemaCategorySlug}`,
    `project: ${args.slug}`,
    "platform: claude",
    "status: Done",
    `author: ${JSON.stringify(author)}`,
    `description: ${JSON.stringify(description)}`,
    `input: ${JSON.stringify(args.input || "See upstream README")}`,
    `process: ${JSON.stringify(args.process || "See upstream README")}`,
    `output: ${JSON.stringify(args.output || "See upstream README")}`,
    "synergy: []",
    `upstream_repo: ${upstreamUrl}`,
    `original_source_url: ${sourceUrl}`,
    `original_author: ${JSON.stringify(author)}`,
    "---",
    "",
  ].join("\n");

  const readmeBody = args.upstreamReadme?.content?.trim();
  const body = [
    `# ${args.slug}`,
    "",
    `> Lift-and-shift mirror of [${parsed?.owner ?? "upstream"}/${parsed?.repo ?? args.slug}](${upstreamUrl}) — original content by **${author}**. Sourced via [issue](${args.issueUrl}).`,
    "",
    "## About this skill",
    "",
    description,
    "",
    "## Upstream README",
    "",
    readmeBody || `_Upstream README could not be fetched. Visit ${upstreamUrl} directly._`,
    "",
    "## Attribution",
    "",
    `This card is a **lift-and-shift mirror** of the upstream project. All implementation, documentation, and design credit goes to **${author}** and the upstream contributors.`,
    "",
    `- **Upstream repo:** [${upstreamUrl}](${upstreamUrl})`,
    `- **Original source:** [${sourceUrl}](${sourceUrl})`,
    "",
  ].join("\n");

  return fm + body;
}

function main() {
  const args = parseArgs();
  const cat = resolveCategory(args.category);

  const targetDir = path.join(SKILLS_DIR, cat.folder, args.slug);
  const targetFile = path.join(targetDir, "SKILL.md");

  if (fs.existsSync(targetFile)) {
    console.error(`Already exists: ${path.relative(ROOT, targetFile)}. Aborting to avoid overwrite.`);
    process.exit(3);
  }

  const issue = fetchIssue(args.issueRepo, args.issueNumber);
  const spec = fetchSpec(args.issueRepo, args.slug) ?? "";

  const description =
    extractField(issue.body, "Description") ??
    extractField(issue.body, "One-line description") ??
    issue.title.replace(/^\[Skill Proposal\]\s*/i, "");
  const input = extractField(issue.body, "Input") ?? "";
  const proc = extractField(issue.body, "Process") ?? "";
  const output = extractField(issue.body, "Output") ?? "";

  const upstreamReadme =
    args.mode === "lift-and-shift" && args.upstreamUrl
      ? fetchUpstreamReadme(args.upstreamUrl)
      : null;

  const md = buildSkillMd({
    slug: args.slug,
    schemaCategorySlug: cat.slug,
    description,
    input,
    process: proc,
    output,
    specBody: spec,
    issueUrl: issue.url,
    mode: args.mode,
    upstreamUrl: args.upstreamUrl,
    upstreamAuthor: args.upstreamAuthor,
    upstreamReadme,
  });

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, md, "utf-8");

  const rel = path.relative(ROOT, targetFile);
  console.log(`Scaffolded: ${rel}`);
  // Last line: machine-readable for the workflow.
  console.log(rel);
}

main();
