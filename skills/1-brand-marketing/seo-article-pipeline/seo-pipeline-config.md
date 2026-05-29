# SEO Article Pipeline — Config

Single source of truth for the IDs and accounts the SEO content pipeline depends on. Every SEO skill (`seo-persona-builder` … `seo-article-finalizer`) references the placeholder `<your-seo-kb-folder-id>`; resolve it here. When something moves, update this file — don't edit each SKILL.md.

---

## Google account

```
user_google_email: <your-google-workspace-account>
```

All Google Workspace MCP calls (Drive search/read, Doc create) use this account.

---

## Drive — SEO Knowledge Base

**The living knowledge base (brand context + seed knowledge + per-article working artifacts):**

```
seo_kb_folder_id:  1ujQJSPjRcqkNd-BMGq68DmVldyr3lsJ2
seo_kb_folder_url: https://drive.google.com/drive/folders/1ujQJSPjRcqkNd-BMGq68DmVldyr3lsJ2
```

Resolve `<your-seo-kb-folder-id>` in every SEO skill to `seo_kb_folder_id`.

### Contents (as of 2026-05-29)

| File | ID | Purpose |
|---|---|---|
| 00 Brand Context (SEO source of truth) | 1XF5VbcDtAcktE8wptTF7ejqPi21DFbtEMm3bHsF9ssE | Brand-level fuel for persona + brief. v2 — aligned to the authoritative Zynkr Brand Guide (decision-first voice, words-to-reduce list). |
| TEMPLATE — Brand-level Context Packet | 1sumEZUBE2V6c2pSl67Dh2b8Kj_5t5W-LuXQJ_C92pj0 | FE intake, fill once |
| TEMPLATE — Article-level Context Packet | 1TX-mpHDMAkXzXbtcCJ6wtB403as_ZEyUN4_fR6llZ2w | FE intake, per article |

---

## Knowledge resolution rule (Drive-first, local fallback)

Every SEO skill's rubric/template is hosted as an **editable Google Doc** in the SEO-KB subfolder `01 Rubrics & Templates`, AND kept as a local `./references/*.md` fallback inside each skill.

**At runtime, each skill must:**
1. Try Drive first — `search_drive_files` in `rubrics_folder_id` by the doc name (e.g. `persona-rubric`), then `get_drive_file_content`. This is the master copy Peter edits.
2. If Drive is unavailable / not found / no MCP access → fall back to the bundled `./references/<file>.md`.
3. If the two ever diverge, the Drive version wins; sync the local copy on next edit.

```
rubrics_folder_id:  1YUUrX0e5JDKy6C0QcWeWD9NfKQpKqXWW
rubrics_folder_url: https://drive.google.com/drive/folders/1YUUrX0e5JDKy6C0QcWeWD9NfKQpKqXWW
```

### Rubric mapping (Drive master ↔ local fallback)

| Skill | Drive doc (name) | Drive doc ID | Local fallback |
|---|---|---|---|
| seo-persona-builder | persona-rubric | 1mv2klNsA5PIb18Niq6GnPIifV6OHeBt3r7adAD7sHqg | ./references/persona-rubric.md |
| seo-question-miner | question-frames | 1lWc9_Sc4IsXv-_dhvyEHJO1CXweKiVxuNOxSCBSY9e4 | ./references/question-frames.md |
| seo-angle-finder | seo-angle-rubric | 1SVQBv-wQIVyhbD9Z5bLW1v-FboBqmdtcCwLluFnF_eA | ./references/seo-angle-rubric.md |
| seo-keyword-mapper | keyword-checklist | 1pbGpMgz-OtEnJpmcZ1BL8T_wSkoy1U2Mh5oINIweVa0 | ./references/keyword-checklist.md |
| seo-keyword-classifier | keyword-sop | 1NakOLc35YFDNecpWEd9FgOTxHuwyb3UKPdapZ1z-8H4 | ./references/keyword-sop.md |
| seo-keyword-classifier | intent-taxonomy | 1vhCo1QLI2gBcSvVwLYBqQguCuwBAIH98RaEMaWxD0ac | ./references/intent-taxonomy.md |
| seo-demand-validator | competitor-review-table | 1bhCPjV-YoGJw21RdqGcE2K5ObO5HZwEnZ802p9dObKI | ./references/competitor-review-table.md |
| seo-brief-writer | ceiling-article-features | 1rbF9ZT1HHZpa3MMVE5fIxg1QtSqSmhRHctRD9z7HOKA | ./references/ceiling-article-features.md |
| seo-brief-writer | winning-key-scoring | 1CVrriUQYc-ttOF0lGUIfVUmtdmR-INK32G1cbt2YKUk | ./references/winning-key-scoring.md |
| seo-brief-writer | brief-template | 1JchbS6D42XzFsbWJx4OTIjM_4YtGxgvedxZQ1fio9Lc | ./references/brief-template.md |
| seo-outline-designer | outline-patterns | 1Csp8S6u16a4wo8zt3XrCXvqLdrJTGiIOYH66SngEu40 | ./references/outline-patterns.md |
| seo-article-finalizer | internal-link-rules | 1dWXE1uEVj9h7v6fOVwEr3b774N4u4y2hJ7U1a9vTIa0 | ./references/internal-link-rules.md |
| seo-article-finalizer | meta-schema-rules | 11M-nPx2NL08TJejHAEBn4FGr15qKUmS-EkHWl6nDfu8 | ./references/meta-schema-rules.md |

