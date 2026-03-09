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

function ingestRepoAsPipeline(
  repoUrl: string,
  tmpDir: string,
  files: RepoMarkdownFile[],
  legacyCsvById: Map<string, LegacyCsvRecord>,
  skillIdOverrides: SkillIdOverrideMap
): IngestRecord[] {
  const orchestratorPath = path.join(tmpDir, ".claude", "skills", "write-article", "SKILL.md");
  const agentsDir = path.join(tmpDir, ".claude", "agents");

  if (!fs.existsSync(orchestratorPath) || !fs.existsSync(agentsDir)) {
    return [];
  }

  const manifestFile = findManifestFile(files);
  if (!manifestFile) {
    return [];
  }

  const parsedManifest = SkillFrontmatter.safeParse(manifestFile.data);
  if (!parsedManifest.success) {
    return [];
  }

  const orchestratorFile = readRepoMarkdownFile(tmpDir, orchestratorPath);
  const stages = parsePipelineStages(orchestratorFile.content);
  if (stages.length === 0) {
    return [];
  }

  const agentPaths = fs
    .readdirSync(agentsDir)
    .filter((file) => file.endsWith(".md") && !file.startsWith("."))
    .map((file) => path.join(agentsDir, file));

  const agentFiles = agentPaths.map((filePath) => readRepoMarkdownFile(tmpDir, filePath));
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
    sourceRepo: repoUrl,
    sourceFile: orchestratorSourceFile,
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
      sourceRepo: repoUrl,
      sourceFile,
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

function generateSkillsJson(
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
  const legacyCsvById = loadLegacyCsvById();
  const skillIdOverrides = loadSkillIdOverrides();

  // Clone to temp dir
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "zynkr-ingest-"));
  console.log(`\nCloning ${repoUrl}...`);
  execSync(`git clone --depth 1 ${repoUrl} ${tmpDir}`, { stdio: "inherit" });

  const mdFiles = findMdFiles(tmpDir);
  const repoFiles = mdFiles.map((filePath) => readRepoMarkdownFile(tmpDir, filePath));
  console.log(`Found ${mdFiles.length} .md file(s)\n`);

  const ingested: { id: string; name: string; sourceFile: string }[] = [];
  const skipped: { file: string; reason: string }[] = [];

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
        sourceRepo: repoUrl,
        sourceFile,
      };

      const outPath = path.join(CONTENT_DIR, `${id}.md`);
      writeNormalizedSkillFile(outPath, content, normalized);

      ingested.push({ id, name: fm.name, sourceFile: relPath });
      console.log(`  ✓  ${id}  ${fm.name}`);
    }
  }

  // Cleanup temp dir
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Regenerate generated/skills.json
  generateSkillsJson(legacyCsvById, skillIdOverrides);

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
