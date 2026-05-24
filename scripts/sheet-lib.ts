/**
 * sheet-lib.ts
 *
 * Helpers for the sheet-driven sync pipeline.
 * Pure functions only — no I/O or API calls. Snapshot-based input.
 *
 * Snapshot format (committed under tmp/ or generated ad-hoc):
 *   tmp/sheet-snapshot.json   — array of SheetRow
 *   tmp/docs/<docId>.md       — Markdown export of one Google Doc, one per row
 *
 * See catalog/sheet-map.json for sheet-row → repo-target bridge.
 */

import fs from "fs";
import path from "path";

// ── Taxonomy: Chinese sheet category → canonical taxonomy slug ──────────────
// Cross-reference: taxonomy.md + scripts/ingest.ts TAXONOMY constant.

export const SHEET_CATEGORY_MAP: Record<string, string> = {
  // category 0 — strategy
  "策略": "strategy",
  // category 1 — brand-marketing
  "內容行銷": "brand-marketing",
  "品牌行銷": "brand-marketing",
  "簡報": "brand-marketing",
  // category 2 — sales-consultant
  "職涯": "sales-consultant",
  "諮詢助理": "sales-consultant",
  "顧問": "sales-consultant",
  "業務": "sales-consultant",
  // category 3 — operations
  "通用行政": "operations",
  "營運": "operations",
  "流程": "operations",
  "專案": "operations",
  // category 4 — training
  "課程產品": "training",
  "員工訓練": "training",
  // category 5 — product
  "AI 助理產品": "product",
  // category 6 — engineer
  "知識庫管理": "engineer",
  // category 7 — people-talent
  "招募": "people-talent",
};

// Inverse of TAXONOMY in ingest.ts — duplicated to keep sheet-lib pure.
export const TAXONOMY_PREFIX: Record<string, number> = {
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

// ── Types ────────────────────────────────────────────────────────────────────

export interface SheetRow {
  id: string;               // e.g. "2.06"
  category_zh: string;      // e.g. "職涯"
  gpt_name: string;         // e.g. "面試猜題"
  description: string;      // full IPO English block
  prompt_doc_url?: string;  // Google Doc URL for the system prompt
  knowledge_doc_urls: string[]; // zero or more knowledge doc URLs
  synergy?: string;         // raw chain string "2.01 → 2.02 → ..."
  author?: string;
  status: string;
  migrate: string;          // "Done" / "Drop" / "" (blank)
  last_update?: string;
}

export interface SheetMapEntry {
  kind: "standalone" | "agent" | "drop" | "skip" | "review";
  category?: string;
  project?: string;            // for standalone
  parent_project?: string;     // for agent
  slug?: string;
  sheet_name?: string;
  author?: string;
  exists?: boolean;
  notes?: string;
}

export interface SheetMap {
  _meta: Record<string, unknown>;
  rows: Record<string, SheetMapEntry>;
  repo_only?: Record<string, unknown>;
}

export interface IpoFields {
  input?: string;
  process?: string;
  output?: string;
}

// ── URL parsing ──────────────────────────────────────────────────────────────

export function extractDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// ── IPO parser ──────────────────────────────────────────────────────────────
// Mirrors ingest.ts:336 parseIpoFromDescription.

export function parseIpo(description: string | undefined): IpoFields {
  if (!description) return {};
  const normalized = description.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  const inputMatch = normalized.match(/Input[：:](.*?)(?=Process[：:]|Output[：:]|$)/is);
  const processMatch = normalized.match(/Process[：:](.*?)(?=Input[：:]|Output[：:]|$)/is);
  const outputMatch = normalized.match(/Output[：:](.*?)(?=Input[：:]|Process[：:]|$)/is);
  return {
    input: compact(inputMatch?.[1]),
    process: compact(processMatch?.[1]),
    output: compact(outputMatch?.[1]),
  };
}

function compact(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || undefined;
}

// ── Synergy parser ──────────────────────────────────────────────────────────

export function parseSynergy(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[→\->]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d+\.\d+$/.test(s));
}

// ── Path resolution ─────────────────────────────────────────────────────────

export function categoryPrefix(category: string): number {
  const prefix = TAXONOMY_PREFIX[category];
  if (prefix === undefined) {
    throw new Error(`Unknown taxonomy category: '${category}'. Allowed: ${Object.keys(TAXONOMY_PREFIX).join(", ")}`);
  }
  return prefix;
}

export function categoryFolder(category: string): string {
  return `${categoryPrefix(category)}-${category}`;
}

