# 視覺判定框架（內容關係 → 視覺 building blocks）

> slide-visual-selector（簡報助理第三棒）的判準聖經。
> 用途：拿到 `▸ Pages` 的每一頁，**只看這頁的「內容關係 / 想傳達的訊息」**，就能對應出一組可直接算繪的 building blocks：`{版式 archetype, 視覺元素 = pptxgenjs 原語, 版面骨架}`。
> 對齊：版式名稱嚴格對齊 SKILL.md 的 archetype enum；每個視覺元素都對得上一個 pptxgenjs 原語，下游 pptx 技能才能 1:1 算繪。


> **品牌中立說明**：本檔「品牌備註」欄與規則一律使用**通用角色語**（決策色／強調色／深底色／顯示字體／編號字體）；實際色值、字體由 `./brand-source.md` 載入的品牌指南決定，未設定品牌時走中性預設。本檔不含任何特定品牌的色碼或內部資訊。

---

## 核心原則：先定訊息，再選形式

這份框架只有一個信念，借自 Gene Zelazny《Say It With Charts》：

> **決定一頁該長什麼樣的，不是「資料」，也不是「主題」，而是「這一頁想說的那一句話（訊息）」。**

同一份數據——例如「五個地區的營收」——你想說的訊息不同，視覺就完全不同：

- 想說「東區遠遠領先」→ 這是**排名**關係 → 排序過的長條圖。
- 想說「東區佔了全公司一半」→ 這是**組成**關係 → 圓餅圖。
- 想說「東區三年來一路往上」→ 這是**趨勢**關係 → 折線圖。

資料一模一樣，但訊息（內容關係）不同，形式就不同。所以本框架的判定**不是**「這頁有沒有數字」，而是「這頁的內容彼此是什麼關係、我想讓聽眾記住哪一句」。先把那句話定下來，形式幾乎是自動掉出來的。

這也是為什麼 Zelazny 的流程是：**訊息（message）→ 比較型態（comparison）→ 圖表型態（chart form）**，圖表永遠是最後一步，不是第一步。

### 標題自帶結論（Minto 金字塔原理）

搭配 Barbara Minto《The Minto Pyramid Principle》：每一頁的**標題就是這頁的結論（action title）**，不是主題名。

- ❌ 主題名：「Q3 營收」
- ✅ action title：「Q3 營收成長 28%，由東區單一市場驅動」

標題寫成結論之後，視覺的工作就被框死了：**視覺只負責把標題那句話「演」給聽眾看**，不是裝飾、不是補充、不是另開話題。判定視覺時永遠回頭問一句：「這個視覺，是在支撐標題那句結論嗎？」如果不是，要嘛換視覺，要嘛標題沒寫對。

把這兩個原則合起來，本棒每頁的判定動線是：

```
讀 action title（這頁的結論）
  → 問：要支撐這句結論，內容彼此是什麼「關係」？（下表 18 類）
  → 對應出 {版式 archetype, 視覺元素=pptxgenjs 原語, 版面骨架}
  → 視覺只服務那句結論，不另開話題
```

---

## 目錄

