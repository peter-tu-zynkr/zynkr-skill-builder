# SKB-028 — Fireflies becomes a first-class transcript source for seven skills

- **Status:** Shipped 2026-09-15 (`9dbdaae9`) — 7 SKILL.md + `extracted.json`, validator green on
  each, ingested and verified live. **This spec is a BACKFILL**, written 2026-09-15 after the code
  landed: the work was sized S on the way in (a content edit to seven files) and only became L when
  the Atlas consumer turned out to be required rather than optional. Recorded as written rather than
  back-dated — the sizing miss is the most useful thing in this document.
- **Size / DoD:** L / D2 *(content-only in this repo — no schema, no secret, no auth, no workflow —
  but cross-repo: the consumer `zynkr-atlas` MUST change, see §5. D2 because every claim below about
  the published copies was fetched, not inferred.)*
- **Created:** 2026-09-15 · **Repo(s):** `zynkr-skill-builder` (consumer: `zynkr-atlas` `ATL-101`)
- **Links:** `SKILL_SPEC.md` (IPO field caps) · Atlas `ATL-063` item 3 (the fail-loud this tripped) ·
  Atlas `ATL-064` (`deriveConnectors` · `external_services` on the manifest) · Atlas `ATL-101` (the
  connector, and the disarming)

## Context

Peter's Fireflies account (free plan) reached Claude Code over MCP on 2026-09-15 — remote HTTP
server at `api.fireflies.ai/mcp`, OAuth, registered at user scope. The question that produced this
spec was his: *「I don't have to copy & paste transcript anymore, I can directly invoke skills and
have it read through the MCP before sending note, right?」*

The answer at the time was **no**, and the reason is the whole point of this spec. An MCP server
appearing in the session gives the *model* a capability; it does not give a *skill* one. Every
transcript-consuming skill in this repo was hardwired to Drive / Google Doc / `.srt` / Gemini /
paste. In an interactive session the model can improvise around that. A scheduled or cloud run
cannot — it follows the SKILL.md, and the SKILL.md said "give me a Doc URL".

⚠️ **The `planning-*` family looked like a counter-example and is not.** It has named Fireflies
since `SKB-007` — but it reads the **recap email through Gmail**
(`search_gmail_messages from:fireflies.ai subject:"Fireflies recap"`), never the API. A grep for
"fireflies" in this repo therefore returned hits *before* this spec and told you nothing.

### Free-plan reality, measured against the live account

Third-party write-ups (Rollout, Bollard, the pricing round-ups) state the Fireflies API is
Business-tier only. **That is wrong**, and `docs.fireflies.ai/fundamentals/limits` contradicts it by
publishing a Free rate limit. Verified directly:

