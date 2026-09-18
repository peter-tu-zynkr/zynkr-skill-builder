#!/usr/bin/env tsx
/**
 * check-house-style.ts — SKB-031 guard for the house-voice binding.
 *
 * Every skills/<category>/<skill>/SKILL.md must declare exactly one frontmatter key:
 *
 *   house-style: bound              — it produces text a human outside the loop reads
 *   house-style: exempt — <reason>  — it does not, and the reason is stated
 *
 * There is no default. A file that declares neither FAILS, which is the whole point: a new
 * skill cannot opt out by staying silent (SDD §0.3 — skip-green is banned fleet-wide).
 *
 * `bound` additionally requires both Drive Doc IDs in the body, because the copy installed at
 * ~/.claude/skills/<name>/SKILL.md has no access to this repo and must name its own sources.
 *
 * Finally, no SKILL.md or reference file may hardcode its own forbidden-word list — that is
 * the drift this guard exists to stop (seo-program-planner had grown one).
 *
 *   npx tsx check-house-style.ts          # exit 1 on any violation
 *   npx tsx check-house-style.ts --list   # print each skill's declaration, exit 0
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");

/** The two Docs a `bound` skill must name. Seed: docs/house-style/README.md */
const HOUSE_VOICE_DOC_ID = "10bOIQwRm9Pxwgct4hlwCwK_B4Pipai1HqBPZKzyRHSE";
const FORBIDDEN_WORDS_DOC_ID = "1N5sHLP4qzmmhpCGsi6KElxi1z0MFe4QZ0Q_35T10Uyg";

/**
 * Words that may only appear as a pointer to 《[3.2]》, never as a local list. Sampled from the
 * real Doc; hitting three or more of them in one file means the file is re-implementing it.
 */
const FORBIDDEN_LIST_MARKERS = [
  "賦能",
  "無縫",
  "supercharge",
  "cutting-edge",
  "game-changing",
  "效率神器",
  "一鍵搞定",
];
const INLINE_LIST_THRESHOLD = 3;

const GITHUB = process.env.GITHUB_ACTIONS === "true";
const listMode = process.argv.includes("--list");

type Violation = { file: string; message: string };
const violations: Violation[] = [];
const declarations: { skill: string; value: string }[] = [];

function fail(file: string, message: string): void {
  violations.push({ file: path.relative(ROOT, file), message });
}

/** Frontmatter is read as raw lines — a skill with malformed YAML must fail loudly, not throw. */
function frontmatterBlock(source: string): string | null {
  if (!source.startsWith("---")) return null;
  const end = source.indexOf("\n---", 3);
  if (end === -1) return null;
  return source.slice(3, end);
}

function readHouseStyle(front: string): string | null {
  for (const line of front.split("\n")) {
    const match = /^house-style:\s*(.+?)\s*$/.exec(line);
    if (match) return match[1].replace(/^["']|["']$/g, "");
  }
  return null;
}

function listSkillFiles(): string[] {
  const out: string[] = [];
  if (!fs.existsSync(SKILLS_DIR)) return out;
  for (const category of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const categoryDir = path.join(SKILLS_DIR, category.name);
    for (const skill of fs.readdirSync(categoryDir, { withFileTypes: true })) {
      if (!skill.isDirectory()) continue;
      const skillMd = path.join(categoryDir, skill.name, "SKILL.md");
      if (fs.existsSync(skillMd)) out.push(skillMd);
    }
  }
  return out.sort();
}

/** Nested .claude/ trees are a skill's own bundled sub-skills — the parent's declaration covers them. */
function listReferenceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(full);
      } else if (entry.name.endsWith(".md") && entry.name !== "SKILL.md") {
        out.push(full);
      }
    }
  };
  if (fs.existsSync(SKILLS_DIR)) walk(SKILLS_DIR);
  return out.sort();
}

function countInlineListMarkers(text: string): string[] {
  return FORBIDDEN_LIST_MARKERS.filter((word) => text.includes(word));
}

// ── 1. Every skill declares, and `bound` skills carry the block ──────────────

const skillFiles = listSkillFiles();

if (skillFiles.length === 0) {
  console.error("::error::No SKILL.md files found — refusing to pass vacuously.");
  process.exit(1);
}

for (const file of skillFiles) {
  const source = fs.readFileSync(file, "utf8");
  const skillName = path.basename(path.dirname(file));
  const front = frontmatterBlock(source);

  if (front === null) {
    fail(file, "no YAML frontmatter block — cannot read `house-style:`");
    continue;
  }

  const declared = readHouseStyle(front);

  if (declared === null) {
    fail(
      file,
      "missing `house-style:` — declare `bound`, or `exempt — <reason>`. " +
        "See docs/house-style/README.md",
    );
    continue;
  }

  declarations.push({ skill: skillName, value: declared });

  if (declared === "bound") {
    if (!source.includes(HOUSE_VOICE_DOC_ID)) {
      fail(file, `declares \`bound\` but does not name 《[2.0]》 (${HOUSE_VOICE_DOC_ID})`);
    }
    if (!source.includes(FORBIDDEN_WORDS_DOC_ID)) {
      fail(file, `declares \`bound\` but does not name 《[3.2]》 (${FORBIDDEN_WORDS_DOC_ID})`);
    }
    continue;
  }

  if (declared.startsWith("exempt")) {
    const reason = declared.replace(/^exempt\s*[—–-]?\s*/, "").trim();
    if (reason.length < 8) {
      fail(file, "`exempt` needs a stated reason: `exempt — <why this emits no house-voiced prose>`");
    }
    continue;
  }

  fail(file, `unknown house-style value \`${declared}\` — expected \`bound\` or \`exempt — <reason>\``);
}

// ── 2. Nobody re-implements the forbidden-word list ──────────────────────────

for (const file of [...skillFiles, ...listReferenceFiles()]) {
  const source = fs.readFileSync(file, "utf8");
  const hits = countInlineListMarkers(source);
  if (hits.length >= INLINE_LIST_THRESHOLD) {
    fail(
      file,
      `re-implements the forbidden-word list inline (${hits.join(" · ")}). ` +
        `Point at 《[3.2]》 ${FORBIDDEN_WORDS_DOC_ID} instead.`,
    );
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

if (listMode) {
  const bound = declarations.filter((d) => d.value === "bound").length;
  for (const { skill, value } of declarations) {
    console.log(`${value === "bound" ? "bound " : "exempt"}  ${skill}${value === "bound" ? "" : `  (${value})`}`);
  }
  console.log(`\n${bound} bound · ${declarations.length - bound} exempt · ${skillFiles.length} skills`);
  process.exit(0);
}

if (violations.length > 0) {
  for (const { file, message } of violations) {
    console.error(GITHUB ? `::error file=${file}::${message}` : `FAIL  ${file}\n      ${message}`);
  }
  console.error(
    GITHUB
      ? `::error::house-style check failed — ${violations.length} violation(s).`
      : `\nhouse-style check failed — ${violations.length} violation(s). See docs/house-style/README.md`,
  );
  process.exit(1);
}

const boundCount = declarations.filter((d) => d.value === "bound").length;
console.log(
  `house-style OK — ${skillFiles.length} skills declared (${boundCount} bound · ${declarations.length - boundCount} exempt), no inline forbidden-word lists.`,
);
