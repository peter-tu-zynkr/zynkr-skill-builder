#!/usr/bin/env tsx
/**
 * publish-skill.ts
 *
 * Sibling to ingest-from-issue.ts. Writes a USER-AUTHORED SKILL.md into
 * skills/<N-category>/<slug>/SKILL.md from a publish dispatch fired by
 * /skill-publish (or workflow_dispatch for manual / local runs).
 *
 * The big difference from ingest-from-issue.ts:
 *   ingest-from-issue.ts ── scaffolds a stub or lift-and-shifts an upstream README.
 *   publish-skill.ts     ── lands a SKILL.md the user has already authored.
 *
 * Inputs (env or CLI flags):
 *   ISSUE_NUMBER / --issue          GitHub issue # in the idea repo (for back-comment + PR body)
 *   ISSUE_REPO   / --repo           default: peter-tu-zynkr/zynkr-skill-idea
 *   SLUG         / --slug           kebab-case skill slug
 *   CATEGORY     / --category       digit 0-9 or canonical slug
 *   SKILL_MD_URL / --skill-md-url   raw/blob URL to fetch SKILL.md from (preferred when content lives on GitHub)
 *   SKILL_MD_B64 / --skill-md-b64   inline base64-encoded SKILL.md content (fallback for local content)
 *
 * Exactly one of SKILL_MD_URL or SKILL_MD_B64 must be set.
 *
 * Outputs the relative path of the new SKILL.md on stdout's last line —
 * the wrapping workflow reads it for commit + PR title (same contract as
 * ingest-from-issue.ts).
 *
 * Idempotency: refuses to overwrite an existing file. The publish flow
 * assumes a single authoritative artifact per slug; updates should go
 * through a normal PR, not a re-dispatch.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");

// Numeric prefix → on-disk folder name. Kept in lockstep with ingest-from-issue.ts.
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

const NUMBER_BY_SLUG: Record<string, string> = {
  strategy: "0",
  "brand-marketing": "1",
  "sales-consultant": "2",
  "business-consulting": "2",
  operations: "3",
  training: "4",
  product: "5",
  engineer: "6",
  "people-talent": "7",
  "talent-development": "7",
  people: "7",
  "finance-admin": "8",
  legal: "9",
};

type Args = {
  issueNumber: string;
  issueRepo: string;
  slug: string;
  category: string;
  skillMdUrl?: string;
  skillMdB64?: string;
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
    skillMdUrl: get("--skill-md-url") ?? process.env.SKILL_MD_URL,
    skillMdB64: get("--skill-md-b64") ?? process.env.SKILL_MD_B64,
  };
  const missing = (["issueNumber", "slug", "category"] as const).filter((k) => !args[k]);
  if (missing.length) {
    console.error(`Missing required args: ${missing.join(", ")}`);
    console.error("See header comment for usage.");
    process.exit(2);
  }
  const hasUrl = Boolean(args.skillMdUrl?.trim());
  const hasB64 = Boolean(args.skillMdB64?.trim());
  if (hasUrl === hasB64) {
    console.error(
      "Exactly one of --skill-md-url / SKILL_MD_URL or --skill-md-b64 / SKILL_MD_B64 must be provided."
    );
    process.exit(2);
  }
  return args;
}

function resolveCategory(input: string): { number: string; folder: string } {
  const trimmed = input.trim().toLowerCase();
  let digit: string | undefined;
  if (/^\d$/.test(trimmed)) {
    digit = trimmed;
  } else if (/^\d-/.test(trimmed)) {
    digit = trimmed.charAt(0);
  } else {
    digit = NUMBER_BY_SLUG[trimmed];
  }
  if (!digit)
    throw new Error(
      `Unknown category: "${input}". Expected digit 0-9, known slug, or "N-slug" combined form.`
    );
  const folder = FOLDER_BY_NUMBER[digit];
  if (!folder) throw new Error(`No on-disk folder for category number ${digit}.`);
  return { number: digit, folder };
}

function fetchContent(args: Args): string {
  if (args.skillMdB64) {
    try {
      return Buffer.from(args.skillMdB64, "base64").toString("utf-8");
    } catch (err) {
      throw new Error(`Failed to decode SKILL_MD_B64: ${(err as Error).message}`);
    }
  }
  // skillMdUrl path. Normalise GitHub blob URLs to raw form before fetch.
  let url = args.skillMdUrl!.trim();
  const blob = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)$/i);
  if (blob) {
    url = `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}`;
  }
  try {
    // Use gh api for github.com hosts so private repos work; curl otherwise.
    if (/^https:\/\/raw\.githubusercontent\.com\//.test(url)) {
      // gh api can fetch raw from private repos but requires the repos/.../contents path.
      // Easiest: try plain fetch via curl with the gh auth token.
      const ghToken =
        execSync(`gh auth token 2>/dev/null || true`, { encoding: "utf-8" }).trim() || "";
      const headerArg = ghToken ? `-H "Authorization: Bearer ${ghToken}"` : "";
      const out = execSync(`curl -fsSL ${headerArg} ${JSON.stringify(url)}`, {
        encoding: "utf-8",
      });
      return out;
    }
    const out = execSync(`curl -fsSL ${JSON.stringify(url)}`, { encoding: "utf-8" });
    return out;
  } catch (err) {
    throw new Error(`Failed to fetch SKILL.md from ${url}: ${(err as Error).message}`);
  }
}

function main() {
  const args = parseArgs();
  const cat = resolveCategory(args.category);
  const targetDir = path.join(SKILLS_DIR, cat.folder, args.slug);
  const targetFile = path.join(targetDir, "SKILL.md");
  const relTarget = path.relative(ROOT, targetFile);

  if (fs.existsSync(targetFile)) {
    console.error(
      `Refusing to overwrite existing file at ${relTarget}. ` +
        `Publish is one-shot per slug; subsequent updates should go through a normal PR.`
    );
    process.exit(3);
  }

  const content = fetchContent(args);
  if (!content.trim().startsWith("---")) {
    console.error(
      "Fetched content does not look like a SKILL.md (missing YAML frontmatter). Aborting."
    );
    process.exit(4);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, content, "utf-8");

  // Last line of stdout is the relative path — the workflow reads this.
  console.log(`Wrote ${relTarget} (${content.length} bytes)`);
  console.log(`Source issue: ${args.issueRepo}#${args.issueNumber}`);
  console.log(relTarget);
}

main();
