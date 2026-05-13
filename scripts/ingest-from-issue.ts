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
  "6": "6-engineer",
  "7": "7-people",
  "8": "8-finance-admin",
  "9": "9-legal",
};

// Slug → numeric prefix. Used when category arrives as a slug instead of a digit.
// Slugs match scripts/validate-skill.ts TAXONOMY plus the on-disk variants.
const NUMBER_BY_SLUG: Record<string, string> = {
  strategy: "0",
  "brand-marketing": "1",
  "business-consulting": "2",
  "sales-consultant": "2",
  operations: "3",
  training: "4",
  product: "5",
  engineer: "6",
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
  "2": "business-consulting",
  "3": "operations",
  "4": "training",
  "5": "product",
  "6": "engineer",
  "7": "talent-development",
  "8": "finance-admin",
};

type Args = {
  issueNumber: string;
  issueRepo: string;
  slug: string;
  category: string; // either a digit "0".."9" or a slug
  specUrl?: string;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const args: Args = {
    issueNumber: get("--issue") ?? process.env.ISSUE_NUMBER ?? "",
    issueRepo: get("--repo") ?? process.env.ISSUE_REPO ?? "peter-tu-zynkr/zynkr-skill-idea",
    slug: get("--slug") ?? process.env.SLUG ?? "",
    category: get("--category") ?? process.env.CATEGORY ?? "",
    specUrl: get("--spec-url") ?? process.env.SPEC_URL,
  };
  const missing = (["issueNumber", "slug", "category"] as const).filter((k) => !args[k]);
  if (missing.length) {
    console.error(`Missing required args: ${missing.join(", ")}`);
    console.error("See header comment for usage.");
    process.exit(2);
  }
  return args;
}

function resolveCategory(input: string): { number: string; folder: string; slug: string } {
  const digit = /^\d$/.test(input) ? input : NUMBER_BY_SLUG[input.toLowerCase()];
  if (!digit) throw new Error(`Unknown category: "${input}". Expected digit 0-9 or known slug.`);
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
}): string {
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
    `upstream_repo: ${args.issueUrl}`,
    "---",
    "",
  ].join("\n");

  const body = [
    `# ${args.slug}`,
    "",
    `> Scaffolded from [issue](${args.issueUrl}) via \`/skill-triager\`. Status: \`Not started\`.`,
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

  const md = buildSkillMd({
    slug: args.slug,
    schemaCategorySlug: cat.slug,
    description,
    input,
    process: proc,
    output,
    specBody: spec,
    issueUrl: issue.url,
  });

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, md, "utf-8");

  const rel = path.relative(ROOT, targetFile);
  console.log(`Scaffolded: ${rel}`);
  // Last line: machine-readable for the workflow.
  console.log(rel);
}

main();
