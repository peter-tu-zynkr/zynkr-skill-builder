# Weekly GM brief — template (blocks 00–08)

The brief has a **fixed order** so the reader learns where to look. It is written for one
reader — the GM, on a Monday, before coffee — who must be able to act on it **without opening
anything first**, and then click straight to the exact cell when he decides to.

Two rules outrank everything else in this file:

> **Say the thing.** If a sentence would not survive being read aloud to someone outside the
> company, rewrite it. Internal codes, section numbers and noun-stacks are not information —
> they are pointers to information the reader does not have.
>
> **Link the thing.** Every document, sheet, tab, row or cell the brief names is a hyperlink to
> that exact place. Naming a source without linking it is a defect, not a style choice.

---

## Language — English prose, verbatim source strings

The brief body is **English**. Not translated-from-Chinese English: write it in English from the
start, in short declarative sentences.

**But never translate a string the reader will have to match against a source.** Tracker item
names, status values, tab names, document titles, owner names and column headers stay
**verbatim, in their original script**, because the reader's next action is to find that exact
string in a Sheet. Translating `未開始` to "Not started" in a table whose Sheet says `未開始`
makes the row harder to find, not easier.

| Write in English | Keep verbatim |
|---|---|
| Every sentence, clause, heading, label and explanation the brief itself authors | Tracker item names (`業務 On-board 步驟`), status values (`未開始` `進行中` `完成` `暫停` `放棄`), tab names (`H2 專案項目`, `待決事項`), doc titles (`[3.1] 營運每週彙報`), people's names as the tracker spells them, column headers (`結束`, `決議紀錄`) |

Gloss a verbatim string the first time it appears, in parentheses, once:
`4.05 陪跑課 (the 6-week cohort programme)`. Once glossed, use it bare.

Derived-state words (`ENDS_SOON` `OVERDUE` `UNDATED` `PROPOSE_DONE` `DIRECTION_UNLABELLED`
`STALLED`) and the shared operating vocabulary (`P0` `P1` `KPI` `LOB` `runway` `burn` `SOR`
`Q3` `H2`) stay as they are — they are the house language, defined in
`derived-state-rules.md`, and translating them loses the tie to the tracker.

**Subject:** `<subject_prefix><YYYY-MM-DD> (W<ww>) — <one-line focus>`
The focus clause is plain English, ≤10 words, and names the thing at stake — not its code.
Good: `4 pricing decisions are 3 days overdue`. Bad: `§D 決策逾期 3 天`.

---

## The five composing rules (apply to every block)

**C1 · Link, don't cite.** Replace every `（來源：X · 讀取於 <date>）` parenthetical with a
hyperlink on the name itself. The audit trail survives — it just stops eating the sentence.
Build links like this:

| Target | URL |
|---|---|
| A Sheet tab | `https://docs.google.com/spreadsheets/d/<id>/edit#gid=<gid>` |
| A row | `…/edit#gid=<gid>&range=A<row>` |
| **A single cell** — use this for "where you type your answer" | `…/edit#gid=<gid>&range=<col><row>` |
| A Doc | `https://docs.google.com/document/d/<id>/edit` |
| A Doc tab | `https://docs.google.com/document/d/<id>/edit?tab=t.<tabId>` |

