# Reconciliation rules

How a month of 台北富邦 activity becomes ledger rows, and how you prove you got it all.

---

## 1. The identity

```
opening 承轉結餘  +  Σ(ledger rows for the month where source ≠ personal)  =  closing balance
```

Both balances are printed on the statement. This holds **to the dollar** — this ledger has no
rounding slack. A residual of any size is a finding, never noise.

There is a second, slower check worth running when something feels wrong:

```
Monthly Summary cumulative  +  outstanding pending personal-card spend  =  富邦 account balance
```

The second term is what the company owes Peter, and it grows every month it is not settled. It is
also the figure the monthly report leads its liability line with.

### Working the residual

Take the difference between the identity's two sides and resolve it into named findings until it
closes exactly. Every residual has a cause; the four causes are:

| Finding | What it looks like | What to do |
|---|---|---|
| **Missing row** | On the statement, not in the ledger | Append it |
| **Split** | One bank line = two or more ledger rows | Append the missing part |
| **Fee** | An amount off by exactly 15 | Append the fee row (§2) |
| **Phantom** | In the ledger, not on the statement | **Report — do not fix silently** |

A phantom is the interesting one. It means a row is booked as though it were paid from this
account when it was not. Either its `source` should be `personal`, or it settles in a later month.
Both are Peter's call, because both change what he is owed.

---

## 2. The NT$15 rule, in both directions

富邦 charges NT$15 per transfer, and the direction determines how it is booked.

**Outbound** — the fee is added to the amount and booked on the same row. A NT$32,000 salary
leaves the account as **32,015**, and the ledger row is `-32,015` with a note recording the split.
No separate fee row.

**Inbound** — the fee is deducted, so the money arrives NT$15 *short* of what was invoiced. How
you book that depends on the counterparty's convention:

- **Gross-booked counterparties** (ACCUPASS) — income is recorded at the gross invoice amount with
  the platform fee as its own `platform-fee` row. The NT$15 remittance fee then needs a **third**
  row, `operating-cost` / `platform-fee`, description `撥款匯費`, amount `-15`. Without it the
  month is off by exactly 15.
- **Net-booked counterparties** (the Hahow 分潤 payer) — income is recorded at the net amount that
  actually landed, and the fee lives in the `notes` as `請款 <gross> 扣匯費 15`. No separate row.

Getting this backwards is a 15- or 30-dollar residual, which is small enough to be tempting to
ignore and is exactly the kind of thing that hides a real error later.

---

## 3. Bundled transfers

One bank line is not always one ledger row. Peter routinely settles an expense reimbursement
inside a salary transfer, and the 摘要 is the only clue.

A 摘要 of `七月薪水和活動` on a NT$38,015 line is **three** things:

```
32,000  salary        →  payroll / salary,        -32,015  (salary + the 15 fee)
 6,000  event cost    →  operating-cost / event-cost,  -6,000
    15  transfer fee  →  folded into the salary row
```

The tell is a compound 摘要 — `薪水和活動`, `薪水和場地` — or an amount that does not match the
person's usual salary. When you split one, note the arithmetic in **both** rows' `notes` so the
next reader can see where the other half went.

---

## 4. What only the statement knows

These never generate an email. If the close starts from Gmail, they are simply missed, and the
identity is what catches them:

- **課程分潤 receipts** — the 摘要 may name the payer, or may say only `７月課程分潤`
- **Inbound 匯費** — the NT$15 above
- **Card settlements** — `ＣＤ轉收` lines from 國泰世華 / 玉山
- **Bank interest** — a small `income` / `interest` row, usually quarterly
- **Transfers with a bare 摘要** — `轉支`, `網路跨轉` with no counterparty

For any of these where the counterparty cannot be established, book the row with a `⚠` note in
`notes` saying exactly what is unconfirmed. Booking a flagged row beats leaving the month unclosed;
leaving it *unflagged* is what you must not do.

---

## 5. Vendor → product line

The Financial Model splits revenue by matching the `vendor` string. Get this wrong and the money
lands in the wrong line while every total stays correct — which makes it hard to spot.

| Product line | Matches |
|---|---|
| **課程 (Hahow)** | `income` / `course-revenue` where vendor matches `*Hahow*`, `*好學校*` or `*原騰*` — 好學校 **is** Hahow's Chinese name, and 原騰數位科技 / 數位簡報室 pays the Hahow 分潤 |
| **課程 (Other)** | All other `course-revenue`, plus `card-settlement` |
| **活動** | ACCUPASS only — `盈科泛利 (ACCUPASS)`, `ACCUPA`. Pays by 匯款 with 委託代銷 descriptions, so it never overlaps card settlements |
| **顧問 · B2B** | `client-payment` |

⚠ **`總收入` in the Financial Model is not operating revenue.** A 業外 row sweeps in everything
whose *subcategory* is `transfer`, `interest` or `refund` **regardless of category** — including
expense rebates booked as `misc` / `refund`. A single capital transfer in has made a month look
like a million-dollar revenue month.

Operating revenue = `總收入` − (transfer + interest + refund). State it that way in the report,
and show the 非營業 figure separately rather than burying it.

---

## 6. Recurring vendors — the completeness check

These bill every month. A missing month is nearly always an oversight, so check the month has one
of each before closing. All are `source: personal`, `operating-cost` / `software`, and pending
reimbursement unless stated.

| Vendor | Cadence | Notes |
|---|---|---|
| Anthropic | Monthly, plus ad-hoc API top-ups | Team plan + Max plan are separate rows |
| OpenAI | ~2nd of the month | EUR |
| Supabase | ~1st | |
| Vercel | ~10th | |
| Google (Workspace) | End of month | Seat count drifts — check the invoice, don't assume |
| Buffer | ~19th | |
| Kit (ConvertKit) | Annual, in August | Large single charge |

The bank-side recurring items are payroll (four people, around the 6th, for the *previous* month)
and 記帳士 / 國稅局 payments, which are irregular.

---

## 7. The report's honest numbers

When writing the monthly report:

- Lead with whether the identity held. If it did not, say so before any other number.
- Give operating revenue, not `總收入`, and show 非營業 separately.
- Give the pending reimbursement balance — it is a real liability and it compounds.
- Name every `⚠` row still open, with what would settle it.
- State the ledger's remaining headroom to row 200.

A report that quietly presents an unreconciled month as a clean one is worse than no report.
