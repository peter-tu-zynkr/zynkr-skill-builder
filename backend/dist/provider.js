import { config } from "./config.js";
import { CsvSkillProvider } from "./providers/csv-provider.js";
import { GoogleSheetsSkillProvider } from "./providers/google-sheets-provider.js";
export function createSkillProvider() {
    if (config.DATA_SOURCE === "google-sheets") {
        return new GoogleSheetsSkillProvider();
    }
    return new CsvSkillProvider();
}
