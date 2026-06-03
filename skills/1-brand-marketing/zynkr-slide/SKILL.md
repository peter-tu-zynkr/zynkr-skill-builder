---
name: zynkr-slide
description: "簡報接力的總指揮（站在三棒接力之上）：使用者說「做一份簡報／做個 deck／幫我把這些做成投影片／做季報簡報／all-hands 簡報／deep dive 簡報／pitch deck」時主動觸發。我做一次到位的智慧 intake──偵測這是哪種簡報（deep-dive 深掘 / business-review 業務檢視 / data-presentation 數據簡報 / all-hands 全員大會 / planning 規劃 / pitch 提案 / update 更新 / teach 培訓 / fundraise 募資）、盤點使用者已給的素材與故事線、提案頁數讓使用者確認、收齊必含素材與模式──組出一份 SLIDE_PACKET ▸ Brief，再依序驅動 slide-storyline-designer → slide-page-splitter → slide-visual-selector → pptx 技能算成 .pptx。預設 express 模式（前面一次問清楚，只在故事線定稿與最終檔兩處請使用者拍板）；帶 guided 參數則保留三棒各自的逐棒人工審核。範圍界線：我只做意圖偵測、context 收斂、▸ Brief 注入與接力調度；不自己排敘事弧線、不自己分頁、不自己選版式、不自己算繪 .pptx──那是三棒與 pptx 技能各自的事。"
category: brand-marketing
project: zynkr-slide
platform: claude
status: Done
author: Peter Tu
input: "原始簡報素材／主題 + 想傳達的訊息（零散筆記、bullet、舊 deck、數據、口頭重點皆可），可帶簡報用途線索；或一份已存在的 ▸ Storyline／▸ Pages 想接續往下跑。參數：express（預設）/ guided。"
process: "偵測意圖 + 盤點既有 context → 單次智慧 intake（確認用途、受眾/場合、提案頁數、必含素材、模式）→ 載入 use-case playbook 組出 SLIDE_PACKET ▸ Brief → 建立共用工作子資料夾存 ▸ Brief → 依序驅動三棒接力（帶著 ▸ Brief）→ 把 ▸ Visuals 交給 pptx 技能算繪 → 交付 .pptx"
output: "一份成稿 .pptx（經三棒接力 + pptx 技能算繪），以及完整 SLIDE_PACKET（▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals）存在同一個工作子資料夾。"
synergy: ["slide-storyline-designer", "slide-page-splitter", "slide-visual-selector", "pptx"]
---

# zynkr-slide

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill zynkr-slide
```

## 這是什麼

`zynkr-slide` 是簡報接力的**總指揮**，站在三棒接力**之上**。完整鏈是：

```
zynkr-slide  ← 你在這（總指揮）
   │  一次 intake → SLIDE_PACKET ▸ Brief（簡報用途 / 受眾與場合 / 工作子資料夾 / 頁數預算 / 必含素材 / 模式 / 套用品牌 / 逐棒強調）
   ▼
slide-storyline-designer (1.12)
   │  SLIDE_PACKET ▸ Storyline
   ▼
slide-page-splitter (1.13)
   │  SLIDE_PACKET ▸ Pages
   ▼
slide-visual-selector (1.14)
   │  SLIDE_PACKET ▸ Visuals (render-ready)
   ▼
