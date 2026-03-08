import Link from "next/link";
import { notFound } from "next/navigation";
import {
  categories,
  getCategoryBySlug,
  getProjectsByCategory,
  getSubagentsByProject,
} from "@/lib/taxonomy";
import { skills } from "@/lib/skills-data";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) notFound();

  const projects = getProjectsByCategory(categorySlug);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            ⚡ Zynkr
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium">{cat.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Category header */}
        <div className="flex items-center gap-4">
          <span className="text-5xl">{cat.icon}</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{cat.name}</h1>
            <p className="text-zinc-500 mt-1">{cat.description}</p>
          </div>
        </div>

        {/* Skills (project) grid */}
        <div>
          <p className="text-sm text-zinc-500 mb-4">
            {projects.length} 個技能 — 點擊查看各技能的 Subagents
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => {
              const subagents = getSubagentsByProject(project.slug, skills);
              const doneCount = subagents.filter((s) => s.status === "Done").length;
              const hasChain = subagents.some((s) => s.synergy.length > 1);

              return (
                <Link
                  key={project.slug}
                  href={`/${categorySlug}/${project.slug}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-zinc-900 text-base group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h2>
                    {hasChain && (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 font-medium">
                        工作流
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100">
                    <span className="text-xs text-zinc-400">
                      {subagents.length} subagents
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">
                      {doneCount} 已完成
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← 回到所有領域
        </Link>
      </div>
    </div>
  );
}
