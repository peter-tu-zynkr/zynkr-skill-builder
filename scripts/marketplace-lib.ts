import fs from "fs";
import path from "path";

export type SkillStatus = "Done" | "WIP" | "Not started" | "Pause" | "Out dated";
export type SkillPlatform = "gpt" | "claude" | "gemini" | "multi";
export type SkillKind = "skill" | "orchestrator" | "subagent";

export type NormalizedSkillRecord = {
  id: string;
  name: string;
  category: string;
  project: string;
  platform: SkillPlatform;
  status: SkillStatus;
  author: string;
  description?: string;
  summary?: string;
  input?: string;
  process?: string;
  output?: string;
  kind?: SkillKind;
  stage?: string;
  tags?: string[];
  synergy?: string[];
  installCommand?: string;
  updatedAt?: string;
  firstSeen?: string;
  sourceRepo?: string;
  sourceFile?: string;
  slug?: string;
  upstreamRepo?: string;
  githubStars?: number;
};

export type MarketplaceIndexEntry = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  category: string;
  project: string;
  platform: SkillPlatform;
  status: SkillStatus;
  author: string;
  repo_url: string;
  source_path: string;
  install_command?: string;
  tags: string[];
  updated_at: string;
  upstream_repo?: string;
  github_stars?: number;
  first_seen?: string;
};

export type MarketplaceDetailEntry = MarketplaceIndexEntry & {
  description?: string;
  input?: string;
  process?: string;
  output?: string;
  kind?: SkillKind;
  stage?: string;
  synergy: string[];
  github_url: string;
};

export type MarketplaceArtifacts = {
  index: MarketplaceIndexEntry[];
  detail: Record<string, MarketplaceDetailEntry>;
};

