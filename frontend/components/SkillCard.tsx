import Link from "next/link";
import { Skill } from "@/lib/skills";
import { platformIcon, platformLabelShort } from "@/lib/platforms";
import StatusBadge from "./StatusBadge";

export default function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/skills/${skill.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-zinc-400 shrink-0">{skill.id}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium truncate">
            {skill.category}
          </span>
        </div>
        <StatusBadge status={skill.status} />
      </div>

      {/* Skill name */}
      <h3 className="font-semibold text-zinc-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
        {skill.name}
      </h3>

      {/* Description snippet */}
      {skill.output && (
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
          <span className="font-medium text-zinc-400">Output: </span>
          {skill.output}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
        <span className="text-xs text-zinc-400">
          {platformIcon[skill.platform]} {platformLabelShort[skill.platform]}
        </span>
        <span className="text-xs text-zinc-400 group-hover:text-blue-500 transition-colors">
          {skill.author} →
        </span>
      </div>
    </Link>
  );
}
