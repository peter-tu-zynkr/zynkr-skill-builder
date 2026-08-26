# Drive Mirror — the Google Workspace backup of the platform 知識庫

The platform KB (Supabase `crm_kb_*`, browsable at `https://platform.zynkr.ai/kb`) is the
**source of truth**. The Google Drive folder is its **backup mirror**.

## The arrow of truth is one-way

```
Zynkr platform KB  ──(mirror)──▶  Google Drive Docs
   (writable SOT)                  (read-only backup)
```

- The platform is **always right**. If Drive and the platform disagree, the platform wins.
- Nothing in Drive is ever read back into the KB. There is no reverse sync, and you must never
  "reconcile" a Drive edit into a card.
- Every mirrored Doc carries an **⚠️ AUTO-GENERATED MIRROR — do not edit** banner naming the
  platform as SOT. A human edit made in a mirrored Doc is destroyed on the next run.
- `/zynkr-support` reads the **platform**, never the mirror. The mirror exists so the knowledge
  survives a Supabase incident and stays human-readable, nothing more.

## Where it lives

| What | Where |
|---|---|
| Mirror folder | `[3.2] 客服知識庫 (KMS)` — `1LpymoVhy4YrxDBi81Sw6CRQQbZAiSLQ6` |
| Section Docs | one per section, `Zynkr Support KB — NN <Title>` (see registry below) |
| Full-fidelity snapshot | `_KB-SNAPSHOT.json` — `1UbDlalP9rP3s0LxitM5q9GMplw3qvLm7` |
| Run manifest | `_MANIFEST.json` — `1I0fE1bId4s5pXmQFWbwioSz0WQBUMBoM` |

The **section Docs are for humans** (readable, diffable, searchable in Drive). The **JSON
snapshot is the restore artifact** — it alone preserves `fact_id`, `cites`, `keywords`, `status`,
`version`, `verification_state` and the `source_*` fields. Prose Docs lose all of that, so a
restore always reads the snapshot, never the Docs.

## Doc registry (update in place — never create a second Doc for a section)

| nn | slug | Doc ID |
|---|---|---|
| 00 | _index_ | `1YeOBZqoX98IHENN_rW7rvrqgHjFwZETXjRPShHBE-EE` |
| 01 | `core-facts` | `1R8JoTiIihh4h7Yk3P2GlIgOIzbgSWMNkIzFcmWOzvb0` |
| 02 | `pricing-quoting` | `1iYncrIpUWci2sfPnLDgLm2UHETX5ZXpO93t886ab2EI` |
| 03 | `course-content` | `1Gs2TOjdEOT891TIp9Y69sSfMU5lYyJeExpaIEhO0eTI` |
| 04 | `scheduling-logistics` | `1To4umb0OTVnF9w2yTQox4MG7vquMzOgguLLK7ZWz78w` |
| 05 | `team-training-enterprise` | `1d-DBf57d9FXA6YGPM6KetYpaaNN5vUJDy6OBjri4pGE` |
| 06 | `technical-howto` | `1zdi2gvu_kyPOv2nYQ-56p8UTapnD6DtpBPv4Pp-ZtCQ` |
| 07 | `access-account` | `1j-mHGvFhtWT3Lf6YQIS1Uj4ozqf6uD1TD4N4wCJxiSo` |
| 08 | `refund-policy` | `1WZ6BpuE-zuGUIMANU70VIrvLuaNR-ZHq_RPSMDMPOMg` |
| 09 | `other` | `1ybCHI2afBDuD4qwF8y8QKnH8pryxlSdUG4d04BbLVkY` |
| 10 | `instructor-profile` | `1UaLcJrCa2lzn1j3xoUyhBDpIRKqQUCCFzShL4xirrys` |
| 11 | `brand-product-vision` | `1_rc1go2pqTILElBi-DKbDwOU7xg3ODarh535cc7N6BE` |
| 12 | `ai-workflow-architecture` | `1WukW2HHv6r1TvOR2W0yJYEbtVJONT97kbW6Y24cagAA` |
| 13 | `tone-style` | `1srAumHBnBgKqy3-pSnef-gKRJiXcShLO7vK-6mah7qE` |
| 14 | `gov-subsidy` | `1lTylt4LZB2IyKRGdQwrHIiXGzB5kcXTHr2felmePy_8` |

