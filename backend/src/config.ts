import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATA_SOURCE: z.enum(["generated-json", "csv"]).default("generated-json"),
  CSV_PATH: z.string().default("../assistant-index.csv"),
  GENERATED_JSON_PATH: z.string().default("../generated/skills.json"),
});

export const config = envSchema.parse(process.env);
