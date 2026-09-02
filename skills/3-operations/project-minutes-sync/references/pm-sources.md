# PM sources — the PMO's canonical artefacts, and the adapter that points at instances

> **Identity:** this file is byte-identical in every PM-family skill's `references/` folder
> (SKB-011), and it is one of **five** artefacts the sync copies. Each has ONE canonical seed
> outside the skill tree; edit the seed, then run `scripts/check-pm-refs.sh --sync` to re-copy
> and `scripts/check-pm-refs.sh` to prove every copy is identical. Never edit a copy in place.
>
> | Seed — edit here | Lands in every PM-family skill at |
> |---|---|
> | `docs/pm-shared/pm-knowledge-pack.md` | `references/pm-knowledge-pack.md` |
> | `docs/pm-shared/pm-sources.md` — this file | `references/pm-sources.md` |
> | `docs/pm-shared/pm-sheet-schema.json` | `references/pm-sheet-schema.json` |
> | `docs/pm-shared/pm-status-crosswalk.json` | `references/pm-status-crosswalk.json` |
> | `scripts/pm-schema.py` | `scripts/pm-schema.py` |
>
> **Why all five, not just the knowledge pack.** An installed skill gets its own folder and
> nothing else. A 強制 step that points at repo-root `scripts/pm-schema.py` or at
> `docs/pm-shared/*.json` therefore breaks the moment the skill is installed standalone. So
> every PM-family skill carries its own validator and its own copy of the two JSON seeds that
> validator reads, and invokes it **skill-folder-relative** — `python3 scripts/pm-schema.py`
> from the skill folder, resolving its seeds from the sibling `references/` — exactly the
> shape `render_dashboard_email.py` already has. One root, no split; the gate keeps all five
> byte-identical.
>
> **Not copied:** `docs/pm-shared/README.md` (it is about maintaining the seed, not about
> running a project) and `docs/pm-shared/pm.json.example` (its bytes are reproduced verbatim
> in §3 below, so an installed skill can still show a user the example without shipping the
> file).
>
> **Scope:** this file is the *identifier and adapter* layer. It holds the org-wide template
> IDs that never change, and it defines the private config file that holds everything that
> *does* change — per-project instances and per-engagement-type behaviour. Policy (the five
> axes, the 五條鐵律, column headers, thresholds) lives next door in `pm-knowledge-pack.md`
> and `pm-sheet-schema.json`; nothing here restates it.
>
> **Ruling D3:** per-team and per-LOB variation is adapter **data**, not variant knowledge.
> There is one knowledge pack for all engagement types; the differences between 客戶案 /
> 課程案 / 內部案 are rows in `~/.config/zynkr/pm.json`, never a forked pack.
>
> **Google account for all `google-workspace` MCP calls:** `peter_tu@zynkr.ai` (override by
> saying so).

---

## 1 · Canonical PMO artefacts

Verified 2026-09-02. These eight IDs are **committed literals** — they are the org's single
template set, they change approximately never, and a skill must be able to copy a template
with no config file present. Use them verbatim; do not re-derive them from a Drive search.

