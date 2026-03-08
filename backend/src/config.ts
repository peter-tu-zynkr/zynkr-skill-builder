import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATA_SOURCE: z.enum(["csv"]).default("csv"),
  CSV_PATH: z.string().default("../assistant-index.csv"),
});

export const config = envSchema.parse(process.env);
