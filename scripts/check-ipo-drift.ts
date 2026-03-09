#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CsvRow = Record<string, string>;

type SkillRecord = {
  id: string;
  name?: string;
  input?: string;
  process?: string;
  output?: string;
  legacyIpoId?: string | null;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "assistant-index.csv");
const GENERATED_JSON_PATH = path.join(ROOT, "generated", "skills.json");

function parseCsv(content: string): string[][] {
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

function normalizeWhitespace(value?: string): string | undefined {
  if (!value) return undefined;

  const compact = value.replace(/\s+/g, " ").trim();
  return compact || undefined;
}

function parseIPO(description?: string): Pick<SkillRecord, "input" | "process" | "output"> {
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

function loadCsvRows(): CsvRow[] {
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(raw);
  const header = rows[1]?.map((value) => value.trim()) ?? [];
  const dataRows = rows.slice(2).filter((row) => row.some((cell) => cell.trim() !== ""));

  return dataRows.map((row) =>
    Object.fromEntries(header.map((columnName, index) => [columnName, row[index]?.trim() ?? ""]))
  );
}

function loadGeneratedSkills(): SkillRecord[] {
  return JSON.parse(fs.readFileSync(GENERATED_JSON_PATH, "utf8")) as SkillRecord[];
}

function formatValue(value?: string): string {
  return value ?? "<empty>";
}

function main() {
  const csvById = new Map(
    loadCsvRows()
      .map((row) => {
        const id = row["no."]?.trim();
        const name = row["GPT"] || row["Gemini"] || row["Claude skill"] || "";
        const ipo = parseIPO(row["Description"]);
        return [
          id,
          {
            id,
            name: name.trim() || undefined,
            ...ipo,
          },
        ] as const;
      })
      .filter(([id, row]) => Boolean(id) && Boolean(row.input || row.process || row.output))
  );

  const generatedSkills = loadGeneratedSkills();
  const drift: string[] = [];

  for (const skill of generatedSkills) {
    const comparisonId =
      skill.legacyIpoId === null ? undefined : skill.legacyIpoId ?? skill.id;
    if (!comparisonId) continue;

    const csvRow = csvById.get(comparisonId);
    if (!csvRow) continue;

    const fields: Array<keyof Pick<SkillRecord, "input" | "process" | "output">> = [
      "input",
      "process",
      "output",
    ];

    for (const field of fields) {
      const csvValue = normalizeWhitespace(csvRow[field]);
      const generatedValue = normalizeWhitespace(skill[field]);

      if (csvValue !== generatedValue) {
        drift.push(
          [
            `${skill.id} ${skill.name ?? csvRow.name ?? ""}`.trim(),
            `  ${field}:`,
            `    csv: ${formatValue(csvValue)}`,
            `    generated: ${formatValue(generatedValue)}`,
          ].join("\n")
        );
      }
    }
  }

  if (drift.length === 0) {
    console.log("IPO drift check passed: generated IPO matches assistant-index.csv for all overlapping IDs.");
    return;
  }

  console.error(`IPO drift detected in ${drift.length} field comparison(s):\n`);
  console.error(drift.join("\n\n"));
  process.exitCode = 1;
}

main();
