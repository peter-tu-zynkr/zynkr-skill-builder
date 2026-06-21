# Plan Doc Template — 程式級 SEO 計畫 Doc 14 段骨架

這份 rubric 是 `seo-program-planner` 在綜合階段產出「整個產品/網站 SEO 策略+執行計畫 Doc」的標準骨架。整個 Doc 用 **markdown 組好 → `import_to_google_doc` 匯入「00 SEO Strategy & Plans」bucket**(folder id 從 `seo-pipeline-config.md` 解析)。檔名沿用 `[產品名] 產品 SEO 計畫`。配套的關鍵字/主題分頁則走另一份 `sheet-tabs-template.md` rubric,用 openpyxl → `import_to_google_sheets` 匯入「01 Keyword Maps」。

**這是程式尺度的計畫,不是單篇文章的 Brief**——它定 persona 群、pillar 群、關鍵字池、主題 backlog 與治理,完成後把 backlog 交給 `seo-article-pipeline` 逐篇往下寫。

## Drive-first / local-fallback

這份 rubric 同時是 Drive 上可編輯 master + 本地 `./references/plan-doc-template.md` fallback。runtime 先試讀 Drive master(folder「00 SEO Strategy & Plans」內的同名 rubric Doc),讀不到再用本地這份。Drive master 待 Peter 建立;在那之前本地這份就是 SOT。

## 兩個 worked example 範本(整段可對照仿寫)

撰寫每一段時,可直接打開這兩份已上線的計畫 Doc 當骨架範本,逐段對照它們怎麼寫(尤其 Positioning 的 named frames、轉換層的 IA 決策、Backlog 與 Month-by-month 的顆粒度):

- **Zynkr CRM 產品 SEO 計畫** — Doc `1Zbw3zpnA_ev5M2Kt0fLCW-cj-_sOQhYQtB9mB6krzro` + 9-tab Sheet `11W4L-iZZ0Z9pqIhPp4x6iCGCJoI4-N_zwZrWcXPR5XY`
- **Zynkr AI 技能市集 SEO 計畫** — Doc `1X-yWQ6OXhkBS-n1MgUnNHntZrGmvcuU0HrHeLPumKPY` + 9-tab Sheet `17f4wSRTyHsBHjsjH4-TK1geWZab_dvMCVlhLhQIzROs`

## 全篇 house guardrails(每段都要遵守)

- 只行銷**已出貨**的功能/能力;需求一律以**信號 + 依據**支撐,不杜撰搜尋量,未證實的標記**(待驗證)**。
- house style:zh-TW 標題/標語**不收句號(。)**,系列分隔用 **·**;清單用 **1️⃣2️⃣3️⃣**,不用 ①②③。
- 語氣 no hype。禁用詞:賦能 / 生產力工具 / AI-powered / 無縫 / supercharge / cutting-edge / game-changing。對外能力一律以 **powered by Claude** 泛稱。
- IA 預設沿用真實 stack:教育內容走 CMS articles + 既有 `/free-resource` + 一個新 category → `/blog/<slug>` SSR,**不蓋子站**;技術 SEO 先查 money page 是否可被收錄(noindex/SSR/meta/canonical/schema/sitemap)。

---

# Doc 骨架(14 段 + Phase0 + Appendix)

下方每段標題即 Doc 內的 H1/H2。每段先寫 1–2 句「這段要寫什麼」,再實際填內容。能引用上面兩份 worked example 對應段落當範本。

## Phase 0｜基礎建設(pre-flight checklist)

> 開工前的盤點:確認這個產品的真實 stack、可發佈管道(CMS articles / `/free-resource` / 新 category)、money page 現況、有哪些既有資產可重用。把「IA 不蓋子站、走既有 stack」這個前提在這裡釘死,後面所有決策都從這裡長出來。
- 真實發佈管道與路徑:______(預設 `/blog/<slug>` SSR + 新 category)
- 既有可重用資產:`/free-resource`、現有文章、產品內工具/proof 點
- Money page 收錄前置體檢的 owner 與時程
- 本計畫的兩個輸出 bucket folder id(00 Strategy / 01 Keyword Maps)

## 0｜TL;DR

> 整份計畫一段話講完:這個產品要在搜尋/AI 答案裡贏下什麼定位、用哪幾個 pillar、90 天要達到什麼。給只看一頁的人。
- 我們要 own 的一句話定位:______
- 主戰場與軌道:______
- 90 天目標(對應第 14 段):______

## 1｜Why now

> 為什麼現在做、為什麼這個窗口值得投。寫市場/搜尋/AI 答案層面的時機信號(信號 + 依據,不杜撰量)。

## 2｜Positioning(類別 POV + named frames + voice/誠實 + 軌道分流)

> 這個產品在類別裡的觀點是什麼。最重要的一段。包含四塊:
- **類別 POV**:我們對這個品類的主張(逆主流的那一刀)
- **Named frames**:1–3 個可被引用、可被搜尋的「具名框架/具名取捨」(AEO 的引用鉤子)
- **Voice / 誠實邊界**:no hype、只講已出貨、powered by Claude 泛稱、禁用詞清單
- **軌道分流**:這個產品的 SEO 軌道與其他軌道(如顧問軌)如何分流、不互相稀釋
> 範本:CRM Doc 的「AI-first sales platform」主張 + 市集 Doc 的類別框架。

