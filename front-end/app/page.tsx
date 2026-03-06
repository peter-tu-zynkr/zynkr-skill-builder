import { skills } from "@/lib/skills-data";
import CatalogClient from "./catalog-client";

export default function HomePage() {
  const totalDone = skills.filter((s) => s.status === "Done").length;

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <span className="text-sm font-semibold text-zinc-500 tracking-widest uppercase">Zynkr</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight">
                AI 技能目錄
              </h1>
              <p className="mt-2 text-zinc-500 text-base max-w-lg">
                Zynkr 精選 AI 助理工具庫 — 幫你找到對的工具，用對的方式，做對的事。
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="text-center px-4 py-3 rounded-2xl bg-zinc-900 text-white min-w-[80px]">
                <div className="text-2xl font-bold">{skills.length}</div>
                <div className="text-xs text-zinc-400 mt-0.5">總技能數</div>
              </div>
              <div className="text-center px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 min-w-[80px]">
                <div className="text-2xl font-bold text-emerald-700">{totalDone}</div>
                <div className="text-xs text-emerald-600 mt-0.5">已完成</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <CatalogClient skills={skills} />
      </div>
    </main>
  );
}
