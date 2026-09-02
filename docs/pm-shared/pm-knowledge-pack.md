<!-- pack_version: 1 · direction pending D4 -->
# PM 共用知識包｜五個 PM 技能的唯一交集

這份知識包收錄的，是 `project-planning`（3.07）· `project-note-specialist`（3.08）· `project-status-update`（3.09）· `project-init`（3.20）· `project-minutes-sync`（3.21）五個技能**共同**需要、而且不管哪個團隊、哪種案型都成立的 PM 規則——交集以外的一律不收。它**不是**這些位元組唯一的家（D4 仍停著：人類到底編輯 Google Doc 還是這份 repo seed，尚未裁決，本包一律寫 direction pending D4，絕不主張任一方是另一方的產物），也**不是**各團隊變體的收納櫃（凡隨團隊／LOB／案型而變的，依 D3 都是 adapter DATA，住在 `pm-sources.md` 與 `~/.config/zynkr/pm.json`）。

---

## 1 · 五條鐵律（Playbook §5 原文）

| # | 鐵律原文 | 對一個技能的意思 |
|---|---|---|
| 1 | 「單一事實來源：進度只在 [專案管控表] tab 1；任何 dashboard 都是「產出」不是「維護」」 | 進度用讀的，不用寫的——週報／看板／簡報一律從 tab 1 推導，技能不得把推導結果回寫成新的事實來源 |
| 2 | 「模板只從 `[3.3]/[1]` 複製，複製後第一件事：改核心目標、清空範例列」 <sup>[†](#note-33)</sup> | 開案一律用複製，不得從零產生模板；複製後第一個動作固定是清空範例列，否則範例資料會被當成真資料讀進報表 |
| 3 | 「日期含年份；WBS 連續編號；狀態只用 Done / WIP / Not started / Drop 四值」 | 寫入 tab 1 的 `Status` 只准這四個字串；日期一律 `YYYY/M/D`；編號不得跳號 |
| 4 | 「Gate 沒過不進下一階段，過關要在 Gate 列留核准人＋日期」 | 技能看到下一階段任務已開始、但 Gate 列沒有核准人＋日期，要當成違規回報，不得自行補簽 |
| 5 | 「結案才算完：[復盤] Doc 完成＋封存歸位，專案才能標結束」 | 100% 不等於結案；沒有復盤 Doc、沒有封存歸位，技能不得把專案敘述成「已結束」 |

<a id="note-33"></a>
† **`[3.3]` 是資料夾正名，五份 Doc 已於 2026-09-02 更正**：Playbook／Business Case／Kickoff／會議記錄／復盤 過去把資料夾寫成 `[3.4]`，與 Drive 上真正的名稱 `[3.3] 專案管理 PMO｜Playbook & Templates` 不符。2026-09-02 已在這五份 Doc 內把 17 處 `[3.4]` 全部改成 `[3.3]`（Playbook 12 · Business Case 1 · Kickoff 1 · 會議記錄 1 · 復盤 2）。因此上表鐵律 2 的原文**現在就是** `[3.3]`，逐字引用即可。這條註腳是一筆已完成的更正紀錄，不是還在發生的漂移——不要再為了「保留原文」把引用改回 `[3.4]`，也不要在產出裡附註任何 `[3.4]` 的但書。

---

## 2 · 五個軸（本次變更的核心裁決 · D5）

PMO 所謂的「狀態漂移」其實不是一套詞彙沒對齊，而是**五個不同的軸**被當成同一套詞彙在讀。任何技能在讀一個欄位之前，要先問：這欄是哪個軸？

| 軸 | 正規值 | 出現在哪 |
|---|---|---|
| **lifecycle**（任務／專案） | `not_started` `in_progress` `paused` `done` `dropped` | 管控表 tab 1 `Status`；Main Tracker `<cycle> 專案項目` |
| **health / RAG**（推導，永不手填） | `on_track` `at_risk` `delayed` | 會議記錄 進度更新；週報 RAG；dashboard_schema health |
| **risk lifecycle** | `open` `monitoring` `closed` | 管控表 Risk Register `狀態` |
| **decision lifecycle** | `proposed` `approved` `rejected` | 管控表 Change & Decision Log `狀態` |
| **closure verdict** | `passed` `passed_with_conditions` `not_delivered` | 復盤 §1 |

**跨軸的已知陷阱：會議記錄「進度更新」欄的 `Done`**。那一欄把 `On track／At risk／Delayed／Done` 併成同一份清單，但 `Done` 不是 health 讀數，而是 lifecycle 的 `done`。讀到它要解析成 lifecycle `done`，該列的 health 仍照 §2.2 裁決三從日期 × lifecycle 推導，不得因為看到 `Done` 就直接給一個 `on_track`。（機讀版：`pm-status-crosswalk.json` → `axes.health.cross_axis`）

### 2.1 · 表面值 → lifecycle 的對照（只有 lifecycle 軸需要對照）

| 來源 | 表面值 → 正規值 |
|---|---|
| 管控表 v2 tab 1 `Status` | `Not started`→`not_started` · `WIP`→`in_progress` · `Done`→`done` · `Drop`→`dropped` |
| Main Tracker | `未開始`→`not_started` · `進行中`→`in_progress` · `暫停`→`paused` · `完成`→`done` · `放棄`→`dropped` |

其餘四軸沒有 lifecycle 那種一個軸兩套詞彙的問題，但**表面值仍然不等於正規值**，一律要查 `pm-status-crosswalk.json` 的 `surfaces`：英文表面值差在大小寫與分隔（risk `Open／Monitoring／Closed`→`open／monitoring／closed` · health `On track／At risk／Delayed`→`on_track／at_risk／delayed`），中文表面值差在整個字串（decision `提案／核准／駁回`→`proposed／approved／rejected` · closure `通過／有條件通過／未交付`→`passed／passed_with_conditions／not_delivered`），health 另有兩組非文字表面（週報 RAG `🟢🟡🔴`、dashboard `ON_TRACK／AT_RISK／DELAYED`）。**跨軸不得互轉**。

### 2.2 · 三條必須寫成規則的裁決

**裁決一：`paused` 只是專案層級的狀態，不是任務層級的狀態**
鐵律 3 把 tab 1 的 `Status` 釘死在四值，裡面本來就沒有 paused；硬塞第五個值會讓所有既有公式與週報同時失效。一個被暫停的**任務**要寫成 `WIP` ＋ `Note` 說明暫停原因與預計恢復條件，或寫成 `Drop` ＋ 一筆 Change & Decision Log。因此 Main Tracker 的 `暫停` 永遠對到一個**專案**，永遠不對到管控表的某一列。

**裁決二：只有 `dropped` 離開分母；不合法的值留在分母**

```
% = done / (total − dropped)

total   = 範圍內的所有任務列，**包含 Status 值不合法的列**
dropped = Status ＝ `Drop` 的列
done    = Status ＝ `Done` 的列
```

舊行為裡疊著兩個不同的 bug，要分開修：

1. **真正被 `Drop` 的列還留在分母裡**——分母被灌水、完成度被低估，專案看起來永遠追不上。`Drop` 是**唯一**能離開分母的狀態：它背後是一個已經做成、而且在 Change & Decision Log 留過痕的決定。被 drop 的列**另表列出**，附上那筆對應紀錄，絕不從報表裡無聲消失——分母要乾淨，但事實要留痕。

2. **`取消` 這種不合法的值被無聲併進 `Not started`**——合法值只有 `Done` / `WIP` / `Not started` / `Drop` 四個（鐵律 3），`取消` 一個都不是。它是一筆**資料錯誤**，不是第五個桶，處置固定為三件事同時發生：**留在分母裡** · **不算進 `done`** · **在報表的 `data_errors` 具名列出**（寫出該列的 `no.` 與原始字串）。它不得被折進任何一個合法桶——舊行為的算術碰巧落在同一格，錯的是那份沉默：讀報表的人不知道有一列沒人看得懂。`data_errors` 非空時，百分比是暫定值，要在摘要裡註明。

   **為什麼不合法的值不能離開分母**：一列你無法歸類的工作，就是一件你不能宣稱已經完成的工作；把它從分母移走會美化數字，而那正是本次要修掉的同一類 bug（把 dropped 當成 not_started 算）。只有 `dropped` 離開分母，其餘一律留下。

**分母為零的邊界**：某個階段 `counted(s) − dropped(s) = 0`（該階段沒有任務列，或每一列都是 `Drop`）時，該階段**退出百分比計算**（`total_spine_stages` 減 1），並在 `data_errors` 具名列出。不得除以零，也不得無聲當成 0%——0% 會讓一個已經全數取消的階段永遠拖著整份報表。（`counted(s)` 就是該階段的 `total`，同樣含資料錯誤列。）

**裁決三：health 是推導出來的，永遠不是打字打出來的**
health 反映的是「日期 × lifecycle」的當下讀數，一旦允許手填，它就會和管控表的事實分岔，而且分岔之後沒有人知道哪一邊是對的。推導規則固定為：

| 讀數 | 條件 |
|---|---|
| 🔴 `delayed` | `End < today` 且 lifecycle ≠ `done` |
| 🟡 `at_risk` | （`End ≤ today+3` 且 lifecycle = `not_started`）或 有一筆未解除、已超過 7 天的阻礙 |
| 🟢 `on_track` | 其餘 |

會議記錄那欄 `On track / At risk / Delayed` 是一次 health **讀數**，不是 lifecycle 狀態；它永遠不得被回寫進管控表 `Status`。反向也一樣：管控表的 `Status` 不足以單獨決定 RAG，沒有日期就沒有 health。

---

## 3 · 管控表 v2 tab 1 `專案管理總表`｜14 欄

| 欄 | 標頭（原字串） | 說明 |
|---|---|---|
| A | `no.` | WBS 編號，`X.0` 階段／`X.Y` 任務 |
| B | `里程碑 Stage` | 階段名稱 |
| C | `任務描述 Task` | 任務本身 |
| D | `Priority` | 實表目前只出現 `High` 一個值，沒有任何地方列舉過完整尺度。技能不得自行補一套（High/Medium/Low 是猜的），也不得把空白讀成「低優先」——照抄原值，需要排序時說明依據 |
| E | `Owner` | 負責人；Gate 列＝核准人 |
| F | `Facilitator` | 協助者 |
| G | `Agent` | 由哪個技能／代理執行 |
| H | `Status` | lifecycle 軸四值 |
| I | `Start (YYYY/M/D)` | 含年份 |
| J | `End (YYYY/M/D)` | 含年份；Gate 列＝核准日期 |
| K | `前置任務 Depends on` | 指向另一列的 `no.`（v2 新增） |
| L | `Reference 連結` | 連結 |
| M | `Note` | 備註；暫停原因寫這裡 |
| N | `DOD 完成定義／交付物` | 完成定義 |

**legacy v1**：同一份清單但**沒有** `前置任務 Depends on`，共 13 欄 A–M（`K`＝`Reference 連結` · `L`＝`Note` · `M`＝`DOD 完成定義／交付物`）。

**版本偵測是強制的**：技能在對映欄位之前，必須先讀第 1 列標頭並判定版本——`K1` 命中 `前置任務` 即為 v2（讀 `A:N`），`K1` 命中 `Reference` 即為 v1（讀 `A:M`）。不得寫死範圍。`project-status-update` 目前寫死 `A1:M44`，在 v2 表上會把 `前置任務` 當成 `Reference` 讀——這就是本次要修掉的活 bug。標頭兩者都不吻合時，**回報**而不是猜。

其餘分頁：`Stakeholders & RACI` · `Risk Register` · `Budget` · `Prerequisite Checklist` · `Change & Decision Log` · `所有檔案` · `Comms Plan`。

---

## 4 · 編號與日期

- **WBS**：`X.0` 是階段列、`X.Y` 是該階段底下的任務列。
- **連續編號**：同一階段內的 `X.Y` 不得跳號、不得重號；插入任務要接在最後，不得為了「順序好看」重排既有編號（重排會讓所有 `前置任務` 參照失效）。
- **日期含年份**：一律 `YYYY/M/D`（例：`2026/9/2`）。沒有年份的日期視為不可讀，回報而不是補。
- **前置任務**：`前置任務 Depends on` 填的是另一列的 `no.`，不是任務描述、不是連結。指到不存在的 `no.` 視為錯誤並回報。
- 技能**永遠不得自行發明一個 `no.`**：要新增列，就取該階段現有最大 `X.Y` ＋1，並在同一次寫入內自行遞增，避免同批次撞號。

---

## 5 · Gate 與核准

- 鐵律 4：**Gate 沒過不進下一階段**；過關要在 Gate 列留下核准人與日期。
- **Gate 列慣例**：`Owner` 欄＝核准人 · `End` 欄＝核准日期。（Playbook 原本承諾獨立的 Gate status／核准人／日期欄位，實表沒有，改用這兩欄承載——沿用實表慣例，不要自建欄位。）
- **Gate 鏈**：Business Case → Charter → Planning，逐關遞進；上一關沒有核准人＋日期，下一關的任務就不該有 `WIP` 或 `Done`。
- **Drop 必須留痕**：把一列改成 `Drop`，同一次動作要在 Change & Decision Log 留一筆（決策內容、決策人、日期）。沒有這筆紀錄的 Drop 視為未完成的動作。
- **範疇變更要走 Gate**：影響範疇／時程／預算的變更，需經 Gate 核准，不得只改管控表就當數。

---

## 6 · 升級與同步（會議記錄的兩條強制規則）

| 觸發 | 必須發生的事 |
|---|---|
| 一筆「決議」的 影響 欄不是 `無`（影響範疇／時程／預算） | 必須同步到管控表 `Change & Decision Log`；週報的 RECENT DECISIONS 從那裡讀，不從會議記錄讀 |
| 一筆「阻礙」一週內無法自行解除 | 必須在 `Risk Register` 開一筆，並填 `Owner` 與 `狀態`（`open` / `monitoring` / `closed`） |

這兩條是技能的檢查責任：偵測到觸發條件卻找不到對應紀錄時，**回報缺漏**並提出建議動作，不代替人做決策、不自行判定影響範疇。

---

## 7 · 週報四段格式（Weekly Project Update）

固定四段、固定標籤、**新的在上（newest-first）**：

```
1 Summary Update
2 Progress
3 Blockers/Challenges
4 What's Next
```

- 只整理、不虛構：可從來源合理推得的就寫，推不出來的就留空，不得補寫看似合理的內容。
- **空段落用語是刻意的分岔，不要統一**：

| 用語 | 使用者 |
|---|---|
| `"No updates this week."` | `admin-meeting-note`（3.04）· `project-note-specialist`（3.08）· `consult-project-specialist`（2.05） |
| 「本次無相關內容」 | `consult-session-notes`（2.39） |

前者是給**專案週期**看的（這一週沒有進展），後者是給**單場會議**看的（這場會議沒有談到）——語意不同，強行統一會讓其中一邊說謊。技能沿用自己那一邊的用語即可，不得跨用、也不得替對方改。

---

## 8 · 結案

- **觸發**：管控表 `%` 達 100%，或專案被中止。
- **「完成」的定義**：`[復盤]` Doc 完成 ＋ 封存歸位。兩者缺一，專案不得標記結束（鐵律 5）。
- 復盤 §1 的結案判定走 **closure verdict** 軸：`passed` / `passed_with_conditions` / `not_delivered`——這是第五個軸，不得和 lifecycle 的 `done` 混用；`done` 說的是事情做完了，closure verdict 說的是做出來的東西算不算數。
- 本專案若改動過模板，回寫 `[3.3]/[1]` Templates 正本並更新 TEMPLATE-INDEX。

---

## 9 · 讀這份知識包的技能，四條鐵律

1. **只出草稿，永不寄送**——任何郵件一律停在 Gmail 草稿，不論排程或互動模式。
2. **讀不到就回報，永不猜測**——來源無法讀取、標頭不吻合、日期缺年份、`前置任務` 指向不存在的 `no.`，一律據實回報缺漏，不以合理推測填補。
3. **Sheet 回寫只寫值（VALUES ONLY）**——在使用中的 Sheet 上只更新儲存格值，不重新轉檔、不改格式、不動欄寬、不重排列序。
4. **永不自行發明 `no.`**——新增列依 §4 的遞增規則取號，不得憑印象填一個編號。

---

## 10 · 本包刻意不收錄

- **各團隊／各案型的容器**：`客戶案` · `課程案` · `內部案` 的歸檔家、Kickoff 必填欄位差異、結案步驟差異、溝通頻率——依 D3 全部是 adapter DATA，寫在 `~/.config/zynkr/pm.json`。
- **交付主軸（delivery spine）**：一個專案的階段順序住在 `~/.config/zynkr/pm.json` → `projects.<slug>.spine`（一個有序的階段名稱陣列），依 D3 是 adapter **DATA**，不是本包的內容。本包不寫死任何一條 spine，技能也不得把某個案子的階段順序當成通則寫進自己的檔案。`project-init` 開案時寫入五個交付階段 `啟動` · `規劃` · `執行` · `監控` · `結案` 作為 `X.0` 列；讀不到 `spine` 的技能回退到這五個階段，並**印出一行警告**說明它用的是回退值。**`跨階段 Cross-Cutting` 不是一個階段列**——它是一條平行軌，永遠不進 spine、永遠不進百分比的分母，只在阻礙／本週動作／時間軸裡露出。
- **報表收件人**：`~/.config/zynkr/pm.json` → `projects.<slug>.report_recipients`，同樣是 adapter DATA。任何 SKILL.md 都不得留下真實收件人字面值；檔案裡的佔位符只是文件，讀到佔位符或找不到這個鍵一律 fail loud，不得寄給「上次那批人」。
- **實例 ID**：任何試算表／文件／資料夾 ID 與 URL 一律住 `pm-sources.md`，本包不出現任何 ID。
- **那 16 項寫在紙上不存在的默會判斷**：例如 WBS 該切多細、哪一個階段值得設 Gate · Gate 2–5 的過關標準 · 什麼時候該 Drop、什麼時候該重新規劃——這些留給人，技能只負責把缺口指出來。
- **技能可自行調整的 health 門檻**：`today+3` 這個視窗與「阻礙 7 天」這條線是預設值，技能可依情境調參；但 §2.2 的**推導方向**（health 由日期 × lifecycle 推得、永不手填）不可調。