## 3｜Audience & funnel(persona 反推 + 楔子 + intent map)

> 從已出貨能力**反推** persona(不是憑空造受眾):誰會搜、卡在什麼決策。寫:
- 2–4 個 persona(反推自產品能力)→ 詳表落 Sheet 的 Personas 分頁
- 每個 persona 的「楔子問題」(進站的第一個搜尋意圖)
- TOFU/MOFU/BOFU intent map:每層對應的搜尋意圖類型

## 4｜內容架構(pillar hub & spoke)

> 定 3–6 個 pillar 群,每個 pillar = 一個 hub 主題 + 一串 spoke 子題(hub & spoke)。這是把關鍵字池組織成可寫 backlog 的骨幹。
- Pillar 清單(每個一句話定義它 own 什麼意圖)→ 對應 Sheet 的 Pillar Legend 分頁
- 每個 pillar 的 hub 頁 + spoke 子題大致範圍

## 5｜轉換層(IA 決策 + money pages + 證明引擎 + glossary)

> 內容怎麼接到轉換。四塊:
- **IA 決策**:教育內容落點(CMS articles + `/free-resource` + 新 category → `/blog/<slug>` SSR,不蓋子站);把這個決策與替代方案寫清楚為何這樣選
- **Money pages**:哪幾頁是要轉換的頁(產品頁/定價/註冊),逐頁列收錄體檢結果(noindex/SSR/meta/canonical/schema/sitemap)
- **證明引擎**:可被引用的工具/範本/數據/案例(提供 AEO 與內鏈著力點)
- **Glossary**:要 own 的術語詞條 → 對應 Sheet 的 Glossary 分頁

## 6｜關鍵字與 intent 策略

> 關鍵字池怎麼建、怎麼分意圖、怎麼排優先。對應前段 seo-* 策略 stage 的綜合輸出。
- 關鍵字池來源與分群邏輯(信號 + 依據;搜尋量未證實標(待驗證))
- intent 分類規則(對應 seo-keyword-classifier 輸出)
- 優先序規則(需求 × 難度 × 與 money page 距離)→ 池與分類落 Sheet 的 Keyword Pool 分頁

## 7｜工具 / 證明引擎 build priority

> 第 5 段點到的證明引擎,在這裡排建置優先序:哪個工具/範本/比較頁先做,理由與依賴。
- 依「能撐起多少關鍵字 × 建置成本 × 轉換貢獻」排序 → 對應 Sheet 的 Free Tools/Templates 分頁

## 8｜CTA ladder

> 從 TOFU 到 BOFU 的 CTA 階梯:每層內容對應什麼行動(訂閱 → 工具 → 試用/註冊 → 預約)。只接已出貨的轉換路徑。

## 9｜KPIs

> 衡量什麼、用什麼基準。收錄數、排名、AI 答案引用、流量、註冊/試用。基準未知就標(待驗證),不杜撰。

## 10｜Governance

> 治理規則:誰維護、多久 review、house guardrails 如何在每篇落地、未證實主張如何標記與覆核、orphan 清理(改 slug 要刪舊 Supabase row 的提醒)。

## 11｜Operating model

> 運轉模式:這個 backlog 怎麼餵進 `seo-article-pipeline`、一週/一月產幾篇、誰挑題、HITL 在哪。寫清楚這份計畫與 article pipeline 的交棒介面。

## 12｜Backlog

> 完整主題 backlog:逐題列(主題 · pillar · persona · primary keyword · intent · 優先序 · 狀態)。這是 seo-article-pipeline 的取題來源。→ 詳表落 Sheet 的 Topic List 分頁,本段放摘要與分批。

## 13｜Month-by-month

> 把 backlog 排進月曆:哪個月做哪批 pillar/主題,含工具/money page 修復的里程碑。可仿 CRM Doc 的逐月排程顆粒度。

## 14｜90 天標準(definition of done)

> 第一個 90 天的明確驗收線:發佈幾篇、收錄/引用達標、哪些 money page 修好、哪些工具上線。對應第 0 段 TL;DR 的目標,可量、可勾。

## Appendix｜Sheet 分頁對照

> 列出配套 9-tab Sheet 的分頁清單與各分頁用途,讓 Doc 與 Sheet 互為索引:
- Keyword Pool · Topic List · Comparison/Use-Case(或 Skill↔Use-Case)· Free Tools/Templates · Glossary · AEO Citation-Gap · Money-Page/Tech-SEO Recon · Personas · Pillar Legend
- 附上本次產出的 Sheet id 與 Doc id,並註明兩份 worked example 範本連結

---

## 產出方式(收尾)

1. 用上方骨架在 markdown 裡填完 14 段 + Phase0 + Appendix。
2. `import_to_google_doc(title="[產品名] 產品 SEO 計畫", markdown=..., folder=「00 SEO Strategy & Plans」folder id)`。
3. 配套分頁用 openpyxl 組多分頁 xlsx → `import_to_google_sheets` 到「01 Keyword Maps」,並把 Sheet id 回填本 Doc 的 Appendix。
4. 全篇套用 house guardrails(已出貨 only · 信號+依據 · house style 標點與 1️⃣2️⃣3️⃣ · no hype 禁用詞 · powered by Claude · 不蓋子站)。
