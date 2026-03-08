import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

import { config } from "../config.js";
import { parseIPO } from "../lib/ipo.js";
import type { Skill, SkillDataProvider, SkillPlatform, SkillStatus } from "../types.js";

type RawRow = {
  id: string;
  category: string;
  gpt: string;
  gemini: string;
  claudeSkill: string;
  description: string;
  synergy: string;
  author: string;
  status: string;
  lastUpdate: string;
};

const STATUS_MAP: Record<string, SkillStatus> = {
  Done: "Done",
  WIP: "WIP",
  "Not started": "Not started",
  Pause: "Pause",
  "Out dated": "Out dated",
};

function inferPlatform(row: RawRow): SkillPlatform {
  const hits = [
    row.gpt ? "gpt" : null,
    row.gemini ? "gemini" : null,
    row.claudeSkill ? "claude" : null,
  ].filter(Boolean) as SkillPlatform[];

  if (hits.length === 0) {
    return "multi";
  }

  if (hits.length > 1) {
    return "multi";
  }

  return hits[0];
}

function normalizeDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parts = trimmed.split("/");
  if (parts.length !== 2) {
    return trimmed;
  }

  const [month, day] = parts.map((part) => Number(part));
  if (!month || !day) {
    return trimmed;
  }

  return `2025-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function splitSynergy(value: string): string[] {
  return value
    .split("→")
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter((item) => item && item !== "Link");
}

function toSkill(row: RawRow): Skill {
  const name = row.gpt || row.gemini || row.claudeSkill;
  const ipo = parseIPO(row.description);

  return {
    id: row.id,
    category: row.category,
    name,
    description: row.description,
    input: ipo.input,
    process: ipo.process,
    output: ipo.output,
    synergy: splitSynergy(row.synergy),
    platform: inferPlatform(row),
    status: STATUS_MAP[row.status] ?? "Not started",
    author: row.author,
    updatedAt: normalizeDate(row.lastUpdate),
  };
}

export class CsvSkillProvider implements SkillDataProvider {
  async listSkills(): Promise<Skill[]> {
    const csvPath = path.resolve(process.cwd(), config.CSV_PATH);
    const content = await readFile(csvPath, "utf8");
    const rows = parse(content, {
      relax_column_count: true,
      skip_empty_lines: false,
    }) as string[][];

    if (rows.length < 2) {
      return [];
    }

    const headerRow = rows[1].map((value) => value.trim());
    const dataRows = rows.slice(2).filter((row) => row.some((cell) => cell.trim() !== ""));

    return dataRows
      .map((row) => {
        const record = Object.fromEntries(
          headerRow.map((header, index) => [header, row[index]?.trim() ?? ""])
        );

        const rawRow: RawRow = {
          id: record["no."],
          category: record["Category"],
          gpt: record["GPT"],
          gemini: record["Gemini"],
          claudeSkill: record["Claude skill"],
          description: record["Description"],
          synergy: record["Synergy"],
          author: record["Author"],
          status: record["Status"],
          lastUpdate: record["Last update"],
        };

        return rawRow;
      })
      .filter((row) => row.id && row.category && row.description)
      .map(toSkill);
  }
}
