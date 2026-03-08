import { google } from "googleapis";
import { config } from "../config.js";
import { parseIPO } from "../lib/ipo.js";
const STATUS_MAP = {
    Done: "Done",
    WIP: "WIP",
    "Not started": "Not started",
    Pause: "Pause",
    "Out dated": "Out dated",
};
function splitSynergy(value) {
    return value
        .split("→")
        .flatMap((segment) => segment.split(","))
        .map((item) => item.trim())
        .filter((item) => item && item !== "Link");
}
function inferPlatform(record) {
    const values = [
        record["GPT"] ? "gpt" : null,
        record["Gemini"] ? "gemini" : null,
        record["Claude skill"] ? "claude" : null,
    ].filter(Boolean);
    if (values.length === 0) {
        return "multi";
    }
    if (values.length > 1) {
        return "multi";
    }
    return values[0];
}
function toSkill(record) {
    const description = record["Description"]?.trim() ?? "";
    const ipo = parseIPO(description);
    return {
        id: record["no."]?.trim() ?? "",
        category: record["Category"]?.trim() ?? "",
        name: record["GPT"]?.trim() ||
            record["Gemini"]?.trim() ||
            record["Claude skill"]?.trim() ||
            "",
        description,
        input: ipo.input,
        process: ipo.process,
        output: ipo.output,
        synergy: splitSynergy(record["Synergy"] ?? ""),
        platform: inferPlatform(record),
        status: STATUS_MAP[record["Status"]?.trim() ?? ""] ?? "Not started",
        author: record["Author"]?.trim() ?? "",
        updatedAt: record["Last update"]?.trim() || undefined,
    };
}
export class GoogleSheetsSkillProvider {
    async listSkills() {
        if (!config.GOOGLE_SHEET_ID ||
            !config.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
            !config.GOOGLE_PRIVATE_KEY) {
            throw new Error("Google Sheets credentials are missing.");
        }
        const auth = new google.auth.JWT({
            email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: config.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });
        const sheets = google.sheets({ version: "v4", auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.GOOGLE_SHEET_ID,
            range: config.GOOGLE_SHEET_RANGE,
        });
        const rows = response.data.values ?? [];
        if (rows.length < 2) {
            return [];
        }
        const headerRow = rows[1].map((value) => String(value).trim());
        const dataRows = rows.slice(2);
        return dataRows
            .map((row) => Object.fromEntries(headerRow.map((header, index) => [header, String(row[index] ?? "").trim()])))
            .filter((record) => record["no."] && record["Category"] && record["Description"])
            .map(toSkill);
    }
}