---

### SEO-KB subfolders

```
rubrics_folder_id:        1YUUrX0e5JDKy6C0QcWeWD9NfKQpKqXWW   # 01 Rubrics & Templates
seed_knowledge_folder_id: 1K-pSQtVR7ezWADIH2_tSCqpOcY-btAkK   # 02 Seed Knowledge
```

Other KB files: `03 AEO Prompt Panel & Metrics (measurement)` = `1qx9_tXF2Zp8zLGkB4qYQB9k8-vCKapNsEfMqiGlwFoM` (Phase-5 measurement template, run monthly — manual).

### Per-article working subfolders

`seo-article-pipeline` creates one subfolder per article (named by working title) under `seo_kb_folder_id`. Each holds the durable green artifacts: 人物誌 · 關鍵字地圖 · 主題清單 · Brief · 大綱 · FAQ · 初稿 · 上架包.

### Seed knowledge (self-heal source)

Lives in the `02 Seed Knowledge` subfolder (`seed_knowledge_folder_id`). `seo-angle-finder`, `seo-brief-writer`, `seo-persona-builder` `search_drive_files` here for first-hand angles/evidence.

**Living-KB self-heal bridge — MANUAL (not yet automated):** after running a livestream through `process-livestream`, copy its `content-idea-curator` ideas + accepted `qa-knowledge-base` entries into `02 Seed Knowledge` (one doc per stream, named `seed_<date>_<topic>`). Keep entries decision-first (angle = a decision/trade-off, not a feature). Until a sync step is built, this deposit is done by hand so the SEO skills see fresh seed knowledge. Future automation: extend `process-livestream` to write an SEO-seed doc straight into `seed_knowledge_folder_id`.

---

## Brand voice (Brand Guide — authoritative)

Zynkr is a **decision-first AI consulting counterpart**, not "AI enablement / productivity." Every article must: lead with a decision, name the real trade-off, commit to a direction; make at least one Zynkr Method move visible (Frame · Clarify · Constrain · Compare · Commit). First-hand experience is evidence for judgment, not the selling point.
- **Words to own:** 決策 · 取捨/trade-off · 判斷 · 方向 · 脈絡 · 顧問夥伴 · 框架 · 清晰.
- **Words to reduce (never in copy):** 賦能/empower · unleash · 生產力工具/productivity tool · AI-powered · seamless/無縫 · 智慧助理 · 顛覆/redefine · supercharge · cutting-edge · game-changing.
- Governance: every article answers YES to all 4 (decision not feature · only-Zynkr-could-say-this · asking/framing/committing not selling · Method shows through).

## Content pillars (decision-first; B2B-priority)

1. **AI 決策思維** — 在不確定中做更好的判斷（TOFU thought leadership；品牌核心）
2. **流程即決策** — 用 AI 重構工作流程的判斷點（B2B core / authority）
3. **打造會思考的 AI 夥伴** — Agent 先問對問題再給答案（builder credibility）
4. **AI 導入的關鍵抉擇** — 該自動化什麼、何時、為何（B2B BOFU / decision）
5. **用 AI 蓋產品** — 每一步都是一個決策（practitioner，AEO-strong）

## Conventions

- zh-TW headings/taglines do not end with 句號 (。); series separator is ·.
- Per-article folder name: `<工作標題>`.
- Artifact filenames: `<工作標題> - 人物誌`, `… - 關鍵字地圖`, `… - Brief`, `… - 大綱`, `… - 上架包`.
- Languages: zh-TW primary; flagship pieces also produce EN via `zh-tw-translator` reverse mode.
