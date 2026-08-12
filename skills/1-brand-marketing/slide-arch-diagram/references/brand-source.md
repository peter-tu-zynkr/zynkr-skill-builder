# Brand Visual Source (configured, not built-in)

> **This skill ships with no brand content.** Brand guides are internal information and are not placed in this public skill library.
> This file does two things: (1) tell the skill **where to load** brand tokens from; (2) define the **token roles** the `.arch` component consumes. Actual color values and fonts are loaded **at runtime** from the source you configure — never hard-coded here.

---

## 1 · Configure the brand source (edit here)

```
BRAND_GUIDE = <your brand guide location>
```

- **Local file**: Read your brand guide / token file directly.
- **Google Drive**: use the `google-workspace` MCP to find and read it.
- **Zynkr internal default**: color VALUES come from the token manifest `https://zynkr.ai/data/tokens.json` (`TOKENS_VERSION`-stamped; per SDD §4 arrow of truth, the website `styles.css :root` values win over any hex table in a guide). The brand guide (`Zynkr-Brand-Guide.md`) supplies the *roles and restraint rules*; the manifest supplies the hex.

**When not found / not configured** → neutral fallback (§3) and clearly tell the user "Currently using neutral visual defaults; no brand applied."

---

## 2 · Token roles the `.arch` component consumes

Map the loaded brand onto these custom properties on the slide container:

| Custom property | Role | Used for |
|---|---|---|
| `--paper` / `--paper-raised` | surface | page ground / icon fills |
| `--ink` / `--ink-soft` | structure | text, icon strokes / octagon node fill |
| `--sage-deep` | thinking structure | frame, lane borders, arrows, icon accents, lane subtitles |
| `--orange` | decision | **the law line only — once per page** |
| `--mute` | secondary text | icon sublabels |
| `--on-dark` / `--on-dark-mute` | text on dark | octagon node text / subline |
| `--f-display` / `--f-mono` | display / mono font roles | lane subtitles / page numbers |

Color-role budget (Zynkr rule, works as a generic default): surface holds
70–80% · structure 15–25% · thinking accent 3–8% · **decision color exactly
once per page** — the law line is that once.

---

## 3 · Neutral fallback (when no brand is configured)

- Surface: white / near-white. Structure: near-black. Lane/arrow accent: one
  muted mid-tone (e.g. a desaturated green or blue). Decision color: one vivid
  color, once per page. Node fill: dark gray, light text.
- Fonts: one sans-serif set; system sans for Chinese.
- All restraint rules in §2 still apply — the grammar works unbranded.
