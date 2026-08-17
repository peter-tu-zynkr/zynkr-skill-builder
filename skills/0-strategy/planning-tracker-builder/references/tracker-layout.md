# Tracker layout contract — `planning-tracker-builder`

> Skill-specific reference (not part of the byte-identical family pack). It
> pins what the July 2026 tracker actually contains — column map, formula
> strings, pivot grid, colour defaults — plus the lint rules and report shapes
> the skill prints. Cite the shared pack for *why* (`planning-knowledge-pack.md`
> §2 taxonomy · §3 priority · §4 C1–C4 · §6 tabs · §8 versioning); this file is
> the *how*. IDs live in `planning-sources.md`; none here.

## 1 · Item schema → SOR tab column map

Header row (row 1, exact strings, columns A–M):

| Col | Header | Item field | Fill rule |
|---|---|---|---|
| A | `#` | number | L1 header row: `<prefix>.0` · item: `<prefix>.NN` (two-digit serial, `1.01` … `1.12`, continue `max+1` under that prefix in extend mode). The prefix is **positional** — see the numbering rule below — not the pack §2 number. **Text, not number** — the live tracker stores `'1.10'` / `'2.0'`; write with `value_input_option="RAW"` (USER_ENTERED turns `1.10` into 1.1 and `1.0` into 1, breaking the `#` keys and the `^\d\.0$` header match) |
| B | `主類別` | L1 | header row AND every item row carry the L1 label **with its pack §2 number**, e.g. `1.0 Marketing & Brand`, `4.0 Knowledge & Training`, `6.0 Tech & Platform` — this text, not the `#` prefix, is what identifies the L1 |
| C | `子類別` | L2 | `2.2 業務招募` — numeric prefix is what the lint matches; wording may be the tracker's short form; blank on header rows |
| D | `項目（正規化）` | 項目 | the normalized text from session-synth ③/④ (or the pasted row); blank on header rows |
| E | `重要` | 重要 | exactly `重要` / `不重要` (blank if unrated) |
| F | `緊急` | 緊急 | exactly `緊急` / `不緊急` (blank if unrated) |
| G | `Priority` | derived | the formula in §2 (or the value when the user asks for values) |
| H | `負責人` | owner | one name; `N/A` only on P3; `All` allowed but linted (T3); undecided ⇒ `未定` (T4) |
| I | `協助者` | helpers | comma-separated names, `All`, or `N/A` |
| J | `開始` | start | `YYYY-MM-DD` literal placeholder when unknown |
| K | `結束` | end | same |
| L | `狀態` | status | `未開始` · `進行中` · `完成` · `放棄` — exact strings; default `未開始`; P3 ⇒ `放棄` |
| M | `備註` | note | free text; lint overrides are written here as `lint override: <reason>` |

L1 header rows: A = `<prefix>.0`, B = L1 label, C–M blank. Fresh / fill: all
eight header rows are always present, in pack §2 order, even when a block has
zero items (coverage echo).

**Numbering rule (matches the live July tracker — print it in every row plan):**

- The pack §2 L1 number lives in the `主類別` **text** (`6.0 Tech & Platform`).
- The `#` prefix of an L1 block is **positional — sequential by presence**: the
  blocks that exist are numbered `1.0`, `2.0`, … in the order they appear. The
  July tracker has no `5.0 Dev-Ops` and no `8.0 Finance` block, so its header
  row whose `主類別` reads `6.0 Tech & Platform` carries `#` `5.0` and its items
  are `5.01`–`5.04`; `7.0 People & Talent` carries `6.0` / `6.01` …. L2 text
  keeps its own pack §2 prefix (`4.5 會員經營` under the `4.0 Knowledge &
  Training` block).
- Fresh / fill: all eight blocks are written, so `#` prefix = pack §2 number
  (`1.0`–`8.0`); the same rule is still stated in the row plan.
- Extend: (a) locate L1 blocks by `主類別` text (fallback: `#` matching
  `^\d\.0$`); (b) continue serials from `max(existing serial under that
  block's # prefix) + 1`; (c) an L1 with no block yet ⇒ append a new header
  block after the last one, `#` prefix = last existing prefix + 1, `主類別` =
  the pack §2 label with its own number. Never rewrite an existing prefix.

