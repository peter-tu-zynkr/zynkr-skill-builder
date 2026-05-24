#!/usr/bin/env tsx
/**
 * sync-from-sheet.ts
 *
 * Usage:
 *   npx tsx scripts/sync-from-sheet.ts [--dry-run] [--rows 2.06,2.07] [--check-drift] [--refresh]
 *
 * What it does:
 *   1. Loads sheet snapshot from tmp/sheet-snapshot.json (array of SheetRow)
 *   2. Loads bridge config from catalog/sheet-map.json
 *   3. For each Done row in the sheet:
 *        - If kind=skip/drop/review/unmapped → skip with reason
 *        - If kind=agent or standalone:
 *            • If target SKILL.md/agent.md exists → skip (or --refresh to overwrite)
 *            • Else: read prompt doc from tmp/docs/<docId>.md, write SKILL.md
 *              and references/<knowledge-slug>.md for each knowledge doc
 *   4. Prints summary
 *
 * IMPORTANT: This script does NOT call Google APIs directly. It expects
 * tmp/sheet-snapshot.json and tmp/docs/*.md to be populated beforehand.
 * v1 workflow: generate snapshot + doc exports via google-workspace MCP tools
 * during a Claude Code session, then run this script.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  loadSheetSnapshot,
  loadSheetMap,
  loadDocBody,
  extractDocId,
  parseIpo,
  parseSynergy,
  targetPath,
  buildStandaloneFrontmatter,
  buildAgentFrontmatter,
  type SheetRow,
  type SheetMapEntry,
} from "./sheet-lib.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_PATH = path.join(ROOT, "tmp", "sheet-snapshot.json");
const DOCS_DIR = path.join(ROOT, "tmp", "docs");
const SHEET_MAP_PATH = path.join(ROOT, "catalog", "sheet-map.json");

// ── CLI flags ────────────────────────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const CHECK_DRIFT = args.has("--check-drift");
const REFRESH = args.has("--refresh");
const ROWS_FILTER = (() => {
  const idx = process.argv.indexOf("--rows");
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  return value ? new Set(value.split(",").map((s) => s.trim())) : null;
})();

// ── Summary collector ───────────────────────────────────────────────────────

type Outcome = "wrote" | "skipped-exists" | "skipped-not-done" | "skipped-kind" | "skipped-unmapped" | "skipped-no-prompt" | "refreshed" | "drift";

interface SyncResult {
  id: string;
  outcome: Outcome;
  detail: string;
}

const results: SyncResult[] = [];

function record(id: string, outcome: Outcome, detail: string) {
  results.push({ id, outcome, detail });
}

// ── Core ────────────────────────────────────────────────────────────────────

function shouldProcess(id: string): boolean {
  if (ROWS_FILTER && !ROWS_FILTER.has(id)) return false;
  return true;
}

function knowledgeSlug(docUrl: string, index: number): string {
  const id = extractDocId(docUrl);
  return id ? `knowledge-${id.slice(0, 12)}` : `knowledge-${index + 1}`;
}

function writeFileEnsureDir(filePath: string, content: string) {
  if (DRY_RUN) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function syncRow(row: SheetRow, entry: SheetMapEntry): void {
  // Filter: only Done rows are sync candidates
  if (row.status !== "Done") {
    record(row.id, "skipped-not-done", `status=${row.status}`);
    return;
  }

  // Kind-based filtering
  if (entry.kind === "drop") {
    record(row.id, "skipped-kind", `kind=drop (${entry.notes ?? "explicit"})`);
    return;
  }
  if (entry.kind === "skip") {
    record(row.id, "skipped-kind", `kind=skip (${entry.notes ?? "not actionable"})`);
    return;
  }
  if (entry.kind === "review") {
    record(row.id, "skipped-kind", `kind=review (${entry.notes ?? "needs human decision"})`);
    return;
  }

  if (entry.kind !== "standalone" && entry.kind !== "agent") {
    record(row.id, "skipped-kind", `unknown kind=${entry.kind}`);
    return;
  }

  // Resolve target path
  const target = targetPath(ROOT, entry);
  if (!target) {
    record(row.id, "skipped-unmapped", `cannot resolve target path for kind=${entry.kind}`);
    return;
  }

  const targetRel = path.relative(ROOT, target.skillMd);
  const targetExists = fs.existsSync(target.skillMd);

  // Check-drift mode: only compare, don't write
  if (CHECK_DRIFT) {
    if (!targetExists) {
      record(row.id, "drift", `MISSING — sheet has Done row but no file at ${targetRel}`);
    } else {
      // For now, just confirm presence. Real drift diff (sheet description vs frontmatter input/process/output) is a follow-up.
      record(row.id, "skipped-exists", `present at ${targetRel}`);
    }
    return;
  }

  // Skip-if-exists (unless --refresh)
  if (targetExists && !REFRESH) {
    record(row.id, "skipped-exists", `${targetRel} already present (use --refresh to overwrite)`);
    return;
  }

  // Need a prompt doc to scaffold
  if (!row.prompt_doc_url) {
    record(row.id, "skipped-no-prompt", `Done row has no prompt doc URL`);
    return;
  }

  // Load prompt body — required
  const promptBody = loadDocBody(DOCS_DIR, row.prompt_doc_url);
  if (!promptBody) {
    const docId = extractDocId(row.prompt_doc_url);
    record(row.id, "skipped-no-prompt", `prompt doc not in tmp/docs/${docId}.md (fetch first)`);
    return;
  }

  // Build frontmatter
  const ipo = parseIpo(row.description);
  const synergy = parseSynergy(row.synergy);
  const fmInput = {
    sheetId: row.id,
    name: entry.slug ?? entry.project ?? row.id,
    zhName: row.gpt_name,
    category: entry.category!,
    project: entry.kind === "agent" ? entry.parent_project! : entry.project!,
    status: row.status,
    author: row.author ?? entry.author ?? "Peter Tu",
    input: ipo.input,
    process: ipo.process,
    output: ipo.output,
    synergy,
  };

  const frontmatter = entry.kind === "standalone"
    ? buildStandaloneFrontmatter(fmInput)
    : buildAgentFrontmatter(fmInput);

  writeFileEnsureDir(target.skillMd, frontmatter + promptBody);

  // Knowledge docs → references/
  for (let i = 0; i < row.knowledge_doc_urls.length; i++) {
    const url = row.knowledge_doc_urls[i];
    const body = loadDocBody(DOCS_DIR, url);
    if (!body) continue;
    const refPath = path.join(target.referencesDir, `${knowledgeSlug(url, i)}.md`);
    writeFileEnsureDir(refPath, body);
  }

  const action = targetExists ? "refreshed" : "wrote";
  record(row.id, action as Outcome, `${targetRel} (+${row.knowledge_doc_urls.length} knowledge docs)`);
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const rows = loadSheetSnapshot(SNAPSHOT_PATH);
  const sheetMap = loadSheetMap(SHEET_MAP_PATH);

  console.log(`sync-from-sheet — ${DRY_RUN ? "DRY RUN" : "WRITE MODE"}${CHECK_DRIFT ? " --check-drift" : ""}${REFRESH ? " --refresh" : ""}`);
  console.log(`  snapshot: ${path.relative(ROOT, SNAPSHOT_PATH)} (${rows.length} rows)`);
  console.log(`  map: ${path.relative(ROOT, SHEET_MAP_PATH)} (${Object.keys(sheetMap.rows).length} mapped IDs)`);
  if (ROWS_FILTER) console.log(`  --rows filter: ${[...ROWS_FILTER].join(", ")}`);
  console.log();

  for (const row of rows) {
    if (!shouldProcess(row.id)) continue;
    const entry = sheetMap.rows[row.id];
    if (!entry) {
      record(row.id, "skipped-unmapped", `not in catalog/sheet-map.json — add an entry or treat as out-of-scope`);
      continue;
    }
    try {
      syncRow(row, entry);
    } catch (err) {
      record(row.id, "skipped-unmapped", `error: ${(err as Error).message}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const buckets: Record<Outcome, SyncResult[]> = {
    wrote: [],
    refreshed: [],
    drift: [],
    "skipped-exists": [],
    "skipped-not-done": [],
    "skipped-kind": [],
    "skipped-unmapped": [],
    "skipped-no-prompt": [],
  };
  for (const r of results) buckets[r.outcome].push(r);

  const sections: [string, Outcome][] = [
    ["✓ Wrote", "wrote"],
    ["↻ Refreshed", "refreshed"],
    ["⚠ Drift", "drift"],
    ["– Already present", "skipped-exists"],
    ["– Not Done", "skipped-not-done"],
    ["– Skip/Drop/Review", "skipped-kind"],
    ["– Unmapped", "skipped-unmapped"],
    ["– No prompt doc", "skipped-no-prompt"],
  ];

  for (const [label, key] of sections) {
    if (buckets[key].length === 0) continue;
    console.log(`${label} (${buckets[key].length})`);
    for (const r of buckets[key]) console.log(`  ${r.id}  ${r.detail}`);
    console.log();
  }

  const wrote = buckets.wrote.length + buckets.refreshed.length;
  if (DRY_RUN && wrote > 0) {
    console.log(`(dry-run) would have written/refreshed ${wrote} skill files. Re-run without --dry-run to apply.`);
  }
  if (buckets.drift.length > 0) {
    process.exitCode = 1;
  }
}

main();
