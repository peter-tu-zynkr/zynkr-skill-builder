# The monthly report

Shape, tone and the rules for the numbers. Sent as HTML to
`<your-google-workspace-account>`, subject `【月結】<YYYY-MM> 財務結算 — <held | N findings>`.

The report is written for one reader who already knows the business, so it does not explain what a
分潤 is. It exists to answer three questions in order: **can I trust these numbers, what happened
this month, and what do I owe or need to decide.**

---

## Section order

### 1. The close result — first, always

One line, before anything else:

> **對帳結果**：identity held to the dollar (582,599 → 535,183，net −47,416)

or

> **對帳結果**：3 findings — 2 rows appended, 1 unresolved (NT$1,050)

If the identity did not hold, the reader needs to know that before they read a single figure
below. Never bury it under a summary table.

### 2. The month in four numbers

A small table, TWD:

| | |
|---|---|
| 營業收入 | operating revenue — **not** `總收入` |
| 非營業 | transfer · interest · refund, shown separately |
| 總支出 | |
| 淨額 | |

Then one sentence naming the biggest single driver either way. "The month is negative because
Kit's annual renewal landed" is worth more than the number alone.

### 3. Income by line

By product line, using the vendor map — 課程 (Hahow) · 課程 (Other) · 活動 · 顧問 · B2B. Give each
line its amount and the counterparty behind it. If one payment dominates the month, say so.

### 4. Cost by category

`operating-cost` · `payroll` · `misc`, then the notable individual items. Do not list every SaaS
subscription — group them as software and call out only what changed: a new vendor, a seat-count
move, an annual renewal, something that stopped.

### 5. Reconciliation detail

Only when there were findings. For each: what it was, what was done, and — if it is still open —
what would settle it and who has to decide.

Show the arithmetic for the residual. The reader should be able to check it.

### 6. What is owed

The pending personal-card reimbursement balance, and how much it moved this month. This is a real
liability that grows silently, so it gets its own line every month even when nothing changed.

### 7. Open items

Every `⚠` row still unresolved, with the specific question attached. If there are none, say
"none open" rather than dropping the section — the absence is information.

### 8. Ledger health

One line: last row used, headroom to row 200, and anything odd noticed in the derived tabs.

---

## Rules for the numbers

- Every figure must come from this run. If you did not compute it, do not print it.
- TWD everywhere, from `twd_amount`. Never mix in a raw foreign `amount`.
- Comparisons to the prior month are welcome, but only where the comparison is honest — a month
  containing an annual renewal is not comparable to one without, and should say so.
- Round nothing. This ledger ties to the dollar and the report should show that it does.

## Tone

Plain and specific. The reader is the person who runs the company; they do not need cheerleading
and they will notice hedging. Where something is uncertain, name the uncertainty and what would
resolve it — that is more useful than a confident number that turns out to be wrong.

Headings and taglines in Chinese take no ending 句號; use `·` for series.

## Styling

Follow the Zynkr brand: Paper holds the page (70–80%), Ink structures it, Sage Deep for the
thinking, and **orange at most once** — spend it on the close result if the identity failed, and
nowhere else. Keep the table borders light and let the whitespace do the work. Graphite does not
appear.
