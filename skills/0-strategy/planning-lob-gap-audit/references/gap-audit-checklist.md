# Gap-audit checklist — the contract behind `planning-lob-gap-audit`

> Skill-specific reference (not part of the shared pack). It fixes: how the inputs are
> resolved, what the folder inventory records, the five gap classes G1–G5 (what each
> checks · evidence · tool + field · finding line), the four heal waves W1–W4, the
> owning-skill routing table, the report Doc skeleton, the 行動追蹤表 layout with its
> conditional colours, and the close-out shape. Vocabulary, taxonomy, priority rule and
> the doc-versioning convention are in `./planning-knowledge-pack.md`; every Drive ID is
> in `./planning-sources.md`. Nothing here restates them.

---

## 1 · Input resolution

| Input | Where it comes from | If missing |
|---|---|---|
| `lob` — one L1 number (`1.0` … `8.0`) | the user | ask; never audit "all LOBs" in one run |
| `cycle` — `H1` / `H2` / `YE` + year | the user; default = the cycle in sources §A | print the assumption |
| Plan Doc (+ its Refresh addendum) | sources §A "Per-LOB plan Docs" row (6.0 = shortcut → resolve `shortcutDetails.targetId` via `get_drive_file_permissions`) | user gives the ID |
| Main Tracker SOR tab | sources §A Main Tracker row + SOR tab gid | user gives the ID |
| LOB Drive folder | `~/.claude/skills/admin-governance/references/lob-folder-map.md` when that skill is installed → the row for `lob`. Its rows are labelled `0` · `1.0` · `2.0` · `3.0` · `4.0` · `5 (SDLC, legacy)` · `5.0 (Product)` · `7 (People)` · `8.0`; match on the L1 number — `5.0` → `5.0 (Product)` (never the legacy `5` row, whose children sit at Drive root) · `7.0` → `7 (People)` (three sibling folders — audit each) · `6.0` → no row. The **target folder** for the two new files is the first folder on the row, i.e. the `[N]` parent, unless the user names another. The map may lag a rename (pack §2 notes 5.0 was re-scoped 2026-08) — if the folder name it returns does not match the LOB, ask | no row for the LOB (`6.0`) or not installed → ask for the folder ID; never guess or search by name and assume |
| Prior audit (`[N.0.1] … Gap Audit` Doc + `行動追蹤表` Sheet) | found during the folder inventory (title prefix `[N.0.1]`) | none = first audit |
| Google account | sources file header | — |

## 2 · Folder inventory record

`list_drive_items(folder_id, page_size=100)` on the LOB folder, then once more on each
direct sub-folder (one level; deeper levels are listed under 未檢查). Every response that
carries `nextPageToken` is followed by another call with `page_token=<that token>` until
the token is empty; if paging stops early (error, cap), the folder goes under 未檢查 as
「<folder> 第 n 頁後未列」. Record per item:

`id · name · mimeType (Doc / Sheet / Slides / folder / shortcut / other) · modifiedTime ·
parent · prefix parsed from the name ([N.x] · [SUPERSEDED YYYY-MM] · [Archive] · [Draft] ·
[@]) · role-doc? (name contains 職務 / role / 工作說明 / SOP / 流程 / 指南 / handbook)`

Shortcuts: record the target ID (`get_drive_file_permissions`) but do not follow them into
other LOB folders — note "shortcut → outside scope" instead. Docs opened for content
(Step 4 of the workflow) are the addendum + plan body, every role doc / SOP the plan
names or that the prefix parse flags, and any Doc a tracker 備註 links. Everything else
is audited by title + modifiedTime only, and the report says so.

## 3 · The five gap classes

Finding line format (used verbatim in the report §4 and the Sheet 修復清單 → 發現):

`G<n>-<k> · <證據：Doc/Sheet title (ID) · modifiedTime or Tracker #N.NN or addendum line> · 問題：<one sentence>`

