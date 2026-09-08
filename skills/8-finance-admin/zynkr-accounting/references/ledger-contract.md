# The ledger contract

Everything in this file is about the Zynkr Finance Ledger spreadsheet
(`<your-finance-ledger-sheet-id>`). Read it before writing a single cell.

The shape of the thing: **`Transactions` is the only tab anyone writes to.** Every other tab
derives itself from it by formula. That is what makes the ledger trustworthy, and it is also why a
careless write breaks it in ways that are not obvious for weeks.

---

## 1. The `Transactions` schema

Sixteen columns, A–P, append-only.

| Col | Field | Notes |
|---|---|---|
| A | `id` | Upper-case UUID v4. Generate a fresh one per row |
| B | `date` | `YYYY-MM-DD` — the date the money moved, not the invoice date |
| C | `source` | `image` · `email` · `personal` · `manual` (see §2) |
| D | `category` | `income` · `operating-cost` · `payroll` · `misc` |
| E | `subcategory` | Free-ish, but reuse an existing value wherever one fits (§3) |
| F | `vendor` | The counterparty. Drives the Financial Model's per-vendor rows — see the map in `reconciliation-rules.md` |
| G | `description` | Human-readable, specific. "撥款匯費" beats "fee" |
| H | `amount` | In the **original currency**. Negative for money out |
| I | `currency` | `TWD` · `USD` · `EUR` … |
| J | `tax` | Usually blank |
| K | `notes` | Where the evidence and the doubts go. Prefix an uncertain attribution with `⚠` |
| L | `raw_ref` | The evidence. For statement rows: `台北富邦銀行對帳單 YYYY/MM` |
| M | `processed_at` | ISO 8601 with the `+08:00` offset |
| N | `twd_amount` | TWD equivalent. **Every summary tab reads this, never `amount`** |
| O | `exchange_rate` | `1` for TWD rows |
| P | `reimbursement_status` | Only for `source: personal` — `pending` · `reimbursed` · `waived` |

### The `source` values carry meaning

`source` is not decoration — it decides whether a row participates in the bank reconciliation.

- **`image`** — read off the bank statement itself. Often the *only* record of the transaction.
- **`email`** — extracted from an invoice, receipt or transfer confirmation, and paid from the
  富邦 account.
- **`personal`** — a business expense on Peter's personal card. **Never appears on the statement.**
  Always carries `reimbursement_status`, and is always excluded from the balance identity.
- **`manual`** — cash or otherwise undocumented.

Getting `personal` vs `email` wrong is the single most common way to break the close: an
`email` row that was really a card charge makes the identity fail by exactly that amount, and it
also understates what the company owes Peter.

### Foreign currency

Store the original `amount` and `currency`, then compute `twd_amount` at the transaction date's
rate and record the rate in `exchange_rate`. The historical rate comes from the fawazahmed0
currency API, dated:

```
https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@<YYYY-MM-DD>/v1/currencies/<lowercase-ccy>.json
```

Never use today's rate for a back-dated row.

---

## 2. How the other tabs derive themselves

| Tab | Mechanism | What it means for you |
|---|---|---|
| `Monthly Summary` | `SUMPRODUCT` over `Transactions!$B$2:$B$200` / `$N$2:$N$200` | **Hard-capped at row 200.** Past that, rows stop being counted with no error |
| `Income` | `=QUERY(Transactions!A:M, …)` spilling from A1, filtered to income | Column N is a **hand-filled** `VLOOKUP` that does not auto-extend |
| `Costs` | Same shape, all non-income rows | Same hand-filled column N |
| `Financial Model` | `MAP(…LAMBDA(…SUMIFS(…)))` array formulas in column E spilling across E:AP | **Never write into it** |
| `Config` | Plain settings | Rarely touched |

### The append protocol

1. Read `Transactions` and find the last populated row, call it `n`.
2. Write your batch to `A{n+1}:P{n+k}` with `USER_ENTERED`.
3. **Fill down column N on `Income` and `Costs`.** This step is not optional — see below.
4. Verify: read `Monthly Summary` for the month and confirm the new figures moved as expected.

### ⚠ The fill-down, and why it bites

`Income!A1` and `Costs!A1` are `QUERY(...)` formulas that **sort by date ascending**. So a
back-dated row does not land at the bottom of those tabs — it sorts into the middle and pushes
every later row down by one. The last row then falls past the end of the hand-filled `N` column and
sits there with a blank `twd_amount`, and the tab's total quietly disagrees with `Transactions`.

After any append, find the new last row of each tab and extend column N:

```
=IFERROR(VLOOKUP($A<row>,Transactions!$A:$N,14,FALSE),"")
```

A row appended with today's date still triggers this, because *other* rows in the batch may be
back-dated. Always check both tabs; often only one has shifted.

### ⚠ Never write into the Financial Model's month columns

Reading a single month column shows plain numbers and looks static. Those numbers are **spilled**
from an array formula in column E. Writing a value into one blocks the spill and turns the entire
row into `#REF!` — "Array result was not expanded".

To check whether a row is still live, read **column E with formulas included**, not the month
column. The fix for a blocked row is to clear the offending cells, never to patch values back in.

Adding rows to `Transactions` updates the Financial Model automatically. There is nothing to
hand-maintain, and nothing there for this skill to write.

---

## 3. Subcategories in use

Reuse these rather than inventing near-synonyms — the Financial Model matches some of them by
exact string, and a novel spelling drops the row out of a line without any error.

**income** — `course-revenue` · `client-payment` · `card-settlement` · `transfer` · `interest`

**operating-cost** — `software` · `platform-fee` · `venue` · `advertising` · `lecturer-fee` ·
`contractor` · `course-production` · `event-cost` · `accounting` · `photography` ·
`video-production`

**payroll** — `salary`

**misc** — `tax` · `refund`

⚠ **`payroll` has no catch-all row in the Financial Model.** It matches exact staff names. Project
labour for someone outside that list must be booked as `operating-cost` / `contractor`, or it
vanishes from the model while still being correct in Monthly Summary. Software has a catch-all
("其他 SaaS"), so a new SaaS vendor is safe; a new *person* is not.

---

## 4. Verification checks

After a close, these should all hold:

- `Costs` column N total = `Transactions` non-income `twd_amount` total.
- `Monthly Summary` income for the month = the sum of the month's income rows.
- No `#REF!` anywhere in the Financial Model — spot-check the month's column.
- The month's Financial Model column reflects the new rows in the right product line.

If the last one fails but Monthly Summary is right, the cause is almost always a `vendor` string
that no `SUMIFS` matches. Check the map in `reconciliation-rules.md`.