| Claim | Result |
|---|---|
| free plan can read | **yes** — `get_user`, `get_transcripts`, and a full 36-minute verbatim transcript all returned |
| transcript shape | speaker-labelled and timestamped, `[12:43 - 14:00] 高May: …` |
| `get_transcripts` | returns summaries **inline** — overview, keywords, action items with timestamps |
| `audio_url` / `video_url` | **empty** — this is the real paid gate; text is the entire surface |
| rate limit | **50 requests/day**, one per tool call (Pro 500/day; Business 60/**minute**) |

⚠️ `Summary Status: skipped` was observed on one 36-minute call, so a summary is **not** guaranteed
even when the transcript is complete. Check the field before relying on `get_summary`.

## What shipped

`9dbdaae9` — **8 files, 238 insertions, 40 deletions.**

**1. Seven SKILL.md name Fireflies in `input:` and carry resolution steps in the body.** The
frontmatter alone would only *advertise* the source; the body is what executes.

| Skill | id | What it got |
|---|---|---|
| `consult-transcriber` | 2.38 | a new **§1.5 SOURCE_MODE gate**; `fireflies` mode **SKIPS §2–§4** — no ASR, no cleanup delegation — and converts Fireflies spans directly to `.srt` |
| `consult-session-notes` | 2.39 | preferred source ahead of paste / Doc / upstream handoff |
| `consult-project-specialist` | 2.05 | preferred source; attendee emails route to the CRM record |
| `sales-follow-up` | 2.10 | reads summary **and** transcript — see D-2 |
| `training-lecture-recap` | 4.08 | a Fireflies branch that skips the ASR step entirely |
| `curate-livestream-transcripts` | 4.09 | new **Step 1b** sweeps Fireflies for livestreams nobody filed as a Doc |
| `admin-video-document` | 3.06 | new **Step 1b** reconciles Drive against Fireflies, surfacing captured-but-unsaved meetings under 「僅 Fireflies，無影片檔」 |

**2. `extracted.json` declares the connector on all seven** — `external_services`, plus
`mcp_servers` / `mcp_tools` / `requires_mcp` for accuracy. `external_services` is the field that
matters: it is the **only** one Atlas's `deriveConnectors` reads, and `mcp_servers` alone yields no
edge.

## Decisions

**D-1 · Every Fireflies block carries the 50/day budget rule, in the skill.** A budget that lives
only in a person's head is not a constraint on an autonomous run. Each block states the cap, that
every tool call spends one, and that the skill must resolve in a single `fireflies_search` and never
loop. `admin-video-document` is told explicitly to make **one** `get_transcripts` call for the whole
reconcile and never fetch a transcript body — it files videos, it does not read them.

**D-2 · `sales-follow-up` must read the transcript, not just the summary.** `get_summary` returns
action items with timestamps that map almost directly onto the follow-up task, which makes it
tempting to stop there. The email's opening mirrors the prospect's pain **in their own words**, and
those words exist only in the verbatim sentences. The skill says so.

**D-3 · The two folder-scanners gain a source, not a parameter.** `curate-livestream-transcripts`
and `admin-video-document` take `input: "None"` — they sweep constants. Fireflies joins them as a
second *source* to sweep, and for `admin-video-document` a Fireflies-only row is explicitly an
**index-only** row: no file exists to move, so it must never fabricate one, and it surfaces in the
approval plan under its own heading.

## ⚠️ Two traps, both hit

**1. `input:` is capped at 180 characters and ingest SILENTLY TRUNCATES past it.** The first draft
ran to **291**. `validate-skill` flags this as `ipo.length` — a **WARN**, so it ships. Truncation
would have cut off the Fireflies mention, which is the entire point of the change. All seven were
rewritten under the cap **and lead with Fireflies**, so even a future truncation keeps it. Verified
on the published copies afterwards, not just locally.

**2. `extracted.json` must be written with `indent=1` and NO trailing newline.** That is its exact
on-disk form — confirmed byte-identical on a clean round-trip before any edit. `indent=2`, or a
trailing newline, reformats all 92 entries into an unreviewable diff that hides the nine real lines.

## Verification

- `validate-skill` **7/7 pass, 0 errors.** Residual warnings (`body.h1_matches_name`,
  `body.h1_present` from markdown template code blocks) are **pre-existing and untouched**.
- `ingest-skills.yml` ✅ and `qa.yml` ✅ both fired on the push; ingest committed its artifacts back
  as `28b6f9d4`.
- All seven fetched live from `zynkr.ai/s/<id>.md` — HTTP 200, Fireflies present in every body, and
  `input:` **un-truncated** with Fireflies leading.
- ⚠️ `/api/skills` shows Fireflies for `consult-transcriber` only. **This is correct, not a defect** —
  that endpoint serves metadata and `summary`; it carries no `input` field and no body. The
  marketplace card shows the first sentence of `description`, and `consult-transcriber` is the one
  whose first sentence changed.

## §5 — ⚠️ The cross-repo consequence, which is why this is L

**This change armed a fail-loud in Atlas, and shipping it alone was not safe.**

Atlas's `deriveConnectors` **throws** on an `external_services` string it cannot resolve —
deliberately, since `ATL-063` item 3 ("a string that does not resolve STOPS THE RUN. That is the
entire point"). Measured on the exact string this spec introduced, *before* the Atlas fix:

```
connectorSlugFor('Fireflies (api.fireflies.ai MCP — meeting transcripts)')  ->  null
notAConnectorReason(...)                                                    ->  null
```

So between `9dbdaae9` and Atlas `ATL-101`, **any re-parse touching any of the seven would have
hard-stopped** — including one aimed at something else entirely. Nothing in *this* repo could have
caught it: `validate-skill` does not know what Atlas's connector map contains.

**The lesson, and the reason the backfill was worth writing:** a new `external_services` string is a
**cross-repo change**, not a content edit, and it sizes **L** on that basis alone. The next one
should land Atlas's map entry in the same breath — or at minimum check
`EXTERNAL_SERVICE_SLUG` and `CONNECTOR_CATALOG` before pushing.

`ATL-101` closed it (both halves are needed; the slug map alone still stops at
`assertConnectorsKnown`) and added the connector. ⚠️ **Its production apply is still owed** — the
Atlas graph does not yet show the connector or its seven `depends_on` edges.