| Role | Artefact | Type | ID |
|---|---|---|---|
| **Playbook** | 專案管理 Playbook — the process spine: phases 啟動·規劃·執行·監控·結案, per-project file set, naming, roles, 五條鐵律 (§5) | Doc | `1ckEyMVhgH7ArRnke4SFjGpnT2pho1Drj7sransKpIh0` |
| **管控表 v2 template** | `[專案管控表]` — the唯一 SOT for progress. tab 1 `專案管理總表` (14 cols A–N) + `Stakeholders & RACI` · `Risk Register` · `Budget` · `Prerequisite Checklist` · `Change & Decision Log` · `所有檔案` · `Comms Plan` | Sheet | `1Pc1YT4z6LdU9JjVSPT_ESN7DCa7aL8DhOD1IOpGiuvQ` |
| **TEMPLATE-INDEX** | The index of the template set: 9 rows (7 files + 2 「(skill)」 rows) plus a 12-term glossary. Update it whenever a template changes | Doc | `1s--w8AqooItD985Rr3sijZBMYByvBWgxchAPiKLLAZc` |
| **Business Case** | `[Business Case]` — header carries **專案類型 客戶案 / 課程案 / 內部案** (the field the adapter keys on); §1 問題與機會 → §6 建議與核准. Gate: 核准後才進入 Charter | Doc | `1jwiSK3nsHQV-HZkc6eDv3IktdfvVcmO1WxiLTUFwDI4` |
| **Charter Slides** | `[Charter]` — 2 slides: objective · milestones · roll-out · KPIs · RAPID · RACI; slide 2 scope in/out · budget · top-3 risks · sign-off. Gate: 核准後才進入 Planning | Slides | `1SWgWed9hIjLrux8mJnff95nFPMPGEO-HNi8yQ8LiBUs` |
| **Kickoff** | `[Kickoff]` — 專案類型 · 客戶/對象 · 主要窗口（內部案免填）· PM · Sponsor · CRM Deal（客戶案）· Charter/管控表/BC URLs · the 4-section Weekly Project Update block · As-is 流程 | Doc | `1W1DAVTFmsuhuDPznN8EicoltxfdyqJ1jegBCIjuVrg0` |
| **會議記錄** | `[會議記錄]` — 進度更新（狀態 On track／At risk／Delayed／Done, a **health** reading）· 提醒與阻礙 · 決議 · Action Items（`對應管控表任務 no.`）· 討論摘要 | Doc | `1NbaL92dg0NWty5Wba-tlIWGE7d0qm0R0aXtFgbkOeNs` |
| **復盤** | `[復盤]` — §1 結案確認（通過／有條件通過／未交付, the **closure verdict** axis）· §2 成果 vs BC · §3 Lessons · §4 封存檢查表（7 boxes, 2 客戶案-only）· §5 PIR 30–90 天 | Doc | `1mHrs1M_hasg9mjIeuiJDWBsoXx_d0-GjLCPt9YvnveY` |

**Where they live.** Template folder is `[3.3] 專案管理 PMO｜Playbook & Templates` →
sub-folder `[1] Templates 模板庫`, which holds **exactly these 7 template files** (the
Playbook itself sits one level up). Copy from there and nowhere else — 鐵律 2.

**Folder name — corrected at source on 2026-09-02.** The five PMO Docs used to write the
template folder as `[3.4]`. All **17** occurrences were corrected to `[3.3]` on **2026-09-02**
— Playbook 12 · Business Case 1 · Kickoff 1 · 會議記錄 1 · 復盤 2. `[3.3]` is now both the
real name and the 原文: **鐵律 2 genuinely reads `[3.3]`**, so quote it as it stands. There is
no live drift left to preserve — the old instruction to quote a `[3.4]` and flag it in the
same breath is now wrong, and any skill text still carrying it is stale and must be deleted.
Cite `[3.3]/[1]` everywhere, in quotation and in prose alike. If `[3.4]` ever reappears in a
live PMO Doc, that is *new* drift: fix the Doc, do not re-introduce a workaround here.

**Sub-folders inside a live project:** `[1] 會議` · `[2] 素材` · `[3] 交付物` · `[4] 封存`.

---

## 2 · The adapter contract — `~/.config/zynkr/pm.json`

Same regime as `~/.config/zynkr/gm.json` and `~/.config/zynkr/ops-weekly.json`:

- **Private. Never commit.** The real file holds per-project Sheet/Doc/folder IDs, some of
  them client-confidential. This repo is public, so only the placeholder example lives here —
  as the committed file `docs/pm-shared/pm.json.example` and, byte for byte, as §3 below.
- Location `~/.config/zynkr/pm.json`, override with env `ZYNKR_PM_CONFIG=<path>`. Create it
  by copying `docs/pm-shared/pm.json.example` (or §3, same bytes) and filling every `<...>`.