pptx 技能  → 算繪成 .pptx
```

**核心理念**：三棒接力本身已經很完整，但有兩個缺口──(1) **四次冷啟動**：每一棒開頭都要重新問使用者它推不出來的 context；(2) **整份簡報沒有「這是哪種簡報」的共識**，所以同一套通用規則套在 deep dive 和 all-hands 上，深掘的不夠深、全員的太密。`zynkr-slide` 補這兩個缺口：**問一次**（把四次冷啟動併成一次智慧 intake），並依「簡報用途」載入一份 playbook，組成 `SLIDE_PACKET ▸ Brief` 一路往下注入，讓每一棒都知道「這是哪種簡報、該往哪個方向用力」。

**吃什麼**：原始素材／主題 + 想傳達的訊息（再亂都接），可帶用途線索；或一份已存在的 ▸ Storyline／▸ Pages 想接續。

**吐什麼**：一份成稿 `.pptx`，以及完整 `SLIDE_PACKET`（▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals）存在同一個工作子資料夾。

**不吐什麼**：我**不自己**排敘事弧線、不自己分頁、不自己選版式、不自己算繪 `.pptx`。我是**薄的調度層**──偵測意圖、收斂 context、組 ▸ Brief、按順序驅動三棒與 pptx 技能（見 ## Limitations）。每一棒的專業判斷仍由那一棒自己做。

> 不論使用者直接喊「做簡報」觸發我，或經 `/zynkr` 路由轉進來，行為一致──兩種入口都跑同一套 intake → ▸ Brief → 接力。

---

## Resources you'll use

- **use-case playbook（本技能知識核心）**：`./references/use-case-playbooks.md` ──「這是哪種簡報 → 用哪一套預設」的對照表。每個用途給：偵測線索、對映的 storyline `場合` enum、敘事骨架 bias、頁數預算區間、預設資訊密度、**逐棒強調 directives**。Step 1 偵測用途、Step 3 組 ▸ Brief 時都讀它。
- **品牌視覺/語氣來源（設定）**：`./references/brand-source.md` ── 本技能**不內建品牌內容**；此檔設定要從哪裡載入品牌規範，並附通用 schema。intake 與組 ▸ Brief 時依它載入；未設定則走中性預設，並告訴使用者「未套用品牌」。三棒各自也會再依自己的 brand-source 載入一次，本層只負責把「要用品牌」這件事帶進 ▸ Brief。
- **下游三棒（接力鏈）**：`slide-storyline-designer`（棒1）、`slide-page-splitter`（棒2）、`slide-visual-selector`（棒3）。用 **Skill 工具**逐棒呼叫，讓每一棒讀自己的 SKILL.md 跑自己的邏輯；我只把 ▸ Brief 與上一棒的交棒包傳給它，**不重寫它的步驟**。三棒都已加入「若帶有 ▸ Brief 則遵從其 directives」的掛勾。
- **算繪技能（已安裝）**：pptx 技能於 `~/.claude/skills/pptx/`，由棒3 在 ▸ Visuals 定稿後呼叫，走 **Create from scratch**（`Read ~/.claude/skills/pptx/pptxgenjs.md`）。本技能**不 vendor、不重寫** pptx。

---

## Step 1 — 偵測意圖 + 盤點既有 context

動手問之前，先盤點，**不要重問使用者已經給的東西**（這正是本技能的價值）。

1. **判斷接力起點**：使用者手上是否已有接力產物？
   - 已貼/已存 `▸ Visuals` → 直接進 pptx 算繪（Step 4 末段）。
   - 已有 `▸ Pages` → 從棒3 接續。
   - 已有 `▸ Storyline` → 從棒2 接續。
   - 只有原始素材／主題 → 從棒1 起跑（最常見）。
   - **中途接續時仍要組完整 ▸ Brief**：先確認用途，再從 playbook 載入**接下來會跑的那幾棒**的逐棒強調 directives（連同受眾與場合、必含素材、套用品牌）──不能只放用途+模式+頁數預算，否則後續棒次拿不到該用途的「味」，等於沒套 orchestrator。已完成棒次的欄位可摘要帶過。若接續的產物當初不是由 ▸ Brief 產生、也沒有用途線索，跑一輪精簡 intake（確認用途/模式/頁數預算/存檔位置）再往下，不要默默猜一個可能與既有內容矛盾的用途。
2. **偵測簡報用途**：讀 `./references/use-case-playbooks.md` 的「偵測線索」，把使用者的字眼/情境映到一個用途（deep-dive / business-review / data-presentation / all-hands / planning / pitch / update / teach / fundraise）。抓不準就在 Step 2 讓使用者選，**別硬猜**。
3. **盤點已給的欄位**：使用者是否已經講了受眾、場合、頁數想法、必含的數據/案例、要不要套品牌？已給的就記下，Step 2 只問**還缺的**。

用一句話把判斷說給使用者聽，讓他能更正：

> 「看起來是一份 **<用途>** 簡報，從 **<起點>** 開始跑。我先跟你確認幾件事就開工。」

---

## Step 2 — 單次智慧 intake（HITL：問一次）

把所有缺的 context **一次問完**（別逐題擠牙膏）。用 `AskUserQuestion` 把離散選項做成選單，開放欄位用文字問。一輪問清：

1. **確認用途**：把 Step 1 偵測到的用途給使用者確認/改（選單帶 playbook 的 9 個用途，外加一個「都不是／不確定」選項）。若選「都不是／不確定」，走 playbook 的**無匹配 fallback**：用「對映場合」的通用骨架、逐棒強調寫「依場合預設，無額外加味」。
2. **受眾與場合**：聽眾是誰？場合對映到 storyline 既有 enum（**對外提案 / 內部更新 / 教學培訓 / 募資**）──playbook 已給每個用途的建議對映，這裡讓使用者確認/改。
3. **提案頁數（page budget）**：**主動算一個建議區間**給使用者確認，不要叫他空想。建議 = playbook 的頁數預算區間 ⨉ 素材量微調（素材多取上緣、素材少取下緣）。講清楚這是 **target 不是硬上限**，實際切幾頁是棒2 的判斷。
4. **必含素材**：有沒有「一定要進」的數據/案例/訊息/頁？沒有就記「無」。
5. **存檔位置**：這份簡報的工作子資料夾要開在哪？（後續 ▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals 與 .pptx 都放這裡。）
6. **模式**：`express`（預設，前面問清楚、只在故事線定稿與最終檔兩處拍板）還是 `guided`（保留三棒各自逐棒審核）？若使用者啟動時帶了 `guided` 參數就用 guided，否則 express。
7. **要不要套品牌**：是否依 `./references/brand-source.md` 載入品牌？載不到就講明走中性預設。

> **必含素材 vs 頁數預算的當場把關**：若「必含素材」的件數明顯撐爆頁數預算上緣（例如 10 張一定要上的數據頁卻只給 8–12 頁），當場提出取捨：拉高預算、或拆成兩份簡報，別讓內容稍後被默默砍或讓預算悄悄爆掉。

> 一次問完是硬規則。intake 結束後，express 模式下中途**不再為了收 context 打斷使用者**（只在故事線定稿、最終檔兩處停）。

---

## Step 3 — 載入 playbook + 組 SLIDE_PACKET ▸ Brief

依確認後的用途，從 `./references/use-case-playbooks.md` 取那一格的 directives，組出 ▸ Brief。**逐棒強調**要從 playbook 抄具體文字（不是「加強一點」這種空話），讓每一棒拿到就能照做。▸ Brief 自己的欄位名稱是接力合約的一部分，三棒掛勾會逐字去讀，**不可改名**（唯一的例外：`受眾與場合` 會被棒1 刻意重新命名、填入它自己的「受眾與情境」欄位──那是兩個不同產物間的欄位橋接，屬預期行為）：

```
SLIDE_PACKET ▸ Brief
────────────────────────────────────────
簡報用途 (use-case)：
  <deep-dive / business-review / data-presentation / all-hands / planning / pitch / update / teach / fundraise>

