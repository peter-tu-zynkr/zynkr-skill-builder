import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { categories, getProjectsByCategory } from "@/lib/taxonomy";
import { skills } from "@/lib/skills-data";

export default function HomePage() {
  const totalDone = skills.filter((s) => s.status === "Done").length;

  return (
    <SiteShell>
      {/* Hero */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image
                  src="/zynkr-logo.jpg"
                  alt="Zynkr logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                  priority
                />
                <span className="text-sm font-semibold text-zinc-500 tracking-widest uppercase">Zynkr</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
                AI 技能目錄
              </h1>
              <p className="mt-2 text-zinc-500 text-base max-w-lg">
                Zynkr 精選 AI 助理工具庫 — 找到對的工具，用對的方式，做對的事。
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="text-center px-4 py-3 rounded-2xl bg-zinc-900 text-white min-w-[80px]">
                <div className="text-2xl font-bold">{skills.length}</div>
                <div className="text-xs text-zinc-400 mt-0.5">總 Subagents</div>
              </div>
              <div className="text-center px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 min-w-[80px]">
                <div className="text-2xl font-bold text-emerald-700">{totalDone}</div>
                <div className="text-xs text-emerald-600 mt-0.5">已完成</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category list */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-zinc-500 mb-6">選擇一個領域開始探索</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const catProjects = getProjectsByCategory(cat.slug);
            const catSkills = skills.filter((s) =>
              catProjects.some((p) => p.slug === s.project)
            );
            const doneCount = catSkills.filter((s) => s.status === "Done").length;

            return (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {cat.prefix}
                  </span>
                </div>
                <h2 className="font-bold text-zinc-900 text-base group-hover:text-blue-600 transition-colors mb-1">
                  {cat.name}
                </h2>
                <p className="text-sm text-zinc-500 flex-1 line-clamp-2">
                  {cat.description}
                </p>
                <div className="flex items-center gap-3 mt-4 text-xs">
                  <span className="text-zinc-400">{catSkills.length} subagents</span>
                  <span className="text-emerald-600 font-medium">{doneCount} 已完成</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </SiteShell>
  );
}
