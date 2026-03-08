import { config } from "./config.js";
import { CsvSkillProvider } from "./providers/csv-provider.js";
import type { SkillDataProvider } from "./types.js";

export function createSkillProvider(): SkillDataProvider {
  return new CsvSkillProvider();
}
