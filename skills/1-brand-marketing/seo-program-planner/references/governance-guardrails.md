# Governance Guardrails — seo-program-planner

> **作用域**：這份 rubric 是 seo-program-planner 的硬性產出守則。`seo-program-planner` 每一次產出計畫 Doc 與多分頁 Sheet、以及它編排的每一個前段策略 stage（persona/question/angle/keyword/classifier/validator）回吐的內容，都必須先通過這裡的每一條才能寫進 Drive。任一條觸發即 **停下、標記、退回對應 stage 重做**，不得帶傷往下游 seo-article-pipeline 交付。
>
> **Drive-first / local-fallback**：本檔同時是 Drive「00 SEO Strategy & Plans」bucket 內的可編輯 master 與本地 `./references/governance-guardrails.md` fallback。runtime 先試 Drive master，取不到才用 local。兩處內容須一致；Peter 在 Drive 上的修訂為準，回灌 local。

---

## G0 — 守則總表（每次產出的 checklist）

每份計畫 Doc / Sheet 交付前，逐條打勾；任一條未過即不得標記該 stage 為 ✅。

| # | 守則 | 觸發即 |
|---|---|---|
| G1 | 只行銷已出貨能力（roadmap 禁區） | 退回，把未出貨能力移出計畫或降級為「待出貨後再寫」 |
| G2 | 需求一律信號化，不杜撰搜尋量 | 退回，補信號+依據或標（待驗證） |
| G3 | house style（標題不收句號 · 系列用 · · 清單 1️⃣2️⃣3️⃣） | 退回，套正格式 |
| G4 | no-hype 禁用詞 | 退回，改寫成具體事實句 |
| G5 | powered by Claude 泛稱，不公佈模型版本 | 退回，改泛稱 |
| G6 | AEO 誠實：引用是非決定性動量指標，不是硬 gate | 退回，把引用從驗收門檻降為觀察指標 |
| G7 | 內外語氣分線：策略 land-grab 語言不上對外頁 | 退回，把對內戰略語言留在計畫，對外文案改中性 |
| G8 | 零孤兒：每個規劃的內部頁都有上下游連結路徑 | 退回，補 hub→spoke / spoke→money page 連結契約 |

---

## G1 — 只行銷已出貨能力（roadmap 禁區）

**原則**：計畫只能圍繞「今天線上、使用者真的能用」的功能、頁面、能力來規劃內容與 money page。roadmap、beta、內部 demo、「快上線了」一律是禁區。

- **SAY（可寫）**：已在 production 的功能、已存在的公開頁面（例如既有 `/free-resource`、`/blog/<slug>`、產品線上頁）、已可被使用者操作的能力、已公開的整合。
- **NEVER-say（不可寫）**：未出貨的功能當成現有賣點、把 roadmap 項目寫進 money page 文案或 CTA、把「規劃中的工具/證明引擎」當成已可用的轉換資產來導流、用未來式包裝成現在式（「即將支援」不得出現在對外頁，只能留在計畫 Doc 的 §7 build priority）。
- **build priority 與對外文案分離**：計畫 Doc §7「工具/證明引擎 build priority」可以列尚未建好的資產（這是對內施工清單），但這些資產在建好並上線前，**不得**出現在 §5 money pages、§8 CTA ladder、或任何 Sheet 的可導流欄位裡。
- **產品宣稱對齊真實 stack**：教育內容走 CMS articles + 既有 `/free-resource` + 新 category → `/blog/<slug>` SSR，不蓋子站；任何「在產品內可做 X」的宣稱，須對得上已出貨的產品能力。
- **檢核問句**：每一條 money page、每一個 CTA、每一個 use-case 宣稱，問「使用者今天點進去，這個能力/頁面存在嗎？」答否即移除或降級。

---

## G2 — 需求信號化，不杜撰搜尋量（待驗證 規則）

