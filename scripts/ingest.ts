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
import { syncMarketplaceArtifacts } from "./build-marketplace.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "skills");
const GENERATED_DIR = path.join(ROOT, "generated");
const SKILL_ID_OVERRIDES_PATH = path.join(ROOT, "catalog", "skill-id-overrides.json");
// Also write here so the frontend can import it directly when ready
const FRONTEND_GENERATED = path.join(ROOT, "frontend", "lib", "generated-skills.json");
const MAX_INPUT_LENGTH = 180;
const MAX_PROCESS_LENGTH = 260;
const MAX_OUTPUT_LENGTH = 180;

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
  description: z.string().optional(),
  input: z.string().optional(),
  process: z.string().optional(),
  output: z.string().optional(),
  synergy: z.array(z.string()).default([]),
  upstream_repo: z.string().optional(),
  security_audits: z.object({
    gen_agent_trust_hub: z.enum(["pass", "fail", "pending"]).optional(),
    socket: z.enum(["pass", "fail", "pending"]).optional(),
    snyk: z.enum(["pass", "fail", "pending"]).optional(),
  }).optional(),
});

type SkillFrontmatter = z.infer<typeof SkillFrontmatter>;

type RepoMarkdownFile = {
  raw: string;
  relPath: string;
  content: string;
  data: Record<string, unknown>;
};

type PipelineStage = {
  stage: string;
  agent: string;
  input?: string;
  output?: string;
};

type IngestRecord = {
  id: string;
  name: string;
  sourceFile: string;
  outPath: string;
};

type ExistingSkillRecord = {
  id: string;
  filePath: string;
  category?: string;
  project?: string;
  kind?: string;
  sourceRepo?: string;
  sourceFile?: string;
  upstreamRepo?: string;
  firstSeen?: string;
};

type IpoField = "input" | "process" | "output";
type IpoFieldSource = "csv" | "frontmatter" | "pipeline" | "derived";

type IpoFields = {
  input?: string;
  process?: string;
  output?: string;
};

type IpoProvenance = Partial<Record<IpoField, IpoFieldSource>>;

type LegacyCsvRecord = {
  id: string;
  name?: string;
  input?: string;
  process?: string;
  output?: string;
};

type SkillIdOverrideEntry = {
  forcedId: string;
  legacyIpoId?: string;
};

type SkillIdOverrideMap = Map<string, Map<string, SkillIdOverrideEntry>>;

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

function getNextIds(prefix: number, count: number): string[] {
  if (count <= 0) return [];

  const firstId = getNextId(prefix);
  const start = parseInt(firstId.split(".")[1], 10);
  return Array.from({ length: count }, (_, index) => {
    return `${prefix}.${String(start + index).padStart(2, "0")}`;
  });
}

