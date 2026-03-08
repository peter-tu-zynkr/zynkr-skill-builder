import { config } from "./config.js";
import { CsvSkillProvider } from "./providers/csv-provider.js";
import { GoogleSheetsSkillProvider } from "./providers/google-sheets-provider.js";
import type { SkillDataProvider } from "./types.js";

export function createSkillProvider(): SkillDataProvider {
  if (config.DATA_SOURCE === "google-sheets") {
    return new GoogleSheetsSkillProvider();
  }

  return new CsvSkillProvider();
}
