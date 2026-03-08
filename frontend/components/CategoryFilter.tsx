"use client";

interface CategoryFilterProps {
  categories: string[];
  counts: Record<string, number>;
  active: string;
  onChange: (cat: string) => void;
}

export default function CategoryFilter({
  categories,
  counts,
  active,
  onChange,
}: CategoryFilterProps) {
  const all = ["all", ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {all.map((cat) => {
        const isActive = active === cat;
        const count = cat === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[cat] ?? 0;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
              isActive
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            {cat === "all" ? "全部" : cat}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
