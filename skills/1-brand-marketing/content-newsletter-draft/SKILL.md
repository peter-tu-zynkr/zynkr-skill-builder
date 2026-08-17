---
name: content-newsletter-draft
sheetId: "1.06"
description: >-
  Drafts Peter's weekly Chinese newsletter from the user's article outline or topic idea, shaping it into a structured handoff for the /zynkr-content-writer pipeline. Use this skill whenever Peter says "幫我寫電子報", "來寫電子報", "寫newsletter", "電子報大綱", or shares a topic/outline and wants it shaped into a newsletter. Trigger even if Peter only gives a rough idea — the skill will structure it into a full outline.
category: brand-marketing
project: content-newsletter-draft
platform: claude
status: Done
author: Peter Tu
input: "Peter's article outline, topic, or rough idea for the weekly newsletter"
process: "Shape the outline/topic into a structured weekly-newsletter outline and hand it off to the /zynkr-content-writer pipeline"
output: "A structured newsletter outline ready for the /zynkr-content-writer drafting pipeline"
synergy: []
---
# Write Newsletter

Peter writes a weekly Chinese newsletter for career professionals and AI practitioners. The newsletter's strength is that Peter doesn't just theorize — he shows real things he's been building and learning.

The single ingredient is the **central theme** — Peter's outline or topic idea.

---

## Step 1: Get the article outline

If Peter has already shared an outline or topic in this conversation, extract it now.

If not, ask: "你這週想寫什麼主題？給我一個大綱或幾個關鍵想法就好。"

---

## Step 2: Shape the outline

Before writing, develop the topic into a structured outline:
- What's the core insight or argument of this issue?
- What concrete example or story makes it land for readers?
- What should readers do or take away by the end?

A clear through-line is what makes the newsletter feel alive rather than generic.

---

## House format (mandatory — brief the drafting agent with this verbatim)

The pipeline agents (`content-draft`, `content-editor`) do NOT know this format. Every time, before drafting, pass the full spec below into the agent prompt, and read the newest issue Doc in the folder to pick up the next number and check for topic overlap with ALL past issue titles (see Voice + avoid-list below).

**Container**
- One Google Doc per issue in Drive folder `1RvIRPNg4Kzp_B-9VFZRTXMX4tRgXpSlN`, named `(NN) 電子報｜<title>` (sequential; check the folder for the latest NN).
- Two versions inside the Doc (Tab 1 正式版 / Tab 2 筆友書信體版本 — real Doc tabs when the `google-workspace` MCP is available, otherwise two `#` H1 sections).
- Link the Doc back to the Notion Content-DB idea row (`Google Doc` + `Full Title` properties).
- Exemplars: (59) `1VrMSecK9pSVQRFoxOmYKS8xn5tAcAMllFUfUZC2X9pM`, (60) `1449GY5oyBshxmxyuiKsp7dmhunUW_nOeLZCHowunbTg`, (61) `1ZW50dFApBTPaYv-iSryizh7GMvmGV_cvxuiYKChosTo`.

**Tab 1 正式版 — 1,200–1,500 字**
- Opening hook: 2–3 short paragraphs, no heading.
- 3–5 sections with `##` headings (一、二、三…), each 2–4 substantial multi-sentence paragraphs — not one-line social-post fragments.
- At most 1–2 bold key sentences in the whole piece.
- Closing synthesis → throw the question back to the reader → 「回信告訴我：…，我會一封一封讀。」 → last line `【CTA 待 Peter 確認】`.

