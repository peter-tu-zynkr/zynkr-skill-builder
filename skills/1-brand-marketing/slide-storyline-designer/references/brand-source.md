# Brand Voice Source (configured, not built in)

> **This skill ships no brand-voice content of its own.** The brand narrative method, voice formulas, and word-choice preferences are internal information and are not placed in this public skill library.
> This file does only two things: (1) tells the skill **where to load** your brand-voice guidelines from; (2) provides a **generic schema** describing what to extract and how to apply it to the storyline.
> The actual brand narrative method and wording are always loaded **at runtime** from the source you configure — never hard-coded here.

---

## 1 · Configure the brand source (edit here)

```
BRAND_GUIDE = <your brand guide location>
```

- **Local file**: use Read to open your brand guide (including the Voice & Tone / Method / Messaging sections).
- **Google Drive**: use the `google-workspace` MCP to search for your brand guide by name.
- **Zynkr internal default (cloud-first since 2026-08-17)**: the guide is a Google Doc named **`Zynkr-Brand-Guide`** in the Drive folder **`[4] Zynkr-Brandbook`**. Find it with `search_drive_files("name = 'Zynkr-Brand-Guide'")` and read it with `get_doc_as_markdown`. It holds the narrative method, voice formula, signature sentence patterns and word-choice preferences.
  - Read the **Drive Doc, not a local path** — the local `Zynkr-Brand-Guide.md` only exists on one machine, so a local-only read silently produced "no brand applied" everywhere else.
  - The Doc is a **mirror**: its canonical source is the git file `1.0 brand-marketing/1.1 brand/Zynkr-Brand-Guide.md`, re-synced by `scripts/sync-brand-guide.py`. Never edit the Doc — the next sync overwrites it.
  - Fallback order: Drive Doc → local `Zynkr-Brand-Guide.md` if present → neutral defaults, saying so.

**When not found / not configured** → use the generic narrative principles in §3, and tell the user "Currently using generic narrative principles; no brand voice applied."

---

## 2 · What to extract from the brand guide (generic schema)

| Item | Description | Applied to |
|---|---|---|
| **narrative method** | The brand's "from problem to promise" step sequence (if the brand defines one) | the default skeleton for the narrative-arc beats |
| **voice formula** | The persona and ordering in how the brand speaks | overall tone |
| **signature patterns** | Reusable sentence-pattern templates | core claim, titles, transitions |
| **lexicon** | Words to use / to avoid | phrasing; word-choice drift in the logic check |

---

## 3 · Generic narrative principles (not brand-specific, can be followed directly)

Even without a brand guide, these principles always hold:

- **Write the core claim as a "decision framework"**: what decision this deck helps the audience **make / what trade-off it helps them see clearly**, rather than an enumeration of features or topics.
- **Titles carry their own conclusion (action title)**: each slide's title is a conclusion, not a topic name.
- **Name the trade-off**: spell out what the real trade-off is, not just a list of options.
- **State the decision first, commit once there's enough information**: don't just give the answer without the judgment behind it.

---

## 4 · Three moves to apply to the storyline (using the loaded brand or generic principles)

- **core claim (through-line)**: write it with the brand voice + the "decision framework" framing.
- **narrative arc (beats)**: for decision-type decks, prefer applying the brand's narrative method (only when loaded; otherwise use the generic "problem → trade-off → direction" structure).
- **logic check**: if the deck "gives the answer without the judgment" or "gives options without the trade-off," or violates the brand word-choice preferences, flag it as **voice drift** and suggest a rewrite — just like a logic jump, it's a gap to be filled.