function getNextIdsExcluding(prefix: number, count: number, excludeIds: Set<string>): string[] {
  if (count <= 0) return [];

  const existing = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .map((f) => f.replace(".md", ""))
    .filter((id) => id.startsWith(`${prefix}.`))
    .map((id) => parseInt(id.split(".")[1], 10))
    .filter((n) => !isNaN(n));

  const nextIds: string[] = [];
  let candidate = existing.length > 0 ? Math.max(...existing) + 1 : 1;

  while (nextIds.length < count) {
    const id = `${prefix}.${String(candidate).padStart(2, "0")}`;
    if (!excludeIds.has(id)) {
      nextIds.push(id);
    }
    candidate += 1;
  }

  return nextIds;
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

function readFirstSeen(outPath: string): string | undefined {
  if (!fs.existsSync(outPath)) return undefined;
  const { data } = matter(fs.readFileSync(outPath, "utf-8"));
  return typeof data.firstSeen === "string" ? data.firstSeen : undefined;
}

async function fetchGitHubStats(ownerRepo: string): Promise<{ stars: number } | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "zynkr-ingest",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${ownerRepo}`, { headers });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count: number };
    return { stars: data.stargazers_count };
  } catch {
    return null;
  }
}

function normalizeFieldValue(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;

  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return undefined;
  if (compact.length <= maxLength) return compact;

  const clipped = compact.slice(0, maxLength);
  const safeBoundary = clipped.lastIndexOf(" ");
  const truncated =
    safeBoundary > Math.floor(maxLength * 0.7) ? clipped.slice(0, safeBoundary) : clipped;

  return `${truncated.trim()}...`;
}

function normalizeWhitespace(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const compact = value.replace(/\s+/g, " ").trim();
  return compact || undefined;
}

function parseLegacyCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function parseIpoFromDescription(description?: string): IpoFields {
  if (!description) {
    return {};
  }

  const normalized = description.replace(/\r\n/g, "\n");
  const inputMatch = normalized.match(/Input[：:](.*?)(?=Process[：:]|Output[：:]|$)/is);
  const processMatch = normalized.match(/Process[：:](.*?)(?=Input[：:]|Output[：:]|$)/is);
  const outputMatch = normalized.match(/Output[：:](.*?)(?=Input[：:]|Process[：:]|$)/is);

  return {
    input: normalizeWhitespace(inputMatch?.[1]),
    process: normalizeWhitespace(processMatch?.[1]),
    output: normalizeWhitespace(outputMatch?.[1]),
  };
}

function loadLegacyCsvById(): Map<string, LegacyCsvRecord> {
  const csvPath = path.join(ROOT, "assistant-index.csv");
  if (!fs.existsSync(csvPath)) {
    return new Map();
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseLegacyCsvRows(raw);
  const header = rows[1]?.map((value) => value.trim()) ?? [];
  const dataRows = rows.slice(2).filter((row) => row.some((cell) => cell.trim() !== ""));

  return new Map(
    dataRows
      .map((row) => {
        const record = Object.fromEntries(
          header.map((columnName, index) => [columnName, row[index]?.trim() ?? ""])
        );
        const id = record["no."]?.trim();
        const name = record["GPT"] || record["Gemini"] || record["Claude skill"] || "";
        return [
          id,
          {
            id,
            name: name.trim() || undefined,
            ...parseIpoFromDescription(record["Description"]),
          },
        ] as const;
      })
      .filter(([id]) => Boolean(id))
  );
}

function optionalString(
  data: Record<string, unknown>,
  key: string
): string | undefined {
  return typeof data[key] === "string" ? data[key] : undefined;
}

function normalizeResolvedField(field: IpoField, value: string): string | undefined {
  const maxLength =
    field === "process" ? MAX_PROCESS_LENGTH : field === "input" ? MAX_INPUT_LENGTH : MAX_OUTPUT_LENGTH;

  return normalizeFieldValue(value, maxLength);
}

function resolveIpoFields(
  legacyLookupId: string | undefined,
  candidates: Record<IpoField, Array<{ value?: string; source: IpoFieldSource }>>,
  legacyCsvById: Map<string, LegacyCsvRecord>
): IpoFields & { ipoProvenance: IpoProvenance } {
  const csv = legacyLookupId ? legacyCsvById.get(legacyLookupId) : undefined;
  const resolved: IpoFields = {};
  const provenance: IpoProvenance = {};

  (["input", "process", "output"] as IpoField[]).forEach((field) => {
    const orderedCandidates = [
      { value: csv?.[field], source: "csv" as const },
      ...candidates[field],
    ];

    for (const candidate of orderedCandidates) {
      const normalizedValue = normalizeResolvedField(field, normalizeWhitespace(candidate.value) ?? "");
      if (!normalizedValue) {
        continue;
      }
      resolved[field] = normalizedValue;
      provenance[field] = candidate.source;
      break;
    }
  });

  return {
    ...resolved,
    ipoProvenance: provenance,
  };
}

function loadSkillIdOverrides(): SkillIdOverrideMap {
  if (!fs.existsSync(SKILL_ID_OVERRIDES_PATH)) {
    return new Map();
  }

  const raw = fs.readFileSync(SKILL_ID_OVERRIDES_PATH, "utf8");
  const parsed = JSON.parse(raw) as Record<
    string,
    Record<string, string | { forcedId: string; legacyIpoId?: string }>
  >;

  return new Map(
    Object.entries(parsed).map(([repoUrl, overrides]) => [
      repoUrl,
      new Map(
        Object.entries(overrides).map(([sourceFile, entry]) => [
          sourceFile,
          typeof entry === "string" ? { forcedId: entry, legacyIpoId: entry } : entry,
        ])
      ),
    ])
  );
}

function getOverrideEntry(
  skillIdOverrides: SkillIdOverrideMap,
  repoUrl: string,
  sourceFile: string
): SkillIdOverrideEntry | undefined {
  return skillIdOverrides.get(repoUrl)?.get(sourceFile);
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

function readRepoMarkdownFile(baseDir: string, filePath: string): RepoMarkdownFile {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    raw,
    relPath: path.relative(baseDir, filePath),
    content,
    data,
  };
}

function parsePipelineStages(orchestratorContent: string): PipelineStage[] {
  const cleanCell = (value: string): string => {
    return value
      .trim()
      .replace(/^`(.+)`$/, "$1")
      .replace(/\\`/g, "`");
  };

  const lines = orchestratorContent.split(/\r?\n/);
  const tableLines: string[] = [];
  let inPipelineSection = false;

  for (const line of lines) {
    if (!inPipelineSection) {
      if (/^##\s+Pipeline Stages\b/i.test(line.trim())) {
        inPipelineSection = true;
      }
      continue;
    }

    if (/^##\s+/.test(line.trim())) {
      break;
    }

    if (line.trim().startsWith("|")) {
      tableLines.push(line);
    }
  }

  return tableLines
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cleanCell(cell)))
    .filter((cells) => cells.length >= 4)
    .filter((cells) => cells[0] !== "Stage")
    .filter((cells) => !cells.every((cell) => /^-+$/.test(cell.replace(/:/g, ""))))
    .map(([stage, agent, input, output]) => ({
      stage,
      agent,
      input: input || undefined,
      output: output || undefined,
    }));
}