- [核心原則：先定訊息，再選形式](#核心原則先定訊息再選形式)
- [三條必守規則](#三條必守規則)
- [快速查找表（內容關係 → building blocks）](#快速查找表內容關係--building-blocks)
- [archetype enum 與算繪原語對照](#archetype-enum-與算繪原語對照)
- [各內容關係的細節判定](#各內容關係的細節判定)
  - [1. assertion 單一主張／高強調 → big-statement](#1-assertion-單一主張高強調--big-statement)
  - [2. parallel list 平行要點 → bulleted-list](#2-parallel-list-平行要點--bulleted-list)
  - [3. comparison 取捨對比 → two-column-compare](#3-comparison-取捨對比--two-column-compare)
  - [4. ranking 排名／大小 → data-chart (bar)](#4-ranking-排名大小--data-chart-bar)
  - [5. time-series 趨勢 → data-chart (line)](#5-time-series-趨勢--data-chart-line)
  - [6. composition 組成／佔比 → data-chart (pie/stacked)](#6-composition-組成佔比--data-chart-piestacked)
  - [7. correlation 相關 → data-chart (scatter)](#7-correlation-相關--data-chart-scatter)
  - [8. distribution 分佈 → data-chart (histogram bar)](#8-distribution-分佈--data-chart-histogram-bar)
  - [9. process 步驟／管線 → process-diagram](#9-process-步驟管線--process-diagram)
  - [10. funnel 漏斗 → process-diagram (trapezoid)](#10-funnel-漏斗--process-diagram-trapezoid)
  - [11. hierarchy 概念層級 → process-diagram (pyramid)](#11-hierarchy-概念層級--process-diagram-pyramid)
  - [12. causal 因果／回饋 → process-diagram (arrows)](#12-causal-因果回饋--process-diagram-arrows)
  - [13. positioning 兩軸定位 → matrix（歸 two-column-compare 家族）](#13-positioning-兩軸定位--matrix歸-two-column-compare-家族)
  - [14. tabular 多屬性結構化資料 → data-chart (table)](#14-tabular-多屬性結構化資料--data-chart-table)
  - [15. quotation 引言／見證 → quote](#15-quotation-引言見證--quote)
  - [16. concept 定義／單一概念 → image-led / big-statement](#16-concept-定義單一概念--image-led--big-statement)
  - [17. divider 段落轉場 → section（用 big-statement/title 算繪）](#17-divider-段落轉場--section用-big-statementtitle-算繪)
  - [18. title / CTA 開場與結尾行動 → title / closing-CTA](#18-title--cta-開場與結尾行動--title--closing-cta)
- [反模式（看到就退回或改版）](#反模式看到就退回或改版)
- [來源與定位](#來源與定位)

---

## 三條必守規則

判定任何一頁前，這三條先成立，否則先處理它們再選版式。

1. **一頁一個訊息。** 一頁只支撐一句結論。若這頁的內容要點其實在講兩三件事、或要塞 >6 條列／>1 張主圖才講得完，這是**分頁問題不是版式問題**——標記出來請使用者回上一棒 `slide-page-splitter` 拆頁，不要靠縮字級、塞兩張圖硬擠。資訊密度超標時硬選版式，等於替壞分頁背書。

2. **標題自帶結論（action title）。** 視覺是來支撐標題那句結論的。判定時若發現「找不到能支撐這句話的視覺」，通常是標題還停在主題名（如「市場概況」），請先把標題改寫成結論再選視覺。

3. **品牌影像法則：「優先結構性圖解、少用裝飾性圖片」（prefer structural diagrams over decoration）。**
   - 優先用**結構性圖解**（流程、層級、矩陣、比較面板）表達關係，而不是塞 stock 圖當氣氛。一張對的圖解 > 一張漂亮但沒資訊的圖。
   - **決策色 是決策色，每頁最多用 1 次**：只標在「這頁要聽眾做的那一個決定／那一個關鍵數字」上。整頁橘 = 沒有重點。
   - **強調色 是強調動詞色，每個標題最多 1 個**：標題裡最關鍵的那個動詞／字才上 強調色，多了就稀釋。
   - 色彩、字體一律**依 `./brand-source.md` 載入的品牌（未設定則用中性預設）**；本框架只標「該強調之處」，不寫死非品牌色碼。字體語意：標題／大字主張用 **顯示字體**；編號／期數／代碼用 **編號字體**；轉場全幅底色用 **深底色**。

---

## 快速查找表（內容關係 → building blocks）

> 用法：讀這頁 action title + 內容要點 → 在「偵測線索」欄找到最符合的那一列 → 直接拿它的版式與原語配方。一頁只會落在**一**類；若同時像兩類，回規則 1（多半是該拆頁）。

| 內容關係 | 偵測線索（在 ▸ Pages 看到什麼） | 版式 archetype | building blocks（pptxgenjs 原語） | 品牌備註 |
|---|---|---|---|---|
| **assertion** 單一主張／高強調 | 只有一句衝擊性結論、一個關鍵數字、一句口號；密度低 | `big-statement` | 大 `addText`（顯示字體 48–64）＋ 可選 dot-grid `addShape` 襯底 | 該強調的字／數字上 決策色（這頁就是那一次） |
| **parallel list** 平行要點、無順序 | 3–6 個彼此獨立、無先後、不需互比的要點 | `bulleted-list` | `addText` bullets，或一排 `ROUNDED_RECTANGLE`＋`addText` 卡片 | 卡片標題動詞可上 1 個 強調色 |
| **comparison** A vs B(／C) 取捨對比 | 方案A vs B、before/after、現況 vs 目標、我們 vs 競品 | `two-column-compare` | 並排 `addShape` 面板＋`addText`，或 `addTable` | 推薦的那一欄表頭上品牌主色／決策色（1 次） |
| **ranking** 跨項目排名／大小 | 「誰最大／前三名／差距多少」，類別比大小 | `data-chart` | `addChart(BAR)` 橫向、**已排序** | 要凸顯的那條 bar 上 決策色，其餘灰階 |
| **time-series** 隨時間變化／趨勢 | 多期、月／季／年、「成長／下滑／走勢」 | `data-chart` | `addChart(LINE)`；期數很少（≤4）時用 `addChart(BAR, col)` | 結論線上品牌主色，其餘淡 |
| **composition** 部分對全體／組成 | 「佔比／組成／結構／X 成」，加總=100% | `data-chart` | `addChart(PIE/DOUGHNUT)`（≤5 片）或 stacked `addChart(BAR)` | 主角那片上 決策色，其餘同色階；節制使用 |
| **correlation** 兩變數相關 | 「X 越高 Y 越…」「兩者有關係」散點 | `data-chart` | `addChart(SCATTER)` | 趨勢區／離群點可用 決策色 點出 |
| **distribution** 分佈／離散 | 「集中在／分散／落在哪一段」次數分佈 | `data-chart` | `addChart(BAR)` 直方（區間為 X 軸） | 主峰區間上 決策色 |
| **process** 步驟／序列／管線 | 「第一步…接著…最後」「流程／pipeline」有序 | `process-diagram` | 一排 `pres.shapes.ROUNDED_RECTANGLE`＋`pres.shapes.LINE`／`'rightArrow'`（字串）箭頭＋`addText`，標號 1→N | 終點／關鍵步驟可上 決策色 1 次 |
| **funnel** 逐段收窄／漏斗 | 「轉換／流失／一層層篩下來」量遞減 | `process-diagram` | 由寬到窄堆疊 `addShape('trapezoid', …)`＋`addText` 標籤 | 最終轉換層上 決策色 |
| **hierarchy** 概念層級 | 「金字塔／層級／基礎→頂層」上下從屬 | `process-diagram`（pyramid） | `addShape('triangle', …)` 或水平帶 `pres.shapes.RECTANGLE`／`addShape('trapezoid', …)`＋`addText` | 頂層／核心層上 決策色 |
| **causal** 因果／回饋 | 「導致／因為→所以／正向循環／飛輪」 | `process-diagram` | `addShape` 節點＋**方向性** `addShape('rightArrow', …)`／`pres.shapes.LINE`，回饋用 `addShape('curvedRightArrow', …)` 環狀箭頭 | 關鍵因子上 決策色 |
| **positioning** 兩軸定位 | 「四象限／高低×高低／落在哪一格」 | `two-column-compare`（matrix 變體） | 2 條 `LINE` 軸＋4 象限標籤 `addText`＋資料點 `OVAL` | 我方／目標象限的點上 決策色 |
| **tabular** 多屬性結構化資料 | 多列×多欄、每格要看精確值 | `data-chart`（table） | `addTable(rows, opts)` | 表頭用品牌主色填底；推薦列底色淡品牌色 |
| **quotation** 引言／見證 | 客戶見證、名言、強背書、第三方說的話 | `quote` | 大引號＋引文 `addText`＋小署名 `addText`；深底色 全幅卡 | 引文中關鍵詞可上 1 個 強調色 |
| **concept** 定義／單一概念 | 解釋一個名詞／一個母題／一個隱喻 | `image-led` 或 `big-statement` | `addText` 定義＋結構母題（concentric/層疊）`addShape`，或 `addImage` 示意 | 用圖解非裝飾圖；核心圈上品牌色 |
| **divider** 段落轉場 | 頁面類型=`section`，宣告下一個 beat | `section`（用 `big-statement`/`title` 算繪） | 深底色 全幅 `addShape`＋顯示字體 `addText`＋強調色 標籤＋編號字體 編號 | 全幅 深底色 底；編號 Mono；標籤 1 個 強調色 |
| **title** 開場封面 | 頁面類型=`title`，簡報名＋副標＋講者 | `title` | wordmark/logo `addImage`＋`addText` 大標／副標 | 深底淺字；logo 依 `./brand-source.md` 載入的品牌（未設定則用中性預設） |
| **CTA** 結尾行動呼籲 | 頁面類型=`closing`，「下一步／聯絡／立即」 | `closing-CTA` | `addText` 單一行動大字＋聯絡資訊／QR `addImage` | 行動鈕／關鍵字上 決策色（這頁那 1 次） |

> 對應到上游 ▸ Pages 的頁面類型 enum（`title / section / content / data / quote / closing`）：`title`/`section`/`quote`/`closing` 多半直接落到同名家族；`content` 會再細分成 assertion / parallel list / comparison / process / funnel / hierarchy / causal / positioning / concept；`data` 會再細分成 ranking / time-series / composition / correlation / distribution / tabular。**頁面類型只是粗分類，真正定版式的是內容關係。**

---

## archetype enum 與算繪原語對照

版式 archetype enum（嚴格對齊 SKILL.md，本框架不得新增枚舉）：

```
title / big-statement / bulleted-list / two-column-compare /
data-chart / process-diagram / image-led / quote / closing-CTA
```

注意上表有四個「邏輯版式」其實是**算繪到既有 archetype**，不是新枚舉：

- `section`（divider）→ 用 `big-statement`（或 `title` 章節變體）算繪。
- `matrix`（positioning）→ 歸 **two-column-compare 家族**，用軸線＋象限算繪。
- `pyramid`（hierarchy）→ 歸 **process-diagram 家族**。
- `concept` → 視內容落到 `image-led` 或 `big-statement`。

每個視覺元素必須 1:1 落到下列某個 pptxgenjs 原語（16:9 寬版畫布 ≈ **13.33" × 7.5"**，預留 0.5" 邊界；座標單位英吋）：

| 視覺元素 | pptxgenjs 原語 | 備註 |
|---|---|---|
| 文字塊 / 大字 / 引言 | `addText(text, {x,y,w,h,fontSize,color,bold,align})` | 標題、大字主張、說明、署名 |
| 條列 | `addText([{text, options:{bullet:true, breakLine:true}}, …])` | **用 `bullet:true`，不要打 unicode「•」**（會變雙重項目符號） |
| 表格 | `addTable(rows, opts)` | 對照表、多屬性資料；`colW` 控欄寬 |
| 圖表 | `addChart(pres.charts.<TYPE>, data, opts)` | `BAR / LINE / PIE / DOUGHNUT / SCATTER`；bar 用 `barDir:'col'`(直)或 `'bar'`(橫) |
| 形狀（四個常用） | `addShape(pres.shapes.<SHAPE>, {x,y,w,h,fill,line})` | 僅 **`RECTANGLE / ROUNDED_RECTANGLE / OVAL / LINE`** 有 `pres.shapes.<UPPERCASE>` 便捷別名 |
| 形狀（進階：漏斗／金字塔／箭頭） | `addShape('<name>', {x,y,w,h,fill,line})`（**字串字面值**）或 `addShape(pres.ShapeType.<name>, {…})` | `'trapezoid'`（漏斗層）、`'triangle'`（金字塔）、`'rightArrow'`/`'chevron'`（流程箭頭）、`'curvedRightArrow'`/`'circularArrow'`（回饋環）——**這些沒有 `pres.shapes.*` 別名** |
| 圖片 / icon | `addImage({path|data, x,y,w,h})` | image-led 主圖、logo、QR；icon 由 react-icons 轉 PNG（pptx 技能處理） |

> **⚠ 形狀命名陷阱（會直接讓算繪 crash）。** pptxgenjs 的 `pres.shapes` 只暴露四個 UPPERCASE 便捷別名（`pres.shapes.RECTANGLE / OVAL / ROUNDED_RECTANGLE / LINE`）。`trapezoid`、`triangle`、`rightArrow`、`chevron`、`curvedRightArrow`、`circularArrow` 這些**沒有** `pres.shapes.*` 別名——寫成 `pres.shapes.trapezoid` 會得到 `undefined`，`addShape(undefined, …)` 直接拋 `Missing/Invalid shape parameter`。正確只有兩種寫法：傳**字串字面值** `addShape('trapezoid', {…})`，或用原始枚舉 `addShape(pres.ShapeType.trapezoid, {…})`。本框架下文凡提到 `trapezoid/triangle/rightArrow/...` 一律指「字串字面值」這個原語入口，請下游 pptx 技能照此算繪，**不要**套 `pres.shapes.` 前綴。

> 算繪細節（精確 x/y/w/h、色碼換算、QA）一律由下游 **pptx 技能** 處理。本棒只給「相對區塊 + 原語型別 + 哪裡上品牌色」，不寫死像素級座標。

---

## 各內容關係的細節判定

每一小節格式固定：**什麼時候用 / 怎麼從 ▸ Pages 偵測 / building-block 配方 / worked example / 常見錯誤**。

---

### 1. assertion 單一主張／高強調 → big-statement

**什麼時候用。** 這頁只有**一句話**要聽眾記住：一個衝擊性結論、一個關鍵數字、一句定位口號。它的力量來自留白與字級，不是來自把它解釋成三行。Zelazny 的精神：訊息夠強時，最好的圖表就是「沒有圖表」。

**怎麼偵測。** ▸ Pages 內容要點只有 1 條（或 1 句＋1 行佐證）、資訊密度標記為低、頁面類型常是 `section` 或 `content`、標題本身已經是完整一句結論。

**building-block 配方。**
- 主角：1 個 `addText`，顯示字體 48–64pt，置中或左偏上，佔畫面主視覺。
- 可選襯底：`addShape` 做 dot-grid（一組小 `OVAL` 排列）或單一品牌色 `OVAL`/`RECTANGLE` 當背景重音，放在文字後方。
- 版面骨架：大字置中／左上，其餘留白；深底配淺字常見。

**worked example.**
標題「我們把報價時間從 3 天壓到 4 小時」→ `addText`「4 小時」64pt 置中（「4 小時」上 決策色，這頁唯一一次），下方一行 `addText`「過去要 3 天」24pt 灰；背景淡 dot-grid `OVAL` 群。

**常見錯誤。** 把一句主張配上一張無關 stock 圖當氣氛（違反「不裝飾要圖解」）；或硬把它擴寫成 4 條 bullet 稀釋掉衝擊力。

---

### 2. parallel list 平行要點 → bulleted-list

**什麼時候用。** 3–6 個**彼此獨立、沒有先後順序、不需要互相比較**的要點。它們是「並列」關係——若有順序就是 process，若要互比就是 comparison。

**怎麼偵測。** ▸ Pages 有 3–6 條內容要點、彼此平行、沒有「第一步／其次」這種序列詞、沒有量化對比。>6 條 → 回規則 1 拆頁。

**building-block 配方。**
- 形式A（純條列）：左上標題帶 `addText` + 下方 `addText` 條列（`bullet:true, breakLine:true`，左對齊，**勿置中**）。
- 形式B（卡片化，3–4 點時更好看）：一排 `ROUNDED_RECTANGLE`（`addShape`）當卡底，每張卡內 `addText` 標題 + 說明；卡片等寬均分。
- 右側可留一欄 `addImage`（icon 或示意圖），圖為輔。

**worked example.**
標題「導入後三件事同時變好」→ 三張 `ROUNDED_RECTANGLE` 卡片橫排（速度／成本／滿意度），每張卡標題動詞上 1 個 強調色，內文 14–16pt。

**常見錯誤。** 把有順序的步驟誤當平行條列（流動感不見了——那是 process）；條列置中（閱讀動線亂）；超過 6 點還硬塞。

---

### 3. comparison 取捨對比 → two-column-compare

**什麼時候用。** 要把**兩個（最多三個）對象並排看差異**：方案A vs B、before/after、現況 vs 目標、我們 vs 競品。Minto 的取捨論點最常落在這裡——並排才看得出 trade-off，上下條列看不出。

**怎麼偵測。** ▸ Pages 出現成對的對象與成對的屬性（「A：快但貴 / B：慢但便宜」），或 before/after、優/劣對照。

**building-block 配方。**
- 形式A（面板）：標題帶 + 下方左右兩組 `addShape`（`RECTANGLE`/`ROUNDED_RECTANGLE`）面板，各自 `addText` 標題 + 條列；欄寬對稱。
- 形式B（對照表）：`addTable`，第一欄是屬性、後面欄是各對象，逐行對齊。
- 推薦／勝出的那一欄：表頭或面板頂用品牌主色填底，或關鍵差異格上 決策色（每頁 1 次）。

**worked example.**
標題「自建 vs 外包：自建總成本三年後反超」→ `addTable` 三列（前期成本／維護／彈性）×兩欄（自建/外包），「三年總成本」那列的勝方格上 決策色。

**常見錯誤。** 三個以上對象還用兩欄面板（擠不下，改 `addTable` 或拆頁）；對照屬性左右不對齊（看不出比較）；兩欄都上品牌色（沒重點）。

---

### 4. ranking 排名／大小 → data-chart (bar)

**什麼時候用。** 訊息是「**誰大誰小／誰第一／差距多少**」——類別之間比量值。對應 Zelazny 五型中的 **item comparison（項目比較）**。

**怎麼偵測。** ▸ Pages 頁面類型多為 `data`，內容要點是一組類別＋各自數值，標題講「最／前N／領先／落後」。

**building-block 配方。**
- `addChart(pres.charts.BAR, …)`，類別多／標籤長時用橫條（`barDir:'bar'`），少時用直條（`barDir:'col'`）。
- **務必排序**（由大到小或由小到大），排名圖不排序就失去意義。
- 要凸顯的那一條 bar 上 決策色，其餘灰階，讓主角跳出來。
- 可加一個大數字 callout `addText`（60–72pt）寫出 key takeaway。

**worked example.**
標題「東區營收是其餘四區總和」→ 橫向 `BAR`，五區由大到小排序，東區那條 決策色、其餘灰；右上 callout「52%」。

**常見錯誤。** bar 不排序；把排名硬塞成圓餅圖（圓餅是看組成不是看排名）；類別 >8 個全擠一張（考慮 Top N + 其他，或拆頁）。

---

### 5. time-series 趨勢 → data-chart (line)

**什麼時候用。** 訊息是「**隨時間怎麼變**」——成長、下滑、波動、轉折。對應 Zelazny 五型的 **time series（時間序列）**。

**怎麼偵測。** ▸ Pages 有時間軸（月／季／年／期數）＋對應數值，標題講走勢。

**building-block 配方。**
- 期數多（≥5）→ `addChart(pres.charts.LINE, …)`，X 軸時間、Y 軸數值。
- 期數很少（≤4）→ 改用 `addChart(pres.charts.BAR, {barDir:'col'})`，少數幾根直條比短折線更清楚。
- 結論線上品牌主色，多條線時只讓主角線突出、其餘淡灰。
- 轉折點可用 `addText`/小 `OVAL` 標註事件。

**worked example.**
標題「導入 AI 後，三季客訴連續下降」→ `LINE`，三季客訴量，主線品牌色，最後一點旁 `addText` 標「-41%」上 決策色。

**常見錯誤。** 兩三個期數硬畫折線（看起來像沒資料，改直條）；多條線全上鮮色（看不出主角）；時間軸間距不等卻當等距畫。

---

### 6. composition 組成／佔比 → data-chart (pie/stacked)

**什麼時候用。** 訊息是「**部分對全體**」——某塊佔整體多少，加總=100%。對應 Zelazny 五型的 **component comparison（成分比較）**。

**怎麼偵測。** ▸ Pages 出現「佔比／組成／結構／X 成」，各項加起來是一個整體。

**building-block 配方。**
- 片數 **≤5** → `addChart(pres.charts.PIE)` 或 `DOUGHNUT`；主角片上 決策色，其餘同色階。
- 片數多、或要同時比「多個整體的組成」→ 改 stacked `addChart(pres.charts.BAR)`（堆疊長條），比多個圓餅好讀。
- **節制使用圓餅**：只有在「一塊明顯主導」時圓餅才有力；要精確比每塊大小時，bar 永遠比 pie 準。

**worked example.**
標題「八成營收來自單一產品線」→ `DOUGHNUT` 兩片（主產品線 80% 決策色 / 其餘 20% 灰），中央 `addText`「80%」。

**常見錯誤。** 圓餅 >5 片（人眼比不出角度，見反模式）；用圓餅做排名；多個圓餅並排比組成（改 stacked bar）。

---

### 7. correlation 相關 → data-chart (scatter)

**什麼時候用。** 訊息是「**兩個變數有沒有關係**」——X 越高 Y 是否跟著高／低。對應 Zelazny 五型的 **correlation（相關）**。

**怎麼偵測。** ▸ Pages 同時出現兩個量化維度、每個樣本是一個點，標題講「越…越…／正相關／沒關係」。

**building-block 配方。**
- `addChart(pres.charts.SCATTER, …)`，X/Y 各一維。
- 趨勢方向用 `addText` 一句點明（「右上趨勢＝投入越多回收越高」）；趨勢帶或關鍵離群點可用 決策色 點出。
- 點多時不必標每個點的標籤，只標主角。

**worked example.**
標題「投放預算與成交數呈強正相關」→ `SCATTER`（X=預算、Y=成交），點群右上斜向，趨勢方向 `addText` 加一句，離群高效點上 決策色。

**常見錯誤。** 只有兩三個點還硬畫散點（樣本太少，改表格或直接講）；把時間序列誤當散點（時間是有序的，用 line）。

---

### 8. distribution 分佈 → data-chart (histogram bar)

**什麼時候用。** 訊息是「**資料集中還是分散、落在哪一段**」——次數分佈、區間分佈。對應 Zelazny 五型的 **frequency distribution（次數分佈）**。

**怎麼偵測。** ▸ Pages 出現「分佈／落在／集中在／多數人在 X 區間」，X 軸是區間（bins）不是類別。

**building-block 配方。**
- `addChart(pres.charts.BAR, {barDir:'col'})` 當直方圖：X 軸是連續區間、Y 軸是次數。
- 主峰區間（最高那根）上 決策色。
- 與 ranking 的差別：直方圖 X 軸**有順序的區間**、**不重新排序**；ranking 是離散類別、要排序。

**worked example.**
標題「七成客戶在 1 小時內完成下單」→ 直方 `BAR`（X=下單耗時區間、Y=人數），<1hr 那根 決策色。

**常見錯誤。** 把分佈的區間任意重排（破壞分佈形狀）；用圓餅表達分佈（看不出形狀）；bins 太細碎像噪音（合併區間）。

---

### 9. process 步驟／管線 → process-diagram

**什麼時候用。** 訊息是「**有先後順序的流程／步驟／階段／pipeline**」。順序本身是重點——條列表達不出「流動」。

**怎麼偵測。** ▸ Pages 出現序列詞（第一步／接著／最後／→），或明確的階段名稱序列。

**building-block 配方。**
- 一排 `addShape(pres.shapes.ROUNDED_RECTANGLE, …)` 節點，內各 `addText`，依步驟數均分版寬。
- 節點之間用 `pres.shapes.LINE` 或 `addShape('rightArrow', …)`／`addShape('chevron', …)`（字串字面值，無 `pres.shapes.` 前綴）箭頭相連，方向一致。
- 每節點標號 1→N（編號用 編號字體 `addText`）。
- 步驟 >5 → 考慮分兩排或回上一棒拆頁。

**worked example.**
標題「四步把詢問變成成交」→ 四張 `ROUNDED_RECTANGLE` 橫排（詢問→評估→提案→簽約），`addShape('rightArrow', …)` 相連，編號 1–4 用 Mono，終點「簽約」卡上 決策色。

**常見錯誤。** 把無序的平行要點畫成帶箭頭流程（暗示了不存在的順序）；箭頭方向不一致；步驟太多擠成一團（拆頁）。

---

### 10. funnel 漏斗 → process-diagram (trapezoid)

**什麼時候用。** 訊息是「**一層層篩下來、量逐段收窄**」——轉換漏斗、流失、招募管線。它是 process 的特例：階段有序＋量遞減。

**怎麼偵測。** ▸ Pages 出現「轉換／流失／曝光→點擊→註冊→付費」這種遞減序列，常帶各層數量或轉換率。

**building-block 配方。**
- 由寬到窄**堆疊** `addShape('trapezoid', {…})`（每層比上層窄；`trapezoid` 是字串字面值，不是 `pres.shapes.trapezoid`），形成漏斗形。
- 每層 `addText` 標籤＋數值／轉換率（可放層內或右側對齊）。
- 最終轉換層（最窄那層）上 決策色——那是這頁要看聽眾記住的數字。

**worked example.**
標題「100 個曝光最後 3 個成交」→ 四層 `trapezoid`（曝光100→點擊25→註冊9→成交3），逐層收窄，成交層 決策色，右側 `addText` 標各層轉換率。

**常見錯誤。** 用等寬矩形畫漏斗（看不出收窄＝失去漏斗語意）；層數過多（>5 合併）；把非遞減的流程硬畫成漏斗。

---

### 11. hierarchy 概念層級 → process-diagram (pyramid)

**什麼時候用。** 訊息是「**上下從屬／基礎到頂層**」——金字塔層級、Maslow 式結構、戰略層次。

**怎麼偵測。** ▸ Pages 出現「基礎／核心／頂層／層級／越往上越…」，項目之間是包含或支撐關係而非並列。

**building-block 配方。**
- 堆疊水平帶：一個大 `addShape('triangle', {…})` 切成幾層，或用幾條由寬到窄的 `pres.shapes.RECTANGLE`／`addShape('trapezoid', {…})` 帶疊成金字塔（`triangle`/`trapezoid` 為字串字面值）。
- 每層 `addText` 層名＋說明。
- 核心層（頂或底，視語意）上 決策色。

**worked example.**
標題「能力金字塔：先有資料治理才談 AI」→ `triangle` 三層帶（底：資料治理 / 中：流程自動化 / 頂：AI 決策），底層上品牌主色強調「先決條件」，頂層上 決策色。

**常見錯誤。** 把並列項目誤畫成金字塔（暗示不存在的層級）；金字塔層數過多看不清；上下層語意方向搞反（基礎應在底）。

---

### 12. causal 因果／回饋 → process-diagram (arrows)

**什麼時候用。** 訊息是「**因為→所以**」的因果鏈，或「**正向循環／飛輪**」的回饋環。重點是箭頭的**方向性**。

**怎麼偵測。** ▸ Pages 出現「導致／驅動／因為→所以／越…越…循環／飛輪」。

**building-block 配方。**
- 因果鏈（線性）：節點用 `pres.shapes.ROUNDED_RECTANGLE`／`pres.shapes.OVAL`＋方向性 `addShape('rightArrow', …)`／`pres.shapes.LINE` 串接，箭頭代表「導致」。
- 回饋環（循環）：節點繞成環，用彎箭頭 `addShape('curvedRightArrow', …)`／`addShape('circularArrow', …)`（字串字面值），或多段 `pres.shapes.LINE` 接成環，形成閉環。
- 關鍵因子（飛輪的起點或瓶頸）上 決策色。

**worked example.**
標題「內容飛輪：發文→流量→訂閱→更多素材→發更多」→ 四節點 `OVAL` 繞環，`addShape('curvedRightArrow', …)` 串成閉環，起點「發文」上 決策色。

**常見錯誤。** 用無向 `LINE` 表達因果（看不出方向，因果一定要箭頭）；把單純流程（無回饋）畫成環；環太多節點看不出主因。

---

### 13. positioning 兩軸定位 → matrix（歸 two-column-compare 家族）

**什麼時候用。** 訊息是「**在兩個維度上各落在哪**」——2×2 矩陣、高低×高低、四象限定位。

**怎麼偵測。** ▸ Pages 出現兩個對立維度（高/低 × 高/低）、要把幾個對象分到四個格子。

**building-block 配方。**（算繪歸 two-column-compare 家族）
- 2 條 `LINE`（一橫一縱）構成十字座標軸，軸端 `addText` 標維度名（如「成本 低↔高」「價值 低↔高」）。
- 4 個象限各 `addText` 一個象限標籤（如「明星／問號／金牛／瘦狗」）。
- 資料點用 `OVAL`（`addShape`）擺到對應象限，旁 `addText` 標名稱。
- 我方／目標象限的點上 決策色。

**worked example.**
標題「我們落在高價值低成本的甜蜜區」→ 十字 `LINE` 軸，四象限標籤，各競品 `OVAL` 散佈，我方點在右上「甜蜜區」上 決策色。

**常見錯誤。** 軸沒標清楚兩端語意（讀者不知道方向）；點太多看不出分群；用表格取代矩陣（失去「空間定位」這個訊息的力量）。

---

### 14. tabular 多屬性結構化資料 → data-chart (table)

**什麼時候用。** 訊息需要「**多列×多欄、每格都要看到精確值**」——規格表、功能矩陣、價目表、評分表。當人要逐格查值而非看趨勢時，表格比圖表誠實。

**怎麼偵測。** ▸ Pages 是結構化的列×欄資料、每格有具體值、沒有單一「走勢／佔比」訊息可抽成一張圖。

**building-block 配方。**
- `addTable(rows, opts)`，第一列表頭、第一欄是項目。
- 表頭用品牌主色填底、白字；推薦列或關鍵欄底色淡品牌色。
- 用 `colW` 控欄寬、`fontSize` 12–16 維持可讀；列數 >8 考慮拆頁。

**worked example.**
標題「三個方案的功能對照一覽」→ `addTable`，列=功能、欄=方案A/B/C，表頭品牌色填底，推薦方案那欄底色淡品牌色，有/無用 `addText` 內的勾叉。

**常見錯誤。** 把其實有「單一趨勢／佔比」訊息的資料硬攤成表（該抽成圖）；表格塞滿整頁無留白；字級太小讀不到。

> 與 comparison 的分界：只有 2–3 個對象、訊息是「選哪個（trade-off）」→ two-column-compare；多屬性、訊息是「查值」、對象可多→ tabular。

---

### 15. quotation 引言／見證 → quote

**什麼時候用。** 這頁要借**第三方的話**——客戶見證、名人名言、權威背書。力量來自「這不是我說的，是他說的」。

**怎麼偵測。** ▸ Pages 頁面類型=`quote`，內容是一段引文＋出處。

**building-block 配方。**
- 大引號（`addText` 的「" "」放大，或一個大 `addText` 引號符號）。
- 引文 `addText`（大字或斜體，置中／左對齊）。
- 署名 `addText` 小字靠下（姓名／職稱／公司）。
- 全幅 深底色 `addShape` 卡當底，大量留白。

**worked example.**
標題（可省或寫成結論「客戶替我們說了重點」）→ 全幅 深底色 卡，引文「『導入後我們省下整個週末的對帳時間。』」42pt，引文中「整個週末」上 1 個 強調色，下方署名「— 王經理，XX 公司財務長」。

**常見錯誤。** 引文太長（>2 句考慮節錄）；署名不清（沒有出處的引言沒有公信力）；引文配無關 stock 大頭照當裝飾。

---

### 16. concept 定義／單一概念 → image-led / big-statement

**什麼時候用。** 這頁要解釋**一個名詞、一個母題、一個隱喻**——把抽象概念用結構講清楚。

**怎麼偵測。** ▸ Pages 內容是「X 是什麼／X 的核心是…」，圍繞單一概念展開，沒有量化、沒有並列清單。

**building-block 配方。**
- 偏文字、概念可一句話定義 → `big-statement`：大 `addText` 定義＋小字補充。
- 概念有**結構母題**（同心圓 concentric、層疊 layered、中心—輻射 hub-and-spoke）→ `image-led`：用 `addShape`（同心 `OVAL`、層疊 `RECTANGLE`、中心 `OVAL`＋輻射 `LINE`）把結構畫出來，配 `addText` 標各部位。核心圈上品牌色。
- 真的需要實物示意才用 `addImage`，但仍優先**圖解非裝飾**。

**worked example.**
標題「Zynkr Method 是三個同心圈」→ 三個同心 `OVAL`（核心：決策／中圈：流程／外圈：工具），各圈 `addText` 標名，核心圈上 決策色。

**常見錯誤。** 用一張隱喻 stock 圖（冰山／燈泡）代替真正的結構圖解（違反「不裝飾要圖解」）；概念硬塞太多子點（其實是 parallel list 或該拆頁）。

---

### 17. divider 段落轉場 → section（用 big-statement/title 算繪）

**什麼時候用。** 純粹的**段落分隔**——宣告「接下來進入下一個 beat」，給聽眾一個喘息與重新定位的點。

**怎麼偵測。** ▸ Pages 頁面類型=`section`，內容只有章節名／一句轉場語＋可能的章節編號。

**building-block 配方。**（算繪到 `big-statement` 或 `title` 章節變體）
- 全幅 深底色 底色 `addShape`（`RECTANGLE` 鋪滿）。
- 章節標題 `addText` 顯示字體 大字。
- 章節標籤／類別 `addText`，關鍵字上 1 個 強調色。
- 章節編號 `addText` 用 編號字體（如「02 / 04」）。

**worked example.**
進入第二章「然後，談錢」→ 全幅 深底色 底，大標「然後，談錢」顯示字體，左上「02」編號字體，標籤「商業模式」中關鍵詞上 強調色。

**常見錯誤。** 轉場頁塞進實質內容（轉場就該空，內容是下一頁的事）；每張轉場頁風格不一致（轉場應全簡報統一模板）。

---

### 18. title / CTA 開場與結尾行動 → title / closing-CTA

**什麼時候用。** 簡報的**封面**（開場第一印象）與**結尾行動呼籲**（聽完然後呢）。

**怎麼偵測。** ▸ Pages 頁面類型=`title`（簡報名＋副標＋講者／場合）或 `closing`（聯絡／下一步／立即行動）。

**building-block 配方。**
- `title`：wordmark/logo `addImage`（依 `./brand-source.md` 載入的品牌（未設定則用中性預設））＋大標 `addText`（顯示字體）＋副標一行＋講者／場合靠下；深底淺字、大量留白。
- `closing-CTA`：單一明確行動 `addText` 大字（**只給一個行動**）＋聯絡資訊／QR `addImage`；行動鈕／關鍵字上 決策色（這頁那唯一 1 次）；深底收尾呼應封面，形成「深—淺—深」三明治。

**worked example.**
封面：logo 置中上方，主標「把報價從 3 天變 4 小時」，副標「Zynkr × XX 公司 導入分享」，講者靠下。
結尾：大字「下一步：預約 30 分鐘導入評估」，下方 QR `addImage`，「預約」上 決策色。

**常見錯誤。** 封面塞內容（封面是第一印象不是大綱）；CTA 給三四個行動（聽眾一個都不會做，只給一個）；CTA 頁 決策色 用了好幾處（規則 3，每頁最多 1 次）。

---

## 反模式（看到就退回或改版）

這些一律不可出現在 ▸ Visuals；判定時看到就改版或退回上一棒。

| 反模式 | 為什麼錯 | 改怎麼做 |
|---|---|---|
| **圓餅圖 >5 片** | 人眼比不出細微角度差，超過 5 片就成色塊拼貼 | 改排序橫向 `BAR`；真的要看組成就 Top4 + 「其他」 |
| **3D 圖表 / 立體圓餅** | 透視扭曲面積與長度，數據被視覺說謊 | 一律 2D；數據圖表的職責是準確不是炫 |
| **一頁多訊息** | 違反規則 1，聽眾不知道該記哪句 | 回 `slide-page-splitter` 拆頁，一頁一結論 |
| **用裝飾圖當填充** | 違反「不裝飾要圖解」，stock 圖不帶資訊只佔位 | 換成結構性圖解；真留白也比假裝飾好 |
| **決策色 濫用** | 決策色 是決策色，整頁橘=沒有決策重點 | 每頁最多 1 次，只標那一個關鍵數字／行動 |
| **bar 不排序做排名** | 排名圖不排序＝看不出名次 | ranking 一律排序；distribution 才保留區間順序 |
| **無資料硬塞 chart** | 沒有可量化數字卻畫圖＝空殼圖 | 改 `big-statement` 或 `bulleted-list`，更誠實 |
| **條列 >6 點** | 超過短期記憶負荷，且通常是分頁沒做好 | 回上一棒拆頁，或卡片化分組 |
| **unicode「•」當條列** | pptxgenjs 會疊出雙重項目符號 | 用 `addText` 的 `bullet:true` |
| **`pres.shapes.trapezoid`／`.triangle`／`.rightArrow` 等** | 這些沒有 `pres.shapes.*` 別名，會解析成 `undefined`，`addShape` 直接 crash | 改傳字串字面值 `addShape('trapezoid', …)` 或 `pres.ShapeType.trapezoid` |

---

## 來源與定位

- **Gene Zelazny《Say It With Charts》** — 本框架的根：**先定訊息，再選形式**；圖表選擇五型 **component（成分）/ item（項目）/ time-series（時間序列）/ frequency（次數分佈）/ correlation（相關）**，分別對應本框架的 composition / ranking / time-series / distribution / correlation。Zelazny 的流程「訊息→比較型態→圖表型態」就是 data-chart 子判準的來源。
- **Barbara Minto《The Minto Pyramid Principle》** — **標題自帶結論（action title）**：每頁標題是結論不是主題，視覺只來支撐那句結論。取捨型論點（trade-off）對應到 comparison / positioning。
- **visualframeworks.com** — 100+ 視覺框架的**靈感型目錄**，分 matrix / hierarchy / flow / comparison / system / temporal / structural 等家族，但**刻意不給「內容→該用哪個」的配對規則**。所以本框架的價值正是補上那層判定邏輯；當需要更豐富的圖解詞彙（hub-and-spoke、Venn、layer cake、causal loop 等）時，可引它擴充 building-block 的形狀組合——但配對仍回到本框架的「內容關係」判準，而不是照目錄挑好看的。

> 一句話定位：visualframeworks.com 給你「有哪些圖解可選」，Zelazny 給你「訊息決定形式」，Minto 給你「標題即結論」；本框架把三者接成一條可操作的判定線，讓 slide-visual-selector 看到一頁就選對 archetype 與 pptxgenjs 原語。
