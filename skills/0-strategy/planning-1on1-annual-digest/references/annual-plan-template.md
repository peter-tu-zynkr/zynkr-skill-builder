# 年度計畫 — Doc skeleton + slide block (contract for `planning-1on1-annual-digest`)

This file is the exact shape of the two artefacts the skill produces. The section
titles are **verbatim** — the exemplar 「年度計畫＿Peggy」 (sources §A) uses them, and
`planning-prework-pack` / the founder read them by name. Fill every `{{…}}`; where a
value has no source, write `（待補）` (proof / evidence) or `待定` (targets), never a
guess (pack §9).

Formatting rule: **plain headings + `- ` bullets only.** No markdown tables, no
checkboxes, no nested numbering deeper than one level — those do not survive the
Doc creation path (`import_to_google_doc` converts `#`/`##` headings and `-` lists to
native Docs styles but drops tables and checkboxes; `create_doc(content=…)` is plain
text). Sub-headings inside a section are plain lines ending with `：`.

Reader rule: the Doc is **teammate-facing** — the person reads it before their session.
Everything inside §A is written for them in plain zh-TW: no pack section numbers, no
skill names, no tool or column names in the body. Internal provenance (which tracker
column, which skill writes the OKR tracker) belongs in the chat report, not the Doc.

Evidence tag rule: every factual claim in 一 and 三 ends with its source tag —
`（WB YYYY/M/D）` for a 1:1 entry, `（Tracker #N.NN）` for a tracker row,
`（<plan Doc short name>）` for a strategy statement. Multiple tags: `（WB 2026/3/4・WB 2026/5/6）`.

---

## A · Doc skeleton (Drive title: `年度計畫＿{{NAME}}`)

```
{{LINE}}・年度計畫（{{CYCLE_LABEL}}）

主體：{{NAME}}（{{LINE}}，L1 {{L1_NUMBERS}}）
策略依據：{{PLAN_DOC_TITLES}}（含 {{ADDENDUM_DATE}} Refresh 附錄）· {{TRACKER_TITLE}}
協作主管：{{MANAGER}}
整理範圍：1:1 文件 WB {{WB_FIRST}}–{{WB_LAST}}（共 {{WB_COUNT}} 篇）· {{TRACKER_TITLE}} 中 {{NAME}} 負責的項目 {{TRACKER_ROW_COUNT}} 筆 · 週期 {{WINDOW_START}}–{{WINDOW_END}}

一、過去一年成果總覽

{{PRODUCT_OR_PROJECT_1}}：
- {{YYYY/MM}}：{{成果一句話}}（WB {{YYYY/M/D}}）
- {{YYYY/MM}}：{{成果一句話}}（WB {{YYYY/M/D}}・Tracker #{{N.NN}}）

{{PRODUCT_OR_PROJECT_2}}：
- {{YYYY/MM}}：{{成果一句話}}（WB {{YYYY/M/D}}）

一起長出來的系統資產：
- {{SOP／模板／工具／文件／tracker 名稱}} — {{一句話說明它移除了什麼依賴或補了哪個缺口}}（WB {{YYYY/M/D}}）
- {{…}}

二、策略透鏡：{{CYCLE_LABEL}} 在打什麼

核心命題：
- {{整合計畫 Doc 或 LOB 計畫 Doc 的一句話主張；沒有就寫「待定（計畫文件未明說）」}}（{{PLAN_DOC_SHORT}}）

四大限制（卡住一切）：
- C1 現金／runway：{{計畫文件的填法；缺 → 待定（計畫文件未明說）}}
- C2 創辦人單點：{{…}}
- C3 產品／價值階梯缺口：{{…}}
- C4 儀表化：{{…}}

你這條線的任務：
- {{LOB 計畫 Doc 的 mandate 一句話}}（{{PLAN_DOC_SHORT}}）
- 本週期掛在你名下的 P0：{{Tracker #… 項目名}} · {{…}}（Tracker）

三、復盤：過去成果 × 策略支柱

放大（可持續的資產，繼續投入）：
- {{成果}} — 打到 C{{n}}：{{一句話為什麼}}（WB {{YYYY/M/D}}）

收割（做完了，維運＋變現，不再新建）：
- {{成果}} — 打到 C{{n}}：{{一句話}}（WB {{YYYY/M/D}}）

停止或改造（策略說要收掉或重做的）：
- {{成果／做法}} — 打到 C{{n}}：{{一句話}}（WB {{YYYY/M/D}}）

四、年度計劃

主軸 1：{{名稱}}（{{對應 C 幾＋策略支柱}}）
- 關鍵路徑：{{里程碑 1}} → {{里程碑 2}} → {{里程碑 3}}（Tracker #{{…}} 若已有）
- 為什麼排第一：{{一句話——先做便宜、會複利的事，再做要花錢的擴張}}

主軸 2：{{…}}
- 關鍵路徑：{{…}}

主軸 3：{{…}}
- 關鍵路徑：{{…}}

（3–5 條，依先後排序）

五、年度目標（OKR）

O：{{一句話目標，對得回二、的核心命題}}
- KR1：{{可量化敘述}} — {{數字（來源：Tracker／OKR Tracker／計畫 Doc）或 待定}}
- KR2：{{…}} — {{數字 或 待定}}
- KR3：{{…}} — {{數字 或 待定}}
- KR4：{{…}} — {{數字 或 待定}}
- KR5：{{…}} — {{數字 或 待定}}（第 5 條可省）

六、接下來

寫進 OKR tracker（session 後統一填入；本文件不代填）：
- O → OKR tracker 的 Objective；KR1–KR{{n}} → 對應 KR，Owner＝{{NAME}}，對到 Tracker #{{…}}

這個月先動 3 件事：
- {{事 1}}（對應主軸 {{n}}／Tracker #{{…}}）
- {{事 2}}
- {{事 3}}

（本文件於 {{TODAY}} 依 1:1 文件、{{PLAN_DOC_SHORT}}、{{TRACKER_TITLE}} 整理；待補／待定共 {{PENDING_COUNT}} 處，請 {{NAME}} 於 session 前補齊或確認。）
```

