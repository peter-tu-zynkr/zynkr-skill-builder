import { SkillStatus } from "@/lib/skills";

const config: Record<SkillStatus, { label: string; classes: string }> = {
  Done: { label: "Done", classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  WIP: { label: "WIP", classes: "bg-amber-100 text-amber-700 border-amber-200" },
  "Not started": { label: "Not started", classes: "bg-slate-100 text-slate-500 border-slate-200" },
  Pause: { label: "Pause", classes: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  "Out dated": { label: "Out dated", classes: "bg-red-100 text-red-500 border-red-200" },
};

const dotColors: Record<SkillStatus, string> = {
  Done: "bg-emerald-500",
  WIP: "bg-amber-400",
  "Not started": "bg-slate-400",
  Pause: "bg-zinc-400",
  "Out dated": "bg-red-400",
};

export default function StatusBadge({
  status,
  size = "sm",
}: {
  status: SkillStatus;
  size?: "sm" | "md";
}) {
  const { label, classes } = config[status];
  const dot = dotColors[status];
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-medium ${textSize} ${classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
