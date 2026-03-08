import Link from "next/link";
import { notFound } from "next/navigation";
import { skills } from "@/lib/skills-data";
import { getCategoryBySlug, getProjectBySlug } from "@/lib/taxonomy";
import { SkillPlatform } from "@/lib/skills";
import StatusBadge from "@/components/StatusBadge";
import IPOBreakdown from "@/components/IPOBreakdown";
import WorkflowChain from "@/components/WorkflowChain";
import SetupGuide from "@/components/SetupGuide";

const platformLabel: Record<SkillPlatform, string> = {
  gpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  multi: "Multi-platform",
};

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
      {/* Breadcrumb */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
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
                  name={skill.name}
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
              <div className="px-5 py-4 space-y-1">
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">狀態</p>
                <div className="pt-0.5">
                  <StatusBadge status={skill.status} size="md" />
                </div>
              </div>
              <div className="px-5 py-4 space-y-1">
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">平台</p>
                <p className="text-sm text-zinc-700 font-medium">{platformLabel[skill.platform]}</p>
              </div>
              <div className="px-5 py-4 space-y-1">
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">類別</p>
                <p className="text-sm text-zinc-700">{skill.category}</p>
              </div>
              {skill.author && (
                <div className="px-5 py-4 space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">作者</p>
                  <p className="text-sm text-zinc-700">{skill.author}</p>
                </div>
              )}
              {skill.updatedAt && (
                <div className="px-5 py-4 space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">最後更新</p>
                  <p className="text-sm text-zinc-700">{skill.updatedAt}</p>
                </div>
              )}
              <div className="px-5 py-4 space-y-1">
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Skill ID</p>
                <p className="font-mono text-sm text-zinc-400">{skill.id}</p>
              </div>
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
    </div>
  );
}
