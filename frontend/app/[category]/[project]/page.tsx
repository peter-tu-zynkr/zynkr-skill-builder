import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import {
  getCategoryBySlug,
  getOrchestratorByProject,
  getProjectBySlug,
  getSubagentsByProject,
  getSkillsByProject,
} from "@/lib/taxonomy";
import { skills } from "@/lib/skills-data";
import { platformIcon, platformLabelShort } from "@/lib/platforms";
import StatusBadge from "@/components/StatusBadge";
import WorkflowChain from "@/components/WorkflowChain";
import SetupGuide from "@/components/SetupGuide";

export function generateStaticParams() {
  const seen = new Set<string>();
  return skills
    .filter((s) => {
      const key = `${s.category}/${s.project}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((s) => ({ category: s.category, project: s.project }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ category: string; project: string }>;
}) {
  const { category: categorySlug, project: projectSlug } = await params;

  const cat = getCategoryBySlug(categorySlug);
  const project = getProjectBySlug(projectSlug);
  if (!cat || !project || project.categorySlug !== categorySlug) notFound();

  const projectSkills = getSkillsByProject(projectSlug, skills);
  const orchestrator = getOrchestratorByProject(projectSlug, skills);
  const subagents = getSubagentsByProject(projectSlug, skills);
  const doneCount = subagents.filter((s) => s.status === "Done").length;

  const chainSource =
    orchestrator?.synergy.length ? orchestrator : subagents.find((s) => s.synergy.length > 1);

  return (
    <SiteShell
      breadcrumbs={[
        { label: cat.name, href: `/${categorySlug}` },
        { label: project.name },
      ]}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Project header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium text-xs">
              {cat.icon} {cat.name}
            </span>
            <span className="text-xs text-zinc-400">
              {subagents.length} subagents · {doneCount} 已完成
              {orchestrator ? ` · ${projectSkills.length} total records` : ""}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{project.name}</h1>
          <p className="text-zinc-500">{project.description}</p>
        </div>

        {orchestrator && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              安裝 Orchestrator
            </h2>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-4 space-y-1">
                <p className="text-sm font-semibold text-zinc-900">{orchestrator.name}</p>
                {orchestrator.output && (
                  <p className="text-sm text-zinc-500">{orchestrator.output}</p>
                )}
              </div>
              <SetupGuide
                platform={orchestrator.platform}
                installCommand={orchestrator.installCommand}
              />
            </div>
          </section>
        )}

        {/* Workflow chain */}
        {chainSource && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              工作流程
            </h2>
            <WorkflowChain
              synergy={chainSource.synergy}
              currentId=""
              allSkills={skills}
            />
          </section>
        )}

        {/* Subagents */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Subagents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subagents.map((s) => (
              <Link
                key={s.id}
                href={`/skills/${s.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-zinc-400 shrink-0">{s.id}</span>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                {/* Name */}
                <h3 className="font-semibold text-zinc-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                  {s.name}
                </h3>

                {s.stage && (
                  <p className="text-xs text-zinc-400">
                    Stage {s.stage}
                  </p>
                )}

                {/* Output snippet */}
                {s.output && (
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    <span className="font-medium text-zinc-400">Output: </span>
                    {s.output}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                  <span className="text-xs text-zinc-400">
                    {platformIcon[s.platform]} {platformLabelShort[s.platform]}
                  </span>
                  <span className="text-xs text-zinc-400 group-hover:text-blue-500 transition-colors">
                    {s.author} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Link
          href={`/${categorySlug}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← 回到 {cat.name}
        </Link>
      </div>
    </SiteShell>
  );
}
