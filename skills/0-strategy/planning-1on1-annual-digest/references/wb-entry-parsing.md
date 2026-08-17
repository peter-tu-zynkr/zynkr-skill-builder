# Parsing a shared 1:1 Doc into an evidence ledger

The shared 1:1 Docs (sources §B) all descend from one template: newest-first weekly
entries headed `### WB（YYYY/M/D）`, each with a fixed set of lines, and a **Read me**
template block parked at the bottom of the Doc. This file is the parsing contract
`planning-1on1-annual-digest` follows in its Step 2. Read the Doc with
`get_doc_as_markdown` — headings and bullets come back as markdown.

## 1 · Entry boundaries

- An entry starts at a heading matching `WB（YYYY/M/D）` — accept full-width `（ ）` or
  half-width `( )`, `YYYY/M/D` or `YYYY/MM/DD`, and heading level `##`/`###`/`####`.
  Normalise the date to `YYYY/M/D` for the evidence tag.
- Entries are **newest first**; keep that order for reading, then sort ascending
  when building the timeline.
- An entry ends at the next `WB（…）` heading, or at the first heading whose text
  contains `Read me` / `Readme` / `模板` / `範本` — that heading and everything after it
  is the template block: **ignore it entirely** (hard rule 4). Never quote a template
  line as evidence; template lines are recognisable by placeholders such as
  `（填…）`, `xxx`, `<…>`, `__N__分`, `What's on my mind (Peter)`, or by repeating the
  field labels with no content.

## 2 · Lines inside an entry

Field labels appear as bold text, a bullet prefix, a line ending in `：`/`:`, or a
short line on its own that introduces the bullets under it. Match on the label, not on
the layout. Labels vary from person to person and week to week — the table lists the
variants actually seen across the shared Docs; an unlisted label is classified by its
meaning (forward-looking → `待完成`, past-tense delivered → `完成`) and the mapping is
noted on the 判讀 list.

| Label (variants) | Ledger category | How it is used |
|---|---|---|
| `完成的事情` · `已完成的部分` · `完成項目` · `本週已完成` · `完成` · `已完成` · `Done` | `完成` | delivered evidence → 一 (timeline) · 三 (retro) · slide Top-3 delivered |
| `需完成的事情` · `接下來要完成的事情` · `這週須完成項目` · `本週項目` · `本周主要事項` · `待處理` · `確認事項` · `待確認項目` · `Talking Points` · `Notes` · `待完成` · `未完成` · `進行中` · `To do` | `待完成` | forward-looking / open items → 四 (主軸 candidates) · 六 (這個月); `確認事項`／`待確認項目`／`Talking Points`／`Notes` are agenda or open-question lines — carry-forward context, never delivered evidence |
| `Action item` · `Action items` · `AI` · `行動項目` | `Action` | commitments → 六; when a later entry's 完成 matches, mark the earlier Action as closed |
| `這周思考` · `這週思考` · `思考` · `反思` | `思考` | strategy signal → 二 (mandate wording) · 三 (放大／停止 judgement) |
| `我的感覺：__N__分` · `我的感覺` · `感覺` · `心情` | `感覺` | morale signal — **manager-private** (see §2a); never in the Doc, never in the slide block |
| `Peter` sub-block (a bullet group / sub-heading labelled `Peter`, `Peter：`, `Peter's notes`) · Read-me field `What's on my mind (Peter)` | `主管` | the manager's asks / notes to the person — **excluded from the person's ledger** (see §2a); at most a `思考`-grade context signal for 二, tagged `（Peter, WB YYYY/M/D）`, never counted as the person's deliverable or commitment |
| anything else | `其他` | keep in the ledger; use only if it is clearly a delivered fact |

One label may carry several bullets — each bullet becomes its own ledger row.

### 2a · Two attribution rules that override the table

