#!/usr/bin/env tsx
/**
 * Local frontmatter validator. Run before pushing to catch the same Zod
 * failures CI would flag during ingest.
 *
 *   npm run validate skills/2-business-consulting/foo/SKILL.md
 *   npm run validate skills/2-business-consulting/foo            # resolves SKILL.md
 *   npm run validate skills/2-business-consulting                # scans the tree
 *
 * Exits non-zero if any SKILL.md fails. Schema mirrors scripts/ingest.ts —
 * keep in sync if SkillFrontmatter or TAXONOMY there change.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";

const TAXONOMY: Record<string, number> = {
  "strategy": 0,
  "brand-marketing": 1,
  "business-consulting": 2,
  "operations": 3,
  "training": 4,
  "product": 5,
  "engineer": 6,
  "talent-development": 7,
  "finance-admin": 8,
  "legal": 9,
};

const SkillFrontmatter = z.object({
  name: z.string().min(1),
  category: z.string().refine((v) => v in TAXONOMY, {
    message: `Must be one of: ${Object.keys(TAXONOMY).join(", ")}`,
  }),
  project: z.string().min(1),
  platform: z.enum(["gpt", "claude", "gemini", "multi"]),
  status: z.enum(["Done", "WIP", "Not started", "Pause", "Out dated"]),
  author: z.string().min(1),
  description: z.string().optional(),
  input: z.string().optional(),
  process: z.string().optional(),
  output: z.string().optional(),
  synergy: z.array(z.string()).default([]),
  upstream_repo: z.string().optional(),
  original_source_url: z.string().url().optional(),
  original_author: z.string().min(1).optional(),
  security_audits: z.object({
    gen_agent_trust_hub: z.enum(["pass", "fail", "pending"]).optional(),
    socket: z.enum(["pass", "fail", "pending"]).optional(),
    snyk: z.enum(["pass", "fail", "pending"]).optional(),
  }).optional(),
}).superRefine((fm, ctx) => {
  // Attribution trio: if any of upstream_repo / original_source_url / original_author
  // is set, all three must be set. Spec §6 — honest-by-default attribution.
  const hasAny = !!(fm.upstream_repo || fm.original_source_url || fm.original_author);
  const hasAll = !!(fm.upstream_repo && fm.original_source_url && fm.original_author);
  if (hasAny && !hasAll) {
    const missing = [
      !fm.upstream_repo && "upstream_repo",
      !fm.original_source_url && "original_source_url",
      !fm.original_author && "original_author",
    ].filter(Boolean);
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Attribution must be complete — missing: ${missing.join(", ")}. See SKILL_SPEC.md §6.`,
      path: ["upstream_repo"],
    });
  }
});

function collectSkillFiles(target: string): string[] {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  const skillMd = path.join(target, "SKILL.md");
  if (fs.existsSync(skillMd)) return [skillMd];

  // Tree scan: only descend looking for SKILL.md, ignore sibling docs
  // (README.md, CLAUDE.md, etc.) that ingest.ts doesn't pick up either.
  const found: string[] = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (!entry.isDirectory()) continue;
    found.push(...collectSkillFiles(path.join(target, entry.name)));
  }
  return found;
}

function validateOne(filePath: string): { ok: boolean; issues: string[] } {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  if (!data || Object.keys(data).length === 0) {
    return { ok: false, issues: ["No frontmatter"] };
  }
  const parsed = SkillFrontmatter.safeParse(data);
  if (parsed.success) return { ok: true, issues: [] };
  const issues = parsed.error.issues.map(
    (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
  );
  return { ok: false, issues };
}

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: tsx scripts/validate-skill.ts <path-to-SKILL.md|skill-dir|skills-tree>");
    process.exit(2);
  }
  const target = path.resolve(arg);
  if (!fs.existsSync(target)) {
    console.error(`Not found: ${target}`);
    process.exit(2);
  }

  const files = collectSkillFiles(target).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.error(`No SKILL.md found under ${target}`);
    process.exit(2);
  }

  let failed = 0;
  for (const file of files) {
    const { ok, issues } = validateOne(file);
    const rel = path.relative(process.cwd(), file);
    if (ok) {
      console.log(`  ✓  ${rel}`);
    } else {
      failed += 1;
      console.log(`  ✗  ${rel}`);
      issues.forEach((i) => console.log(`       ${i}`));
    }
  }

  console.log(`\n${files.length - failed}/${files.length} valid`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