- Loaded at **Step 0 of every PM-family run**, before any Drive or Sheets call.
- A missing, empty or still-placeholder value ⇒ **fail loud** and stop, with the key path in
  the message: `config: projects.<slug>.tracker_sheet_id unset`. Never guess an ID, never
  fall back to a hardcoded one, never pick 「the only sheet with that tab name」. A wrong
  sheet ID writes a week of status into somebody else's project.
- Rotate by editing this file only. When a project's Sheet is moved, renamed or replaced, no
  skill file changes.

### 2.1 · The shape, key by key

Annotated for reading — **not** copy-pastable (JSON has no comments). The copyable version
is §3.

```jsonc
{
  "google_account": "…",        // every google-workspace MCP call uses this
  "language": "zh-TW",          // output language for drafts; source strings stay verbatim

  "defaults": {
    "timezone": "Asia/Taipei",  // all date maths, all 「today」 comparisons
    "week_start": "MON",        // which day starts the reporting week
    "health_thresholds": {      // the ONLY tunable numbers in the health derivation
      "delayed_after_days": 0,  // 🔴 delayed once End is this many days past (0 = End < today)
      "at_risk_within_days": 3, // 🟡 at_risk when End ≤ today + N AND lifecycle = not_started
      "blocker_stale_days": 7   // 🟡 at_risk when an open blocker is older than N days;
                                //    also the 會議記錄 rule 「阻礙一週內無法自行解除 ⇒ 開 Risk Register」
    }
  },

  "engagement_types": {         // keys are the LITERAL 專案類型 values in the BC/KO header,
                                // so a run reads 專案類型 and looks the key up directly
    "客戶案": {
      "filing_home": {
        "folder_id": "<folder-id>",   // where a new project folder is created
        "label": "[2.2]"              // the bracket label, for prose and for backlinks
      },
      "creates_crm_deal": true,       // consult-project-specialist automates creation for this
                                      // type ONLY; the other two are created by hand / project-init
      "kickoff_fields_omitted": [],   // Kickoff header fields this type leaves blank
      "closure_extra_steps": [        // appended to the 復盤 §4 封存檢查表 for this type
        "CRM deal 關閉",
        "客戶版連結權限"
      ],
      "comms_cadence": "biweekly"     // weekly | biweekly — 客戶窗口 雙週 Email vs 內部 週報
    },

    "課程案": {
      "filing_home": { "folder_id": "<folder-id>", "label": "[4.3]" },
      "creates_crm_deal": false,
      "kickoff_fields_omitted": ["CRM Deal"],
      "closure_extra_steps": [],
      "comms_cadence": "weekly"
    },

    "內部案": {
      "filing_home": {
        "folder_id": null,            // 內部案 files into ITS OWN LOB folder — there is no
                                      // single home, so folder_id stays null and by_lob resolves it
        "label": "[N.0] 該 LOB 資料夾",
        "by_lob": { "3.0": "<folder-id>", "4.0": "<folder-id>" }
      },
      "creates_crm_deal": false,
      "kickoff_fields_omitted": ["主要窗口", "CRM Deal"],
      "closure_extra_steps": [],
      "comms_cadence": "weekly"
    }
  },

  "projects": {                 // slug → the three instance IDs plus three adapter values.
                                // Slugs are kebab-case and stable; they are what a skill is
                                // invoked with
    "<project-slug>": {
      "tracker_sheet_id": "<sheet-id>",  // the [專案管控表] Sheet — the唯一 SOT for progress
      "minutes_doc_id": "<doc-id>",      // the [會議記錄] Doc for this project
      "folder_id": "<folder-id>",        // the project folder holding [1]–[4] sub-folders
      "engagement_type": "課程案",         // MUST be a key of engagement_types above

      "spine": [                         // D3: the delivery spine is adapter DATA, not shared
        "啟動",                           // knowledge. Ordered stage NAMES; the array index + 1
        "規劃",                           // IS the X.0 number, so entry 1 is stage 1.0. Written
        "執行",                           // as they read in 里程碑 Stage, minus the X.0 prefix.
        "監控",                           // 跨階段 is NEVER an entry — see below.
        "結案"
      ],
      "report_recipients": [             // who a status mail is addressed to. No recipient
        "<someone@example.com>"          // literal lives in any SKILL.md — this is the only
      ]                                  // place the list exists.
    }
  }
}
```

