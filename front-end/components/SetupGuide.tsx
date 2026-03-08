"use client";

import { useEffect, useRef, useState } from "react";
import { SkillPlatform } from "@/lib/skills";
import { platformLabel } from "@/lib/platforms";

interface SetupGuideProps {
  platform: SkillPlatform;
  installCommand?: string;
}

const INSTALL_STEPS = [
  "複製上方的安裝指令",
  "打開你的終端機（Terminal）",
  "貼上並執行指令",
  "技能已安裝至 Claude Code，輸入 /技能名稱 即可使用",
];

export default function SetupGuide({ platform, installCommand }: SetupGuideProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    if (!installCommand) return;
    await navigator.clipboard.writeText(installCommand);
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  if (!installCommand) {
    return (
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium bg-zinc-50 border-zinc-200 text-zinc-500">
          <span>🔧</span>
          {platformLabel[platform]}
        </div>
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-6 text-center space-y-1">
          <p className="text-sm font-medium text-zinc-600">安裝指令即將推出</p>
          <p className="text-xs text-zinc-400">
            此技能的一鍵安裝指令正在準備中，敬請期待。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Platform tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium bg-zinc-50 border-zinc-200 text-zinc-500">
        <span>🔧</span>
        {platformLabel[platform]}
      </div>

      {/* Command block */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-950 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
          <span className="text-xs text-zinc-500 font-mono">Terminal</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">已複製</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                複製
              </>
            )}
          </button>
        </div>
        <div className="px-4 py-4 overflow-x-auto">
          <pre className="text-sm text-zinc-100 font-mono whitespace-pre">{installCommand}</pre>
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {INSTALL_STEPS.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <p className="text-sm text-zinc-700 leading-relaxed pt-0.5">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
