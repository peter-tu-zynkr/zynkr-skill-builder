import { SkillPlatform } from "./skills";

export const platformLabel: Record<SkillPlatform, string> = {
  gpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  multi: "Multi-platform",
};

export const platformLabelShort: Record<SkillPlatform, string> = {
  gpt: "GPT",
  claude: "Claude",
  gemini: "Gemini",
  multi: "Multi",
};

export const platformIcon: Record<SkillPlatform, string> = {
  gpt: "🤖",
  claude: "🟠",
  gemini: "💎",
  multi: "✨",
};
