# Scoreboard tab layout + numbers-slide text (planning-evidence-pack)

> Skill-specific reference: the exact shape of what the skill writes. Column names are
> fixed so `planning-prework-pack` can read the tab back without guessing.

## 1 · Tab / Sheet naming

| Situation | What is written |
|---|---|
| Session workbook ID given, no `Scoreboard` tab yet | new tab named exactly `Scoreboard` (`create_sheet` + `modify_sheet_values`) |
| Workbook has a `Scoreboard` tab already | new tab `Scoreboard — YYYY-MM 現行版` (pack §8: version by new tab, never overwrite); the old tab is left untouched |
| No workbook given | new spreadsheet `<YYYY> <cycle> Scoreboard — 數字回顧` created, then moved into the planning hub folder (ID: `./planning-sources.md` §A); if the move tool is unavailable, print the new Sheet URL and ask the user to move it |

## 2 · Columns (rows 1–3 = key · row 4 = header · data from row 5; exact strings)

Header row (row 4), columns A–F:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| `KPI` | `source` | `<cycle>-start` | `<cycle>-end` | `Δ` | `note` |

- `<cycle>` is the label from Step 0 (`H1` / `H2` / `YE`), e.g. `H2-start` · `H2-end`.
  A mid-cycle run appends the as-of date to the end header: `H2-end (as of 2026-08-17)`.
  For **flow** rows `<cycle>-start` holds the previous cycle's count (baseline; note opens
  with `baseline = 上一週期 <window>`); for **stock** rows it is the level at the cycle's
  first day (`./kpi-source-map.md` §1).
- `source` is one of: `tracker` · `tracker snapshot` · `OKR tracker` · `calendar` ·
  `gmail fireflies` · `pasted` · `connector:<name>` — the S-family label from
  `./kpi-source-map.md` §2 in plain words.
- Rows are grouped by L1 (pack §2) with one bold group row per LOB (`1.0 Marketing &
  Brand`, `2.0 Sales & Consulting`, …) and a final `公司整體` group for cash / runway /
  team-rhythm counts. Group rows carry no values.
- Rows 1–3 hold a small key above the header: `cycle` · `window` (`YYYY-MM-DD →
  YYYY-MM-DD`) · `generated` (date + 「planning-evidence-pack」); the header row is
  therefore row 4 and the data start at row 5 (SKILL.md Step 8 order: key rows → header →
  group rows → KPI rows → `公司整體`). Freeze rows 1–4 (`format_sheet_range` or leave for
  the user).
- `（待補）` cells are written as text; the `note` cell carries the exact-source line
  (`./kpi-source-map.md` §4).
- Optional colour (only if `format_sheet_range` is available): `（待補）` cells light
  amber; nothing else — the tab is data, not a dashboard.

## 3 · Numbers-slide text (5 stat tiles — the deck's 「looking back in numbers」 slide 4)

The count is set by the consumer: `planning-prework-pack`'s
`references/session-workbook-template.md` §2 gives slide 4 (Part 1 · Looking Back)
**5 big-number tiles** (value + caption). Printed as a text block in the chat and appended
as a small block below the table on the tab (rows after the data, one blank row apart,
header `Slide tiles`). Shape:

```
【<cycle> 數字回顧】
① <大數字>  <標籤>          （<source> · Δ <±n> vs <cycle>-start）   ← stock KPI
② <大數字>  <標籤>          （<source> · Δ <±n> vs 上一週期）        ← flow KPI
③ …
④ …
⑤ …
資料日期：<as-of date>　缺口：<n> 項待補（見 Scoreboard note 欄）
```

Δ label: **stock** tiles say `vs <cycle>-start` (a level at the cycle's first day); **flow**
tiles say `vs 上一週期` (the previous cycle's count — `./kpi-source-map.md` §1); a row with
`—` in `<cycle>-start` prints no Δ.

Tile-selection rules (deterministic — a reviewer can re-derive the five):

1. Only KPIs whose `<cycle>-end` is a real number qualify. `（待補）` never becomes a tile.
2. Fill five tiles from this priority order, one tile per LOB group where possible (six
   candidates, so one missing group still yields five): 公司整體 (cash / runway or headline
   revenue if pasted) → 1.0 demand (subscribers / LINE members / content count) → 2.0 sales
   (Demo 場次 or pipeline number if pasted) → 4.0 / 3.0 delivery (講座 + 直播 count, or 完成
   items) → 6.0 product (marketplace agents / platform metric) → tracker headline (`完成 N /
   55 項` style — the denominator is the tracker's own row count, read, not remembered).
   The first five candidates with a real number win; a sixth is never printed.
3. Fewer than five qualifying KPIs ⇒ fewer tiles, and the block says
   `（本次只有 n 個有數字的 tile；其餘待補）`. Never pad with an estimate.
4. Each tile's parenthesis names its source family so the deck stays auditable.

Consumer: `planning-prework-pack` pastes this block into the deck request it hands to
`zynkr-slide` (template-fill on the designed deck's looking-back slide, sources §A).
