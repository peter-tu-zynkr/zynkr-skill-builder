<!--
PII RULE — read before filling in a single placeholder.
This issue body is posted to GitHub, where it is visible beyond the CRM:
- The issue carries the COMPANY name ONLY — never the contact person's name,
  email, or phone number. The person lives in the CRM task, not here.
- No CRM / deal URLs, no Gmail links, no quoted mail bodies that carry
  signatures. Paraphrase the report; do not paste the mail.
- Screenshots are only re-attached if they are scrubbed of personal data;
  otherwise describe them and note where they live.
Placeholders use {{DOUBLE_BRACES}}. Delete every comment block (including this
one) before the body goes to the approval gate.
-->

## Summary

{{ONE_SENTENCE_SYMPTOM}}

<!-- One sentence, present tense, observable behavior. No speculation about cause. -->

## Environment

- Product surface: {{SURFACE}} <!-- e.g. platform 工作指南 module / marketplace page / client assistant -->
- URL or screen: {{URL_OR_SCREEN}}
- Browser / device: {{BROWSER_DEVICE}} <!-- write 未確認 if the report didn't say -->
- Workspace / account context: {{WORKSPACE_HINT}} <!-- company-level only — never a personal email -->
- First observed: {{DATE_OBSERVED}}

## Repro steps

1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}（未確認）

<!-- Number every step. Any step the reporter did not explicitly state but you
     reconstructed as a best guess MUST end with（未確認）so engineering knows
     which parts of the path are inferred rather than reported. -->

## Expected vs Actual

- **Expected:** {{EXPECTED_BEHAVIOR}}
- **Actual:** {{ACTUAL_BEHAVIOR}}

## Severity

**{{SEVERITY}}** — {{ONE_LINE_RATIONALE}}

<!-- Rubric: S1 outage / data loss · S2 core flow broken, no workaround ·
     S3 degraded, workaround exists · S4 cosmetic. -->

## Client impact

{{WHO_IS_BLOCKED_AND_HOW}}

<!-- Company name only. Describe the blocked workflow and its business effect
     ("宏宇精密 cannot issue quotes until this clears"), never the person. -->

## Links

- CRM tracking task: {{CRM_TASK_TITLE}}
- Screenshots / attachments: {{ATTACHMENT_NOTE}}

<!-- INTERNAL NOTE (do not let it survive into the posted issue): the CRM deal
     URL is internal-only — do NOT paste it here. Reference the tracking task
     by TITLE only; the task itself (in the CRM) carries the deal URL, the
     contact person, and the Gmail thread link. -->