Worked example — extend the July tracker (blocks present: `1.0` Marketing ·
`2.0` Sales · `3.0` Ops · `4.0` Knowledge · `5.0` ← `6.0 Tech & Platform`
(items `5.01`–`5.04`) · `6.0` ← `7.0 People & Talent`) with two Tech items and
one Finance item:

| new item | `#` | `主類別` | why |
|---|---|---|---|
| Tech item A | `5.05` | `6.0 Tech & Platform` | block found by 主類別 text; its `#` prefix is `5`; max serial was `04` |
| Tech item B | `5.06` | `6.0 Tech & Platform` | serial continues |
| Finance item | `7.01` | `8.0 Finance & Admin` | no Finance block exists ⇒ new header row `#` `7.0` appended after `6.0` (last prefix 6 + 1); 主類別 text keeps the pack §2 `8.0` |

Row-plan line for this case: `# 前綴依位置排序（現有 1=1.0 Marketing … 5=6.0 Tech &
Platform · 6=7.0 People & Talent）；主類別文字帶 pack §2 編號；新 L1 8.0 Finance →
前綴 7.0`.

**Write discipline (SKILL.md Hard rule 6):** every `range_name` is prefixed with
the tab — `'<SOR>'!A1:M<n>` — and every `resize_sheet_dimensions` names
`sheet_name=<SOR>`; an unprefixed call goes to the FIRST tab (README). Columns
A–F and H–M (every data column) are written `RAW`; **every formula write** —
column G in its own call, AND the whole `專案項目小記` grid (§3: COUNTIF /
COUNTIFS / SUM / ratio cells) — is `value_input_option="USER_ENTERED"` so the
formulas evaluate instead of landing as literal text.

## 2 · Priority formula (the template's own — reuse verbatim, row-relative)

```
=IF(OR($E3="",$F3=""),"",IF(TRIM($E3)="重要",IF(TRIM($F3)="緊急","P0","P2"),IF(TRIM($F3)="緊急","P1","P3")))
```

Row 3 shown; substitute the row number for every item row. Header rows leave G
blank. Column G is written in its own call with `value_input_option=
"USER_ENTERED"` (range `'<SOR>'!G2:G<last>`, after the RAW data write); the
only other `USER_ENTERED` write is the `專案項目小記` grid (§3). Truth table = pack §3
(重要+緊急 → P0 · 不重要+緊急 → P1 · 重要+不緊急 → P2 · 不重要+不緊急 → P3).

## 3 · `專案項目小記` pivot grid, formulas, colours

Grid as built in July (row 1 blank; `<SOR>` = the SOR tab name, e.g. `H2 專案項目`
or `YE 專案項目` — re-point every reference when the tab is cycle-named):

