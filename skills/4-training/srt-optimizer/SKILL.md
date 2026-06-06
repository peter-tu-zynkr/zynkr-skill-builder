---
name: srt-optimizer
sheetId: "4.10"
description: "Minimally clean subtitle .srt files into readable Traditional Chinese while preserving original wording, cue timing, and subtitle alignment."
category: training
project: srt-optimizer
platform: multi
status: Done
author: Peter Tu
input: "One .srt subtitle file containing raw speech-to-text output"
process: "Inspect -> export rewrite worksheet -> rewrite cue text batch by batch -> rebuild -> validate -> upload final .srt to Google Drive"
output: "A minimally edited .srt with preserved cue timing, wording fidelity, subtitle-friendly Traditional Chinese, and a copy saved to the designated Google Drive folder"
synergy: []
---

# SRT Optimizer

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill srt-optimizer
```

Optimize a raw `.srt` subtitle file into cleaner Traditional Chinese subtitles without breaking subtitle timing alignment or drifting from the original wording. Use this skill when you have a raw STT subtitle file (e.g., auto-generated from a Chinese lecture or interview) and want minimal-edit cleanup — filler removal and obvious STT fixes only — that preserves every cue's index, timestamp, and meaning.

## Core Goal

- Keep cue numbering and timestamps aligned to the source `.srt`.
- Rewrite only subtitle text unless the user explicitly asks to retime or merge cues.
- Keep subtitle wording as close as possible to the source.
- Only remove filler words, fix obvious STT mistakes, and improve line breaks or spacing.

## Rules

Read `./references/subtitle_rules_zh.md` before rewriting any cue text.

These rules are strict:
- Output Traditional Chinese.
- Use minimal edits only.
- Remove only meaningless filler and obvious STT errors.
- Keep terminology such as `FLAC`, `Notion`, `n8n`, `Claude Code`.
- Use `它` when referring to AI or LLMs rather than `他` or `她`.
- Each subtitle line should stay visually short and natural.
- Do not paraphrase, summarize, compress, or reorder meaning across cues.

## Workflow

1. Inspect the source file:
   - `python3 scripts/optimize_srt.py inspect input.srt`
2. Export a worksheet:
   - `python3 scripts/optimize_srt.py export input.srt --out worksheet.md`
3. Rewrite `TARGET` blocks batch by batch using inline minimal edits only.
4. Rebuild the subtitle file:
   - `python3 scripts/optimize_srt.py rebuild input.srt worksheet.md --out output.srt`
5. Validate the result:
   - `python3 scripts/optimize_srt.py validate output.srt`
6. Upload the validated `.srt` to Google Drive folder `1ml0cPvrH5oohV36yqMMEqOrXXzW0ZVSf`

## Delivery

After validation succeeds, save the final subtitle file to this Google Drive folder:

- Folder URL: `https://drive.google.com/drive/folders/1ml0cPvrH5oohV36yqMMEqOrXXzW0ZVSf`
- Folder ID: `1ml0cPvrH5oohV36yqMMEqOrXXzW0ZVSf`

Use the connected Google Drive / Google Workspace tools to upload the local `.srt` file.

Recommended parameters:
- `folder_id`: `1ml0cPvrH5oohV36yqMMEqOrXXzW0ZVSf`
- `mime_type`: `application/x-subrip`
- `file_name`: keep the validated local filename, preferably ending in `.optimized.srt`

Upload only after local validation passes.
If upload fails, keep the validated local file and report the failure instead of blocking the workflow.

## Rewrite Discipline

- Work in source cue order.
- Keep each cue mapped to the same cue index and timestamp.
- Start from the source wording and change as little as possible.
- Prefer reflowing text within the same cue over changing structure.
- Do not compress two ideas into a shorter paraphrase.
- Do not replace specific wording with a more general summary.
- If a cue is ambiguous, preserve meaning conservatively instead of inventing missing context.
- If the original cue has repeated fragments, keep only the meaningful version.

## Worksheet Contract

The worksheet contains:
- `### Cue N`
- `TIME: ...`
- `SOURCE:` fenced block
- `TARGET:` fenced block

`TARGET` is prefilled with the source text on purpose. Edit that text in place.

Only fill `TARGET` blocks. Do not renumber cues or edit the `TIME:` line.
Do not rewrite a cue from scratch unless the source text is clearly broken by STT.

## Validation Targets

After rebuild, check:
- cues are sequential
- timestamps are unchanged
- no empty subtitle text
- no line exceeds the configured visual width threshold
- punctuation is removed unless the user explicitly wants it preserved
- wording drift from source is minimal and justified by filler removal or STT correction

## Recommended Default Output Path

If the user does not specify an output path, write next to the original file with `.optimized.srt` suffix.
After that, upload the same validated file to the Google Drive folder above.