function findManifestFile(files: RepoMarkdownFile[]): RepoMarkdownFile | undefined {
  const validFiles = files.filter((file) => SkillFrontmatter.safeParse(file.data).success);

  return (
    validFiles.find((file) => path.basename(file.relPath).toLowerCase() === "claude.md") ??
    validFiles.find((file) => !file.relPath.startsWith(".claude/")) ??
    validFiles[0]
  );
}

function loadExistingSkillRecords(): ExistingSkillRecord[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("."))
    .map((file) => {
      const filePath = path.join(CONTENT_DIR, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = matter(raw).data as Record<string, unknown>;
      return {
        id: typeof data.id === "string" ? data.id : file.replace(".md", ""),
        filePath,
        category: typeof data.category === "string" ? data.category : undefined,
        project: typeof data.project === "string" ? data.project : undefined,
        kind: typeof data.kind === "string" ? data.kind : undefined,
        sourceRepo: typeof data.sourceRepo === "string" ? data.sourceRepo : undefined,
        sourceFile: typeof data.sourceFile === "string" ? data.sourceFile : undefined,
        upstreamRepo: typeof data.upstreamRepo === "string" ? data.upstreamRepo : undefined,
        firstSeen: typeof data.firstSeen === "string" ? data.firstSeen : undefined,
      };
    });
}