Adding a section (Step 5d) means the mirror gains a Doc — see *New section* below, then add the
row here.

## How to run it

### 1. Render (local, reads Supabase directly)

```bash
node scripts/kb-drive-mirror.mjs \
  --out <staging-dir> \
  --workspace 19881fe1-0081-452e-9141-8ba196e61abe \
  --env "<repo>/6.0 tech/zynkr-ai-platform/.env.local" \
  [--sections pricing-quoting,core-facts]
```

The script only reads. It writes one `NN-slug.md` per section plus `_KB-SNAPSHOT.json` and
`_MANIFEST.json`, and prints a small JSON summary (counts + filenames) — card bodies stay on
disk and never enter context.

> ### ⚠️ `--workspace` is mandatory
> `crm_kb_*` is a **shared multi-tenant table**. Peter's workspace is
> `19881fe1-0081-452e-9141-8ba196e61abe`. Other tenants have sections whose `nn` values *collide*
> with Peter's (their `pricing` is also nn 1). Running unscoped mirrors **another tenant's cards
> into Peter's Drive** — a data leak — and inflates every count. The script refuses to run
> without the flag; never work around that.
>
> Note `mcp__zynkr__list_kb_sections` is already workspace-scoped, so it will show fewer sections
> than a raw `select * from crm_kb_sections`. The MCP view is the correct one.

### 2. Stage into the MCP sandbox

The `google-workspace` MCP server only accepts local paths under
**`~/.workspace-mcp/attachments/`**. Copy the rendered files there before uploading:

> The MCP tool arg must be a real absolute path — expand `~` to an absolute path when you
> pass `file_path`; the tilde form here is only to keep machine-specific paths out of the skill.

```bash
mkdir -p ~/.workspace-mcp/attachments/kb-mirror
cp <staging-dir>/*.md <staging-dir>/_*.json ~/.workspace-mcp/attachments/kb-mirror/
```

### 3. Upload (in place, by Doc ID)

Per touched section — `mcp__google-workspace__update_drive_file`:

- `file_id` — from the registry above
- `file_path` — `~/.workspace-mcp/attachments/kb-mirror/NN-slug.md`
- `source_format: "md"` — Drive converts Markdown → native Doc, **keeping the Doc ID**, so links,
  comments and sharing all survive
- `description` — the AUTO-GENERATED MIRROR banner

Refresh `_KB-SNAPSHOT.json` and `_MANIFEST.json` the same way (they are plain JSON files —
`mime_type: application/json`, and they must **never** be converted to Docs).

### New section

`create_drive_file` leaves a raw `text/markdown` file, not a Doc. Use
**`mcp__google-workspace__import_to_google_doc`** (`file_path` + `source_format: "md"` +
`folder_id`) to create a real Doc, then add its ID to the registry above.

## Verifying a run

- The script summary's `total_cards` must equal the platform's card count for Peter's workspace.
- `sections` must equal what `mcp__zynkr__list_kb_sections` returns (**14** as of 2026-08-26). A
  larger number means the workspace filter is missing.
- `orphans` must be `0` — a non-zero value means a card points at a section that no longer exists.
- Spot-check one Doc you just wrote: the banner should carry the current timestamp.

## Restoring from the mirror

Read `_KB-SNAPSHOT.json` — not the Docs. Re-create **fact cards first**, then qa cards, so `cites`
resolve (same ordering rule as Step 5). Preserve `fact_id` exactly; qa cards cite by that handle.