**`spine` — the ordered delivery phases (ruling D3 · adapter data).** Every project has one,
and it is per-project: a 課程案 spine (專案啟動 → 課綱規劃 → 教材開發 → 錄製後製 → 課程包組裝 →
上架追蹤) is not a 客戶案 spine. No skill hardcodes one. Entries are stage *names*; position
gives the number, so the third entry is stage `3.0`.

- **跨階段 Cross-Cutting is not a stage and must never be listed.** It is a *parallel* track
  that runs alongside the whole project — governance, comms, admin — and by design it is
  never finished. Put it in the spine and it enters the percent denominator, where it can
  never reach `done` and so drags the project's % down for the project's entire life. Surface
  its rows in blockers / this-week / timeline instead; they count toward no stage.
- **Missing `spine` ⇒ fall back, loudly.** A run with no `spine` key uses the five delivery
  phases 啟動 · 規劃 · 執行 · 監控 · 結案 and **prints a warning naming the key path**
  (`config: projects.<slug>.spine unset — 以五階段預設交付主軸計算`). It does not fall back to
  any project's specific spine, and it does not fall back silently.
- Percent maths over the spine, including the empty-stage boundary, is policy and lives in
  `pm-status-crosswalk.json`; nothing here restates it.

**`report_recipients` — who gets the mail (adapter data).** An array of addresses. It is the
only place a recipient list exists: **no recipient literal survives in any SKILL.md.** A
SKILL.md may show a placeholder as documentation of the shape, never as a value.

- **Missing `report_recipients` ⇒ fail loud**, `config: projects.<slug>.report_recipients
  unset`, and stop. No fallback, not even to `google_account`.
- The asymmetry with `spine` is deliberate: a wrong spine produces a visibly odd percent that
  a reviewer catches before it matters, while a guessed recipient list mails one project's
  status to the wrong people — and you cannot unsend that.

Validation a skill does at Step 0, in order: config file exists → the named project slug
exists in `projects` → its `engagement_type` is a key of `engagement_types` → the IDs it
needs for *this run* are non-null and non-placeholder → **if the run sends or drafts a
report**, `report_recipients` is present and non-empty. Each failure names its key path and
stops. A run never half-proceeds on a partial config. `spine` is the one key that is checked
last and does not stop the run — it warns and falls back, per the rule above.

### 2.2 · Which regime does an identifier belong to

Three regimes, and every identifier a PM skill touches belongs to exactly one:

