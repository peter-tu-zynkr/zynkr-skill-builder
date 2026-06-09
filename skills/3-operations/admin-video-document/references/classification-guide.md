# Classification guide — where each recording goes

This is the cheat-sheet for Step 3 of `admin-video-document`. The destination
sub-folders are **discovered at runtime** (they may change), but this maps the
folders kept in the recording inbox to the kind of recording that belongs in
each. The folder names below are an example taxonomy — adapt to whatever
sub-folders the inbox actually contains. Classify primarily from the **Gemini
Notes content**; fall back to the title heuristics below.

## Folder → what belongs there

| Folder | Put here when the recording is about… |
|---|---|
| `[0] Strategy & planning` | Company direction, product strategy, roadmap, OKRs, hiring direction (CTO/leadership), 30/60/90 planning |
| `[1.0] Marketing` | Content writing, 內容策展, newsletter, Notion/Buffer publishing, NotebookLM repurposing, 流量變現 |
| `[2.0] Sales & consult` | Sales process, 簡報故事線, product demos for prospects, consult/pilot sessions, 陌生開發 |
| `[3.0] Operation process` | Internal SOPs / operations: 活動安排, 歸檔流程, taxonomy, follow-up, payment links, calendar ops, 履歷健檢步驟, 商業漏斗 |
| `[4.0] Course design` | Course/lecture content, 寫作課, teaching material, 指令工程教學, Custom GPT 教學 modules |
| `[5.0] Development knowledge` | Product/engineering knowledge: 資料結構, 設計方法論, FE/BE/DB 流程重構, 技術架構, input/process/output, MVP demos of the product |
| `[5.1] Discovery & design` | Product discovery, user research, design exploration sessions |
| `[5.2] AI assistant go-to-market` | GTM for the AI assistant product specifically |
| `[7.0] People` | 1:1s and people conversations — internal partner/coaching catch-ups (NOT a client engagement → that's Consult, see below; NOT a team-wide meeting) |
| `[8.0] Weekly meeting` | Recurring **internal** team/partner meetings — `Team Weekly Meeting`, a partner weekly, `Team Weekly Meeting (Read only)`. ⚠️ A partner-weekly / `<Name> / You` title can actually be a **client** meeting — if the Notes are about a prospect/pilot/proposal, it goes to `Consult`, not here. |
| `[2.0] Sales & consult/Consult` (nested) | **Client / consulting engagements** — a specific external client's meeting, demo, pilot, or proposal session. Files here are numbered `[N] <Client> (...) - <date>` (video) + `[N] <Client>_<transcript/notes>` (companion), e.g. `[1] Bicky (Pilot Round) - 2025/08/29`. **Stack up to the next `[N]` and rename** (Step 5 numbering rule). Cross-check the Video Index: a name already filed under Sales & consult is a client, not a `[7.0] People` 1:1. |
| `[@] AI Writing` | AI 寫作課直播回放 / writing-course livestream replays |
| `[@] AI 助理實作` | Hands-on AI-assistant build-along sessions |
| `[@] AI 職場應用八週陪跑` | The 8-week workplace-AI cohort program recordings |
| `[@] 職涯升遷＋海外求職` | Career-progression / overseas job-search content |
| `[@] SRT file` | Loose `.srt` subtitle files **only** when they have no parent video to ride along with |

## Title heuristics (fallback when there's no Notes Doc)

- `Team Weekly Meeting…` / a recurring partner weekly → `[8.0] Weekly meeting`
- `<Name> <> <Name>` / `<Name> / <Name>` (two people) → `[7.0] People` — **unless** that name is a client (check the Video Index for the name under `[2.0] Sales & consult`, or Notes read like a prospect/pilot/demo) → then `Consult` and renumber
- A partner-weekly / generic title whose Notes are clearly about **one external client's** business, demo, pilot, or proposal → `[2.0] Sales & consult/Consult` (renumber `[N]`)
- Contains `Demo` / `演示` / `MVP` of the product, framed for a prospect → `[2.0] Sales & consult`; framed as how-it-was-built → `[5.0] Development knowledge`
- 寫作課 / 寫作助理 / Custom GPT 教學 → `[4.0] Course design` (or `[@] AI Writing` if it's a livestream **replay**)
- 技術架構 / 資料結構 / 流程重構 / 方法論 → `[5.0] Development knowledge`
- NotebookLM / Buffer / Notion 內容 / 業配 / 電子報 → `[1.0] Marketing`
- 歸檔 / taxonomy / SOP / follow up / 付款連結 / calendar → `[3.0] Operation process`
- 公司方向 / 產品方向 / CTO / 30-60-90 → `[0] Strategy & planning`

## Confidence rubric

- **高** — Notes content clearly matches one folder's purpose.
- **中** — Title + partial Notes signal point to one folder, but it's plausibly two.
- **低** — Title-only guess (no Notes Doc), or genuinely ambiguous.

When confidence would be 低 *and* no folder is a decent fit, raise a
**🆕 新資料夾 proposal** instead of forcing a poor match — the user approves it at the gate.
