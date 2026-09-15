# Wording

Everything this skill publishes is read by six colleagues, in zh-TW, in a chat room and a Doc
they use all day. It should read like a competent teammate wrote it, not like a report
generator emitted it.

The house rules come from **`/content-translator`** (skill `1.13`). That skill exists to remove
翻譯腔 from translated text; the same failure shows up here for a different reason — text
assembled from field names, status enums and internal mode names has exactly the same stiff,
machine-shaped smell. Apply its Step 2 rules and its Step 3 self-check to anything this skill
writes.

**This matters most for the lines that are *not* in `message-templates.md`.** The agenda
bullets, the recap mail body and every failure notice are composed fresh each run, so they are
where the register actually drifts.

---

## The four habits that cause it

### 1. 官腔 — bureaucratic verbs

The Doc and the chat are not a government filing.

| Don't | Do |
|---|---|
| 本週週報開始**徵集** | 這週的週報開始**收**囉 |
| 週四議程已**產出** | 週四的議程**整理好了** |
| **決議候選** — 本週 0 項 | **這次沒有要決定的事** |
| 六位回報者**皆**用舊格式回報 | 六位**都還在用舊格式** |

### 2. Half-translated lines

Leaving one English word in a Chinese sentence is the loudest tell. Keep only brand names,
code identifiers and acronyms with no Chinese standard (`API`, `KPI`, `Doc`, `SEO`).

| Don't | Do |
|---|---|
| KPI **off-target** 3 項 | KPI **沒達標** 3 項 |
| 逾期與 **carry-over** | 逾期和**一直沒動的** |
| 下週各部門 **focus** | 下週各部門**要做的事** |
| 完整 **recap** 已寄出 | **完整版**已經寄到大家信箱 |
| 事項 — **Not started** | 事項 — **還沒開始** |

### 3. Internal names leaking out

`nudge`, `rollup`, `agenda`, `骨架`, `unrouted_heading`, `↻` thresholds and cell references are
this skill's vocabulary, not the team's. Translate them at the boundary — the mapping table is
in `message-templates.md`.

| Don't | Do |
|---|---|
| ⚠ **rollup** 這週沒有完成 | ⚠ 這週的**週報彙整**沒跑完 |
| 下週**骨架**已開 | **下週的區塊也開好了** |
| 共 57 項候選中已濾除**範本／連結標籤** | （just show the items; the filtering is not news） |

### 4. Explaining your own machinery

A reader wants the finding, not the method. Parenthetical notes about how many candidates were
scored and what was filtered belong in the run report, which only Peter reads — never in the
Doc block.

> 連續3週以上未動（前5項，共57項候選中已濾除範本／連結標籤）— …

becomes

> 這幾件連續三週以上沒動 — …

---

## Rhythm

Short sentences for the finding, longer only when explaining. Conversational particles
(`囉`、`吧`、`喔`) are fine in Chat, sparingly, and belong nowhere in the Doc. Drop the subject
pronoun when context carries it. Use `·` for a series, and no ending 句號 on headings or
one-line items.

## Say the awkward thing plainly

The most common failure is a line that hides a bad result behind neutral phrasing. If there
were no decisions, say there were none **and why**. If a number cannot be checked, say it
cannot be checked — not that it is on target.

| Don't | Do |
|---|---|
| KPI off-target — 無法比對 | KPI 這欄還沒有人填數字，所以沒辦法看有沒有達標 |
| 決議候選 — 本週 0 項 | 這次沒有要決定的事：大家都用舊格式回報，沒有「卡關」那行 |

## Frozen strings — never reword

Two strings are machine-readable idempotency keys, not prose. Changing either one makes the
loop write duplicates:

- `〔自動彙整 <week> · <stamp>〕` — `rollup` searches the section for `〔自動彙整 <week>`
- `— zynkr-ops-weekly · <week>` — the Chat footer every delivering beat looks for

`↻N週` is also fixed: `norm_key()` in `render_block.py` strips it with the regex
`↻\s*\d+\s*週`, so appending words to it silently breaks carry-over matching.

## Two week vocabularies, on purpose

`<week>` above is the **week-beginning label**, `WB 9/14` — the Monday that opens the week.
That is what the team reads, in the Doc and in the space.

The **ISO key**, `2026-W38`, stays in two machine-only places: the launchd state files
(`<week>.<mode>.done`, which is how `run_ops_weekly.sh` knows a beat is settled) and the
`week=` field of the receipt line. Neither is ever read by a person, both need to be
year-qualified and sortable, and the scheduler derives its own key independently — it greps
the receipt for `status=ok` and nothing else. `parse_reports.py` emits both, as `week` and
`week_iso`.

This is a deliberate split, not drift. Do not "fix" it by unifying them: a label without a
year is wrong for a state file, and an ordinal nobody can place is wrong for a chat message.

## The changeover

The label changed from `W38` to `WB 9/14` on **2026-09-15**. Sections written before that
carry the old shape. Until no live section predates the change — three weeks, given the
archive — every idempotency search must accept **both**:

- `〔自動彙整 WB 9/14` **or** `〔自動彙整 2026-W38`
- `— zynkr-ops-weekly · WB 9/14` **or** `— zynkr-ops-weekly · W38`

Matching only the new shape makes `rollup` write a second block into a section that already
has one, and makes `decisions` conclude the loop never ran and refuse to send the recap. Drop
the legacy arm once three weeks have passed, the same way `--accept-untagged` gets dropped.