| Identifier class | Regime | Where it lives | Why that regime |
|---|---|---|---|
| The 8 PMO template IDs (§1) | **committed literal** | this file, and its copy in every PM-family `references/` | One org-wide set; changes ~never; a skill must copy a template before any config exists |
| Template folder `[3.3]` → `[1] Templates 模板庫` | **committed literal** | this file §1 | Same — and since the 2026-09-02 Doc correction the literal and the 原文 finally agree |
| Column headers, tab names, the 14-column v2 layout | **committed literal** | `pm-sheet-schema.json`, and its copy in every PM-family `references/` | Schema, not an identifier — versioned with the pack |
| The five axes, mappings, the % denominator rule | **committed literal** | `pm-status-crosswalk.json`, and its copy in every PM-family `references/` | Policy — the whole point of the shared seed |
| Per-project 管控表 Sheet ID | **private config** | `pm.json` → `projects.<slug>.tracker_sheet_id` | One per project, grows every month, some client-confidential |
| Per-project 會議記錄 Doc ID · project folder ID | **private config** | `pm.json` → `projects.<slug>.minutes_doc_id` / `.folder_id` | Same |
| Engagement-type filing-home folder IDs | **private config** | `pm.json` → `engagement_types.<type>.filing_home` | The bracket *label* is committed above; the folder *ID* is not |
| Timezone · week start · health thresholds | **private config**, defaults documented | `pm.json` → `defaults` | Tunable per team; the defaults in §3 are the PMO's current numbers |
| Per-project delivery spine (the ordered `X.0` stages) | **private config**, fallback documented | `pm.json` → `projects.<slug>.spine` | Ruling D3 — per-project variation is adapter data; a hardcoded spine is one project's shape imposed on every other. Missing ⇒ five delivery phases **plus a printed warning** |
| Per-project status-mail recipients | **private config**, no fallback | `pm.json` → `projects.<slug>.report_recipients` | People change and the list is not the repo's business; the wrong list is an unsendable mistake. Missing ⇒ **fail loud** |
| Row values: `Status`, dates, `Owner`, `Note`, % complete | **runtime lookup** | read from the Sheet on every run | State. Never cached in a file, never carried between runs |
| Person → email | **runtime lookup** | the artefact's own `Owner` / `負責人` column | The roster changes; no contact data belongs in this repo |
| Which templates exist right now | **runtime lookup** | list `[3.3]/[1]`, cross-check TEMPLATE-INDEX | The folder is authoritative over any list written down |

### 2.3 · The rule that resolves the course-tracker mess

**Symptom.** One identifier — the course-production 管控表, `1w74oPg7…` — is stored three
different ways at once today: a **committed literal** in `docs/planning-shared/planning-sources.md`
and its eight skill copies · a **private-config** entry in `~/.config/zynkr/gm.json` (with a
placeholder in the committed `config.example.json`) · and a bare **placeholder**
`<YOUR_GOOGLE_SHEET_ID>` in `project-status-update/SKILL.md`. The skill that actually owns
the project is the only one that does not hold the value.

**Rule, three lines:**

1. **Instance Sheet/Doc/folder IDs live in `pm.json` ONLY** — under `projects.<slug>`. That
   is the single place a real instance ID is stored. An instance ID committed to this repo
   is a defect, not a convenience: delete it, do not mirror it.
2. **The repo carries a placeholder** — `<sheet-id-…>` in `pm.json.example` / §3, and
   `<YOUR_GOOGLE_SHEET_ID>` (or the config key path) in a SKILL.md body. A placeholder that
   survives into a run is a fail-loud condition, not a default.
3. **A skill that finds neither a config value nor an explicit argument fails loud** —
   `config: projects.<slug>.tracker_sheet_id unset` — and stops. It does not guess, does not
   Drive-search by title, does not reuse the ID it saw last run.

**Boundary.** The committed literal in `docs/planning-shared/planning-sources.md` is
SKB-007's seed and is **not** touched by this change; the planning family keeps reading it.
What changes is the PM family: a PM-family skill resolves the course tracker from
`pm.json` → `projects.course-production.tracker_sheet_id`, never from that copy, so the two
families stop disagreeing about who owns the value. Retiring the planning-side literal is a
later change with its own spec.

---

## 3 · `pm.json.example`

**The committable copy of this block lives at `docs/pm-shared/pm.json.example`** — a real,
parseable JSON file (`python3 -m json.tool docs/pm-shared/pm.json.example` exits 0). Prefer
copying that file; the fenced block below is the same JSON, reproduced here because
`pm.json.example` is **not** in the copy set, so this is the only form an installed skill can
show a user. The two are edited together or not at all.

Copy to `~/.config/zynkr/pm.json` and replace every `<...>`. All IDs below are obvious fakes —
a real 44-character Google ID never looks like this. Three example projects, one per
engagement type, so the per-type differences are visible side by side.

