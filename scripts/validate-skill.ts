#!/usr/bin/env tsx
/**
 * Layered, tier-aware QA engine for SKILL.md files — the single source of
 * truth shared by CI and the /skill-qa skill.
 *
 *   npm run validate skills/2-sales-consultant/foo/SKILL.md   # ERROR-tier only (CI default)
 *   npm run validate skills/2-sales-consultant/foo            # resolves SKILL.md
 *   npm run validate skills/2-sales-consultant                # scans the tree
 *   tsx scripts/validate-skill.ts <path> --tier=all           # also print WARN + INFO
 *   tsx scripts/validate-skill.ts <path> --json               # machine-readable (for /skill-qa)
 *
 * Exit codes: 0 = no ERROR · 1 = >=1 ERROR · 2 = usage/IO error.
 * The exit code is governed SOLELY by ERROR count, regardless of --tier, so a
 * `--tier=all` run for annotations never blocks CI.
 *
 * Tiers: ERROR blocks (PR/publish), WARN advises, INFO is a note only.
 * Frontmatter schema + TAXONOMY mirror scripts/ingest.ts — keep in sync if
 * either changes there. (We do NOT import ingest.ts: it runs main() on import.)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { z } from "zod";

export const TAXONOMY: Record<string, number> = {
  "strategy": 0,
  "brand-marketing": 1,
  "sales-consultant": 2,
  "operations": 3,
  "training": 4,
  "product": 5,
  "engineer": 6,
  "people-talent": 7,
  "finance-admin": 8,
  "legal": 9,
};

export const SkillFrontmatter = z.object({
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
  install_command: z.string().min(1).optional(),
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

// IPO soft length limits — mirror scripts/ingest.ts:33-35 (ingest silently
// truncates; QA only warns so the author sees the clip coming).
const MAX_INPUT_LENGTH = 180;
const MAX_PROCESS_LENGTH = 260;
const MAX_OUTPUT_LENGTH = 180;

export type Tier = "ERROR" | "WARN" | "INFO";
export interface QaFinding {
  check: string;
  tier: Tier;
  message: string;
  file: string;
  line?: number;
  fixable?: boolean;
  suggestion?: string;
}

// ── small helpers ────────────────────────────────────────────────────────────

// Mirror of toSlug in scripts/ingest.ts:209-216.
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function collapse(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
}

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), "..", "..");

interface SkillInfo {
  data: Record<string, any>;
  body: string;
  bodyLines: string[];
  bodyStartLine: number; // 1-based raw line where the body begins
  hasFrontmatter: boolean;
}

function readSkill(filePath: string): SkillInfo {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(raw);
  const data = (parsed.data ?? {}) as Record<string, any>;
  const hasFrontmatter = data && Object.keys(data).length > 0;

  // Compute the raw line where the body starts so findings carry true line numbers.
  const lines = raw.split("\n");
  let bodyStartLine = 1;
  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---") {
        bodyStartLine = i + 2; // 1-based line after the closing delimiter
        break;
      }
    }
  }
  const body = parsed.content ?? "";
  return { data, body, bodyLines: body.split("\n"), bodyStartLine, hasFrontmatter };
}

// Reference-only / lifted entries (e.g. the Anthropic pptx card, vercel-labs
// lift-and-shift): they legitimately have no Step/Workflow body, an H1 that
// differs from the slug, and an upstream install URL. Body-structure findings
// downgrade to INFO for these so they never block.
function isReferenceEntry(data: Record<string, any>, hasWorkflow: boolean): boolean {
  if (data.install_command) return true;
  const author = String(data.author ?? "");
  const trio = data.upstream_repo && data.original_source_url && data.original_author;
  if (trio && !/peter\s*tu/i.test(author)) return true;
  if (data["disable-model-invocation"] === true && !hasWorkflow) return true;
  return false;
}

// Scaffold stubs (pre-/skill-creator): don't block body-structure as ERROR;
// the author fills them in and flips status before publishing.
function isStub(data: Record<string, any>, body: string): boolean {
  return data.status === "Not started" || /<!--\s*TODO/i.test(body);
}

// Downgrade a body-check tier per escape hatches.
function bodyTier(base: Tier, isRef: boolean, stub: boolean): Tier {
  if (isRef) return "INFO";
  if (stub && base === "ERROR") return "WARN";
  return base;
}

let _skillNames: Set<string> | null = null;
function skillNameSet(): Set<string> {
  if (_skillNames) return _skillNames;
  const names = new Set<string>();
  const skillsDir = path.join(REPO_ROOT, "skills");
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "SKILL.md") {
        try {
          const d = matter(fs.readFileSync(full, "utf-8")).data as Record<string, any>;
          if (typeof d?.name === "string") names.add(d.name);
        } catch { /* ignore unreadable */ }
      }
    }
  };
  walk(skillsDir);
  _skillNames = names;
  return names;
}

