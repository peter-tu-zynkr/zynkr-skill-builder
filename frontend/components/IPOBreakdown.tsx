const panels = [
  {
    key: "input",
    label: "Input",
    emoji: "📥",
    bg: "bg-blue-50",
    border: "border-blue-100",
    label_color: "text-blue-600",
    icon_bg: "bg-blue-100",
  },
  {
    key: "process",
    label: "Process",
    emoji: "⚙️",
    bg: "bg-violet-50",
    border: "border-violet-100",
    label_color: "text-violet-600",
    icon_bg: "bg-violet-100",
  },
  {
    key: "output",
    label: "Output",
    emoji: "📤",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    label_color: "text-emerald-600",
    icon_bg: "bg-emerald-100",
  },
] as const;

interface IPOBreakdownProps {
  input?: string;
  process?: string;
  output?: string;
}

export default function IPOBreakdown({ input, process, output }: IPOBreakdownProps) {
  const values = { input, process, output };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {panels.map((p) => {
        const val = values[p.key];
        return (
          <div
            key={p.key}
            className={`rounded-2xl border ${p.border} ${p.bg} p-5 flex flex-col gap-3`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-lg ${p.icon_bg} flex items-center justify-center text-base`}>
                {p.emoji}
              </span>
              <span className={`font-semibold text-sm ${p.label_color}`}>{p.label}</span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {val ?? <span className="text-zinc-400 italic">—</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
