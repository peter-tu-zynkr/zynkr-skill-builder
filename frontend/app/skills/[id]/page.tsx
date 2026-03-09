import { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { skills } from "@/lib/skills-data";
import { getCategoryBySlug, getProjectBySlug } from "@/lib/taxonomy";
import { platformLabel, platformIcon } from "@/lib/platforms";
import StatusBadge from "@/components/StatusBadge";
import IPOBreakdown from "@/components/IPOBreakdown";
import WorkflowChain from "@/components/WorkflowChain";
import SetupGuide from "@/components/SetupGuide";

function SidebarItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-5 py-4 space-y-1">
      <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">{label}</p>
      <div className="pt-0.5">{children}</div>
    </div>
  );
}

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
    <SiteShell
      breadcrumbs={[
        ...(cat && project
          ? [
              { label: cat.name, href: `/${cat.slug}` },
              { label: project.name, href: `/${cat.slug}/${project.slug}` },
            ]
          : []),
        { label: skill.name },
      ]}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Title block */}
        <div className="mb-8 space-y-2">
          <span className="font-mono text-sm text-zinc-400">{skill.id}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{skill.name}</h1>
          {skill.output && (
            <p className="text-base text-zinc-500 max-w-2xl leading-relaxed">{skill.output}</p>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Install — hero position */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                如何安裝
              </h2>
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <SetupGuide
                  platform={skill.platform}
                  installCommand={skill.installCommand}
                />
              </div>
            </section>

            {/* IPO breakdown */}
            {(skill.input || skill.process || skill.output) && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                  輸入 / 處理 / 輸出
                </h2>
                <IPOBreakdown
                  input={skill.input}
                  process={skill.process}
                  output={skill.output}
                />
              </section>
            )}

            {/* Workflow chain */}
            {skill.synergy.length > 1 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                  工作流程 — 與其他技能搭配使用
                </h2>
                <div className="bg-white rounded-2xl border border-zinc-200 p-5">
                  <WorkflowChain
                    synergy={skill.synergy}
                    currentId={skill.id}
                    allSkills={skills}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-60 shrink-0">
            <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
              <SidebarItem label="狀態">
                <StatusBadge status={skill.status} size="md" />
              </SidebarItem>
              <SidebarItem label="平台">
                <span className="text-sm text-zinc-700 font-medium">
                  {platformIcon[skill.platform]} {platformLabel[skill.platform]}
                </span>
              </SidebarItem>
              <SidebarItem label="類別">
                <span className="text-sm text-zinc-700">{skill.category}</span>
              </SidebarItem>
              {skill.author && (
                <SidebarItem label="作者">
                  <span className="text-sm text-zinc-700">{skill.author}</span>
                </SidebarItem>
              )}
              {skill.updatedAt && (
                <SidebarItem label="最後更新">
                  <span className="text-sm text-zinc-700">{skill.updatedAt}</span>
                </SidebarItem>
              )}
              <SidebarItem label="Skill ID">
                <span className="font-mono text-sm text-zinc-400">{skill.id}</span>
              </SidebarItem>
            </div>

            <Link
              href={cat && project ? `/${cat.slug}/${project.slug}` : "/"}
              className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              ← 回到{project?.name ?? "技能目錄"}
            </Link>
          </aside>

        </div>
      </div>
    </SiteShell>
  );
}