// ── checks ───────────────────────────────────────────────────────────────────

function checkFrontmatter(file: string, info: SkillInfo): QaFinding[] {
  const out: QaFinding[] = [];
  if (!info.hasFrontmatter) {
    out.push({ check: "frontmatter.present", tier: "ERROR", file, line: 1,
      message: "No YAML frontmatter found." });
    return out;
  }
  const parsed = SkillFrontmatter.safeParse(info.data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      out.push({ check: "frontmatter.schema", tier: "ERROR", file, line: 1,
        message: `${issue.path.join(".") || "(root)"}: ${issue.message}` });
    }
  }
  if (info.data.install_command !== undefined && typeof info.data.install_command !== "string") {
    out.push({ check: "frontmatter.install_command_known", tier: "WARN", file, line: 1,
      message: "install_command should be a string." });
  }
  return out;
}

function checkBody(file: string, info: SkillInfo): QaFinding[] {
  const out: QaFinding[] = [];
  const { bodyLines, bodyStartLine, data, body } = info;
  const rawLine = (i: number) => bodyStartLine + i;

  const h1Idxs = bodyLines.map((l, i) => ({ l, i })).filter((x) => /^#\s+\S/.test(x.l));
  const firstH2Idx = bodyLines.findIndex((l) => /^##\s+\S/.test(l));
  const snippetIdxs = bodyLines.map((l, i) => ({ l, i })).filter((x) => /npx\s+skills\s+add/i.test(x.l));
  const hasWorkflow = bodyLines.some((l) => /^##\s+(Step\b|Workflow\b)/i.test(l));

  const isRef = isReferenceEntry(data, hasWorkflow);
  const stub = isStub(data, body);
  const name = typeof data.name === "string" ? data.name : "";
  const nameSlug = toSlug(name);

  // body.h1_present
  if (h1Idxs.length === 0) {
    out.push({ check: "body.h1_present", tier: bodyTier("ERROR", isRef, stub), file, line: bodyStartLine,
      message: "No H1 title (`# ...`) in the body.", fixable: false,
      suggestion: `Add a top-level "# ${name}" heading.` });
  } else if (h1Idxs.length > 1) {
    out.push({ check: "body.h1_present", tier: isRef ? "INFO" : "WARN", file, line: rawLine(h1Idxs[1].i),
      message: `Multiple H1 headings (${h1Idxs.length}); a SKILL.md should have exactly one.` });
  }

  // body.h1_matches_name
  if (h1Idxs.length > 0 && nameSlug) {
    const h1Text = h1Idxs[0].l.replace(/^#\s+/, "");
    const h1Slug = toSlug(h1Text);
    if (!h1Slug.includes(nameSlug)) {
      out.push({ check: "body.h1_matches_name", tier: isRef ? "INFO" : "WARN", file, line: rawLine(h1Idxs[0].i),
        message: `H1 "${h1Text}" does not reflect name "${name}".`, fixable: !isRef,
        suggestion: `Rename H1 to include "${name}".` });
    }
  }

  // body.install_snippet — WARN, not ERROR: most of the existing catalog omits
  // the body snippet (the marketplace auto-generates the install command), so
  // blocking on it would fail ~1/3 of skills. SKILL_SPEC §2 stays a nudge.
  if (snippetIdxs.length === 0) {
    out.push({ check: "body.install_snippet", tier: bodyTier("WARN", isRef, stub), file, line: bodyStartLine,
      message: "No install snippet (`npx skills add ... --skill <slug>`) in the body.", fixable: !isRef,
      suggestion: `Add near the top:\n\`\`\`bash\nnpx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill ${name}\n\`\`\`` });
  } else {
    if (snippetIdxs.length > 1) {
      out.push({ check: "body.install_snippet", tier: isRef ? "INFO" : "WARN", file, line: rawLine(snippetIdxs[1].i),
        message: `${snippetIdxs.length} install snippets found; SKILL_SPEC §2 expects exactly one.` });
    }
    const first = snippetIdxs[0];
    const m = first.l.match(/npx\s+skills\s+add\s+(\S+)\s+--skill\s+(\S+)/i);
    if (m && nameSlug && toSlug(m[2]) !== nameSlug) {
      out.push({ check: "body.install_snippet", tier: bodyTier("WARN", isRef, stub), file, line: rawLine(first.i),
        message: `Install snippet --skill "${m[2]}" != name "${name}".`, fixable: !isRef,
        suggestion: `Change --skill to ${name}.` });
    }
    const nearTop = firstH2Idx === -1 || first.i < firstH2Idx;
    if (!nearTop) {
      out.push({ check: "body.install_snippet", tier: isRef ? "INFO" : "WARN", file, line: rawLine(first.i),
        message: "Install snippet appears after the first `## ` heading; SKILL_SPEC §2 wants it near the top." });
    }
  }

  // body.summary_paragraph
  const summaryEnd = firstH2Idx === -1 ? bodyLines.length : firstH2Idx;
  const summaryStart = h1Idxs.length > 0 ? h1Idxs[0].i + 1 : 0;
  const hasProse = bodyLines.slice(summaryStart, summaryEnd).some((l) => {
    const t = l.trim();
    return t.length > 40 && !/^[#>\-*|]/.test(t) && !/^```/.test(t) && !/npx\s+skills\s+add/i.test(t);
  });
  if (!hasProse) {
    out.push({ check: "body.summary_paragraph", tier: isRef ? "INFO" : "WARN", file, line: bodyStartLine,
      message: "No summary paragraph (plain prose: what it does + when to trigger) before the first `## ` section." });
  }

  // body.workflow_present — WARN, not ERROR: many shipped internal skills
  // structure their body with other headings; blocking would fail them.
  if (!hasWorkflow) {
    out.push({ check: "body.workflow_present", tier: bodyTier("WARN", isRef, stub), file, line: bodyStartLine,
      message: "No `## Step N` or `## Workflow` section — SKILL_SPEC §4 recommends a numbered or linear workflow.",
      fixable: false, suggestion: "Add `## Step 1`, `## Step 2`, … or a `## Workflow` section." });
  }

  return out;
}

function checkPaths(file: string, info: SkillInfo): QaFinding[] {
  const out: QaFinding[] = [];
  // Match real machine-specific home paths but NOT doc placeholders like
  // /Users/<name>/ (the segment after the prefix must be word-chars).
  const absHome = /(?:\/Users\/|\/home\/|\/root\/)[A-Za-z0-9._-]+\//;
  const winHome = /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+/;
  info.bodyLines.forEach((l, i) => {
    if (absHome.test(l) || winHome.test(l)) {
      out.push({ check: "paths.absolute_home", tier: "ERROR", file, line: info.bodyStartLine + i,
        message: `Absolute home-dir path leaked: "${l.trim().slice(0, 80)}". SKILL_SPEC §5 forbids machine-specific paths.`,
        fixable: true, suggestion: "Use a relative path (./...) or the {{SKILL_DIR}} placeholder." });
    }
    if (/<!--\s*SKILL BASE PATH/i.test(l)) {
      out.push({ check: "paths.skill_dir_literal", tier: "WARN", file, line: info.bodyStartLine + i,
        message: "Legacy `<!-- SKILL BASE PATH -->` comment; remove it (SKILL_SPEC §5)." });
    }
  });
  return out;
}

// Free / personal webmail providers. An address on one of these is almost
// always a real individual's PII rather than a corporate or service mailbox —
// the zynkr-support / consult-intake leak (a real inquirer's gmail pasted into
// a sample form block) was exactly this shape. SKILL.md ships publicly
// (zynkr.ai/s/<id>.md + GitHub raw + the marketplace), so a real personal
// address here is a public PII disclosure. SKILL_SPEC §5.
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.com.tw", "ymail.com",
  "hotmail.com", "hotmail.com.tw", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com",
  "gmx.com", "gmx.net", "qq.com", "foxmail.com", "163.com", "126.com",
  "sina.com", "sina.cn", "naver.com", "hanmail.net", "daum.net",
]);

// Local-parts that read as obviously illustrative even on a real domain — never
// flag these (they're the placeholders we WANT authors to use).
const PLACEHOLDER_LOCALPARTS =
  /^(inquirer|example|sample|demo|user|username|your[._-]?name|your[._-]?email|you|name|firstname|lastname|john[._-]?doe|jane[._-]?doe|foo|bar|baz|test|customer|client|lead|contact)$/i;

// Email matcher — deliberately broad on the capture, narrow on the verdict.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

// Reserved doc/example domains (RFC 2606) — always safe placeholders.
function isExampleDomain(domain: string): boolean {
  return /(^|\.)(example\.(com|org|net)|test|invalid|localhost)$/i.test(domain);
}

function checkPii(file: string, info: SkillInfo): QaFinding[] {
  const out: QaFinding[] = [];
  const seen = new Set<string>();
  info.bodyLines.forEach((l, i) => {
    EMAIL_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = EMAIL_RE.exec(l))) {
      const email = m[0];
      const domain = m[1].toLowerCase();
      const local = email.slice(0, email.lastIndexOf("@"));
      if (isExampleDomain(domain)) continue;
      if (PLACEHOLDER_LOCALPARTS.test(local)) continue;
      if (!PERSONAL_EMAIL_DOMAINS.has(domain)) continue; // corporate/other: not a confident PII signal
      if (seen.has(email)) continue;
      seen.add(email);
      out.push({ check: "pii.personal_email", tier: "ERROR", file, line: info.bodyStartLine + i,
        message: `Personal email "${email}" looks like real PII. SKILL.md is published publicly (zynkr.ai/s/<id>.md + GitHub raw) — never paste a real person's name/email into an example.`,
        fixable: true, suggestion: "Replace with a placeholder on example.com (e.g. inquirer@example.com) and a placeholder name." });
    }
  });
  return out;
}

function checkSynergy(file: string, info: SkillInfo): QaFinding[] {
  const out: QaFinding[] = [];
  const syn = Array.isArray(info.data.synergy) ? info.data.synergy : [];
  if (syn.length === 0) return out;
  const names = skillNameSet();
  const self = typeof info.data.name === "string" ? info.data.name : "";
  for (const slug of syn) {
    if (typeof slug !== "string") continue;
    if (slug === self) continue; // self-reference is a known quirk, not a break
    if (!names.has(slug)) {
      out.push({ check: "synergy.slugs_exist", tier: "WARN", file, line: 1,
        message: `synergy references "${slug}", which is not an existing skill name under skills/**.` });
    }
  }
  return out;
}

function checkIpo(file: string, info: SkillInfo): QaFinding[] {
  const out: QaFinding[] = [];
  const checks: [string, number][] = [
    ["input", MAX_INPUT_LENGTH], ["process", MAX_PROCESS_LENGTH], ["output", MAX_OUTPUT_LENGTH],
  ];
  for (const [field, max] of checks) {
    const len = collapse(info.data[field]).length;
    if (len > max) {
      out.push({ check: "ipo.length", tier: "WARN", file, line: 1,
        message: `frontmatter "${field}" is ${len} chars (> ${max}); ingest will silently truncate it.` });
    }
  }
  return out;
}

function checkAttribution(file: string, info: SkillInfo): QaFinding[] {
  const out: QaFinding[] = [];
  const author = String(info.data.author ?? "");
  if (/\(derivative of/i.test(author)) {
    const hasSection = /^##\s+Attribution\b/im.test(info.body);
    if (!hasSection) {
      out.push({ check: "attribution.case_c_section", tier: "WARN", file, line: 1,
        message: 'Author is a derivative (Case C) but no `## Attribution` section describes the changes (SKILL_SPEC §6).' });
    }
  }
  return out;
}

function checkDownload(file: string, info: SkillInfo): QaFinding[] {
  const out: QaFinding[] = [];
  // source_path_exists: the artifact must be readable + non-empty.
  if (!info.body.trim() && !info.hasFrontmatter) {
    out.push({ check: "download.source_path_exists", tier: "ERROR", file, line: 1,
      message: "SKILL.md is empty — nothing to install." });
  }
  // install_url_wellformed: validate the body install snippet's URL.
  const snippet = info.bodyLines.find((l) => /npx\s+skills\s+add/i.test(l));
  if (snippet) {
    const m = snippet.match(/npx\s+skills\s+add\s+(\S+)/i);
    if (m) {
      const ok = z.string().url().safeParse(m[1]).success && /^https?:\/\/github\.com\//i.test(m[1]);
      if (!ok) {
        out.push({ check: "download.install_url_wellformed", tier: "WARN", file, line: 1,
          message: `Install URL "${m[1]}" is not a well-formed github.com URL.` });
      }
    }
  }
  // relative_refs_resolve: ./refs in the body should exist next to the skill.
  const skillDir = path.dirname(file);
  const refRe = /\]\((\.\/[^)\s]+)\)|`(\.\/[^`\s]+)`/g;
  let mm: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((mm = refRe.exec(info.body))) {
    const ref = (mm[1] || mm[2]).replace(/[#?].*$/, "");
    if (seen.has(ref)) continue;
    seen.add(ref);
    if (!fs.existsSync(path.join(skillDir, ref))) {
      out.push({ check: "body.relative_refs_resolve", tier: "INFO", file, line: 1,
        message: `Relative reference "${ref}" does not resolve under ${path.relative(REPO_ROOT, skillDir)} (ok if it lands in the same PR bundle).` });
    }
  }
  // live_check is post-ship only.
  out.push({ check: "download.live_check", tier: "INFO", file, line: 1,
    message: "Live download (zynkr.ai/s/<id>.md) is verified post-ship by /skill-triager Option D." });
  return out;
}

export function runChecks(filePath: string): QaFinding[] {
  const info = readSkill(filePath);
  return [
    ...checkFrontmatter(filePath, info),
    ...checkBody(filePath, info),
    ...checkPaths(filePath, info),
    ...checkPii(filePath, info),
    ...checkSynergy(filePath, info),
    ...checkIpo(filePath, info),
    ...checkAttribution(filePath, info),
    ...checkDownload(filePath, info),
  ];
}

// ── CLI ────────────────────────────────────────────────────────────────────

function collectSkillFiles(target: string): string[] {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  const skillMd = path.join(target, "SKILL.md");
  if (fs.existsSync(skillMd)) return [skillMd];
  const found: string[] = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (!entry.isDirectory()) continue;
    found.push(...collectSkillFiles(path.join(target, entry.name)));
  }
  return found;
}

interface FileResult {
  file: string;
  pass: boolean;
  errors: number;
  warns: number;
  infos: number;
  findings: QaFinding[];
}

function summarize(file: string, findings: QaFinding[]): FileResult {
  const errors = findings.filter((f) => f.tier === "ERROR").length;
  const warns = findings.filter((f) => f.tier === "WARN").length;
  const infos = findings.filter((f) => f.tier === "INFO").length;
  return { file, pass: errors === 0, errors, warns, infos, findings };
}

const GLYPH: Record<Tier, string> = { ERROR: "❌", WARN: "⚠️ ", INFO: "ℹ️ " };

function printText(result: FileResult, showTiers: Set<Tier>): void {
  const rel = path.relative(process.cwd(), result.file);
  const head = result.pass ? "✓" : "✗";
  console.log(`  ${head}  ${rel}  —  ${result.errors} error(s), ${result.warns} warning(s)`);
  for (const f of result.findings) {
    if (!showTiers.has(f.tier)) continue;
    const loc = f.line ? `:${f.line}` : "";
    console.log(`       ${GLYPH[f.tier]} ${f.tier}  ${f.check}  (${rel}${loc})`);
    console.log(`            ${f.message}`);
    if (f.suggestion && showTiers.has(f.tier)) {
      for (const sline of f.suggestion.split("\n")) console.log(`            ↳ ${sline}`);
    }
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const positional = argv.filter((a) => !a.startsWith("--"));
  const tierFlag = [...flags].find((f) => f.startsWith("--tier="))?.split("=")[1] ?? "error";
  const asJson = flags.has("--json");
  const asGithub = flags.has("--github"); // emit ::error/::warning PR annotations
  const showTiers: Set<Tier> = tierFlag === "all"
    ? new Set<Tier>(["ERROR", "WARN", "INFO"])
    : new Set<Tier>(["ERROR"]);

  const arg = positional[0];
  if (!arg) {
    console.error("Usage: tsx scripts/validate-skill.ts <SKILL.md|skill-dir|tree> [--tier=error|all] [--json]");
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

  const results = files.map((f) => summarize(f, runChecks(f)));
  const totalErrors = results.reduce((n, r) => n + r.errors, 0);

  if (asGithub) {
    // GitHub Actions workflow-command annotations (show inline on the PR).
    for (const r of results) {
      for (const f of r.findings) {
        if (f.tier === "INFO") continue;
        const level = f.tier === "ERROR" ? "error" : "warning";
        const rel = path.relative(REPO_ROOT, f.file);
        const msg = `${f.check}: ${f.message}`.replace(/[\r\n]+/g, " ");
        console.log(`::${level} file=${rel}${f.line ? `,line=${f.line}` : ""}::${msg}`);
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) printText(r, showTiers);
    const passed = results.filter((r) => r.pass).length;
    const warns = results.reduce((n, r) => n + r.warns, 0);
    console.log(`\n${passed}/${results.length} pass (0 errors)` +
      (totalErrors ? ` · ${totalErrors} error(s)` : "") +
      (warns ? ` · ${warns} warning(s)${tierFlag === "all" ? "" : " (run --tier=all to see them)"}` : ""));
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
