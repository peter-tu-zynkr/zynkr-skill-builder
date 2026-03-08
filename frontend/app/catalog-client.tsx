"use client";

import { useState, useMemo, useCallback } from "react";
import { Skill, getAllCategories, filterSkills } from "@/lib/skills";
import SkillCard from "@/components/SkillCard";
import CategoryFilter from "@/components/CategoryFilter";
import SearchBar from "@/components/SearchBar";

export default function CatalogClient({ skills }: { skills: Skill[] }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [doneOnly, setDoneOnly] = useState(true);

  const categories = useMemo(() => getAllCategories(skills), [skills]);

  const filtered = useMemo(
    () => filterSkills(skills, { category, query, doneOnly }),
    [skills, category, query, doneOnly]
  );

  // Compute per-category counts respecting current query + doneOnly filter
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const cat of categories) {
      result[cat] = filterSkills(skills, { category: cat, query, doneOnly }).length;
    }
    return result;
  }, [skills, categories, query, doneOnly]);

  const handleQueryChange = useCallback((val: string) => setQuery(val), []);

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={query} onChange={handleQueryChange} />
        </div>
        <button
          onClick={() => setDoneOnly((v) => !v)}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            doneOnly
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${doneOnly ? "bg-emerald-500" : "bg-zinc-300"}`} />
          {doneOnly ? "僅顯示已完成" : "顯示全部狀態"}
        </button>
      </div>

      {/* Category filter */}
      <CategoryFilter
        categories={categories}
        counts={counts}
        active={category}
        onChange={setCategory}
      />

      {/* Results count */}
      <p className="text-sm text-zinc-500">
        顯示 <span className="font-semibold text-zinc-900">{filtered.length}</span> 個技能
        {category !== "all" && ` ／ ${category}`}
        {query && ` ／ 搜尋「${query}」`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-zinc-500 text-sm">找不到符合條件的技能</p>
          <button
            onClick={() => { setQuery(""); setCategory("all"); setDoneOnly(true); }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            清除篩選條件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
