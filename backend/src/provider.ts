import { config } from "./config.js";
import { CsvSkillProvider } from "./providers/csv-provider.js";
import { GeneratedJsonSkillProvider } from "./providers/generated-json-provider.js";
import type { SkillDataProvider } from "./types.js";

export function createSkillProvider(): SkillDataProvider {
  if (config.DATA_SOURCE === "csv") {
    return new CsvSkillProvider();
  }

  return new GeneratedJsonSkillProvider();
}
