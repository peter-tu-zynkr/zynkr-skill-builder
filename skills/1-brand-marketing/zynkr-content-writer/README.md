# Zynkr Writing Agent

A modular article writing pipeline built on [Claude Code](https://claude.ai/claude-code), designed for Zynkr's content team. Seven specialized agents handle each stage of the writing process — from ideation to CTA — orchestrated by a single `/zynkr-content-writer` command.

## Install

### Option 1: Install into your current Claude workspace

If you already have a project open in Claude Code and want to add this writing pipeline into that workspace, run:

```bash
curl -fsSL https://raw.githubusercontent.com/peter-tu-zynkr/writing-agent/main/scripts/install.sh | bash
```

This installs:

- `.claude/skills/write-article/`
- all 7 supporting files in `.claude/agents/`

If you want to install into a different workspace path:

```bash
curl -fsSL https://raw.githubusercontent.com/peter-tu-zynkr/writing-agent/main/scripts/install.sh | bash -s -- "/path/to/your/project"
```

### Option 2: Manual install

Copy the Claude assets into your target workspace:

```bash
mkdir -p "/path/to/your/project/.claude/agents" "/path/to/your/project/.claude/skills"
cp .claude/agents/*.md "/path/to/your/project/.claude/agents/"
cp -R .claude/skills/write-article "/path/to/your/project/.claude/skills/write-article"
```

### Option 3: Run it directly from this repo

If you prefer to use the repo as-is, clone it and open Claude Code in the repo root:

```bash
git clone https://github.com/peter-tu-zynkr/writing-agent.git
cd writing-agent
claude
```

## Pipeline Overview

```
 Ideation → Structure → Drafting → Editing → Titles → CTA
   (0)        (1)        (2)        (3)       (4)     (5)
```

| Stage | Agent | What It Does |
|-------|-------|--------------|
| 0 | `content-idea` | Guides vague ideas into a refined premise through Socratic dialogue |
| 1 | `content-style-select` | Recommends article structures (9 templates) and maps section key points |
| 2 | `content-draft` | Writes the draft section-by-section (~1000–1200 words) following a style guide |
| 3 | `content-editor` | Reviews against editorial rules, checks forbidden words, removes AI-sounding language |
| 3.5 | `content-reader` | (Optional) Scores the article on a 100-point rubric with critical analysis |
| 4 | `content-title` | Generates 10 SEO-optimized title suggestions |
| 5 | `content-cta` | Produces 3 CTA options matched to the article's goal |

## Quick Start

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated

### Usage

Open the workspace that contains the installed skill in Claude Code:

```bash
cd /path/to/your/project
claude
```

Then invoke the orchestrator:

```
/zynkr-content-writer
```

The orchestrator detects what you already have and starts from the appropriate stage. You can also pass a topic directly:

```
/zynkr-content-writer 我想寫一篇關於AI工具的文章
```

### Using Individual Agents

Each agent can also be invoked independently via the Task tool. For example, if you only need editing:

```
Help me edit this article: [paste your draft]
```

Claude will automatically route to the `content-editor` agent, as long as the `.claude/agents` files from this repo are installed in the current workspace.

## Project Structure

```
.
.claude/
├── agents/
│   ├── content-idea.md
│   ├── content-style-select.md
│   ├── content-draft.md
│   ├── content-editor.md
│   ├── content-reader.md
│   ├── content-title.md
│   └── content-cta.md
└── skills/
    └── write-article/
        ├── SKILL.md
        └── references/
            ├── stage-0-socratic.md
            ├── stage-1-style-selection.md
            ├── stage-1-article-structure.md
            ├── stage-2-article-draft.md
            ├── stage-2-style-guide.md
            ├── stage-3-editor.md
            ├── stage-3-editor-guide.md
            ├── stage-3-5-content-reader.md
            ├── stage-4-article-title.md
            ├── stage-4-seo-list.md
            ├── stage-5-cta-writing.md
            └── stage-5-cta-selection.md
scripts/
└── install.sh
```

## Runtime Layout

The only files Claude Code needs at runtime are under `.claude/`.

- `.claude/agents/` contains the 7 subagents
- `.claude/skills/write-article/` contains the orchestrator skill
- `.claude/skills/write-article/references/` contains the stage-specific reference material used to maintain consistency across the pipeline

The repo root is intentionally kept small so install instructions and entry points are easy to scan.

## Claude Asset Layout

```text
.claude/
├── agents/
│   ├── content-idea.md   # Stage 0 — Ideation
│   ├── content-style-select.md      # Stage 1 — Structure
│   ├── content-draft.md             # Stage 2 — Drafting
│   ├── content-editor.md              # Stage 3 — Editing
│   ├── content-reader.md          # Stage 3.5 — Review (optional)
│   ├── content-title.md     # Stage 4 — SEO Titles
│   └── content-cta.md                  # Stage 5 — CTA
└── skills/
    └── write-article/
        └── SKILL.md                   # Pipeline orchestrator
```

## Language

The agents and style guides are written in Traditional Chinese (zh-TW), reflecting Zynkr's target audience. The orchestrator responds in whichever language the user writes in.

## License

Private project — all rights reserved.
