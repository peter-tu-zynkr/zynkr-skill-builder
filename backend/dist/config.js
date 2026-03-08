import { z } from "zod";
const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(4000),
    DATA_SOURCE: z.enum(["csv", "google-sheets"]).default("csv"),
    CSV_PATH: z.string().default("../assistant-index.csv"),
    GOOGLE_SHEET_ID: z.string().optional(),
    GOOGLE_SHEET_RANGE: z.string().default("Sheet1!A:Z"),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
    GOOGLE_PRIVATE_KEY: z.string().optional(),
});
export const config = envSchema.parse(process.env);