受眾與場合：
  聽眾：<是誰>
  場合：<對外提案 / 內部更新 / 教學培訓 / 募資>   ← 對齊 storyline 既有 enum；由用途對映、使用者已確認

工作子資料夾 (working-folder)：
  <本份簡報的工作子資料夾絕對路徑（Step 2 問到的存檔位置）；▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals 與 .pptx 都放這裡>

頁數預算 (page budget)：
  <目標區間，例 12–15；target 非 hard cap，實際切頁由棒2 決定>

必含素材 (must-include)：
  <使用者點名一定要進的內容/數據/案例/頁；沒有寫「無」>

模式 (mode)：
  <express | guided>

套用品牌：
  <是，依各棒 brand-source 載入 / 否，中性預設>

逐棒強調 ▸ 故事線 (棒1)：<從 playbook 抄：敘事骨架 bias + 邏輯檢查要加重哪幾項 + 收尾要求>
逐棒強調 ▸ 分頁 (棒2)：<從 playbook 抄：預設密度上限 + 哪種頁優先 + 同一 beat 是否容許多頁>
逐棒強調 ▸ 視覺 (棒3)：<從 playbook 抄：偏好哪些 archetype + 視覺要「揭示」什麼 + 用色取向>
────────────────────────────────────────

（注意：`逐棒強調 ▸ 故事線 (棒1)` / `▸ 分頁 (棒2)` / `▸ 視覺 (棒3)` 是三棒掛勾**逐字比對**的欄位名，連 ▸ 與單一空格都要照上面這樣寫，別改成縮排子項或多空格對齊。）
```

建立 Step 2 講好的工作子資料夾，把 ▸ Brief 存進去（durable，與後續 ▸ Storyline / ▸ Pages / ▸ Visuals 同一份）。

---

## Step 4 — 跑接力（relay runner）

**開跑前 preflight**：先確認接下來會用到的棒次與 pptx 技能都已安裝（三棒目錄在 `skills/1-brand-marketing/`；pptx 在 `~/.claude/skills/pptx/`）。缺哪個就告訴使用者要 `npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill <名>`（pptx 須另外安裝），並**停在這裡**，不要硬跑到一半才失敗。

**傳遞方式 (transport)**：用 **Skill 工具**呼叫某一棒時，把**完整 ▸ Brief 區塊 + 上一棒的交棒包**逐字貼進該次呼叫的 args（連同 ▸ Brief 的「工作子資料夾」路徑），讓那一棒在 context 裡就直接看得到 ▸ Brief；**不要**只丟一句提示就期待它自己去翻檔案。**讓每一棒讀自己的 SKILL.md 跑自己的邏輯**──我不在這裡重寫敘事/分頁/版式判斷。

**接力順序（依 Step 1 判斷的起點切入）**：從哪一棒開始就跳過它前面的棒次。⚠️ 若從棒2/棒3 接續，棒1 的故事線定稿閘已不在本次流程內──express 模式下中途就**沒有任何人工關卡**，只剩最終 .pptx 那一關；開跑前先跟使用者確認他貼的 ▸ Storyline／▸ Pages 已是定稿。

1. **棒1 `slide-storyline-designer`**：傳原始素材 + ▸ Brief。棒1 讀 ▸ Brief 的「故事線 (棒1)」directives 與場合，排敘事弧線、做邏輯檢查。
   - **故事線定稿閘（兩種模式都保留）**：故事線是後面所有頁的母版，**無論 express 或 guided 都要使用者拍板**。這是 express 模式下的第一個（也是 intake 之外唯一中途）人工關卡。
2. **棒2 `slide-page-splitter`**：傳 ▸ Storyline + ▸ Brief。棒2 讀「分頁 (棒2)」directives 與頁數預算（當 target）、預設密度，切頁。
   - `express`：棒2 的人工審核走**非阻斷式**（列出分頁、標明可隨時喊停，無重大問題即自動往下）。
   - `guided`：保留棒2 原本逐頁阻斷式 HITL。
3. **棒3 `slide-visual-selector`**：傳 ▸ Pages + ▸ Brief。棒3 讀「視覺 (棒3)」directives，逐頁選 archetype、寫版面、對應 pptxgenjs 原語。
   - `express`：棒3 的人工審核走**非阻斷式**。
   - `guided`：保留棒3 原本逐頁阻斷式 HITL。
4. **算繪**（誰呼叫 pptx 分兩條路徑，別重複算）：
   - **正常路徑**（本次有跑棒3）：由**棒3 自己**在 ▸ Visuals 定稿後呼叫已安裝的 **pptx 技能**（Create from scratch，`Read ~/.claude/skills/pptx/pptxgenjs.md`）逐頁算繪、並完成 pptx 要求的 QA（markitdown 文字檢查 + 子代理視覺檢查）。本層只**確認它有跑**，不重複呼叫。
   - **從 ▸ Visuals 接續**（Step 1 起點＝已有 Visuals、棒3 不會跑）：改由**本層（orchestrator）直接**呼叫 pptx 技能算繪 + QA。
   兩條路徑都：色彩/字體依品牌（▸ Brief「套用品牌」= 是時），版面依 ▸ Visuals 的版面配置。

> **退棒 / 局部修改**：觸發情況包括故事有缺口、單頁密度爆表、**必含素材超出頁數預算**。做法：用 Skill 工具帶著現有 ▸ Brief + 上一棒交棒包 + 具體修改要求，重新呼叫該棒讓它**重出整份交棒包**，再往下重跑受影響的棒次（批量重跑，不做逐頁 patch）。退棒不需要重跑 intake──▸ Brief 還在工作子資料夾裡。

---

## Step 5 — 交付 + 存檔（最終閘）

1. **最終閘（兩種模式都保留）**：確認 pptx QA 已由負責方（正常路徑＝棒3；接續路徑＝本層）跑過、不重複算繪；把成稿 `.pptx`（連同視覺 QA 結果）交給使用者過目，列出每頁一行摘要，請他確認或指出要改的頁。要改就照 Step 4「退棒 / 局部修改」的做法退回對應棒次重出、再重跑受影響的下游棒次。
2. 全程跑完後，工作子資料夾裡會有完整四件套：`▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals` + 成稿 `.pptx`（中途接續時，較早的交棒包以使用者提供的版本為準）。
3. 用一句話收尾：跑了哪種用途、幾頁、用了哪個模式、檔案在哪。

---

## 模式對照（express vs guided）

| 關卡 | express（預設） | guided（帶參數） |
|---|---|---|
| intake（Step 2） | ✅ 一次問清 | ✅ 一次問清 |
| 棒1 故事線定稿 | ✅ 阻斷式拍板 | ✅ 阻斷式拍板 |
| 棒2 分頁審核 | 非阻斷（列出 + 可喊停，自動往下） | ✅ 逐頁阻斷式 |
| 棒3 視覺審核 | 非阻斷（列出 + 可喊停，自動往下） | ✅ 逐頁阻斷式 |
| 最終 .pptx | ✅ 過目拍板 | ✅ 過目拍板 |

express 的精神：**前面問一次、後面只在母版（故事線）與成品（.pptx）兩處停**；中間的分頁與視覺照 ▸ Brief 自動跑，使用者隨時可喊停。guided 適合高風險或要逐步掌控的簡報。

---

## Outputs

一份成稿 `.pptx`，以及完整 `SLIDE_PACKET`（▸ Brief / ▸ Storyline / ▸ Pages / ▸ Visuals）存在同一個工作子資料夾。整條接力都帶著 ▸ Brief，所以同一份簡報從故事線到視覺都對齊「這是哪種簡報」。

## Limitations

`zynkr-slide` 是**薄的調度層**。我**做**：意圖偵測、單次 context 收斂、▸ Brief 組裝與注入、按順序驅動三棒與 pptx、把關 express/guided 兩處人工閘。我**不做**：

- **不自己排敘事弧線、不自己定核心主張**：那是棒1 `slide-storyline-designer` (1.12)；我只把用途/場合/directives 餵給它。
- **不自己分頁、不自己決定每頁放多少**：那是棒2 `slide-page-splitter` (1.13)；頁數預算是我給的 target，實際切頁是它的判斷。
- **不自己選版式 archetype、不自己寫版面或 pptxgenjs 原語**：那是棒3 `slide-visual-selector` (1.14)。
- **不自己算繪 `.pptx`、不 vendor pptx 技能**：算繪與算繪 QA 由已安裝的 pptx 技能負責，本技能只呼叫它。
- **不內建品牌內容**：品牌一律在執行時依 `./references/brand-source.md` 載入；本公開技能庫不放任何內部 IP。
