import { SkillPlatform } from "@/lib/skills";

interface SetupGuideProps {
  platform: SkillPlatform;
  link?: string;
  name: string;
}

const platformConfig: Record<
  SkillPlatform,
  { label: string; icon: string; accentBg: string; accentText: string; steps: string[] }
> = {
  gpt: {
    label: "ChatGPT (GPT)",
    icon: "🤖",
    accentBg: "bg-emerald-50 border-emerald-200",
    accentText: "text-emerald-700",
    steps: [
      "前往 ChatGPT 並登入你的帳戶（需要 ChatGPT Plus 或 Free 版本）",
      "點擊上方連結，或在 ChatGPT 首頁搜尋欄輸入技能名稱",
      "點擊「開始對話」即可使用。首次使用建議先閱讀技能說明",
      "準備好你的 Input（如技能說明中描述），貼入對話框即可開始",
    ],
  },
  claude: {
    label: "Anthropic Claude",
    icon: "🟠",
    accentBg: "bg-orange-50 border-orange-200",
    accentText: "text-orange-700",
    steps: [
      "前往 Claude.ai 並登入帳戶（免費帳戶可使用，Pro 解鎖更高使用量）",
      "點擊上方連結進入指定 Project 或 Prompt，或新建對話",
      "如為 Project，記得上傳相關文件或設定背景資訊",
      "依照 Input 說明準備資料後，開始與 Claude 互動",
    ],
  },
  gemini: {
    label: "Google Gemini",
    icon: "💎",
    accentBg: "bg-blue-50 border-blue-200",
    accentText: "text-blue-700",
    steps: [
      "前往 Gemini.google.com 並使用 Google 帳戶登入",
      "點擊上方連結進入指定 Gem，或在 Gems 頁面搜尋",
      "選擇「使用此 Gem」開始新對話",
      "依技能說明準備 Input 資料，直接貼入對話開始使用",
    ],
  },
  multi: {
    label: "Multi-platform",
    icon: "✨",
    accentBg: "bg-violet-50 border-violet-200",
    accentText: "text-violet-700",
    steps: [
      "此技能可在多個平台使用，選擇你最熟悉的 AI 工具",
      "推薦：Claude（最強推理）/ GPT（最廣功能）/ Gemini（Google整合）",
      "從上方連結取得 Prompt 模板後複製到你選擇的平台",
      "依照 Input 說明準備資料後，貼入 Prompt 開始使用",
    ],
  },
};

export default function SetupGuide({ platform, link, name }: SetupGuideProps) {
  const config = platformConfig[platform];

  return (
    <div className="space-y-4">
      {/* Platform badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${config.accentBg} ${config.accentText}`}>
        <span>{config.icon}</span>
        {config.label}
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {config.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <p className="text-sm text-zinc-700 leading-relaxed pt-0.5">{step}</p>
          </li>
        ))}
      </ol>

      {/* Launch CTA */}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors"
        >
          <span>{config.icon}</span>
          啟動「{name}」
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15,3 21,3 21,9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}
    </div>
  );
}
