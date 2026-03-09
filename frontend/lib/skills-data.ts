import { Skill } from "./skills";
import generatedSkills from "./generated-skills.json";

export const skills = generatedSkills as unknown as Skill[];
