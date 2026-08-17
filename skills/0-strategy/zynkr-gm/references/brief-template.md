# Weekly GM brief — template (blocks 00–08)

The brief has a **fixed order** so the reader learns where to look. Body language: zh-TW,
keeping English terms exactly as the source docs use them (P0, KPI, LOB, runway, Refresh…).
Every number carries `（來源：<source> · <as-of>）`. Never restate a number from a narrative
doc; never invent a metric that has no Actual — list it as an ask instead.

**Subject:** `<subject_prefix><YYYY-MM-DD>（W<ww>）— <one-line focus>`
Example: `【GM 週報】2026-08-17（W34）— 先拆掉 §D 決策，再收 08-15 名單`

---

## 00 · Runway（永遠第一行）

One line, always present, always first:

`Runway <N> 個月 · burn NT$<x>k / 上限 NT$<cap>k · 帳務截至 <as-of>（來源：<sheet/tab or accounting> · <date>）`

State colour: **RED** if `N < runway_floor_months`, or `as-of` older than `books_stale_days`,
or no runway figure exists anywhere (then the line reads `RED · Runway 未計量 — 沒有任何來源提供
runway 數字`). AMBER if within 0.5 month of the floor. GREEN otherwise. RED/AMBER/GREEN are
semantic states, not brand colours.

## 01 · 只有 GM 能拆的三件事（≤3）

Numbered, three at most. Sources, in this order: open decisions past or within 7 days of
their decide-by (or with no decide-by at all and blocking a P0); P0s owned by the GM with 結束
≤14 days; P0s UNDATED for >2 weeks (any owner — the GM's job is to make the absence visible).
Each item: what · why now (one clause) · what "done" looks like (a stamped record, a date on
the tracker, a sent message — never "a conversation").

## 02 · 兩個時鐘

- 現金時鐘：runway (from 00) → "at current burn, floor is reached <date>".
- 日曆時鐘：days to Q3 end · days to H2 end · every P0/P1 with 結束 ≤30 days (id · item · owner ·
  date).

## 03 · P0 / P1 狀態（依 LOB）

One table per LOB in tracker order (1.0 → 8.0). Columns: `#` · 項目 · 負責人 · 狀態（tracker）·
derived states · 證據 · 下一步. Derived states use the words in `derived-state-rules.md`
(ENDS_SOON · OVERDUE · UNDATED · PROPOSE_DONE · DIRECTION_UNLABELLED · STALLED). Evidence is
one clause pointing at where you saw it (tracker Δ, weekly-log section, sheet row). Every P0
appears exactly once. P2 items appear only if OVERDUE.

## 04 · 各 owner 摘要

One line per owner (as named in the tracker): P0 held · P1 held · UNDATED · OVERDUE · ENDS_SOON ·
asks (what the brief needs from them) · 最近一次出現在週報 (newest weekly-log block that mentions
their function). End with a GM-load line: `GM 持有 <k>/<n> 個 P0（<pct>%）`.

## 05 · KPI 偏離 + 待補數字

Two lists from the KPI dashboard:
1. **偏離**：rows that have BOTH a target and an Actual, where the Actual misses the current
   quarter's target → metric · target · actual · as-of · owner.
2. **待補**：rows with no Actual → metric · owner · class (AUTO / SEMI / HUMAN per `kpi-map.md`)
   · how it would be filled. Batch asks by owner; do not repeat an ask sent last week unless
   it is P0-linked.
Cloud runs: CRM/accounting-backed metrics are marked `（排程執行無法讀取 · 待本地補）`.

## 06 · 決策登記簿

Table: id · 事項 · label（已定案 / 還在摸索 / 未標）· 決策者 · decide-by（或「無期限」）· 狀態 ·
來源. Sources: the ops heal sheet's decisions tab; open decisions named in the strategy
docs' authoritative sections; DIRECTION_UNLABELLED P0s (label 未標). Overdue or no-date rows
are carried every week until closed.

## 07 · 本週刻意不做

3–5 named skips with one clause each. An unstated skip becomes an unnoticed slip.

## 08 · 機器健康

- Routines: newest weekly livestream note date (flag if >8 days); this brief's own
  idempotency result.
- SOR docs changed in the last 7 days (name · modified date · which authoritative section).
- Sources this run could not read, and why (unavailable in cloud / read failed / not found).

---

## Chat rendering

Same blocks as Markdown H2 headings `## 00 · Runway` … `## 08 · 機器健康`. Tables as
Markdown tables. Keep 03 compact (one table per LOB, no prose).

## HTML email skeleton (all CSS inline — Gmail strips `<style>`)

Palette (brand tokens, sync 2026-08-17): page `#FBF7F0` (paper) · card `#FDFAF5` · ink
`#0F0F0E` · mute `#6F6B62` · line `rgba(43,43,40,.14)` · label sage `#5FA48A` · callout
`#DCEEE6`. Semantic (not brand): RED bg `#FEE2E2` fg `#B91C1C` · AMBER bg `#FEF3C7` fg
`#B45309` · GREEN bg `#DCFCE7` fg `#15803D`. Font stack:
`-apple-system,'Segoe UI','PingFang TC','Noto Sans TC','Microsoft JhengHei',Roboto,Helvetica,Arial,sans-serif`.

```html
<div style="background:#FBF7F0;padding:24px 0;font-family:-apple-system,'Segoe UI','PingFang TC','Noto Sans TC','Microsoft JhengHei',Roboto,Helvetica,Arial,sans-serif;color:#0F0F0E;">
 <div style="max-width:680px;margin:0 auto;padding:0 16px;">
  <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6F6B62;font-family:ui-monospace,Menlo,monospace;">GM 週報 · {{YYYY-MM-DD}} · W{{ww}}</div>
  <div style="font-size:22px;font-weight:800;line-height:1.3;margin:4px 0 16px;">{{one-line focus}}</div>

  <!-- 00 runway: RED/AMBER/GREEN card -->
  <div style="background:{{state_bg}};border-radius:12px;padding:14px 18px;margin:0 0 14px;">
   <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:{{state_fg}};">00 · RUNWAY</div>
   <div style="font-size:16px;font-weight:700;color:{{state_fg}};margin-top:4px;">{{runway line}}</div>
   <div style="font-size:12px;color:#6F6B62;margin-top:2px;">{{（來源 · as-of）}}</div>
  </div>

  <!-- generic block card; repeat for 01..08 -->
  <div style="background:#FDFAF5;border:1px solid rgba(43,43,40,.14);border-radius:12px;padding:16px 18px;margin:0 0 14px;">
   <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#5FA48A;font-family:ui-monospace,Menlo,monospace;">{{NN · TITLE}}</div>
   <!-- 01: <ol> with 3 items; 03/04/05/06: <table style="width:100%;border-collapse:collapse;font-size:13px;"> with header cells color #6F6B62 and row borders 1px solid rgba(43,43,40,.08); 07: <ul>; 08: <ul> -->
  </div>

  <div style="font-size:12px;color:#6F6B62;text-align:center;margin-top:8px;line-height:1.6;">本週報由 zynkr-gm 依 SOR 順序自動彙整（tracker → 週報 → OKR/KPI → 各 function 進度表）；每個數字附來源與日期。</div>
 </div>
</div>
```

HTML-escape user text (`< > &`). Keep tables `width:100%` and cells `padding:6px 8px;
vertical-align:top;`. No images, no external CSS, no scripts.
