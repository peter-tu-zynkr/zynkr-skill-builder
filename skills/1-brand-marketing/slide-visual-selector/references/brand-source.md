# Brand Visual Source (configured, not built-in)

> **This skill ships with no brand content.** Brand guides are internal information and are not placed in this public skill library.
> This file does only two things: (1) tell the skill **where to load** your brand visual standards from; (2) provide a **generic schema** describing what to extract from the brand guide and how to apply it to the "design notes".
> Actual color values, fonts, and image standards are always loaded **at runtime** from the source you configure — never hard-coded here.

---

## 1 · Configure the brand source (edit here)

```
BRAND_GUIDE = <your brand guide location>
```

- **Local file**: use Read to read your brand guide (Markdown / PDF / token file).
- **Google Drive**: use the `google-workspace` MCP to search for your brand guide by name, then read its contents.
- **Zynkr internal default**: the brand guide filename is `Zynkr-Brand-Guide.md` (located in the brand folder), containing the color system, type scale, image rules, and logo assets; load it via local Read or Drive search. **Color VALUES come from the token manifest**: `https://zynkr.ai/data/tokens.json` (`TOKENS_VERSION`-stamped; per the SDD §4 arrow of truth, styles.css values win over any hex table in the guide) — the guide supplies the *roles and usage rules* (which color plays surface/highlight/decision and each one's restraint rule), the manifest supplies the actual hex.

**When not found / not configured** → fall back to the "neutral fallback" (see §4), and clearly tell the user "Currently using neutral visual defaults; no brand applied."

---

## 2 · What to extract from the brand guide (generic schema)

After loading, map the roles below to the actual values in the brand guide, then write them into each page's "design notes". These are **generic design roles** that apply to any brand:

| Role | Description | Applied to |
|---|---|---|
| **Default surface color (surface)** | Page default background color | `slide.background` |
| **Dark contrast color (dark contrast)** | Full-bleed dark background (cover / section / closing) | Dark-background page background; text flipped to the surface color |
| **Highlight color (highlight)** | Thinking / keyword emphasis | Title keywords, **≤ 1 per title** |
| **Decision color (accent / decision)** | The single decision, CTA | **At most 1 per page** |
| **Text color / footnote color** | Body text and secondary information | addText color |
| **Font roles** | Display font / body font / numeral font / Chinese font | slide-pptx `fontFace` |
| **Type scale** | The pt sizes for display / heading / body / footnote / numbering | slide-pptx `fontSize` |
| **Image rules** | Prefer structural diagrams vs decorative images; motifs; icon specs | image-led / concept / divider pages |
| **Logo assets** | Light logo on dark backgrounds, dark logo on light backgrounds | cover / closing `addImage` |

---

## 3 · Generic design principles (not brand-specific, follow directly)

Even without a brand guide, these principles always hold:

- **One decision color, at most once per page**: only mark the genuine "decision / CTA / key number". Emphasizing the whole page = no focus at all.
- **Restrained highlight color**: only keywords get the highlight color; too many dilutes it.
- **Don't decorate, diagram**: if a structural diagram (flow / hierarchy / matrix / comparison panel) can clearly explain the relationship, don't stuff in atmospheric stock images.
- **Dark–light–dark sandwich**: cover dark background → interior light backgrounds → closing dark background, so the ending echoes the opening.

---

## 4 · Neutral fallback (when no brand is configured)

- Surface color: white / light gray; dark contrast: dark gray near black; decision color: a single vivid color (once per page); text: dark gray.
- Fonts: one sans-serif set (display bold, body regular); use a system sans-serif for Chinese.
- Images: still follow "don't decorate, diagram".
- And remind the user: you can configure the brand source in §1 to apply the actual brand.

---

## 5 · pptxgenjs implementation (generic mechanism, not brand content)

- Color values **drop the `#`**: `fill: { color: "RRGGBB" }`, `color: "RRGGBB"`.
- Default background color: `slide.background = { color: "<surface>" }`.
- 16:9 widescreen canvas ≈ `13.33" × 7.5"` (`LAYOUT_WIDE`), reserve a `0.5"` margin.
- If a font is unavailable on the rendering machine, the slide-pptx skill will fall back; this relay only needs to specify the "font role" in the design notes.