| ID | Class | What it checks | Evidence needed | Default wave |
|---|---|---|---|---|
| **G1** | P0/P1 without doctrine | every P0 and P1 row of this LOB in the SOR tab has EITHER a doctrine / SOP / playbook Doc in the folder (title match or addendum link) OR an owner-named plan paragraph in the plan Doc (owner = the row's 負責人); an item that runs "from someone's memory" is G1 | Tracker `#N.NN` + Priority + 負責人 · the addendum's P0 list · folder inventory titles | W3 (build missing doctrine); W1 if the item is in the plan but not in the tracker or vice-versa |
| **G2** | Contradicting role docs / SOPs | a role doc or SOP names a tool, system, channel, owner or cadence the plan / addendum has replaced (e.g. a tool the plan retired · an owner who left per the tracker roster · a KPI the plan dropped) | the role-doc sentence (quoted) + the plan/addendum sentence it contradicts + the doc's modifiedTime | W4 (rewrite) — W2 if the whole doc is superseded rather than partially wrong |
| **G3** | Referenced-but-missing docs | a Doc / Sheet / SOP the plan or addendum names or links does not exist in the folder inventory (or the link 404s / points at a trashed file) | the exact plan phrase or link + the inventory miss (searched titles listed) | W3 if it must be written; W1 if the plan should stop referencing it |
| **G4** | Unbannered superseded snapshots | an older version / snapshot / plan Doc still carries a live-looking title with no `[SUPERSEDED YYYY-MM]` prefix and no banner line pointing at the live doc (pack §8), OR two Docs claim the same role | both titles + IDs + modifiedTimes; which one the plan / GM Knowledge Directory treats as live | W2 (banners) |
| **G5** | Open founder decisions | a decision the plan / addendum / role docs need and only the founder can make (pricing, boundary between LOBs, headcount / capacity, tool retirement, a `NEEDS PETER` / `待定` / `待決` marker) — deduplicated across sources | the marker's location + what it gates (Tracker # or plan section) + any deadline stated | none — goes to §7 待決事項, not the heal list |

Coverage note: also record LOB-level smells that are not a numbered finding — the plan
Doc has no Refresh addendum at all (→ route to `planning-suite-reconciler`), zero P0/P1
rows for the LOB (→ pack §2 coverage-gap language), a folder with no `[N.x]` structure.

## 4 · Heal waves

| Wave | Name | Contains | Why this order |
|---|---|---|---|
| **W1** | SOR sync | tracker ↔ plan mismatches (item in one, not the other; owner / priority / dates differ; plan cites a retired item) | until SOR and plan agree, every later fix might target the wrong truth |
| **W2** | Banners & filing | `[SUPERSEDED YYYY-MM]` renames + one-line banners (incl., on a same-cycle re-run, the previous `[N.0.1]` report Doc + 行動追蹤表 → banner pointing at the new pair; 可交 Claude ✓); wrong-folder / duplicate docs; index and directory lines | cheap, mechanical, stops people reading the wrong doc while W3/W4 run |
| **W3** | Build missing doctrine | the SOP / playbook / runbook a P0/P1 needs and no doc holds; docs the plan cites that must exist | unblocks execution of the cycle's priorities |
| **W4** | Rewrites | partial rewrites of role docs / SOPs that contradict the plan | slowest, needs the owner's time; safe to do last once W1–W3 fixed the ground truth |

Heal-item fields (one row per fix; a finding may produce 0, 1 or several items):
`# · 波次 · 缺口 (G-id) · 發現 (finding line) · 修復動作 (imperative, one sentence) ·
對應 Tracker # · 負責人 (tracker 負責人 or 待認領) · 可交 Claude (✓ / —) · 建議技能 (slug or
手動) · 狀態 (未開始) · 備註`

**可交 Claude = ✓** when the fix is mechanical and its source is fully readable (a banner
line, an index entry, a SOR sync of quoted cells, a first-draft rewrite from a diff, a
doctrine skeleton from the tracker + plan). **= —** when it needs a decision, a number
nobody has written down, or knowledge that lives in one person's head. Every ✓ item still
names a human 負責人 who accepts the result.

## 5 · Owning-skill routing (name a skill only if it exists; otherwise `手動`)

| Fix type | 建議技能 |
|---|---|
| Plan Doc addendum missing / out of date vs the tracker; OKR tabs stale | `planning-suite-reconciler` |
| Tracker cells stale (dates `YYYY-MM-DD`, 掛 All, slipped 狀態) — nudge the owner | `planning-tracker-sync` (nudges); the owner edits the cell |
| Local `_INDEX.md` line for a new / renamed / retired Doc | `admin-governance` |
| GM Knowledge Directory entry + ⤴ backlink for a new core doc | 手動 (this skill prints the suggested entry; nobody automates the hub) |
| Support / customer-facing facts and Q&A that belong in the platform 知識庫 | `zynkr-kms` |
| Consulting engagement artefacts (BRD / UAT / session notes) | `consult-brd-writer` · `consult-uat-writer` · `consult-session-notes` |
| A process the SOP should carry as a diagram | `product-flow-design` |
| `[SUPERSEDED]` renames + banners · new SOP / doctrine bodies · role-doc rewrites | 手動 or 可交 Claude one-off pass (no owning skill — say so) |

## 6 · Report Doc skeleton

Title: `[N.0.1] <LOB name from pack §2; where §2 lists two names (5.0), use the name on the plan Doc's title> — <cycle> Gap Audit & Heal Plan（YYYY-MM-DD）`
(e.g. `[3.0.1] Operations — H2 Gap Audit & Heal Plan（2026-08-10）`; a second audit in the
same cycle keeps `[N.0.1]`, takes the new date, and lists the W2 heal item that banners
the previous pair `[SUPERSEDED YYYY-MM]` — the skill never renames it). Body zh-TW; English section words
where the exemplar uses them. Sections, in this order, numbered so 待決事項 is always §7:

1. **摘要** — 3–5 lines: scope (folder(s), plan Doc, tracker rows counted), the counts
   (findings per G-id · heal items per wave · decisions), 「執行進度以追蹤表為準」 + the
   Sheet URL, and the one-line verdict.
2. **審核範圍與方法** — what was read (IDs · modifiedTimes), what was inventoried by
   title only, the date, the cycle, "report-only — no existing Doc was edited".
3. **最嚴重缺口** — the top 3–5, each: which G-id · why it hurts a P0/P1 (Tracker #) ·
   the first heal item that addresses it.
4. **逐項發現（G1–G5）** — every finding line, grouped by G-id, in the §3 format.
5. **修復清單（依波次 W1–W4）** — the heal items as bullets grouped by wave, each with
   `#`, 負責人, 可交 Claude, 建議技能; identical content to the Sheet's 修復清單.
6. **追蹤表與知識目錄** — the 行動追蹤表 URL, the 狀態 vocabulary, and the suggested GM
   Knowledge Directory entry (§8 below) — text only.
7. **待決事項** — every G5 item: 決策 · 為何需要 · 影響 (Tracker # / doc) · 建議期限 ·
   狀態 待決.
8. **未檢查** — sub-folders deeper than one level, Docs audited by title only, shortcuts
   into other LOBs, files that errored, anything the user asked to skip. Never empty
   without saying 「無」.

Formatting: HEADING_1 title, HEADING_2 per section, bullets for lists; no tables. Write
the body as a local `.md` (`#` / `##` / `-`) and create it with
`import_to_google_doc(file_name, file_path, folder_id=<target folder id>)`, which places
it in the folder and converts the headings natively; `create_doc` + `batch_update_doc`
`update_paragraph_style` (then the move in §7) is the fallback. Read the Doc back once
and confirm the eight headings.

## 7 · 行動追蹤表 layout

Title: `[N.0.1] <LOB name> Gap Heal — 行動追蹤表（YYYY-MM-DD）`. Three tabs, in order:

| Tab | Rows / columns |
|---|---|
| `README` | two columns key · value: 來源報告 (URL) · 建立日 · 範圍 (folder + plan Doc + tracker) · 方法 (inventory → addendum + SOR → G1–G5 → waves) · 狀態詞彙 `未開始 / 進行中 / 完成 / 放棄` · 波次定義 W1–W4 (one row each) · 「執行進度以此表為準；報告 Doc 不再更新」 · 未檢查 count |
| `修復清單` | header row: `# · 波次 · 缺口 · 發現 · 修復動作 · Tracker # · 負責人 · 可交 Claude · 建議技能 · 狀態 · 備註` (A–K); one row per heal item in wave order; column J starts as `未開始`; freeze row 1 (`resize_sheet_dimensions(sheet_name="修復清單", frozen_row_count=1)`) |
| `待決事項` | header row: `# · 決策 · 為何需要 · 影響 · 建議期限 · 狀態 · 決議 · 決定日` (A–H); 狀態 ∈ `待決 / 已定案`; one row per G5 item |

Conditional colours on `修復清單!A2:K1000` (`manage_conditional_formatting`,
`condition_type="CUSTOM_FORMULA"`), same defaults as the family's tracker:

| 狀態 | formula | background | text |
|---|---|---|---|
| 完成 | `=$J2="完成"` | `#D9EAD3` | — |
| 進行中 | `=$J2="進行中"` | `#FFF2CC` | — |
| 放棄 | `=$J2="放棄"` | `#EFEFEF` | `#999999` |
| 未開始 | `=$J2="未開始"` | none | — |

`待決事項`: `=$F2="已定案"` → `#D9EAD3`. Header rows bold + `#F3F3F3`. Optional data
validation on the two 狀態 columns (list of the four / two strings) — never blocking.

Creation path + tool gotchas (both files): `import_to_google_doc` takes `folder_id` —
pass the target folder and no move is needed. `create_spreadsheet` (and the `create_doc`
fallback) take no folder and land in My Drive root → `update_drive_file(file_id,
add_parents=<target folder id>, remove_parents="root")`; creating directly inside a
folder via `create_drive_file` returns HTTP 400. Never move a shortcut (the tool moves
its target — resolve `shortcutDetails.targetId` instead). Tabbed Docs: `get_doc_as_markdown`
has NO `tab_id` parameter — it returns every tab, each under a top-level heading; run
`inspect_doc_structure` first to learn the tab titles, then read the plan body under its
tab's heading. Listing: `list_drive_items` pages on `nextPageToken` → `page_token` (see
§2). Tables: the Docs markdown renderer has flattened them in past runs, while the
`update_drive_file` docstring says markdown import converts tables — verify on the first
real run; until then bullets in the Doc, grids only in the Sheet.

## 8 · GM Knowledge Directory entry suggestion (printed, never written)

```
【建議新增 · GM Knowledge Directory】
- 文件：[N.0.1] <LOB name> — <cycle> Gap Audit & Heal Plan（YYYY-MM-DD）〈URL〉
- 一句話：<LOB> 文件資產 vs <cycle> 計畫的缺口稽核；修復進度以 行動追蹤表〈URL〉為準
- 查閱時機：接手 <LOB> 的文件修復、或下一輪 planning 前確認缺口是否已補
- ⚠ caveats：report-only；已定案的決策以追蹤表 待決事項 tab 為準
- 需要 ⤴ backlink：是（新核心文件慣例）
```

## 9 · Close-out shape

```
已寫入：
- 報告 Doc：<title> — <URL>（資料夾：<LOB folder URL>）
- 行動追蹤表：<title> — <URL>（tabs README · 修復清單 <n> 列 · 待決事項 <n> 列）
GM Knowledge Directory 建議：見上（未寫入）
未做（設計如此）：未編輯任何既有 Doc / Sheet / 資料夾；未執行任何修復；未動 Main Tracker；
未寫 _INDEX.md；未寄信
承前：上一輪審核 <title> 尚有 <n> 項未完成，已以「承前」標記帶入
未檢查：<list or 無>
```
