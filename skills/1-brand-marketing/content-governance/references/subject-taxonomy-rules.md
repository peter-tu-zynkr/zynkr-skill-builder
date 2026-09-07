# Subject taxonomy — 分類規則

The classification rules that govern `subject-taxonomy.csv`. The CSV says *what the subjects are*;
this file says *how to choose between them*. Read both before assigning tags — keyword matching
alone is not sufficient, and rule **R03** says so explicitly.

## Provenance

Per rule **R08**, every run must record the version, the extraction time and the content hash of
the taxonomy it used. This export carries them:

| Field | Value |
|---|---|
| Source of truth | Google Sheet `subject-taxonomy` — `1GByqJ-E1XDo4b9FCfqnQlt_Raje0grEtFo2O-9IQ09s` |
| Tabs exported | `subject-taxonomy` (gid `1114685261`) → `subject-taxonomy.csv` · `分類規則` (gid `9062026`) → this file |
| `taxonomy_version` | `1.0` |
| Subjects | 82 (`sub_001` … `sub_082`), 592 keyword entries · 568 distinct |
| Exported | 2026-09-07 |
| Sheet last modified | 2026-09-06 |
| `subject-taxonomy.csv` sha256 | `30fd2a8484ccb2a6014d5330b5776179da68cbb1fe2a6cca553fbce4479db30f` |

**The Sheet stays the editable source; this repo holds a stamped copy.** Edit subjects in the
Sheet, never here — then bump `taxonomy_version`, re-export both tabs, and update the hash above.
The copy exists so the skill runs without Drive access; it is not a second place to make changes.

Re-export check (the hash must match the table above):

```bash
shasum -a 256 references/subject-taxonomy.csv
```

## Reading the CSV

Six columns, `subject,description_zh,keywords_zh,keywords_en,subject_id,taxonomy_version`.
Per **R07** the keyword columns are `" | "`-delimited — split on the pipe, trim, and treat each
column as a string array. Do **not** split on commas.

---

## 通則 — R01 to R09

### R01 · 維度
來源 origin、用途 note_type、成熟度 maturity 與 subject 分開；所有 subject 均可用於 source/idea/project
*例*：「想做筆記系統」可為 self + project，主題 Knowledge management

### R02 · 主次主題
已分類卡恰好 1 個 primary_subject_id，0–2 個 secondary_subject_ids；同一 ID 不重複
*例*：以卡片核心觀點選主題，次題須有實質內容支持

### R03 · 判斷依據
定義與核心觀點優先，關鍵字只作召回提示；不得僅因出現工具名稱就分類
*例*：文章提到 Notion，但核心是升遷，仍可選 Career

### R04 · 不確定
無適合主題時 classification_status=pending，主題留空；兩類接近先問一題
*例*：入庫仍需 G1；不得將 pending 呈現為分類完成

### R05 · 新增與變更
AI 只能建議新主題；Peter 確認後才加入。改名保留 subject_id；ID 不因排序改變且不可重用
*例*：合併時保留舊 ID 到新 ID 的映射，不靜默重分類舊卡

### R06 · 層級
v1.0 是平面 subject 清單，不建立 parent_id 樹，也不強迫所有主題互斥
*例*：Book/Podcast/YouTube 暫保留；分類實驗後才考慮分離媒介維度

### R07 · 匯入契約
主表 A:F；keywords_zh/en 使用「 | 」分隔，讀取後轉字串陣列；含漢字的混合詞放 zh，其餘放 en
*例*：每列關鍵字去除首尾空白並精確去重，原有詞彙均保留

### R08 · 版本
每次規則或主題修改提升 taxonomy_version；執行時保存版本、擷取時間與內容 hash
*例*：同一 run 固定快照；新版不自動改寫既有卡片

### R09 · 審核
每項建議顯示 subject 名稱、ID、依據及信心值；使用者可修改，入庫前一律 G1
*例*：信心值只用來決定澄清優先序，不代表正確率