function normalizeSourceFile(sourceFile: string): string {
  return sourceFile.replace(/`([^`]+)`/g, "$1");
}

function buildSourceKey(repoUrl: string, sourceFile: string): string {
  return `${repoUrl}::${normalizeSourceFile(sourceFile)}`;
}

function compareSkillIds(a: string, b: string): number {
  const [aPrefixRaw, aSeqRaw] = a.split(".");
  const [bPrefixRaw, bSeqRaw] = b.split(".");
  const aPrefix = Number(aPrefixRaw);
  const bPrefix = Number(bPrefixRaw);
  const aSeq = Number(aSeqRaw);
  const bSeq = Number(bSeqRaw);

  if (aPrefix !== bPrefix) {
    return aPrefix - bPrefix;
  }

  return aSeq - bSeq;
}

function allocateIdsForSourceFiles(
  prefix: number,
  repoUrl: string,
  sourceFiles: string[],
  skillIdOverrides: SkillIdOverrideMap
): Map<string, string> {
  const existing = loadExistingSkillRecords();
  const existingBySource = new Map<string, string[]>();
  const existingById = new Map(existing.map((record) => [record.id, record]));
  const repoOverrides = skillIdOverrides.get(repoUrl) ?? new Map<string, SkillIdOverrideEntry>();

  for (const record of existing) {
    if (!record.sourceRepo || !record.sourceFile || !record.id) continue;
    const key = buildSourceKey(record.sourceRepo, record.sourceFile);
    const ids = existingBySource.get(key) ?? [];
    ids.push(record.id);
    existingBySource.set(key, ids);
  }

  const assigned = new Map<string, string>();
  const reservedIds = new Set<string>();
  const currentSourceKeys = new Set(sourceFiles.map((sourceFile) => buildSourceKey(repoUrl, sourceFile)));

  for (const sourceFile of sourceFiles) {
    const overrideEntry = repoOverrides.get(sourceFile);
    if (overrideEntry) {
      const existingRecord = existingById.get(overrideEntry.forcedId);
      if (
        existingRecord &&
        buildSourceKey(existingRecord.sourceRepo ?? "", existingRecord.sourceFile ?? "") !==
          buildSourceKey(repoUrl, sourceFile) &&
        !currentSourceKeys.has(buildSourceKey(existingRecord.sourceRepo ?? "", existingRecord.sourceFile ?? ""))
      ) {
        throw new Error(
          `ID override conflict: ${sourceFile} in ${repoUrl} requested ${overrideEntry.forcedId}, already used by ${existingRecord.sourceRepo ?? "unknown"}:${existingRecord.sourceFile ?? existingRecord.filePath}`
        );
      }

      if (reservedIds.has(overrideEntry.forcedId)) {
        throw new Error(`Duplicate ID override: ${overrideEntry.forcedId} requested more than once for ${repoUrl}`);
      }

      assigned.set(sourceFile, overrideEntry.forcedId);
      reservedIds.add(overrideEntry.forcedId);
      continue;
    }

    const existingIds = existingBySource.get(buildSourceKey(repoUrl, sourceFile));
    const existingId = existingIds?.sort(compareSkillIds)[0];
    if (existingId) {
      assigned.set(sourceFile, existingId);
      reservedIds.add(existingId);
    }
  }

  const missingSourceFiles = sourceFiles.filter((sourceFile) => !assigned.has(sourceFile));
  const newIds = getNextIdsExcluding(prefix, missingSourceFiles.length, reservedIds);

  missingSourceFiles.forEach((sourceFile, index) => {
    assigned.set(sourceFile, newIds[index]);
  });

  return assigned;
}

function cleanupRepoRecords(
  repoUrl: string,
  project: string,
  sourceFileToId: Map<string, string>
) {
  const existing = loadExistingSkillRecords();
  const activeIds = new Set(sourceFileToId.values());
  const activeSourceKeys = new Set(
    Array.from(sourceFileToId.keys()).map((sourceFile) => buildSourceKey(repoUrl, sourceFile))
  );

  for (const record of existing) {
    if (record.sourceRepo !== repoUrl || record.project !== project || !record.sourceFile) {
      continue;
    }

    const normalizedKey = buildSourceKey(repoUrl, record.sourceFile);
    const isManagedPipelineRecord =
      record.kind === "subagent" || record.kind === "orchestrator" || record.sourceFile === "CLAUDE.md";

    if (!isManagedPipelineRecord) {
      continue;
    }

    const shouldDelete =
      !activeSourceKeys.has(normalizedKey) || !activeIds.has(record.id);

    if (shouldDelete && fs.existsSync(record.filePath)) {
      fs.rmSync(record.filePath, { force: true });
    }
  }
}

function stripUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, stripUndefinedDeep(nestedValue)])
    );
  }

  return value;
}

function writeNormalizedSkillFile(
  outPath: string,
  body: string,
  normalized: Record<string, unknown>
) {
  fs.writeFileSync(outPath, matter.stringify(body, stripUndefinedDeep(normalized) as Record<string, unknown>));
}

function findOrchestratorAndAgents(
  projectDir: string
): { orchestratorPath: string; agentsDir: string } | null {
  // Try flat layout first: SKILL.md + agents/
  const flatOrchestrator = path.join(projectDir, "SKILL.md");
  const flatAgents = path.join(projectDir, "agents");
  if (fs.existsSync(flatOrchestrator) && fs.existsSync(flatAgents)) {
    return { orchestratorPath: flatOrchestrator, agentsDir: flatAgents };
  }

  // Try .claude/ layout: .claude/skills/*/SKILL.md + .claude/agents/
  const claudeAgents = path.join(projectDir, ".claude", "agents");
  const claudeSkillsDir = path.join(projectDir, ".claude", "skills");
  if (fs.existsSync(claudeAgents) && fs.existsSync(claudeSkillsDir)) {
    const skillDirs = fs
      .readdirSync(claudeSkillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory());
    for (const skillDir of skillDirs) {
      const skillMd = path.join(claudeSkillsDir, skillDir.name, "SKILL.md");
      if (fs.existsSync(skillMd)) {
        return { orchestratorPath: skillMd, agentsDir: claudeAgents };
      }
    }
  }

  return null;
}

function ingestProjectSkills(
  repoUrl: string,
  projectDir: string,
  monorepoRoot: string,
  legacyCsvById: Map<string, LegacyCsvRecord>,
  skillIdOverrides: SkillIdOverrideMap
): IngestRecord[] {
  const skillMdPath = path.join(projectDir, "SKILL.md");
  if (!fs.existsSync(skillMdPath)) return [];

  const skillFile = readRepoMarkdownFile(monorepoRoot, skillMdPath);
  const parsed = SkillFrontmatter.safeParse(skillFile.data);
  if (!parsed.success) return [];

  const manifest = parsed.data;
  const prefix = TAXONOMY[manifest.category];
  const today = new Date().toISOString().split("T")[0];

  // Collect all source files: SKILL.md (orchestrator) + agent files (subagents)
  const agentsDir = path.join(projectDir, "agents");
  const agentFiles: RepoMarkdownFile[] = [];
  if (fs.existsSync(agentsDir)) {
    const agentPaths = fs
      .readdirSync(agentsDir)
      .filter((f) => f.endsWith(".md") && !f.startsWith("."))
      .map((f) => path.join(agentsDir, f));
    agentPaths.forEach((filePath) => {
      agentFiles.push(readRepoMarkdownFile(monorepoRoot, filePath));
    });
  }

  const sourceFiles = [skillFile.relPath, ...agentFiles.map((f) => f.relPath)];
  const idsBySourceFile = allocateIdsForSourceFiles(prefix, repoUrl, sourceFiles, skillIdOverrides);
  const synergy = sourceFiles.map((sf) => idsBySourceFile.get(sf)!);
  const ingested: IngestRecord[] = [];

  cleanupRepoRecords(repoUrl, manifest.project, idsBySourceFile);

  // Write orchestrator
  const orchestratorId = idsBySourceFile.get(skillFile.relPath)!;
  const orchestratorSlug = toSlug(manifest.name);
  const orchestratorOutPath = path.join(CONTENT_DIR, `${orchestratorId}.md`);
  const orchestratorOverride = getOverrideEntry(skillIdOverrides, repoUrl, skillFile.relPath);
  const orchestratorLegacyIpoId = orchestratorOverride
    ? orchestratorOverride.legacyIpoId ?? null
    : orchestratorId;
  const orchestratorIpo = resolveIpoFields(
    orchestratorOverride?.legacyIpoId,
    {
      input: [{ value: manifest.input, source: "frontmatter" }],
      process: [{ value: manifest.process, source: "frontmatter" }],
      output: [{ value: manifest.output, source: "frontmatter" }],
    },
    legacyCsvById
  );
  writeNormalizedSkillFile(orchestratorOutPath, skillFile.content, {
    id: orchestratorId,
    name: manifest.name,
    category: manifest.category,
    project: manifest.project,
    platform: manifest.platform,
    status: manifest.status,
    author: manifest.author,
    description: manifest.description,
    input: orchestratorIpo.input,
    process: orchestratorIpo.process,
    output: orchestratorIpo.output,
    ipoProvenance: orchestratorIpo.ipoProvenance,
    legacyIpoId: orchestratorLegacyIpoId,
    kind: agentFiles.length > 0 ? "orchestrator" : "skill",
    synergy,
    installCommand: buildInstallCommand(orchestratorId, orchestratorSlug),
    updatedAt: today,
    firstSeen: readFirstSeen(orchestratorOutPath) ?? today,
    sourceRepo: repoUrl,
    sourceFile: skillFile.relPath,
    upstreamRepo: manifest.upstream_repo,
    securityAudits: manifest.security_audits,
  });
  ingested.push({
    id: orchestratorId,
    name: manifest.name,
    sourceFile: skillFile.relPath,
    outPath: orchestratorOutPath,
  });

  // Write subagents
  agentFiles.forEach((agentFile) => {
    const agentData = agentFile.data as Record<string, unknown>;
    const agentName =
      (typeof agentData.name === "string" && agentData.name) ||
      path.basename(agentFile.relPath, ".md");
    const agentDescription = optionalString(agentData, "description");
    const sourceFile = agentFile.relPath;
    const agentId = idsBySourceFile.get(sourceFile)!;
    const agentOutPath = path.join(CONTENT_DIR, `${agentId}.md`);
    const agentOverride = getOverrideEntry(skillIdOverrides, repoUrl, sourceFile);
    const agentLegacyIpoId = agentOverride ? agentOverride.legacyIpoId ?? null : agentId;
    const agentIpo = resolveIpoFields(
      agentOverride?.legacyIpoId,
      {
        input: [{ value: optionalString(agentData, "input"), source: "frontmatter" }],
        process: [{ value: optionalString(agentData, "process"), source: "frontmatter" }],
        output: [{ value: optionalString(agentData, "output"), source: "frontmatter" }],
      },
      legacyCsvById
    );

    writeNormalizedSkillFile(agentOutPath, agentFile.content, {
      id: agentId,
      name: agentName,
      category: manifest.category,
      project: manifest.project,
      platform: manifest.platform,
      status: manifest.status,
      author: manifest.author,
      description: agentDescription,
      input: agentIpo.input,
      process: agentIpo.process,
      output: agentIpo.output,
      ipoProvenance: agentIpo.ipoProvenance,
      legacyIpoId: agentLegacyIpoId,
      kind: "subagent",
      synergy,
      updatedAt: today,
      firstSeen: readFirstSeen(agentOutPath) ?? today,
      sourceRepo: repoUrl,
      sourceFile,
      upstreamRepo: manifest.upstream_repo,
      securityAudits: manifest.security_audits,
    });

    ingested.push({
      id: agentId,
      name: agentName,
      sourceFile,
      outPath: agentOutPath,
    });
  });

  return ingested;
}

function ingestRepoAsPipeline(
  repoUrl: string,
  tmpDir: string,
  files: RepoMarkdownFile[],
  legacyCsvById: Map<string, LegacyCsvRecord>,
  skillIdOverrides: SkillIdOverrideMap,
  baseDir?: string
): IngestRecord[] {
  const relBase = baseDir ?? tmpDir;
  const layout = findOrchestratorAndAgents(tmpDir);
  if (!layout) return [];

  const { orchestratorPath, agentsDir } = layout;

  const manifestFile = findManifestFile(files);
  if (!manifestFile) {
    return [];
  }

  const parsedManifest = SkillFrontmatter.safeParse(manifestFile.data);
  if (!parsedManifest.success) {
    return [];
  }

  const orchestratorFile = readRepoMarkdownFile(relBase, orchestratorPath);
  const stages = parsePipelineStages(orchestratorFile.content);
  if (stages.length === 0) {
    return [];
  }

  const agentPaths = fs
    .readdirSync(agentsDir)
    .filter((file) => file.endsWith(".md") && !file.startsWith("."))
    .map((file) => path.join(agentsDir, file));

  const agentFiles = agentPaths.map((filePath) => readRepoMarkdownFile(relBase, filePath));
  const agentByStem = new Map(
    agentFiles.map((file) => [path.basename(file.relPath, ".md"), file])
  );
  const agentByName = new Map(
    agentFiles
      .map((file) => {
        const parsed = matter(file.raw).data as Record<string, unknown>;
        const name = typeof parsed.name === "string" ? parsed.name : "";
        return [name, file] as const;
      })
      .filter(([name]) => Boolean(name))
  );

  const manifest = parsedManifest.data;
  const sourceFiles = [manifestFile.relPath, ...stages.map((stage) => {
    const agentFile =
      agentByStem.get(stage.agent) ??
      agentByName.get(stage.agent);
    return agentFile?.relPath ?? `.claude/agents/${stage.agent}.md`;
  })];
  const idsBySourceFile = allocateIdsForSourceFiles(
    TAXONOMY[manifest.category],
    repoUrl,
    sourceFiles,
    skillIdOverrides
  );
  const ids = sourceFiles.map((sourceFile) => idsBySourceFile.get(sourceFile)!);
  const synergy = ids;
  const today = new Date().toISOString().split("T")[0];
  const ingested: IngestRecord[] = [];

  cleanupRepoRecords(repoUrl, manifest.project, idsBySourceFile);

  const orchestratorSlug = toSlug(manifest.name);
  const orchestratorSourceFile = manifestFile.relPath;
  const orchestratorId = idsBySourceFile.get(orchestratorSourceFile)!;
  const orchestratorPathOut = path.join(CONTENT_DIR, `${orchestratorId}.md`);
  const orchestratorOverride = getOverrideEntry(skillIdOverrides, repoUrl, orchestratorSourceFile);
  const orchestratorLegacyIpoId = orchestratorOverride
    ? orchestratorOverride.legacyIpoId ?? null
    : orchestratorId;
  const orchestratorIpo = resolveIpoFields(
    orchestratorOverride?.legacyIpoId,
    {
      input: [{ value: manifest.input, source: "frontmatter" }],
      process: [{ value: manifest.process, source: "frontmatter" }],
      output: [{ value: manifest.output, source: "frontmatter" }],
    },
    legacyCsvById
  );
  writeNormalizedSkillFile(orchestratorPathOut, manifestFile.content, {
    id: orchestratorId,
    name: manifest.name,
    category: manifest.category,
    project: manifest.project,
    platform: manifest.platform,
    status: manifest.status,
    author: manifest.author,
    description: manifest.description,
    input: orchestratorIpo.input,
    process: orchestratorIpo.process,
    output: orchestratorIpo.output,
    ipoProvenance: orchestratorIpo.ipoProvenance,
    legacyIpoId: orchestratorLegacyIpoId,
    kind: "orchestrator",
    synergy,
    installCommand: buildInstallCommand(orchestratorId, orchestratorSlug),
    updatedAt: today,
    firstSeen: readFirstSeen(orchestratorPathOut) ?? today,
    sourceRepo: repoUrl,
    sourceFile: orchestratorSourceFile,
    upstreamRepo: manifest.upstream_repo,
    securityAudits: manifest.security_audits,
  });
  ingested.push({
    id: orchestratorId,
    name: manifest.name,
    sourceFile: orchestratorSourceFile,
    outPath: orchestratorPathOut,
  });

  stages.forEach((stage, index) => {
    const agentFile =
      agentByStem.get(stage.agent) ??
      agentByName.get(stage.agent);

    const agentData = agentFile ? (matter(agentFile.raw).data as Record<string, unknown>) : {};
    const agentName =
      (typeof agentData.name === "string" && agentData.name) ||
      `${manifest.name} - ${stage.agent}`;
    const agentDescription = optionalString(agentData, "description");
    const sourceFile = agentFile?.relPath ?? `.claude/agents/${stage.agent}.md`;
    const stageId = idsBySourceFile.get(sourceFile)!;
    const stagePathOut = path.join(CONTENT_DIR, `${stageId}.md`);
    const stageOverride = getOverrideEntry(skillIdOverrides, repoUrl, sourceFile);
    const stageLegacyIpoId = stageOverride ? stageOverride.legacyIpoId ?? null : stageId;
    const stageIpo = resolveIpoFields(
      stageOverride?.legacyIpoId,
      {
        input: [
          { value: optionalString(agentData, "input"), source: "frontmatter" },
          { value: stage.input, source: "pipeline" },
        ],
        process: [
          { value: optionalString(agentData, "process"), source: "frontmatter" },
          {
            value: `Stage ${stage.stage} in the ${manifest.name} pipeline, orchestrated by ${manifest.name}.`,
            source: "derived",
          },
        ],
        output: [
          { value: optionalString(agentData, "output"), source: "frontmatter" },
          { value: stage.output, source: "pipeline" },
        ],
      },
      legacyCsvById
    );

    writeNormalizedSkillFile(stagePathOut, agentFile?.content ?? "", {
      id: stageId,
      name: agentName,
      category: manifest.category,
      project: manifest.project,
      platform: manifest.platform,
      status: manifest.status,
      author: manifest.author,
      description: agentDescription,
      input: stageIpo.input,
      process: stageIpo.process,
      output: stageIpo.output,
      ipoProvenance: stageIpo.ipoProvenance,
      legacyIpoId: stageLegacyIpoId,
      kind: "subagent",
      stage: stage.stage,
      synergy,
      updatedAt: today,
      firstSeen: readFirstSeen(stagePathOut) ?? today,
      sourceRepo: repoUrl,
      sourceFile,
      upstreamRepo: manifest.upstream_repo,
      securityAudits: manifest.security_audits,
    });

    ingested.push({
      id: stageId,
      name: agentName,
      sourceFile,
      outPath: stagePathOut,
    });
  });

  return ingested;
}

async function generateSkillsJson(
  legacyCsvById: Map<string, LegacyCsvRecord>,
  skillIdOverrides: SkillIdOverrideMap
) {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .sort();

  const skills = files.map((f) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf-8");
    const { data } = matter(raw);
    const skillData = data as Record<string, unknown>;
    const id = typeof skillData.id === "string" ? skillData.id : f.replace(".md", "");
    const sourceRepo = typeof skillData.sourceRepo === "string" ? skillData.sourceRepo : "";
    const sourceFile = typeof skillData.sourceFile === "string" ? skillData.sourceFile : "";
    const overrideEntry = getOverrideEntry(skillIdOverrides, sourceRepo, sourceFile);
    const legacyIpoId =
      "legacyIpoId" in skillData
        ? (skillData.legacyIpoId as string | null)
        : overrideEntry
          ? (overrideEntry.legacyIpoId ?? null)
          : id;
    const normalizedIpo = resolveIpoFields(
      legacyIpoId ?? undefined,
      {
        input: [{ value: typeof skillData.input === "string" ? skillData.input : undefined, source: "frontmatter" }],
        process: [{ value: typeof skillData.process === "string" ? skillData.process : undefined, source: "frontmatter" }],
        output: [{ value: typeof skillData.output === "string" ? skillData.output : undefined, source: "frontmatter" }],
      },
      legacyCsvById
    );

    return {
      ...skillData,
      id,
      input: normalizedIpo.input,
      process: normalizedIpo.process,
      output: normalizedIpo.output,
      ipoProvenance: normalizedIpo.ipoProvenance,
      legacyIpoId,
    };
  });

  // Fetch GitHub stars for external upstream repos
  const upstreamRepos = new Set(
    skills
      .map((s) => (typeof (s as Record<string, unknown>).upstreamRepo === "string"
        ? (s as Record<string, unknown>).upstreamRepo as string
        : undefined))
      .filter((r): r is string => Boolean(r))
  );
  const githubStarsCache = new Map<string, number>();
  if (upstreamRepos.size > 0) {
    console.log(`\n  → Fetching GitHub stats for ${upstreamRepos.size} upstream repo(s)...`);
    for (const repo of upstreamRepos) {
      const stats = await fetchGitHubStats(repo);
      if (stats !== null) {
        githubStarsCache.set(repo, stats.stars);
        console.log(`    ★  ${repo}: ${stats.stars.toLocaleString()} stars`);
      }
    }
  }

  const enrichedSkills = skills.map((skill) => {
    const upstreamRepo = typeof (skill as Record<string, unknown>).upstreamRepo === "string"
      ? (skill as Record<string, unknown>).upstreamRepo as string
      : undefined;
    const githubStars = upstreamRepo ? githubStarsCache.get(upstreamRepo) : undefined;
    return githubStars !== undefined ? { ...skill, githubStars } : skill;
  });

  const json = JSON.stringify(enrichedSkills, null, 2);
  fs.writeFileSync(path.join(GENERATED_DIR, "skills.json"), json);
  fs.writeFileSync(FRONTEND_GENERATED, json);
  console.log(`\n  → generated/skills.json updated (${enrichedSkills.length} skills total)`);
  console.log(`  → frontend/lib/generated-skills.json updated`);
  syncMarketplaceArtifacts();
}

// ── Monorepo detection ──────────────────────────────────────────────────────

function detectMonorepoProjects(repoDir: string): string[] {
  return fs
    .readdirSync(repoDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .filter((d) => {
      const subdir = path.join(repoDir, d.name);
      const hasSkillMd = fs.existsSync(path.join(subdir, "SKILL.md"));
      const hasClaudeDir = fs.existsSync(path.join(subdir, ".claude"));
      return hasSkillMd || hasClaudeDir;
    })
    .map((d) => d.name);
}

function ingestSingleProject(
  repoUrl: string,
  projectDir: string,
  monorepoRoot: string,
  legacyCsvById: Map<string, LegacyCsvRecord>,
  skillIdOverrides: SkillIdOverrideMap
): IngestRecord[] {
  // Try pipeline ingest first (has ## Pipeline Stages table)
  const mdFiles = findMdFiles(projectDir);
  const repoFiles = mdFiles.map((filePath) => readRepoMarkdownFile(monorepoRoot, filePath));

  const pipelineResult = ingestRepoAsPipeline(
    repoUrl,
    projectDir,
    repoFiles,
    legacyCsvById,
    skillIdOverrides,
    monorepoRoot
  );
  if (pipelineResult.length > 0) return pipelineResult;

  // Fall back to project-level ingest (SKILL.md + agents/)
  const projectResult = ingestProjectSkills(
    repoUrl,
    projectDir,
    monorepoRoot,
    legacyCsvById,
    skillIdOverrides
  );
  if (projectResult.length > 0) return projectResult;

  return [];
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/ingest.ts <github-repo-url|local-path> [canonical-url]");
    process.exit(1);
  }

  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const legacyCsvById = loadLegacyCsvById();
  const skillIdOverrides = loadSkillIdOverrides();

  const isLocalPath = !arg.startsWith("http");
  // Keep the staging URL as canonical namespace so existing skill IDs don't change
  const repoUrl = isLocalPath
    ? (process.argv[3] ?? "https://github.com/peter-tu-zynkr/zynkr-skills-staging")
    : arg;

  let tmpDir: string;
  let shouldCleanupTmpDir = false;

  if (isLocalPath) {
    tmpDir = path.resolve(arg);
    console.log(`\nScanning local path ${tmpDir}...`);
  } else {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "zynkr-ingest-"));
    console.log(`\nCloning ${repoUrl}...`);
    execSync(`git clone --depth 1 ${repoUrl} ${tmpDir}`, { stdio: "inherit" });
    shouldCleanupTmpDir = true;
  }

  const ingested: { id: string; name: string; sourceFile: string }[] = [];
  const skipped: { file: string; reason: string }[] = [];

  // Check for monorepo layout (supports flat layout AND category/project two-level layout)
  let monorepoProjects = detectMonorepoProjects(tmpDir);
  if (monorepoProjects.length === 0) {
    // Try two-level scan: [category]/[project]/ — used by skills/ subfolder structure
    for (const catEntry of fs.readdirSync(tmpDir, { withFileTypes: true })) {
      if (!catEntry.isDirectory() || catEntry.name.startsWith(".")) continue;
      const catPath = path.join(tmpDir, catEntry.name);
      for (const proj of detectMonorepoProjects(catPath)) {
        monorepoProjects.push(path.join(catEntry.name, proj));
      }
    }
  }

  if (monorepoProjects.length > 0) {
    console.log(`Detected monorepo with ${monorepoProjects.length} project(s): ${monorepoProjects.join(", ")}\n`);

    for (const projectName of monorepoProjects) {
      const projectDir = path.join(tmpDir, projectName);
      console.log(`── ${projectName} ──`);

      const projectIngested = ingestSingleProject(
        repoUrl,
        projectDir,
        tmpDir,
        legacyCsvById,
        skillIdOverrides
      );

      if (projectIngested.length > 0) {
        projectIngested.forEach((record) => {
          ingested.push({
            id: record.id,
            name: record.name,
            sourceFile: record.sourceFile,
          });
          console.log(`  ✓  ${record.id}  ${record.name}`);
        });
      } else {
        console.log(`  (no ingestible skills found)`);
      }
    }
  } else {
    // Single-project repo (existing behavior)
    const mdFiles = findMdFiles(tmpDir);
    const repoFiles = mdFiles.map((filePath) => readRepoMarkdownFile(tmpDir, filePath));
    console.log(`Found ${mdFiles.length} .md file(s)\n`);

    const pipelineIngested = ingestRepoAsPipeline(
      repoUrl,
      tmpDir,
      repoFiles,
      legacyCsvById,
      skillIdOverrides
    );
    if (pipelineIngested.length > 0) {
      pipelineIngested.forEach((record) => {
        ingested.push({
          id: record.id,
          name: record.name,
          sourceFile: record.sourceFile,
        });
        console.log(`  ✓  ${record.id}  ${record.name}`);
      });
    } else {
      for (const file of repoFiles) {
        const { data, content, relPath } = file;

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
        const sourceFile = relPath;
        const id = allocateIdsForSourceFiles(prefix, repoUrl, [sourceFile], skillIdOverrides).get(sourceFile)!;
        const slug = toSlug(fm.name);
        const today = new Date().toISOString().split("T")[0];
        const overrideEntry = getOverrideEntry(skillIdOverrides, repoUrl, sourceFile);
        const legacyIpoId = overrideEntry ? overrideEntry.legacyIpoId ?? null : id;
        const standaloneIpo = resolveIpoFields(
          legacyIpoId ?? undefined,
          {
            input: [{ value: fm.input, source: "frontmatter" }],
            process: [{ value: fm.process, source: "frontmatter" }],
            output: [{ value: fm.output, source: "frontmatter" }],
          },
          legacyCsvById
        );

        const normalized = {
          id,
          name: fm.name,
          category: fm.category,
          project: fm.project,
          platform: fm.platform,
          status: fm.status,
          author: fm.author,
          description: fm.description,
          input: standaloneIpo.input,
          process: standaloneIpo.process,
          output: standaloneIpo.output,
          ipoProvenance: standaloneIpo.ipoProvenance,
          legacyIpoId,
          kind: "skill",
          synergy: fm.synergy,
          installCommand: buildInstallCommand(id, slug),
          updatedAt: today,
          firstSeen: readFirstSeen(outPath) ?? today,
          sourceRepo: repoUrl,
          sourceFile,
          upstreamRepo: fm.upstream_repo,
          securityAudits: fm.security_audits,
        };

        const outPath = path.join(CONTENT_DIR, `${id}.md`);
        writeNormalizedSkillFile(outPath, content, normalized);

        ingested.push({ id, name: fm.name, sourceFile: relPath });
        console.log(`  ✓  ${id}  ${fm.name}`);
      }
    }
  }

  // Cleanup temp dir (only if we cloned; don't delete local workspace)
  if (shouldCleanupTmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // Regenerate generated/skills.json
  await generateSkillsJson(legacyCsvById, skillIdOverrides);

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