const REQUIRED_FIELDS: Array<keyof MarketplaceIndexEntry> = [
  "id",
  "slug",
  "name",
  "summary",
  "category",
  "project",
  "platform",
  "status",
  "author",
  "repo_url",
  "source_path",
  "tags",
  "updated_at",
];

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function compactWhitespace(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function firstSentence(value: string): string {
  const compact = compactWhitespace(value) ?? value.trim();
  const match = compact.match(/^(.{1,220}?[.!?。！？])(\s|$)/);
  return (match?.[1] ?? compact.slice(0, 220)).trim();
}

function buildSummary(skill: NormalizedSkillRecord): string {
  const explicit = compactWhitespace(skill.summary);
  if (explicit) return explicit;

  const description = compactWhitespace(skill.description);
  if (description) return firstSentence(description);

  const parts = [skill.input, skill.process, skill.output]
    .map((part) => compactWhitespace(part))
    .filter((part): part is string => Boolean(part));

  if (parts.length > 0) {
    return firstSentence(parts.join(" "));
  }

  return `${skill.name} for ${skill.project}`;
}

function buildTags(skill: NormalizedSkillRecord): string[] {
  const explicitTags = Array.isArray(skill.tags)
    ? skill.tags
        .map((tag) => compactWhitespace(tag))
        .filter((tag): tag is string => Boolean(tag))
    : [];

  const derivedTags = [skill.project, skill.category, skill.platform, skill.kind, skill.stage]
    .map((tag) => compactWhitespace(tag))
    .filter((tag): tag is string => Boolean(tag))
    .map((tag) => toSlug(tag));

  return Array.from(new Set([...explicitTags.map((tag) => toSlug(tag)), ...derivedTags]));
}

function buildSlug(skill: NormalizedSkillRecord): string {
  const explicit = ensureString(skill.slug);
  if (explicit) {
    return toSlug(explicit);
  }

  const sourceStem = ensureString(skill.sourceFile)
    ?.split("/")
    .pop()
    ?.replace(/\.md$/i, "");
  const normalizedSourceStem = sourceStem ? toSlug(sourceStem) : undefined;
  const genericSourceStem =
    !normalizedSourceStem ||
    ["skill", "claude", "readme", "index"].includes(normalizedSourceStem);

  if (skill.kind === "orchestrator") {
    return toSlug(skill.project || skill.name);
  }

  if (skill.kind === "subagent") {
    return toSlug(`${skill.project}-${genericSourceStem ? skill.name : sourceStem}`);
  }

  return toSlug(genericSourceStem ? skill.project || skill.name : sourceStem);
}

function buildGithubUrl(skill: NormalizedSkillRecord, repoUrl: string, sourcePath: string): string {
  const cleanedRepoUrl = repoUrl.replace(/\/+$/, "");
  const cleanedSourcePath = sourcePath.replace(/^\/+/, "");

  if (cleanedSourcePath === "CLAUDE.md" || cleanedSourcePath.endsWith("/CLAUDE.md")) {
    // Use the directory containing CLAUDE.md — more accurate than skill.project alone
    const projectDir = path.dirname(cleanedSourcePath);
    if (projectDir && projectDir !== ".") {
      return `${cleanedRepoUrl}/tree/main/${projectDir}`;
    }
  }

  return `${cleanedRepoUrl}/blob/main/${cleanedSourcePath}`;
}

function assertRequired(indexEntry: MarketplaceIndexEntry): void {
  for (const field of REQUIRED_FIELDS) {
    const value = indexEntry[field];
    if (Array.isArray(value)) {
      if (value.length === 0) {
        throw new Error(`Skill ${indexEntry.id} is missing required field ${field}.`);
      }
      continue;
    }

    if (!value) {
      throw new Error(`Skill ${indexEntry.id} is missing required field ${field}.`);
    }
  }
}

export function buildMarketplaceArtifacts(skills: NormalizedSkillRecord[]): MarketplaceArtifacts {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenRepoPaths = new Set<string>();
  const seenNames = new Set<string>();

  const detailEntries = skills
    .map((skill) => {
      const repoUrl = ensureString(skill.sourceRepo);
      const sourcePath = ensureString(skill.sourceFile);
      if (!repoUrl || !sourcePath) {
        throw new Error(`Skill ${skill.id} is missing sourceRepo/sourceFile metadata.`);
      }

      const slug = buildSlug(skill);
      const normalizedName = skill.name.trim().toLowerCase();
      const repoPathKey = `${repoUrl}::${sourcePath}`;

      if (seenIds.has(skill.id)) {
        throw new Error(`Duplicate skill id detected: ${skill.id}`);
      }
      if (seenSlugs.has(slug)) {
        throw new Error(`Duplicate skill slug detected: ${slug}`);
      }
      if (seenRepoPaths.has(repoPathKey)) {
        throw new Error(`Duplicate source repo/path detected: ${repoPathKey}`);
      }
      if (seenNames.has(normalizedName)) {
        throw new Error(`Duplicate skill name detected: ${skill.name}`);
      }

      seenIds.add(skill.id);
      seenSlugs.add(slug);
      seenRepoPaths.add(repoPathKey);
      seenNames.add(normalizedName);

      const indexEntry: MarketplaceIndexEntry = {
        id: skill.id,
        slug,
        name: skill.name.trim(),
        summary: buildSummary(skill),
        category: skill.category.trim(),
        project: skill.project.trim(),
        platform: skill.platform,
        status: skill.status,
        author: skill.author.trim(),
        repo_url: repoUrl,
        source_path: sourcePath,
        install_command: ensureString(skill.installCommand),
        tags: buildTags(skill),
        updated_at: ensureString(skill.updatedAt) ?? new Date().toISOString().split("T")[0],
        upstream_repo: ensureString(skill.upstreamRepo),
        github_stars: typeof skill.githubStars === "number" ? skill.githubStars : undefined,
        first_seen: ensureString(skill.firstSeen),
      };

      assertRequired(indexEntry);

      const detailEntry: MarketplaceDetailEntry = {
        ...indexEntry,
        description: compactWhitespace(skill.description),
        input: compactWhitespace(skill.input),
        process: compactWhitespace(skill.process),
        output: compactWhitespace(skill.output),
        kind: skill.kind,
        stage: ensureString(skill.stage),
        synergy: Array.isArray(skill.synergy) ? skill.synergy : [],
        github_url: buildGithubUrl(skill, repoUrl, sourcePath),
      };

      return detailEntry;
    })
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return {
    index: detailEntries.map(({ description, input, process, output, kind, stage, synergy, github_url, ...entry }) => entry),
    detail: Object.fromEntries(
      detailEntries.flatMap((entry) => [
        [entry.id, entry],
        [entry.slug, entry],
      ])
    ),
  };
}

export function loadNormalizedSkills(filePath: string): NormalizedSkillRecord[] {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as NormalizedSkillRecord[];
}

export function writeMarketplaceArtifacts(outputDir: string, artifacts: MarketplaceArtifacts): void {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "skills-index.json"), JSON.stringify(artifacts.index, null, 2));
  fs.writeFileSync(path.join(outputDir, "skills-detail.json"), JSON.stringify(artifacts.detail, null, 2));
}