---

## 主題界線 — R10 to R23

These are the pairs that get confused. When two subjects both look right, this section decides.

### R10 · Writing / Content Writing
Writing：一般寫作方法、文章結構與文筆；Content Writing：標題、文案與具體內容產出
*例*：段落如何銜接→Writing；產品文案標題改寫→Content Writing

### R11 · Organization / Process / Automation
Organization：整理與建立工作系統；Process：流程步驟、標準化與交接；Automation：減少人工介入的自動執行
*例*：資料夾整理→Organization；審稿 SOP→Process；n8n 自動送審→Automation

### R12 · Thinking / Mental model / MECE
Thinking：一般思考與推理；Mental model：具名心智模型的應用；MECE：專談互斥且窮盡的拆解
*例*：如何檢查推理→Thinking；第一性原理案例→Mental model；MECE 拆解→MECE

### R13 · Apps / Code / Technology / Gen AI
Apps：工具評測與使用；Code：程式實作；Technology：非 AI 專屬科技概覽；Gen AI：生成式 AI 能力與應用
*例*：Claude 程式除錯教學可 Code 主題、Gen AI 次題；依核心論點判斷

### R14 · Business / Entrepreneur / Strategy / Operation
Business：商業模式與整體經營；Entrepreneur：創業或副業歷程；Strategy：方向與競爭取捨；Operation：日常營運執行
*例*：創業第一年心得→Entrepreneur；日常客服排班→Operation

### R15 · Career / Interview / Resume
Career：長期職涯與升遷；Interview：面試準備與互動；Resume：履歷文件內容
*例*：履歷成就句改寫→Resume；面試回答 STAR→Interview

### R16 · Leadership / People management / Stakeholder / Teamwork
Leadership：方向與影響力；People management：直接帶人與績效；Stakeholder：利害關係人與向上管理；Teamwork：協作
*例*：一對一績效談話→People management；跨部門合作→Teamwork

### R17 · Customer life / Customer experience
Customer life：生命週期階段、旅程與留存；Customer experience：接觸點體驗品質、滿意度與 NPS
*例*：新客到續約的旅程→Customer life；改善客服體驗→Customer experience

### R18 · Finance / Budgeting / Investment / Wealth
Finance：整體個人財務及現金流；Budgeting：預算與支出控制；Investment：投資配置；Wealth：財富累積與財富觀
*例*：每月預算→Budgeting；ETF 配置→Investment

### R19 · Learning / Education / Course
Learning：個人學習方法；Education：教育體系與觀點；Course：課程設計與學習產品
*例*：自學技巧→Learning；八週課綱設計→Course

### R20 · Stress / Anxiety / Psychology
Stress：壓力與情緒管理；Anxiety：焦慮、不確定感；Psychology：心理學機制與行為研究
*例*：不確定下的焦慮→Anxiety；認知偏誤解析→Psychology

### R21 · Writing / Newsletter / Marketing
Newsletter：電子報形式、訂閱及經營策略；Writing：通用寫作技術；Marketing：行銷目標與轉換策略
*例*：提升開信率→Newsletter；跨渠道漏斗→Marketing

### R22 · 媒介與主題
Book/Podcast/Video/YouTube 用於書評、節目評論、製作或渠道經營；輸入來源是該媒介不自動加標籤
*例*：Podcast 裡的升遷觀點→Career；Podcast 節目製作→Podcast

### R23 · RPA / Automation / Prompt Engineering
RPA：機器人流程自動化實作；Automation：一般工作流自動化；Prompt Engineering：提示詞與指令設計
*例*：系統提示詞設計→Prompt Engineering；Make 工作流→Automation

---

## 驗證 — R24

### R24 · 驗證
匯入保留 82 個名稱、定義及所有不同關鍵字；subject_id 唯一且非空；分類輸出只能引用本版本存在的 ID
*例*：改排序後 ID 不變；未知 ID 拒絕標記為 classified
