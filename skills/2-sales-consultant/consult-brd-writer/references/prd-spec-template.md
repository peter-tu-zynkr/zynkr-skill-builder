<!--
CONTRACT — this template's structure is parsed downstream. Do NOT restructure.
consult-uat-writer machine-reads four things from every PRD produced here:
  1. the H1 line          `# {{SPEC_ID}} — {{TITLE}}`        (spec identity)
  2. the Size / DoD line  `- **Size / DoD:** …`               (test depth)
  3. every AC pair        `- **AC-n** — When …, then …` +
                          its following `*Verify:*` line      (one UAT case each)
  4. the `## Out of scope` section                            (negative test cases)
Keep the exact heading text, the `**AC-n**` bold markers, and the italic
`*Verify:*` prefix. Renaming any of these silently breaks the UAT hand-off.
Structure mirrors Zynkr SDD §2.4 (6.0 tech/SDD.md); English-canonical, with
zh-TW client-facing strings quoted verbatim in 「」.
-->
# {{SPEC_ID}} — {{TITLE}}

- **Status:** Draft
- **Size / DoD:** {{SIZE}} / {{DOD}}   *(D3 if client data · schema · auth · money — say which)*
- **Created:** {{TODAY}} · **Client:** {{COMPANY}} ({{DEAL_URL}})
- **Sources:** {{SOURCE_DOCS}}

## Context

{{CONTEXT}}
<!-- 2–4 sentences: the client's problem, why now, what exists today (name the
     systems/files). Business framing lives in the BRD; link it, don't repeat it. -->

## Requirements & acceptance criteria

- **AC-1** — When {{TRIGGER_1}}, then {{OUTCOME_1}}.
  *Verify:* {{VERIFY_1}}
- **AC-2** — When {{TRIGGER_2}}, then {{OUTCOME_2}}.
  *Verify:* {{VERIFY_2}}
<!-- One AC per requirement, EARS-lite: "When <trigger/state>, then <observable
     outcome>." Every *Verify:* line must be a check the CLIENT can watch happen —
     an exact click path, a query, a file that appears — never "tests pass".
     Quote client-facing UI strings verbatim in zh-TW, e.g. When the operator
     clicks 「送出報價」, then …  Add AC-3, AC-4 … as needed; never renumber. -->

## Design sketch

- Data: {{DATA_CHANGES}}            <!-- tables / sheets / files touched, or "none" -->
- Surfaces: {{SURFACES}}            <!-- screens / routes / scripts / automations -->
- Decisions: {{DECISIONS}}          <!-- bullets; note rejected alternatives only if contested -->

## Out of scope

- {{OUT_OF_SCOPE_1}}
- {{OUT_OF_SCOPE_2}}
<!-- Explicitly not doing — each line with the follow-up home if deferred.
     consult-uat-writer turns these into "confirm it does NOT happen" checks. -->

## Tasks

- [ ] {{SPEC_ID}}.1 {{TASK_1}}
- [ ] {{SPEC_ID}}.2 {{TASK_2}}

## Verification plan

- End-to-end: {{E2E_FLOW}}
  <!-- the real flow to drive once built — same flow consult-uat-writer scripts -->
- Evidence lands in: {{EVIDENCE_HOME}}
  <!-- e.g. the deal's activity timeline + this Doc's Status line flipping to
       Shipped YYYY-MM-DD -->

<!--
Placeholder guide (fill, then delete this comment block):
  {{SPEC_ID}}       <CLIENTSLUG>-NNN, e.g. ACME-001 — CLIENTSLUG is the 3–5 letter
                    latinization of the client company; NNN = 1 + highest existing
                    [PRD] doc in the client's Drive folder (the Doc titles ARE the
                    registry — no central file)
  {{TITLE}}         short buildable-change title, English, e.g. Quote auto-fill from price history
  {{SIZE}}/{{DOD}}  per SDD §2.1/§3 — S/D1 · M/D2 · L/D2; client data/schema/auth/money ⇒ D3
  {{TODAY}}         YYYY-MM-DD
  {{COMPANY}}       client company name
  {{DEAL_URL}}      https://zynkr-crm.vercel.app/deals/{deal_id}
  {{SOURCE_DOCS}}   links: the [BRD] doc, discovery summaries, shadowing transcript
  {{CONTEXT}}       see inline comment above
  {{TRIGGER_n}}/{{OUTCOME_n}}/{{VERIFY_n}}  see the AC inline comment
  {{DATA_CHANGES}}/{{SURFACES}}/{{DECISIONS}}  design sketch bullets
  {{OUT_OF_SCOPE_n}}  explicit exclusions (mirror BRD §五 where one exists)
  {{TASK_n}}        build tasks, one line each
  {{E2E_FLOW}}/{{EVIDENCE_HOME}}  verification plan bullets
-->