- **Whose line is it?** A 1:1 Doc holds two voices. Bullets under the entry's `Peter`
  sub-block (and the template's `What's on my mind (Peter)` field, wherever it was
  copied) are the manager's asks, notes or follow-ups — they are attributed to the
  manager (`主管` category), **never** turned into a 完成 / 待完成 / Action row for the
  person, never cited in 一 or 三, and never counted in the coverage line's 完成／Action
  totals. If the person later reports the same item under their own 完成 label, that
  later line is the evidence. When the sub-block boundary is unclear (indentation lost
  in markdown), the whole ambiguous run is treated as `主管` and listed under 判讀.
- **Where does 我的感覺 go?** The `我的感覺：__N__分` score (and any free-text mood
  line) is a private signal for the manager. It is summarised in ONE line of the chat
  report, addressed to Peter only (e.g. `私下備註（僅供主管）：感覺分數 4 週 ≤ 5 分，
  集中在 2026/3–4；建議在 session 前私下聊`), and goes **nowhere else**: not into the
  年度計畫 Doc, not into the slide block, not into `planning-prework-pack`'s one-pager.
  The slide block's `Top risk` is a **business risk** — a delivery, capacity, dependency
  or market risk drawn from 待完成／Action／思考 rows or the tracker, phrased as
  `<risk> → C-n` — never a morale reading. Trend words like 「壓力大」 stay in the private
  note even when paraphrased.

## 3 · Ledger row shape (kept in working memory / printed on request)

```
WB 2026/5/6 · 完成 · 「客服 SOP v2 上線，回覆模板 12 則」 · tag: 客服 SOP · asset: yes
WB 2026/5/6 · 待完成 · 「LINE 自動回覆串接」 · tag: LINE 自動化 · asset: —
WB 2026/4/29 · Action · 「跟王小明對齊講師排課表」 · tag: 排課 · closed-by: WB 2026/5/13
WB 2026/4/29 · 主管 · 「（Peter）請先確認講師合約再排課」 · tag: 排課 · not-the-person's-item
WB 2026/4/29 · 感覺 · 「6 分」 · manager-private · not for Doc / slide
```

- `tag` = the product / project / system the line belongs to — reuse the wording the
  person used; merge obvious aliases (「客服 SOP」/「客服流程」) and note the merge in
  the report's 判讀 list.
- `asset: yes` when the line names a durable thing (SOP · template · checklist ·
  automation · tracker · Doc · course module) → feeds 「一起長出來的系統資產」.
- Numbers inside a line (「12 則」, 「3 場」) are the person's own — quote them as
  written; they are proof numbers only if the person stated them, never derived.

## 4 · Window + coverage

- Default window = the last 12 months ending on the session date (or today); the
  user may pass H1 / H2 or explicit dates. Entries outside the window are read for
  context but never cited.
- Report coverage: `WB 篇數 in window · first / last date · gaps ≥ 3 weeks` — a gap is a
  fact to state (「2026/1–2 無 1:1 紀錄」), not to fill.
- If a person's Doc is not in sources §B (new hire, renamed doc), ask for the Doc ID
  — never search Drive by personal name and guess.

## 5 · Judgement calls to surface, never silently resolve

- Ambiguous date (missing year, `5/6` only) → infer from neighbouring entries, tag it
  `（WB 2026/5/6？）` and list it under 判讀 in the report.
- A 完成 line that reads like a plan (「預計上線」) → `待完成`, and say so.
- Same deliverable reported in two entries → cite both dates, count once.
- A line that mentions another teammate → keep the fact, drop any evaluative wording
  about that person; owners come from the tracker's 負責人 column, not from 1:1 prose.
- A `Peter` sub-block whose end is unclear (flattened indentation) → the ambiguous run
  is `主管`, not the person's; say which entry and how many bullets under 判讀 (§2a).
- An unlisted forward/delivered label (e.g. a one-off 「這週重點」) → classify by meaning
  and record `<label> → 待完成／完成` under 判讀 so the next run inherits it.
