#!/usr/bin/env tsx
/**
 * ingest.ts
 *
 * Usage:
 *   npx tsx scripts/ingest.ts <github-repo-url>
 *
 * What it does:
 *   1. Clones the source SME repo to a temp directory
 *   2. Finds all .md files that have valid frontmatter
 *   3. Validates each file against the skill schema
 *   4. Assigns the next available ID in the category (FIFO)
 *   5. Writes a normalized file to content/skills/{id}.md
 *   6. Regenerates generated/skills.json for frontend consumption
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "skills");
const GENERATED_DIR = path.join(ROOT, "generated");
// Also write here so the frontend can import it directly when ready
const FRONTEND_GENERATED = path.join(ROOT, "frontend", "lib", "generated-skills.json");

// ── Taxonomy: category slug → numeric prefix ─────────────────────────────────

const TAXONOMY: Record<string, number> = {
  "strategy": 0,
  "brand-marketing": 1,
  "business-consulting": 2,
  "operations": 3,
  "training": 4,
  "dev-ops": 5,
  "tech": 6,
  "talent-development": 7,
  "finance-admin": 8,
};

// ── Schema ───────────────────────────────────────────────────────────────────

const SkillFrontmatter = z.object({
  name: z.string().min(1),
  category: z.string().refine((v) => v in TAXONOMY, {
    message: `Must be one of: ${Object.keys(TAXONOMY).join(", ")}`,
  }),
  project: z.string().min(1),
  platform: z.enum(["gpt", "claude", "gemini", "multi"]),
  status: z.enum(["Done", "WIP", "Not started", "Pause", "Out dated"]),
  author: z.string().min(1),
  input: z.string().optional(),
  process: z.string().optional(),
  output: z.string().optional(),
  synergy: z.array(z.string()).default([]),
});

type SkillFrontmatter = z.infer<typeof SkillFrontmatter>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getNextId(prefix: number): string {
  const existing = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .map((f) => f.replace(".md", ""))
    .filter((id) => id.startsWith(`${prefix}.`))
    .map((id) => parseInt(id.split(".")[1], 10))
    .filter((n) => !isNaN(n));

  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}.${String(next).padStart(2, "0")}`;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildInstallCommand(id: string, slug: string): string {
  return `curl -sL zynkr.ai/s/${id}.md -o ~/.claude/skills/${slug}.md`;
}

function findMdFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findMdFiles(full));
    else if (entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

function generateSkillsJson() {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .sort();

  const skills = files.map((f) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf-8");
    const { data } = matter(raw);
    return data;
  });

  const json = JSON.stringify(skills, null, 2);
  fs.writeFileSync(path.join(GENERATED_DIR, "skills.json"), json);
  fs.writeFileSync(FRONTEND_GENERATED, json);
  console.log(`\n  → generated/skills.json updated (${skills.length} skills total)`);
  console.log(`  → frontend/lib/generated-skills.json updated`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const repoUrl = process.argv[2];
  if (!repoUrl) {
    console.error("Usage: npx tsx scripts/ingest.ts <github-repo-url>");
    process.exit(1);
  }

  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  // Clone to temp dir
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "zynkr-ingest-"));
  console.log(`\nCloning ${repoUrl}...`);
  execSync(`git clone --depth 1 ${repoUrl} ${tmpDir}`, { stdio: "inherit" });

  const mdFiles = findMdFiles(tmpDir);
  console.log(`Found ${mdFiles.length} .md file(s)\n`);

  const ingested: { id: string; name: string; sourceFile: string }[] = [];
  const skipped: { file: string; reason: string }[] = [];

  for (const filePath of mdFiles) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const relPath = path.relative(tmpDir, filePath);

    // Skip files with no frontmatter
    if (!data || Object.keys(data).length === 0) {
      skipped.push({ file: relPath, reason: "No frontmatter" });
      continue;
    }

    const parsed = SkillFrontmatter.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message).join("; ");
      skipped.push({ file: relPath, reason: issues });
      continue;
    }

    const fm = parsed.data;
    const prefix = TAXONOMY[fm.category];
    const id = getNextId(prefix);
    const slug = toSlug(fm.name);
    const today = new Date().toISOString().split("T")[0];

    const normalized = {
      id,
      name: fm.name,
      category: fm.category,
      project: fm.project,
      platform: fm.platform,
      status: fm.status,
      author: fm.author,
      input: fm.input,
      process: fm.process,
      output: fm.output,
      synergy: fm.synergy,
      installCommand: buildInstallCommand(id, slug),
      updatedAt: today,
      sourceRepo: repoUrl,
      sourceFile: relPath,
    };

    const outPath = path.join(CONTENT_DIR, `${id}.md`);
    fs.writeFileSync(outPath, matter.stringify(content, normalized));

    ingested.push({ id, name: fm.name, sourceFile: relPath });
    console.log(`  ✓  ${id}  ${fm.name}`);
  }

  // Cleanup temp dir
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Regenerate generated/skills.json
  generateSkillsJson();

  // Report
  console.log(`\nDone. Ingested: ${ingested.length}  Skipped: ${skipped.length}`);
  if (skipped.length > 0) {
    console.log("\nSkipped files:");
    skipped.forEach((s) => console.log(`  ✗  ${s.file}  —  ${s.reason}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
