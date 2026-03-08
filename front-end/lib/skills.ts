export type SkillStatus = "Done" | "WIP" | "Not started" | "Pause" | "Out dated";
export type SkillPlatform = "gpt" | "claude" | "gemini" | "multi";

export type Skill = {
  id: string;
  category: string;
  project: string;        // project slug — maps to taxonomy.ts
  name: string;
  description: string;
  input?: string;
  process?: string;
  output?: string;
  synergy: string[];
  platform: SkillPlatform;
  status: SkillStatus;
  author: string;
  link?: string;
  updatedAt?: string;
};

export function parseIPO(description: string): {
  input?: string;
  process?: string;
  output?: string;
} {
  const inputMatch = description.match(/Input[：:](.*?)(?=Process[：:]|Output[：:]|$)/is);
  const processMatch = description.match(/Process[：:](.*?)(?=Input[：:]|Output[：:]|$)/is);
  const outputMatch = description.match(/Output[：:](.*?)(?=Input[：:]|Process[：:]|$)/is);

  return {
    input: inputMatch?.[1]?.trim(),
    process: processMatch?.[1]?.trim(),
    output: outputMatch?.[1]?.trim(),
  };
}

export function getAllCategories(skills: Skill[]): string[] {
  const cats = Array.from(new Set(skills.map((s) => s.category)));
  return cats.sort();
}

export function filterSkills(
  skills: Skill[],
  {
    category,
    query,
    doneOnly,
  }: { category: string; query: string; doneOnly: boolean }
): Skill[] {
  return skills.filter((s) => {
    if (doneOnly && s.status !== "Done") return false;
    if (category && category !== "all" && s.category !== category) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !s.description.toLowerCase().includes(q) &&
        !s.id.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}