**原則**：所有「這個關鍵字/主題有需求」的主張,都必須掛上**信號 + 依據**;不得憑空給搜尋量數字、不得把估算寫成事實。

- **信號優先於數字**：用可指認的需求信號（社群提問、論壇討論串、support 重複問題、競品已覆蓋、AI 引擎被問到的問句、既有站內搜尋）作為需求依據，而不是裸露的月搜量。
- **每個量化標記出處**：任何出現的搜尋量、難度、流量數字,必須在同列/同段標明來源工具與抓取日期;**無可信來源的數字一律不寫**,改為定性信號描述。
- **（待驗證）規則**：尚未用工具或一手資料證實的需求、量級、排名機會,一律加上 **（待驗證）** 標。Sheet 的 Keyword Pool / Topic List / AEO Citation-Gap 等分頁須有一欄記錄「需求信號」與「驗證狀態」;validator stage 未過的列保持（待驗證）,不得在計畫 Doc 正文被當成已確認機會引用。
- **不杜撰**：寧可寫「論壇有 N 串在問，量級待驗證」也不要捏一個「月搜 1,200」。捏造數字是這份計畫的最高級錯誤。

---

## G3 — House style（zh-TW 排版硬規）

- **標題/標語不收句號**：所有 zh-TW 標題、章節名、標語、卡片標題結尾**不加句號（。）**。
- **系列分隔用 ·**：列舉/系列/並置用「·」分隔，**不用** 句號當分隔（例：`Summary · Progress · Blockers · What's Next`）。
- **清單編號用 1️⃣2️⃣3️⃣**：需要編號的清單用 emoji 數字 1️⃣2️⃣3️⃣…，**不用** 圈號 ①②③。
- **適用範圍**：計畫 Doc 的 14 段標題、Sheet 的分頁名與表頭、所有對外文案草稿、CTA 文案、pillar/spoke 命名，全部套這套排版。
- 這條同時管對內 Doc 與對外文案；對外文案另受 G7 語氣分線約束。

---

## G4 — No-hype（禁用詞）

**原則**：語氣務實、可驗證、具體；不誇飾。寫「它做什麼、對誰有用、依據是什麼」，不寫形容詞堆疊。

- **禁用詞（中英皆禁，含明顯變體）**：賦能 · 生產力工具 · AI-powered · 無縫 · seamless · supercharge · cutting-edge · game-changing · revolutionary · 顛覆 · 一鍵搞定（當成空話用時）· 效率神器。
- **改寫方向**：把禁用詞換成具體動作或結果。例：「AI-powered 無縫整合」→「用 Claude 讀會議記錄、自動建一筆 CRM deal」。
- **適用範圍**：對外文案、money page 草稿、CTA、meta description、pillar/spoke 標題,以及計畫 Doc 裡所有會被直接搬去發佈的文字。對內戰略分析段落（如 §2 Positioning 的類別 POV）可以用分析性語言,但仍不得用上列空話詞。
- **檢核**：產出後對禁用詞清單做一次掃描；命中即逐一改寫,不得保留。

---

## G5 — Powered by Claude 泛稱（不公佈模型版本）

- **對外一律泛稱 powered by Claude**：所有對外可見文案、money page、產品宣稱,提到 AI 來源時只用「powered by Claude」這類泛稱。
- **不公佈模型版本/ID**：對外文字**不出現** 具體模型名稱或版本（不寫 Opus / Sonnet / Haiku / `claude-*` / 模型 ID / context 視窗大小 / 參數）。這些是內部實作細節。
- **不承諾特定模型行為**：不對外宣稱「使用最新/最強模型」之類會隨時間失真的話。
- **適用**：計畫 Doc 裡任何標為「對外文案」「money page 草稿」「CTA」的段落,以及 Sheet 中會被搬去發佈的欄位。對內 build priority / governance 段落可記錄實作細節。

---

## G6 — AEO 誠實（引用是動量指標，非硬 gate）

