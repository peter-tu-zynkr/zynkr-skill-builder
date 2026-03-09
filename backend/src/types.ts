export const SKILL_STATUSES = [
  "Done",
  "WIP",
  "Not started",
  "Pause",
  "Out dated",
] as const;

export const SKILL_PLATFORMS = ["gpt", "claude", "gemini", "multi"] as const;
export const SKILL_KINDS = ["skill", "orchestrator", "subagent"] as const;

export type SkillStatus = (typeof SKILL_STATUSES)[number];
export type SkillPlatform = (typeof SKILL_PLATFORMS)[number];
export type SkillKind = (typeof SKILL_KINDS)[number];

export type Skill = {
  id: string;
  category: string;
  project?: string;
  name: string;
  description?: string;
  input?: string;
  process?: string;
  output?: string;
  kind?: SkillKind;
  stage?: string;
  synergy: string[];
  platform: SkillPlatform;
  status: SkillStatus;
  author: string;
  link?: string;
  installCommand?: string;
  updatedAt?: string;
  sourceRepo?: string;
  sourceFile?: string;
};

export type SkillFilters = {
  category?: string;
  q?: string;
  status?: SkillStatus;
  platform?: SkillPlatform;
};

export type SkillDataProvider = {
  listSkills(): Promise<Skill[]>;
};