```json
{
  "$comment": "PM-family PRIVATE runtime config (SKB-011). Copy to ~/.config/zynkr/pm.json and NEVER commit the filled-in copy. Every id below is an obvious fake — a real Google id is 44 chars of base64ish noise, never <angle-bracket-prose> — and a skill that reads one of these verbatim must fail loud. These bytes are the same JSON as pm-sources.md §3: edit both or neither.",
  "google_account": "pm@example.com",
  "language": "zh-TW",

  "defaults": {
    "timezone": "Asia/Taipei",
    "week_start": "MON",
    "health_thresholds": {
      "delayed_after_days": 0,
      "at_risk_within_days": 3,
      "blocker_stale_days": 7
    },
    "$health_note": "These three numbers are the ONLY tunables in the health derivation. health is DERIVED, never typed — see pm-status-crosswalk.json."
  },

  "engagement_types": {
    "$note": "Keys are the literal 專案類型 values in the Business Case / Kickoff header, so a run reads the field and looks the key up directly. Adding a fourth type is a config change, not a code change.",

    "客戶案": {
      "filing_home": { "folder_id": "<folder-id-client-projects>", "label": "[2.2]" },
      "creates_crm_deal": true,
      "kickoff_fields_omitted": [],
      "closure_extra_steps": ["CRM deal 關閉", "客戶版連結權限"],
      "comms_cadence": "biweekly"
    },

    "課程案": {
      "filing_home": { "folder_id": "<folder-id-course-projects>", "label": "[4.3]" },
      "creates_crm_deal": false,
      "kickoff_fields_omitted": ["CRM Deal"],
      "closure_extra_steps": [],
      "comms_cadence": "weekly"
    },

    "內部案": {
      "filing_home": {
        "folder_id": null,
        "label": "[N.0] 該 LOB 資料夾",
        "by_lob": {
          "1.0": "<folder-id-lob-1>",
          "2.0": "<folder-id-lob-2>",
          "3.0": "<folder-id-lob-3>",
          "4.0": "<folder-id-lob-4>"
        },
        "$note": "內部案 has no single home — it files into its own LOB folder. folder_id stays null; a run resolves by_lob[<lob>] and fails loud if the LOB is unknown."
      },
      "creates_crm_deal": false,
      "kickoff_fields_omitted": ["主要窗口", "CRM Deal"],
      "closure_extra_steps": [],
      "comms_cadence": "weekly"
    }
  },

  "projects": {
    "$note": "slug → the instance ids plus the two adapter arrays. engagement_type MUST be a key of engagement_types above. spine is the ordered delivery-phase names (array index + 1 IS the X.0 number); 跨階段 is a PARALLEL track and is never listed. A missing spine falls back to the five delivery phases 啟動·規劃·執行·監控·結案 with a printed warning; a missing report_recipients FAILS LOUD (config: projects.<slug>.report_recipients unset) — never guess who gets a status mail.",

    "course-production": {
      "tracker_sheet_id": "<sheet-id-course-tracker>",
      "minutes_doc_id": "<doc-id-course-minutes>",
      "folder_id": "<folder-id-course-project>",
      "engagement_type": "課程案",
      "spine": [
        "專案啟動",
        "課程定位與課綱規劃",
        "教學教材開發",
        "錄製與後製",
        "課程包組裝",
        "上架完成與上線後追蹤"
      ],
      "report_recipients": ["pm@example.com", "sponsor@example.com", "producer@example.com"]
    },

    "example-client-rollout": {
      "tracker_sheet_id": "<sheet-id-client-tracker>",
      "minutes_doc_id": "<doc-id-client-minutes>",
      "folder_id": "<folder-id-client-project>",
      "engagement_type": "客戶案",
      "spine": ["啟動", "規劃", "執行", "監控", "結案"],
      "report_recipients": ["pm@example.com", "account-lead@example.com"]
    },

    "example-internal-tooling": {
      "tracker_sheet_id": "<sheet-id-internal-tracker>",
      "minutes_doc_id": "<doc-id-internal-minutes>",
      "folder_id": "<folder-id-internal-project>",
      "engagement_type": "內部案",
      "spine": ["啟動", "規劃", "執行", "監控", "結案"],
      "report_recipients": ["pm@example.com"]
    }
  }
}
```