Resolve `<gid>` once per run with `get_spreadsheet_info` (it returns each tab's numeric ID) and
reuse it for every link into that spreadsheet. In a cloud run where gid is not obtainable, link
the file and name the tab in the text — a file-level link is acceptable, no link is not.

**C2 · Show the as-of date only when it changes the reading.** A date earns its place when the
number drives a state (runway, a KPI Actual, an overdue calculation), when the source is stale
(>7 days), or when the reader would otherwise assume it is fresh. Everywhere else, drop it —
the link goes to the live source anyway.

**C3 · One clause per bullet, one idea per sentence.** No bullet carries a second thought after
a semicolon. If a bullet needs two sentences, it is two bullets or it is block 03.

**C4 · Expand a code the first time, then use it bare.** `§D`, `[2.1]`, `[3.3]`, `01-3`, `C1–C4`
mean nothing standing alone. First mention: `the four open pricing decisions ([3.3] §D)`.
A code that cannot be resolved to a real document gets rule C5.

**C5 · An unresolvable reference is a finding, not a citation.** If a source names a document
the run cannot locate (a `[N.N]` code with no matching file, a section that no longer exists),
do **not** repeat the code as though it were an address. Say what happened —
`the decision row points at "[3.3] §D", and no document by that name is in Drive` — and make
the card's ask fixing the pointer. Passing a dead reference to the reader as a citation is the
failure this rule exists to stop.

### Word budgets

| Block | Budget |
|---|---|
| 01 · each decision card | ≤60 words, ≤5 lines, excluding link text |
| 02 · each bullet | ≤20 words |
| 03 · each table cell | ≤12 words |
| 05 · 07 · 08 · each line | ≤20 words |
| Whole email | ≤900 words. Over budget means block 03 is carrying prose it should not. |

---

## 00 · Runway (always the first line)

One line, always present, always first:

`Runway <N> months · burn NT$<x>k / cap NT$<cap>k · books as of <date>`

with the source name linked. State colour: **RED** if `N < runway_floor_months`, or the books
are older than `books_stale_days`, or no runway figure exists anywhere — then the line reads
`RED · Runway is not being measured — no Actual in the KPI Dashboard`, and the second line says
who can fix that and by doing what. AMBER within 0.5 month of the floor. GREEN otherwise.
RED/AMBER/GREEN are semantic states, not brand colours.

If the state is RED for a second consecutive week, say so in four words: `Second week running.`

## 01 · Decisions only you can make (≤3)

**This block is the whole point of the brief.** Everything else is context for it. If the reader
finishes this block still asking "so what do you want from me?", the brief has failed regardless
of how accurate the other eight blocks are.

Sources, in this order: open decisions past or within 7 days of their decide-by (or with no
decide-by at all and blocking a P0); P0s owned by the GM with 結束 ≤14 days; P0s UNDATED for
>2 weeks (any owner — the GM's job is to make the absence visible).

### The decision card

Each item is exactly this shape, in this order:

```
<N>. <The question, in plain English, ending in "?">
     Options — A: <option>  ·  B: <option>          (or)  Fill in — <what value> in <where>
     If you don't — <the concrete consequence, one clause>
     Close it — <the one action> → <link to the exact cell or row>
     Where this came from — <one clause> → <link>
```

Five rules govern it:

**D1 · One question per card.** A source row that bundles four decisions is four questions, not
one. Ask the single one that unblocks the most, and add one line:
`Same row also holds: <n> more — answer them in the same cell.` Never hand the reader a list of
four things joined by `·` and call it a decision: that is unanswerable, and it is the single
most common way this block fails.

**D2 · The question names the thing, not its code.** The subject of the sentence is a real
noun the reader recognises without opening anything.
- ✅ `Which price list governs the enterprise AI diagnostic — the B2B pricing sheet, or a separate project rate?`
- ❌ `價格帶 vs「[2.1] B2B Pricing Sheet」SOR · 保證條款 · enterprise-lite pilot 是否定為標準楔子`

**D3 · Options are mandatory.** State the actual alternatives (A/B/C), or — when the decision is
a value rather than a choice — state exactly what goes where (`Fill in — an end date in 結束
for rows 2.02, 6.03, 7.01`). **If you cannot state the options, it is not a decision, it is
research**: drop it out of block 01, and put the research step in block 03 or 06 instead. This
rule is what stops the block from filling with things the reader cannot actually resolve in a
sitting.

**D4 · Read the source before you write the question.** When a decision row's own text is
shorthand (`§D 四項：價格帶 vs [2.1] SOR・保證條款・pilot 楔子・auto-send 政策`), open the section
it points at and state the real choice. Restating the shorthand is not summarising — it just
moves the reader's confusion into their inbox. If the section cannot be opened or does not
exist, apply C5: say so, and make that the ask.

**D5 · "Close it" is one action with a link.** It ends in a stamped artefact — a value typed in
a named cell, a date on a tracker row, a message sent. Never "a conversation", never "align on".
The link goes to the cell, not the file: the reader should be typing within one click.

### Worked example

Wrong — this is the shape the brief must never produce again (four decisions in one line, three
unexplained codes, no link, the reasoning longer than the ask):

> **[3.3] §D 四項決策 — 期限 08-28，今天逾期 3 天。** 價格帶 vs「[2.1] B2B Pricing Sheet」SOR ·
> 保證條款 · enterprise-lite pilot 是否定為標準楔子 · 哪些回覆模板可自動寄出。決策者只有你。
> 為什麼是現在 — 4.01 企業 AI 診斷已於 2026-08-24 標記 完成（來源：Main Tracker 4.01），首案不再
> 被卡；§D 現在關的是「下一次交付能不能照抄」…

Right:

> **1. Which price list governs the enterprise AI diagnostic?**
> Options — **A:** the existing [B2B pricing sheet](url) governs, and the diagnostic is priced
> off it · **B:** the diagnostic gets its own rate, written back into that sheet.
> If you don't — the next enterprise deal has no quotable price, and Q3 ends in 30 days.
> Close it — type A or B and today's date in [待決事項 row 1, 決議紀錄](url#gid=…&range=F2), and
> set 狀態 to 已定案.
> Where this came from — decision #1, due Aug 28, now 3 days overdue. Same row also holds 3
> more (guarantee terms, pilot-as-standard, auto-send policy) — answer them in the same cell.

## 02 · Two clocks

- **Cash clock** — from block 00: at this burn, the floor is reached on `<date>`. If runway is
  unmeasured, say `Stopped — no figure to run.` and nothing else.
- **Calendar clock** — days to Q3 end · days to H2 end · every P0/P1 with 結束 ≤30 days
  (id · item · owner · date).

One clause each (C3). A milestone that needs a paragraph belongs in 03.

## 03 · P0 / P1 status by LOB

One table per LOB in tracker order (1.0 → 8.0). Columns: `#` · Item · Owner · Status · Derived ·
Evidence · Next. Derived states use the words in `derived-state-rules.md`. Evidence is one clause
naming where you saw it, **linked** to that row or section. Every P0 appears exactly once. P2
items appear only if OVERDUE. Cells ≤12 words — this block is a scan surface, not a narrative.

Where the tracker and another source disagree, say which one wins under the precedence rules and
put the reconciliation in Next. A divergence is a fact about the machine, not an opinion.

## 04 · Per-owner summary

One line per owner (named as the tracker names them): P0 held · P1 held · UNDATED · OVERDUE ·
ENDS_SOON · what the brief needs from them · when they last appeared in the weekly log. End with
`GM holds <k>/<n> P0s (<pct>%)`.

## 05 · KPI off-target + missing numbers

Two lists from the KPI dashboard:
1. **Off target** — rows with BOTH a target and an Actual where the Actual misses the current
   quarter's target: metric · target · actual · owner.
2. **Missing** — rows with no Actual: metric · owner · class (AUTO / SEMI / HUMAN per
   `kpi-map.md`) · how it would be filled. Batch by owner; do not repeat an ask sent last week
   unless it is P0-linked.

Cloud runs: CRM/accounting-backed metrics are marked `(not readable on a scheduled run)`.

## 06 · Decisions register

Table: id · Item · Label (`已定案` / `還在摸索` / unlabelled) · Decider · decide-by (or "no
deadline") · Status · Source (linked). Sources: the ops heal sheet's decisions tab; open
decisions named in the strategy docs' authoritative sections; DIRECTION_UNLABELLED P0s. Overdue
or undated rows are carried every week until closed.

The three promoted into block 01 appear here too, marked `→ see 01`, so the register stays whole.

## 07 · Deliberately not this week

3–5 named skips, one clause each. An unstated skip becomes an unnoticed slip.

## 08 · Machine health

- Routines: newest weekly livestream note date (flag if >8 days); this brief's own idempotency
  result.
- SOR docs changed in the last 7 days (name · modified date · which authoritative section).
- Sources this run could not read, and why (not available on a scheduled run / read failed /
  not found).
- **Dead references** found under C5: a code or section named by a source that resolves to
  nothing. These rot quietly and are cheap to fix once surfaced.

---

## Chat rendering

Same blocks as Markdown H2 headings `## 00 · Runway` … `## 08 · Machine health`. Tables as
Markdown tables, links as `[text](url)`. Keep 03 compact (one table per LOB, no prose).

## HTML email skeleton (all CSS inline — Gmail strips `<style>`)

Palette (brand tokens, sync 2026-08-17): page `#FBF7F0` (paper) · card `#FDFAF5` · ink
`#0F0F0E` · mute `#6F6B62` · line `rgba(43,43,40,.14)` · label sage `#5FA48A` · callout
`#DCEEE6` · **link `#2F6F58`** (sage deep — readable on paper, and the only place a link colour
is used). Semantic (not brand): RED bg `#FEE2E2` fg `#B91C1C` · AMBER bg `#FEF3C7` fg `#B45309`
· GREEN bg `#DCFCE7` fg `#15803D`. Font stack:
`-apple-system,'Segoe UI','PingFang TC','Noto Sans TC','Microsoft JhengHei',Roboto,Helvetica,Arial,sans-serif`.

Every link is `<a href="…" style="color:#2F6F58;text-decoration:underline;">…</a>` — Gmail
restyles bare `<a>` unpredictably, so the colour is always inline.

```html
<div style="background:#FBF7F0;padding:24px 0;font-family:-apple-system,'Segoe UI','PingFang TC','Noto Sans TC','Microsoft JhengHei',Roboto,Helvetica,Arial,sans-serif;color:#0F0F0E;">
 <div style="max-width:680px;margin:0 auto;padding:0 16px;">
  <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6F6B62;font-family:ui-monospace,Menlo,monospace;">GM WEEKLY · {{YYYY-MM-DD}} · W{{ww}}</div>
  <div style="font-size:22px;font-weight:800;line-height:1.3;margin:4px 0 16px;">{{one-line focus}}</div>

  <!-- 00 runway: RED/AMBER/GREEN card -->
  <div style="background:{{state_bg}};border-radius:12px;padding:14px 18px;margin:0 0 14px;">
   <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:{{state_fg}};">00 · RUNWAY</div>
   <div style="font-size:16px;font-weight:700;color:{{state_fg}};margin-top:4px;">{{runway line}}</div>
   <div style="font-size:12px;color:#6F6B62;margin-top:2px;">{{one clause: what would change it}}</div>
  </div>

  <!-- 01 decision cards -->
  <div style="background:#FDFAF5;border:1px solid rgba(43,43,40,.14);border-radius:12px;padding:16px 18px;margin:0 0 14px;">
   <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#5FA48A;font-family:ui-monospace,Menlo,monospace;">01 · DECISIONS ONLY YOU CAN MAKE</div>
   <!-- repeat per card, ≤3 -->
   <div style="margin:12px 0 0;padding:12px 14px;background:#FBF7F0;border-radius:10px;">
    <div style="font-size:14px;font-weight:700;line-height:1.5;">{{N}}. {{the question?}}</div>
    <div style="font-size:13px;line-height:1.7;margin-top:6px;"><b>Options</b> — <b>A:</b> {{a}} · <b>B:</b> {{b}}</div>
    <div style="font-size:13px;line-height:1.7;"><b>If you don't</b> — {{consequence}}</div>
    <div style="font-size:13px;line-height:1.7;"><b>Close it</b> — {{action}} → <a href="{{cell_url}}" style="color:#2F6F58;text-decoration:underline;">{{tab}} row {{n}}, {{column}}</a></div>
    <div style="font-size:12px;color:#6F6B62;line-height:1.6;margin-top:4px;">{{where this came from}}</div>
   </div>
  </div>

  <!-- generic block card; repeat for 02..08 -->
  <div style="background:#FDFAF5;border:1px solid rgba(43,43,40,.14);border-radius:12px;padding:16px 18px;margin:0 0 14px;">
   <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#5FA48A;font-family:ui-monospace,Menlo,monospace;">{{NN · TITLE}}</div>
   <!-- 03/04/05/06: <table style="width:100%;border-collapse:collapse;font-size:13px;"> header cells color #6F6B62, row borders 1px solid rgba(43,43,40,.08); 02/07/08: <ul> -->
  </div>

  <div style="font-size:12px;color:#6F6B62;text-align:center;margin-top:8px;line-height:1.6;">Assembled by zynkr-gm from the sources of record in precedence order (tracker → weekly log → OKR/KPI → function sheets). Every claim links to where it came from.</div>
 </div>
</div>
```

HTML-escape user text (`< > &`) — and escape it **before** wrapping it in an `<a>`, never after.
Keep tables `width:100%` and cells `padding:6px 8px; vertical-align:top;`. No images, no
external CSS, no scripts.

---

## Before sending — the plain-language check

Run these against the composed brief. Any "no" is a rewrite, not a note.

1. Does every card in 01 ask **one** question, ending in a question mark?
2. Could the reader answer each one **without opening another document**?
3. Does every card offer **options** (or name the exact value and cell)?
4. Is every document, tab, row and cell mentioned anywhere a **hyperlink**?
5. Is there a `[N.N]` code, `§` reference or acronym that is never expanded?
6. Is any reference **dead** — and if so, is it reported as a finding rather than a citation?
7. Read block 01 aloud. Does it sound like a person telling you what they need?
