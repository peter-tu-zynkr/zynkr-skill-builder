import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { config } from "../config.js";
import {
  SKILL_KINDS,
  SKILL_PLATFORMS,
  SKILL_STATUSES,
  type Skill,
  type SkillDataProvider,
} from "../types.js";

const skillSchema = z.object({
  id: z.string(),
  category: z.string(),
  project: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  input: z.string().optional(),
  process: z.string().optional(),
  output: z.string().optional(),
  kind: z.enum(SKILL_KINDS).optional(),
  stage: z.string().optional(),
  synergy: z.array(z.string()),
  platform: z.enum(SKILL_PLATFORMS),
  status: z.enum(SKILL_STATUSES),
  author: z.string(),
  link: z.string().optional(),
  installCommand: z.string().optional(),
  updatedAt: z.string().optional(),
  sourceRepo: z.string().optional(),
  sourceFile: z.string().optional(),
});

const skillsSchema = z.array(skillSchema);

export class GeneratedJsonSkillProvider implements SkillDataProvider {
  async listSkills(): Promise<Skill[]> {
    const jsonPath = path.resolve(process.cwd(), config.GENERATED_JSON_PATH);
    const content = await readFile(jsonPath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    return skillsSchema.parse(parsed);
  }
}