export function targetPath(rootDir: string, entry: SheetMapEntry): { skillMd: string; referencesDir: string; projectDir: string } | null {
  if (!entry.category) return null;
  const catFolder = categoryFolder(entry.category);

  if (entry.kind === "standalone") {
    if (!entry.project) return null;
    const projectDir = path.join(rootDir, "skills", catFolder, entry.project);
    return {
      projectDir,
      skillMd: path.join(projectDir, "SKILL.md"),
      referencesDir: path.join(projectDir, "references"),
    };
  }

  if (entry.kind === "agent") {
    if (!entry.parent_project || !entry.slug) return null;
    const projectDir = path.join(rootDir, "skills", catFolder, entry.parent_project);
    // Prefer existing layout: try .claude/agents/ first, then flat agents/.
    // Both are recognized by ingest.ts findOrchestratorAndAgents.
    const claudeAgent = path.join(projectDir, ".claude", "agents", `${entry.slug}.md`);
    const flatAgent = path.join(projectDir, "agents", `${entry.slug}.md`);
    const chosenAgent = fs.existsSync(claudeAgent)
      ? claudeAgent
      : fs.existsSync(flatAgent)
        ? flatAgent
        : (fs.existsSync(path.join(projectDir, ".claude", "agents"))
          ? claudeAgent  // new file: follow existing project's layout
          : flatAgent);
    return {
      projectDir,
      skillMd: chosenAgent,
      referencesDir: path.join(projectDir, "references"),
    };
  }

  return null;
}

// ── Frontmatter builder for new standalone SKILL.md ─────────────────────────

export interface FrontmatterInput {
  sheetId: string;
  name: string;            // English slug-friendly
  zhName: string;          // original Chinese name from sheet
  category: string;
  project: string;
  status?: string;
  author?: string;
  description?: string;
  input?: string;
  process?: string;
  output?: string;
  synergy?: string[];
}

export function buildStandaloneFrontmatter(input: FrontmatterInput): string {
  const lines = [
    "---",
    `name: ${input.name}`,
    `description: ${JSON.stringify(input.description ?? input.zhName)}`,
    `category: ${input.category}`,
    `project: ${input.project}`,
    `platform: claude`,
    `status: ${input.status ?? "Done"}`,
    `author: ${input.author ?? "Peter Tu"}`,
    `sheetId: "${input.sheetId}"`,
    `originalName: ${JSON.stringify(input.zhName)}`,
  ];
  if (input.input) lines.push(`input: ${JSON.stringify(input.input)}`);
  if (input.process) lines.push(`process: ${JSON.stringify(input.process)}`);
  if (input.output) lines.push(`output: ${JSON.stringify(input.output)}`);
  if (input.synergy && input.synergy.length) {
    lines.push(`synergy:`);
    for (const id of input.synergy) lines.push(`  - "${id}"`);
  } else {
    lines.push(`synergy: []`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

// Agent files use simpler frontmatter (subagent format used by writing-agent / cv-customizer)
export function buildAgentFrontmatter(input: FrontmatterInput): string {
  const desc = input.description ?? `${input.zhName} — agent of ${input.project}`;
  const lines = [
    "---",
    `name: ${input.name}`,
    `description: ${JSON.stringify(desc)}`,
    `sheetId: "${input.sheetId}"`,
    `originalName: ${JSON.stringify(input.zhName)}`,
  ];
  if (input.input) lines.push(`input: ${JSON.stringify(input.input)}`);
  if (input.process) lines.push(`process: ${JSON.stringify(input.process)}`);
  if (input.output) lines.push(`output: ${JSON.stringify(input.output)}`);
  lines.push("---", "");
  return lines.join("\n");
}

// ── Snapshot loaders ────────────────────────────────────────────────────────

export function loadSheetSnapshot(snapshotPath: string): SheetRow[] {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(
      `Sheet snapshot not found at ${snapshotPath}. ` +
      `Generate one via the google-workspace MCP tools (read Assistant Index 📖 with include_hyperlinks) ` +
      `and dump to JSON matching the SheetRow shape.`
    );
  }
  const raw = fs.readFileSync(snapshotPath, "utf8");
  return JSON.parse(raw) as SheetRow[];
}

export function loadSheetMap(mapPath: string): SheetMap {
  const raw = fs.readFileSync(mapPath, "utf8");
  return JSON.parse(raw) as SheetMap;
}

export function loadDocBody(docsDir: string, docUrl: string | undefined): string | null {
  if (!docUrl) return null;
  const id = extractDocId(docUrl);
  if (!id) return null;
  const filePath = path.join(docsDir, `${id}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}