---

## B · 12-line slide summary block (chat output; consumed by `planning-prework-pack`)

Exactly twelve lines, in this order. Keep each item to one line; proof numbers only
from a source, otherwise `（待補）`; goals quote the KR number or `待定`. **Top risk is a
business risk** (delivery / capacity / dependency / market — from 待完成／Action／思考
rows, the tracker or the plan Doc), phrased `<risk>（→ C-n）`; the 我的感覺 morale score
never appears here — this block is team-visible (parsing file §2a).

```
【{{NAME}}｜{{LINE}}】{{CYCLE_LABEL}} 一頁摘要
Top-3 delivered：
1. {{成果}}（WB {{YYYY/M/D}}）— {{proof number 或（待補）}}
2. {{成果}}（WB {{YYYY/M/D}}）— {{proof number 或（待補）}}
3. {{成果}}（WB {{YYYY/M/D}}）— {{proof number 或（待補）}}
Top-3 goals：
1. {{主軸／KR}} — {{數字 或 待定}}
2. {{主軸／KR}} — {{數字 或 待定}}
3. {{主軸／KR}} — {{數字 或 待定}}
Top risk：{{一句話}}（→ C{{n}}）
Source：年度計畫＿{{NAME}}（{{DOC_URL}}）· 1:1 WB {{WB_FIRST}}–{{WB_LAST}}
待補／待定：{{PENDING_COUNT}} 處（見文件 五、與 一、）
```

---

## C · Section-by-section acceptance checks (run before creating the Doc)

- 一 — every bullet has a `（WB …）` or `（Tracker …）` tag; grouped by product/project,
  month-ordered inside each group; 「一起長出來的系統資產」 lists only durable things
  (SOP · template · tool · Doc · tracker · automation), not one-off tasks.
- 二 — 核心命題 / C1–C4 / mandate each carry a plan-Doc tag or say 待定; nothing here is
  the skill's own opinion.
- 三 — every item names exactly one bucket (放大 / 收割 / 停止或改造) and one constraint
  `C1–C4`; every item traces back to a bullet in 一.
- 四 — 3 to 5 主軸, ordered, each with a 關鍵路徑 line; the order follows pack §4
  (cheap compounding first, capital-heavier convert/scale gated behind it).
- 五 — one O, 4–5 KRs; every KR ends with a number **and its source** or `待定`.
- 六 — the OKR-tracker mapping is described, not executed; exactly three 這個月 items,
  each pointing at a 主軸 or a Tracker #.
- Whole Doc — zh-TW; six sections in this order with these exact titles; no tables,
  no checkboxes; header lines 主體／策略依據／協作主管／整理範圍 present.
- Attribution — no bullet in 一／三／四／六 comes from the 1:1 Doc's `Peter` sub-block or
  the `What's on my mind (Peter)` field; no 我的感覺 score or mood wording anywhere in
  the Doc or the slide block (parsing file §2a).
- Reader-safe — no `pack §`, skill slug, tool name or tracker column name inside the Doc
  body; the internal provenance lives in the chat report only.
