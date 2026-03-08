import Link from "next/link";
import { Skill } from "@/lib/skills";

interface WorkflowChainProps {
  synergy: string[];
  currentId: string;
  allSkills: Skill[];
}

export default function WorkflowChain({ synergy, currentId, allSkills }: WorkflowChainProps) {
  if (!synergy || synergy.length <= 1) return null;

  const skillMap = Object.fromEntries(allSkills.map((s) => [s.id, s]));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {synergy.map((id, i) => {
        const s = skillMap[id];
        const isCurrent = id === currentId;
        return (
          <div key={id} className="flex items-center gap-2">
            {i > 0 && (
              <svg className="w-4 h-4 text-zinc-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
            {s ? (
              <Link
                href={`/skills/${id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isCurrent
                    ? "bg-zinc-900 text-white border-zinc-900 cursor-default"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                <span className="font-mono text-xs opacity-60">{id}</span>
                <span className="hidden sm:inline truncate max-w-[120px]">{s.name}</span>
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-zinc-100 bg-zinc-50 text-zinc-400">
                <span className="font-mono text-xs">{id}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