**原則**：AEO（被 AI 答案引擎引用）是值得追蹤的**動量指標**,不是內容是否合格的硬性驗收門檻。不得為了「被引用」而犧牲 G1–G5。

- **引用 = 非決定性動量指標**：計畫 Doc §9 KPIs 與 Sheet「AEO Citation-Gap」分頁把「被引用次數/被引用問句覆蓋」列為**觀察性動量指標**,標明它受外部引擎黑箱影響、會波動、不可承諾。
- **不得當硬 gate**：不得把「必須被某引擎引用」設成內容上線或驗收的通過條件;不得把引用數寫成可保證的 KPI 目標。
- **誠實的 citation-gap**：AEO Citation-Gap 分頁記錄「哪些問句目前沒有好答案來源」這個事實性缺口,作為內容機會,而不是宣稱「寫了就會被引用」。
- **與 G2 一致**：任何 AEO 機會量級未證實一律（待驗證）。

---

## G7 — 內外語氣分線（land-grab 語言不上對外頁）

**原則**：計畫 Doc 裡的策略性、戰略性、競爭性語言是**對內**的;它幫團隊對齊方向,但**不得**原樣流到對外頁面文案。

- **對內可用**：類別 POV、named frames、「擁有某個類別詞」「land-grab」「卡位」「軌道分流」「對 HubSpot/Attio 建模」這類戰略敘述,留在計畫 Doc §2 Positioning / §1 Why now / §11 Operating model。
- **對外不可用**：對外頁面文案不講「我們要擁有這個類別」「搶佔」「卡位」「打贏競品」這類 land-grab 句;對外只講對使用者有用的具體價值。把競品名稱用於對外時,只用在中性的 comparison/use-case 內容,不用於宣戰式語言。
- **分線檢核**：計畫 Doc 每一段先標「對內戰略 / 對外文案」;任何標為對外的段落若殘留戰略 land-grab 語言,退回改成中性使用者價值敘述。
- 這條與 G4 互補：G4 管空話誇飾,G7 管戰略內語外洩。

---

## G8 — 零孤兒（內部連結契約）

**原則**：計畫規劃出來的每一個內部頁面,都必須在 IA 裡有上游入口與下游去處,**沒有孤兒頁**。

- **hub & spoke 連結契約**：每個 spoke（單篇文章）規劃時就標明它掛在哪個 pillar hub 底下,且 hub 會連回它;每個 pillar hub 列出其 spoke 清單。Sheet「Topic List / Pillar Legend」分頁須能還原這張連結圖。
- **spoke → money page 路徑**：每個 spoke 都規劃出至少一條通往相關 money page 或 CTA 的內部連結路徑（受 G1 約束：只能連到已出貨的 money page）。
- **money page 可被收錄前置檢查**：在把任何 money page 設為內部連結目標前,先查它是否可被收錄（noindex / SSR / meta / canonical / schema / sitemap)；不可收錄的頁先進技術 SEO recon（Sheet「Money-Page/Tech-SEO Recon」分頁）,修好前不當作可導流目標。
- **無懸空連結**：計畫不得規劃連到尚不存在的頁、未出貨的頁、或已知 noindex 的頁。
- **檢核**：交付前對 Topic List 跑一次「每列是否都有 上游 pillar + 下游 money page/CTA」掃描;缺任一端即補,不得留孤兒。

---

## 退回協定

任一守則觸發時：
1️⃣ 在進度板上把該 stage 標回 ▶️（不得標 ✅）,並記下命中的守則編號。
2️⃣ 若問題出在前段策略 stage（persona/question/angle/keyword/classifier/validator）的回吐內容,把它退回對應 stage 重跑;若出在程式級綜合步驟(pillar/IA/money page/月曆/Sheet/Doc),由 orchestrator 自行修正。
3️⃣ 修正後重跑 G0 checklist,全綠才繼續往下游交付。
4️⃣ 絕不把帶（待驗證）以外傷況的內容交給 seo-article-pipeline。