**Tab 2 筆友書信體版本 — ~1,200–1,400 字**
1. Open by answering a question Peter is often asked.
2. Address the reader as 「你」 throughout; anticipate the reader's objection, then catch it.
3. No headings. **No separator lines between paragraphs — do NOT insert `–` / `—` / `---` lines; paragraphs are separated by a blank line only** (Peter's rule, 2026-08-17).
4. Mostly one sentence per line; each sentence is its own paragraph.
5. No bold.
6. Explain jargon inline in plain words.
7. Ending: question back to the reader → invite replies 「回信告訴我…我會一封一封讀。」 → last line 「下禮拜見 ·」.
8. Warm but not cutesy.

**Language rules**
- zh-TW; Chinese headings and taglines carry no ending 句號; use 「·」 for series.
- Peter's voice: first person, shows real things he built/learned, concrete example per section, no clichés (「在這個時代」「不可否認」「值得注意的是」…).
- Run `content-editor` after drafting (forbidden-words Doc + editor guide) before creating the Doc.

**Voice + avoid-list (2026-08-17, from the (25)–(61) audit)** — put these in the draft agent's prompt every time, and run `content-editor` after drafting:
- Read at runtime: 《[2.2] 內文風格指南》§八「Peter 的聲音」(`1ect0fDoHZQ7srFEQvLNCSLsQk-UTawvbxpt3SteYP1M`, tab 最終產出) for the positive rules, and 《[3.2] 禁用詞清單》增補 A–V (`1N5sHLP4qzmmhpCGsi6KElxi1z0MFe4QZ0Q_35T10Uyg`) for the forbidden patterns. If Drive is unreachable, use the summary below.
- Positive: open on a stamped first-person moment (time/place/prop/someone's exact words) — never a thesis, heading, 「最近常被問到一個問題」, borrowed English quote, or textbook theory; ≥3 hard receipts (numbers/years/tool names/money/durations) + ≥1 admitted cost or mistake; Taiwanese spoken register (十趴、開坑、踩雷、打退堂鼓、手癢、霧霧的) with jargon glossed in the same sentence, ≤5 unglossed English terms; 「我」 sentences ≥ 「你」 sentences; hedges welcome (可能／大概／我不確定); each section = one small real story → what Peter changed; close with a plain restatement (no aphorism) → one question answerable in a line → 「回信告訴我：…，我會一封一封讀。」→「下禮拜見 ·」.
- Avoid (per-issue caps): 「不是 X，是 Y」 and every variant (不在／而在／不是因為／這不是說／不只是) ≤2, and 0 in title/headings/bold; 「真正」≤1; 「關鍵」 as connective 0; 「從來不是」 0; 「老實說／說真的／說穿了／說到底」 ≤1 and never in the first three sentences or a heading; 「其實」≤2; 「X 教我／想通／坦白 一件事」 0; the whole 「愣了一下／停了一下／那一刻／那個瞬間／突然意識到」 epiphany family 0 (also body-reaction beats and 「哇／天啊／我差點摔滑鼠」); 「很多人以為／大部分人」 0; letter-version 「你可能會說／你大概會接著問／換成你我想問你」 ≤1 and only with a real objection; self-Q&A 0; section-closing aphorisms ≤2; one-line dramatic paragraphs ≤1; 「——」≤5; buzzwords (護城河、稀缺、洞見、賦能…), 成語 posters, 中國用語 (優化／積累／哪怕／反饋／打法／落地／代辦／計劃) 0.
- Editor stage must return a count table for the caps above and a 「原句 → 類別 → 建議改法」 list; fix before creating the Doc.
- Overlap check is against **all** past titles in the folder (not just the last five): (25) already covered 傑文斯悖論／生產力悖論, (59) 時間管理, (54) 工作習慣, (58) 多工／終端機. A concept that already had an issue becomes a one-line callback, not a re-explanation.
- Hygiene: only 【CTA 待 Peter 確認】 may remain as a placeholder; facts must match between 正式版 and 書信體 (dates, percentages); one separator style; no leftover Handoff Summary / outline blocks in the Doc.

---

## Step 3: Hand off to /zynkr-content-writer

At this point we have a structured outline with key points per section. This is exactly **Stage 2** entry point for the `/zynkr-content-writer` pipeline.

Package the outline into a handoff summary in this format **plus the full House format block above**, then invoke `/zynkr-content-writer`:

```
## Newsletter Handoff Summary

**Central theme:** [one sentence]

**Confirmed structure:** [structure name, e.g. Problem → Insight → Application → CTA]

**Section key points:**
1. [Section title] — [2–3 bullet points]
2. [Section title] — [2–3 bullet points]
3. [Section title] — [2–3 bullet points]
4. CTA — [3 specific actions]
```

Then say: "我已經整理好大綱，交給 /zynkr-content-writer 開始撰寫。" and invoke `/zynkr-content-writer` with the handoff summary as the argument — it will enter at Stage 2 (content-draft) and run the full writing pipeline from there.
