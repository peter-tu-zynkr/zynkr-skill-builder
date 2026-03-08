import { Skill } from "./skills";

export type Category = {
  slug: string;
  name: string;
  icon: string;
  description: string;
};

export type Project = {
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
};

export const categories: Category[] = [
  {
    slug: "brand-marketing",
    name: "品牌行銷",
    icon: "✍️",
    description: "打造品牌聲音、內容策略與行銷素材的 AI 工具組",
  },
  {
    slug: "talent-development",
    name: "人才發展",
    icon: "🧑‍💼",
    description: "職涯規劃、招募流程與面試輔助的 AI 助理",
  },
  {
    slug: "business-consulting",
    name: "業務顧問",
    icon: "🤝",
    description: "客戶需求挖掘、流程優化與業務開發的顧問工具",
  },
  {
    slug: "strategy",
    name: "策略領導",
    icon: "🎯",
    description: "策略規劃與決策支援的高階工具",
  },
  {
    slug: "operations",
    name: "營運",
    icon: "⚙️",
    description: "專案管理、會議紀錄與日常營運流程工具",
  },
  {
    slug: "training",
    name: "培訓",
    icon: "📚",
    description: "課程輔助、學習評估與影片內容處理工具",
  },
  {
    slug: "ai-development",
    name: "AI 助理開發",
    icon: "🛠️",
    description: "設計、重構與優化 AI 指令的開發工具",
  },
];

export const projects: Project[] = [
  // 品牌行銷
  {
    slug: "writing-assistant",
    name: "寫作助理",
    categorySlug: "brand-marketing",
    description: "從靈感發想到出版的完整文章寫作工作流",
  },
  {
    slug: "brand-marketing-assistant",
    name: "品牌行銷助理",
    categorySlug: "brand-marketing",
    description: "品牌故事線、分頁設定與視覺呈現選擇",
  },
  // 人才發展
  {
    slug: "resume",
    name: "履歷客製化",
    categorySlug: "talent-development",
    description: "分析職缺到完成履歷的五步驟客製化工作流",
  },
  {
    slug: "interview",
    name: "面試",
    categorySlug: "talent-development",
    description: "面試猜題與模擬面試輔助",
  },
  {
    slug: "career-coach",
    name: "職涯教練",
    categorySlug: "talent-development",
    description: "長期職涯發展輔導工具",
  },
  {
    slug: "recruitment",
    name: "招募助理",
    categorySlug: "talent-development",
    description: "從職缺設計到候選人溝通的完整招募工作流",
  },
  // 業務顧問
  {
    slug: "career-consulting",
    name: "職涯諮詢",
    categorySlug: "business-consulting",
    description: "職涯諮詢教練的資料分析與洞察工具",
  },
  {
    slug: "consulting-assistant",
    name: "顧問助理",
    categorySlug: "business-consulting",
    description: "客戶痛點挖掘與公司願景描繪",
  },
  {
    slug: "operations-assistant",
    name: "營運助理",
    categorySlug: "business-consulting",
    description: "流程探勘、數位轉型評估與流程重構工作流",
  },
  {
    slug: "sales-assistant",
    name: "業務助理",
    categorySlug: "business-consulting",
    description: "名片整理與線索評分的業務開發工具",
  },
  // 策略領導
  {
    slug: "strategy-planning",
    name: "策略規劃",
    categorySlug: "strategy",
    description: "策略規劃與解決方案設計",
  },
  // 營運
  {
    slug: "search-index",
    name: "搜尋助理索引",
    categorySlug: "operations",
    description: "智慧推薦最適合助理的索引工具",
  },
  {
    slug: "project-management",
    name: "專案管理",
    categorySlug: "operations",
    description: "專案章程發想與規劃工具",
  },
  {
    slug: "project-assistant",
    name: "專案助理",
    categorySlug: "operations",
    description: "會議筆記整理、追蹤與資訊整合工具",
  },
  // 培訓
  {
    slug: "video-review",
    name: "影片回顧",
    categorySlug: "training",
    description: "影片轉錄與結構化回顧文件生成",
  },
  {
    slug: "course-ta",
    name: "課程助教",
    categorySlug: "training",
    description: "AI 寫作課程的學習輔助與評估工具",
  },
  // AI 助理開發
  {
    slug: "prompt-engineering",
    name: "指令工程助理",
    categorySlug: "ai-development",
    description: "引導需求與重構 AI 指令的開發工具",
  },
];

// --- Helpers ---

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getProjectsByCategory(categorySlug: string): Project[] {
  return projects.filter((p) => p.categorySlug === categorySlug);
}

export function getSubagentsByProject(projectSlug: string, skills: Skill[]): Skill[] {
  return skills.filter((s) => s.project === projectSlug);
}

export function getCategoryForSkill(skill: Skill): Category | undefined {
  const project = projects.find((p) => p.slug === skill.project);
  if (!project) return undefined;
  return categories.find((c) => c.slug === project.categorySlug);
}