| Cell | Content |
|---|---|
| B2:B5 | `P0` · `P1` · `P2` · `P3` |
| C2:C5 | `=COUNTIF('<SOR>'!G:G,B2)` … (row-relative) |
| D2:D5 | `=C2/SUM(C$2:C$5)` … formatted PERCENT (`format_sheet_range(range_name="'專案項目小記'!D2:D5", number_format_type="PERCENT")`) |
| F2:J2 | `Name` · `P0` · `P1` · `P2` · `Total` |
| F3:F<n> | one row per distinct 負責人 in the SOR tab (order: as first seen top-down; `All` included when present; `N/A` excluded) |
| G<r> | `=COUNTIFS('<SOR>'!$H:$H,$F<r>,'<SOR>'!$G:$G,"P0")` |
| H<r> | same with `"P1"` · I<r> with `"P2"` |
| J<r> | `=SUM(G<r>:I<r>)` |
| below | leave empty. Nothing else writes here — `planning-tracker-sync` writes `tracker-latest` / `tracker-snapshots` into the **OKR & KPI Tracker**, never into the Main Tracker. Fresh build: clear `'專案項目小記'!A<grid end + 1>:Z<tab rows>` in the copy so stray rows from the template do not carry over (`+1` — a shorter owner list must not leave a stale row; bound every range to the tab's grid size from `get_spreadsheet_info`, resizing first if the plan is longer) |

**Write:** the whole grid (labels B2:B5 / F2:J2 and every formula cell) goes in
one `modify_sheet_values` call with `value_input_option="USER_ENTERED"` — RAW
would store `=COUNTIF(...)` as text. Then the PERCENT format on D2:D5.

Extend mode with a second SOR tab: add a second grid block two rows below the
first (same shape, new `<SOR>`, `USER_ENTERED`), never overwrite the first.
Fill mode (the session-synth file, `專案項目小記` empty or missing): build the
grid from B2 exactly as above. **Guard:** if `專案項目小記` already holds a grid
(a live cycle) it is never rewritten — that run is extend/new-tab, the grid
goes two rows below the existing one (or in a new tab), and the README counts
of the other cycle are not touched.

Conditional colours (only when the duplicated tab carries none — check first;
`manage_conditional_formatting(action="add", range_name="'<SOR>'!A2:M1000",
condition_type="CUSTOM_FORMULA", condition_values=[<formula>], …)`):

| 狀態 | formula | background | text |
|---|---|---|---|
| 完成 | `=$L2="完成"` | `#D9EAD3` | — |
| 進行中 | `=$L2="進行中"` | `#FFF2CC` | — |
| 放棄 | `=$L2="放棄"` | `#EFEFEF` | `#999999` |
| 未開始 | `=$L2="未開始"` | none (leave default) | — |

L1 header rows: `format_sheet_range(range_name="'<SOR>'!A<r>:M<r>", bold=True,
background_color="#F3F3F3")`. Freeze row 1 with
`resize_sheet_dimensions(sheet_name="<SOR>", frozen_row_count=1)`. Extend mode:
rows inserted with `insert_rows_at` inherit the format of the row above — right
under an L1 header that is the bold grey fill — so reset the inserted range
first (`format_sheet_range(range_name="'<SOR>'!A<r1>:M<r2>", bold=False,
background_color="#FFFFFF")`) before writing items into it. Colours are
defaults — the user may name others.

## 4 · Lint rules T1–T8 (warn, never block)

| ID | Rule | Trigger | Line format |
|---|---|---|---|
| T1 | P0 cap (pack §3) | count(P0) > 6 **or** count(P0)/count(all items incl. P3) > 25% | `T1 · P0 = <n> (<pct>%) — 超過 ≤6 / 25% 的 Do-now 上限；房間選的規則：<rule or 未定>` |
| T2 | Owner load | any 負責人 with > 3 P0 | `T2 · <owner> 持有 <n> 個 P0（<#s>）— 建議轉 P2 或換 owner` |
| T3 | 掛 All | 負責人 = `All` (any priority) | `T3 · 掛 All 的項目需要認領：<#s>` |
| T4 | Missing owner | P0–P2 with 負責人 blank / `未定` / `N/A` | `T4 · P0–P2 缺負責人：<#s>` |
| T5 | Missing dates | P0 with 開始 or 結束 = `YYYY-MM-DD`; note (not warn) for P1/P2 with both dates missing | `T5 · P0 缺日期：<#s>（P1/P2 未填：<n> 筆，僅提醒）` |
| T6 | L2 off-taxonomy | L2 prefix not in pack §2 for that L1 | `T6 · <#> 子類別「<text>」不在 pack §2 — 建議 <nearest L2>；或本週期新增 L2（保留 L1）` |
| T7 | Duplicate 項目 | exact match after trim + full-width→half-width, or ≥ 90% token overlap | `T7 · 疑似重複：<#a> ↔ <#b> — 依 pack §7 判準建議 合併／不合併（理由）` |
| T8 | P3 hygiene | Priority = P3 and 狀態 ≠ 放棄; or 狀態 = 放棄 and Priority ≠ P3 | `T8 · P3 未標放棄：<#s>；放棄但非 P3：<#s>` |

Header of every lint report also carries the **coverage echo**: items per L1
keyed by the **pack §2 number in `主類別`** (not the positional `#` prefix):
(`1.0 12 · 2.0 9 · … · 5.0 0 ⚠ · 6.0 2 ⚠ · 8.0 0 ⚠`) — zero or ≤ 2 in
5.0 / 6.0 / 8.0 is flagged as a coverage gap with the pointer 「請看該 LOB plan
Doc 該有的項目」 (pack §2); it is a report line, not a rule the builder fixes.

## 5 · C1 cash pre-mortem — spend keywords

A P0 "implies spend" when 項目 or 備註 contains any of: `招募` `聘` `hire`
`headcount` `外包` `contractor` `freelance` `廣告` `Ads` `投放` `付費` `paid`
`預算` `budget` `採購` `購買` `訂閱` `subscription` `場地` `租` `venue`
`獎金` `分潤` `commission` `bonus` `顧問費` `agency` `工具` `tool` `平台費`.
List each with `#`, 項目, 負責人, 開始; then ask the founder to confirm the C1
floor holds (pack §4: ≥ 4 months runway; the runway number is the user's or
`（待補）` — never computed here). Keyword miss ≠ no spend: say so.

## 6 · Report shapes

**Lint report** (printed in Step 3):

```
LINT REPORT — 2026 YE · 48 items · fresh build
L1 coverage: 1.0 11 · 2.0 9 · 3.0 8 · 4.0 10 · 5.0 0 ⚠ · 6.0 4 · 7.0 4 · 8.0 2 ⚠
Priority: P0 9 (18.8%) · P1 8 · P2 17 · P3 14
T1 · —（P0 = 9 > 6 但 18.8% ≤ 25%；房間選的規則：25%）→ 僅提醒
T2 · 王小明 持有 4 個 P0（2.01 2.02 4.03 6.01）— 建議轉 P2 或換 owner
T3 · 掛 All 的項目需要認領：1.09 3.04
T4 · P0–P2 缺負責人：4.05
T5 · P0 缺日期：2.02 2.03 4.03（P1/P2 未填：15 筆，僅提醒）
T6 · 3.06 子類別「3.9 社群」不在 pack §2 — 建議 1.6 社群觸點營運（移到 1.0）
T7 · 疑似重複：1.03 ↔ 1.07 — 依 pack §7 #3 建議 合併（紅筆是黑筆項目的展開）
T8 · P3 未標放棄：—
C1 cash pre-mortem — P0 with implied spend:
  2.03 業務獎金制度（李小華 · 2026-01-15）· 1.06 Google Ads（王小明 · YYYY-MM-DD）
  以上 P0 進場後，C1 底線（runway ≥ 4 個月）是否仍成立？runway 目前 =（待補）
Owner/priority overrides so far: none. Reply: fix / override <T# reason> / go on.
```

**Row plan** (printed in Step 4):

```
ROW PLAN — mode fresh · copy of <template ID> → 「2026 YE Planning Main Tracker」 in <folder ID>
Tabs: README · YE 回顧總結 (dup of H1 回顧總結, emptied) · YE 專案項目 (SOR, dup of H2 專案項目)
      · 專案項目小記 (re-pointed, rows below grid cleared) · ② ③ ④ (emptied for session-synth)
(mode fill: 「<existing ID>」 · YE 專案項目 + 專案項目小記 both empty → filled in place · other tabs untouched)
(mode extend: 「<existing ID>」 · H2 專案項目 · rows inserted under blocks 1.0 / 5.0(=6.0 Tech) · new block 7.0(=8.0 Finance) appended after 6.0(=7.0 People))
YE 專案項目: row 1 header · 1.0 @row2 → 1.01–1.11 rows 3–13 · 2.0 @row14 → 2.01–2.09 …
Numbering: # 前綴依位置排序（fresh/fill = pack §2 1.0–8.0；extend = 現有 1=1.0 Marketing … 5=6.0 Tech & Platform · 6=7.0 People）；主類別文字帶 pack §2 編號；新 L1 → 前綴 last+1
Priority: formula (col G, USER_ENTERED) · data columns RAW · 狀態 default 未開始 · P3 → 放棄
Pivot owners: 王小明 · 李小華 · All · …  Colours: template rules kept
Leftovers foreseen: H1 回顧總結 + H2 專案項目 emptied — delete/rename in UI
Go? (nothing is written until you say so)
```

**Final report** (Step 7): `WROTE:` file name · ID · URL · tabs · row ranges ·
pivot rows · colour rules — `OVERRIDES:` T# + reason — `DID NOT:` 排除 rows ·
manual tab leftovers · `（待補）` README lines · anything skipped — `NEXT:`
`/planning-tracker-sync <ID>` · `/planning-suite-reconciler` when final.
