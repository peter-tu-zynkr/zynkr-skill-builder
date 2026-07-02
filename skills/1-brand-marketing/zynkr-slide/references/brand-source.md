# Brand Source (configuration, not built-in)

> **This skill ships with no brand content.** Brand voice, narrative method, and visual conventions (color/font/imagery) are internal information and are not placed in this public skill library.
> This file does only two things: (1) tell `zynkr-slide` **where to load** your brand guidelines from; (2) provide a **generic schema** describing what to care about during intake and when assembling the ▸ Brief.
> The actual brand content is always loaded **at runtime** from the source you configure — it is never hard-coded here.

> **Division-of-labor reminder**: this `zynkr-slide` layer is only responsible for carrying "should this deck apply the brand or not" into the `SLIDE_PACKET ▸ Brief` (the "Apply brand" field). The **actual per-relay brand application** is still done by each relay's own brand-source, loaded within that relay:
> - Voice/narrative → `slide-storyline-designer/references/brand-source.md`
> - Visual/color/font → `slide-visual-selector/references/brand-source.md`
> This layer does not redefine brand details; it only unifies the "source pointer" and the master switch of "apply or not".

---

## 1 · Configure the brand source (edit here)

```
BRAND_GUIDE = <location of your brand guide>
```

- **Local file**: use Read to load your brand guide (including the Voice & Tone / Method / Visual / Messaging sections).
- **Google Drive**: use the `google-workspace` MCP to search for your brand guide by name.
- **Zynkr internal default**: the brand guide file is named `Zynkr-Brand-Guide.md` (located in the brand folder) and contains the narrative method, voice formulas, signature sentence patterns, word-choice preferences, color roles, type scale, imagery rules, and logo; load it via local Read or Drive search. Color VALUES additionally come from the token manifest (`https://zynkr.ai/data/tokens.json`, `TOKENS_VERSION`-stamped; SDD §4) — the guide gives roles and usage, the manifest gives the actual hex; relay 3 (slide-visual-selector) applies this rule at load time.

**When not found / not configured** → record the ▸ Brief's "Apply brand" as "No, neutral default", and tell the user during intake that "the neutral default is currently in use; no brand is applied".

---

## 2 · What this layer cares about (generic schema)

| Item | Description | Applied in |
|---|---|---|
| **Apply brand or not** | Master switch: whether this deck is produced according to the brand guide | Written into the ▸ Brief "Apply brand" field |
| **Brand source pointer** | Where the brand guide actually lives (local/Drive/unset) | Passed to the three relays so they each load it |

> The detailed voice formulas, color roles, type-scale steps, etc. **are not handled at this layer** — those are the responsibility of relay 1 (voice) and relay 3 (visual), each in its own brand-source. This layer only ensures "consistent source, explicit switch".

---

## 3 · Neutral default when no brand is set (safe to follow directly)

Even without a brand guide, these principles always hold (consistent with what the three relays build in):

- **Write the core claim as a "decision framework"**: what decision does this deck help the audience **make / what trade-off does it help them see clearly**.
- **Titles carry their own conclusion (action title)**: each page's title is a conclusion, not a topic name.
- **Restrained use of color**: the decision color appears at most once per page; don't prop up the layout with flashy color schemes.
- **Don't fabricate material**: mark missing data/cases as "to be filled in" and hand them back to the user.
