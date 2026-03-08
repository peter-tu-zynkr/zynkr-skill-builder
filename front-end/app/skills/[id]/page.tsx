import Link from "next/link";
import { notFound } from "next/navigation";
import { skills } from "@/lib/skills-data";
import { getCategoryBySlug, getProjectBySlug } from "@/lib/taxonomy";
import StatusBadge from "@/components/StatusBadge";
import IPOBreakdown from "@/components/IPOBreakdown";
import WorkflowChain from "@/components/WorkflowChain";
import SetupGuide from "@/components/SetupGuide";

export function generateStaticParams() {
  return skills.map((s) => ({ id: s.id }));
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skill = skills.find((s) => s.id === id);
  if (!skill) notFound();

  const project = getProjectBySlug(skill.project);
  const cat = project ? getCategoryBySlug(project.categorySlug) : undefined;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            ⚡ Zynkr
          </Link>
          {cat && project && (
            <>
              <span>/</span>
              <Link href={`/${cat.slug}`} className="hover:text-zinc-900 transition-colors">
                {cat.name}
              </Link>
              <span>/</span>
              <Link href={`/${cat.slug}/${project.slug}`} className="hover:text-zinc-900 transition-colors">
                {project.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-zinc-900 font-medium truncate">{skill.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-zinc-400">{skill.id}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
              {skill.category}
            </span>
            <StatusBadge status={skill.status} size="md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{skill.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            {skill.author && <span>作者：{skill.author}</span>}
            {skill.updatedAt && <span>更新：{skill.updatedAt}</span>}
          </div>
        </div>

        {/* IPO Breakdown */}
        {(skill.input || skill.process || skill.output) && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              IPO 架構
            </h2>
            <IPOBreakdown
              input={skill.input}
              process={skill.process}
              output={skill.output}
            />
          </section>
        )}

        {/* Workflow Chain */}
        {skill.synergy.length > 1 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              工作流程
            </h2>
            <WorkflowChain
              synergy={skill.synergy}
              currentId={skill.id}
              allSkills={skills}
            />
          </section>
        )}

        {/* Setup Guide */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
            如何使用
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <SetupGuide
              platform={skill.platform}
              link={skill.link}
              name={skill.name}
            />
          </div>
        </section>

        {/* Back link */}
        <Link
          href={cat && project ? `/${cat.slug}/${project.slug}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← 回到{project?.name ?? "技能目錄"}
        </Link>
      </div>
    </div>
  );
}
