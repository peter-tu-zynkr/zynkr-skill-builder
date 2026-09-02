---
name: slide-pptx
sheetId: "1.28"
category: brand-marketing
project: slide-pptx
platform: claude
status: Done
author: Anthropic, PBC
description: "The 'rendering engine' that comes after the three-stage slide relay (the fourth stage, maintained by Anthropic): it takes the SLIDE_PACKET ▸ Visuals handed off by slide-visual-selector and renders it page by page into a real .pptx file, and can also read, parse, and edit existing decks in reverse. This is Anthropic's official slide-pptx skill; Zynkr does not redistribute its code — this card is only a reference and a hand-off pointer, so install it from the Anthropic source."
input: "The SLIDE_PACKET ▸ Visuals per-page visual spec (handed off by slide-visual-selector), or an existing .pptx file."
process: "Read each page's layout archetype and pptxgenjs primitives → render with pptxgenjs / LibreOffice → output a .pptx; for an existing file, parse, edit, and write it back."
output: "A .pptx presentation file you can open and edit directly."
synergy: ["slide-visual-selector"]
upstream_repo: https://github.com/anthropics/skills
original_source_url: https://github.com/anthropics/skills/blob/HEAD/skills/slide-pptx/SKILL.md
original_author: Anthropic, PBC
install_command: npx skills add https://github.com/anthropics/skills --skill slide-pptx
handoff: []
execution_mode: deterministic
---

# slide-pptx — Anthropic's Official Slide-Rendering Skill (reference card)

> **This is a reference, not a redistribution.** `slide-pptx` is authored and copyrighted by Anthropic (© Anthropic, PBC — All rights reserved), and its license prohibits third parties from reproducing, modifying, or redistributing it. Zynkr **does not host any of its code on this site**; this page only credits the author, links to the official source, and provides the official install command — the same approach as [skills.sh](https://www.skills.sh/anthropics/skills/slide-pptx).

## Its place in the "slide assistant" chain (stage 4)

```
1. slide-storyline-designer  → ▸ Storyline   敘事骨架      （Zynkr 自製）
2. slide-page-splitter       → ▸ Pages       每頁配置      （Zynkr 自製）
3. slide-visual-selector     → ▸ Visuals     逐頁視覺規格  （Zynkr 自製）
4. slide-pptx (by Anthropic)       → .pptx 檔       算繪 ← 你在這裡
```

The first three stages are Zynkr's own "design" gates, responsible for thinking through what goes on each page and what it looks like; `slide-pptx` is the "rendering" gate that turns the spec into a real file. After the three stages hand over `▸ Visuals`, `slide-pptx` wraps things up and produces the `.pptx`.

If all you need is a storyline or a page-splitting plan, or you intend to switch to Canva / Google Slides for the visuals, you can stop at stage three and don't necessarily need `slide-pptx`.

## Install (from Anthropic's official source)

```bash
npx skills add https://github.com/anthropics/skills --skill slide-pptx
```

- Official source: <https://github.com/anthropics/skills> (skill: `slide-pptx`)
- skills.sh reference page: <https://www.skills.sh/anthropics/skills/slide-pptx>
