# Visual Grammar — the `.arch` component (render contract)

Proven in production (AI Sales Workflow Workshop deck, 2026-08-12, seven
diagrams). This file is the contract: markup skeleton, element semantics, the
CSS, and the QA gotchas — each gotcha shipped as a real bug once.

## Assumptions

The component lives inside a slide `section` that:

1. is a **CSS size container** (`container-type:size`) — all dimensions use
   `cqh`/`cqw` so the diagram scales with projection;
2. defines the **brand token custom properties** it references
   (`--sage-deep --ink --ink-soft --paper --paper-raised --orange --mute
   --on-dark --on-dark-mute --f-display --f-mono`). Values load at runtime per
   `./brand-source.md` — never hard-code hex here.

## Page skeleton around the diagram

```html
<section class="slide">
  <div class="eyebrow">Part N · 工作流 ①</div>
  <h1 class="tight">Conclusion-bearing title — a claim, not a label</h1>
  <div class="sub">The use-case in the user's words, one line, italic</div>
  <div class="body">
    <div class="arch"> … (below) … </div>
  </div>
  <footer><span>Deck name · Section</span><span class="pg"></span></footer>
</section>
```

Title discipline: 「只要公司名和網址，其餘都自動生得出來」 ✓ ·
「背景調查流程」 ✗. The title states the diagram's argument.

## Diagram markup skeleton

4-column grid — label gutter + one column per BE node — × 3 lane rows, then the
law-line row. Full worked example with two DB feeds and one FE input:

```html
<div class="arch">
  <!-- lane 1: FE -->
  <div class="lane-lbl r1"><b>前端</b><span>Front End</span></div>
  <div class="cell r1">
    <div class="doc"><span class="ic"></span><div><b>收件人職稱與角色</b><span>這封信寫給誰</span></div></div>
    <span class="stem-dn"></span><span class="vdn"></span>
  </div>
  <div class="cell r1"></div>
  <div class="cell r1">
    <div class="doc"><span class="ic"></span><div><b>150 字開發信</b><span>＋兩個主旨版本 A/B</span></div></div>
    <span class="stem-out"></span><span class="vout"></span>
  </div>
  <!-- lane 2: BE -->
  <div class="lane-lbl r2"><b>後端</b><span>Back End</span></div>
  <div class="cell r2"><div class="node"><b>選切入角度</b><span>從背調挑一個痛點</span></div><span class="harw"></span></div>
  <div class="cell r2"><div class="node"><b>套結構</b><span>切入點→證據→單一 CTA</span></div><span class="harw"></span></div>
  <div class="cell r2"><div class="node"><b>控長度與語氣</b><span>150 字以內</span></div></div>
  <!-- lane 3: DB -->
  <div class="lane-lbl r3"><b>資料庫</b><span>Database</span></div>
  <div class="cell r3"></div>
  <div class="cell r3">
    <span class="stem-up"></span><span class="vup"></span>
    <div class="fol"><span class="ic"></span><div><b>②的背景摘要</b><span>上一格的 Output</span></div></div>
  </div>
  <div class="cell r3">
    <span class="stem-up"></span><span class="vup"></span>
    <div class="fol"><span class="ic"></span><div><b>有回信的信件範例</b><span>你的手感，寫下來</span></div></div>
  </div>
  <!-- law line -->
  <div class="law">全自動——但品質完全由 Input 決定</div>
</div>
```

## Element semantics

| Class | Meaning | Rules |
|---|---|---|
| `.lane-lbl` | Lane label (前端/後端/資料庫 + EN subtitle) | carries the lane's `r1/r2` border class; MUST stretch to row height (see gotcha 1) |
| `.doc` | FE artifact (human-provided input, or the output) | top lane only |
| `.node` | BE process step (octagon, dark) | 2–4 per diagram, execution order left→right; `<b>` = the action, `<span>` = the how/constraint |
| `.fol` | DB feed (stored state / written knowledge) | bottom lane only; label WHAT it is + WHY it matters (「前提：⑤有做」) |
| `.stem-dn`+`.vdn` | FE input drops into BE | bottom edge of the FE cell, pointing down |
| `.stem-out`+`.vout` | output rises from BE into FE | bottom edge of the FE cell, pointing **up** — NOT `.vup` (gotcha 4) |
| `.stem-up`+`.vup` | DB feed rises into BE | top edge of the DB cell, pointing up |
| `.harw` | BE node chain arrow | **empty span** — the arrow is drawn in CSS (gotcha 3) |
| `.law` | the verdict | exactly ONE per diagram; the page's only orange; plain text, no emoji (gotcha 2) |

Adjusting column count: change `repeat(3,1fr)` to `repeat(N,1fr)` for N nodes;
`.law{grid-column:2/5}` becomes `2/N+2`.

## The CSS (embed once per deck)

```css
/* ─── p11-style architecture: FE / BE / DB lanes, flow left→right ─── */
.arch{border:1.5px solid var(--sage-deep); border-radius:18px; width:100%;
      display:grid; grid-template-columns:9.5cqw repeat(3,1fr); position:relative}
.arch .lane-lbl{padding:2cqh 0 2cqh 1.6cqw; display:flex; flex-direction:column; justify-content:center}
.arch .lane-lbl b{display:block; font-size:2.5cqh; font-weight:800; color:var(--ink); line-height:1.2}
.arch .lane-lbl span{display:block; font-family:var(--f-display); font-size:1.55cqh;
      color:var(--sage-deep); font-weight:600; margin-top:.2em}
.arch .cell{display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
      padding:2cqh .8cqw; position:relative; min-height:13.5cqh}
.arch .r1{border-bottom:1px solid var(--sage-deep)}
.arch .r2{border-bottom:1px solid var(--sage-deep)}
.arch .r2.cell{justify-content:center}
.arch .r3.cell{justify-content:center}
/* doc icon + label (FE artifacts) */
.arch .doc{display:flex; align-items:flex-start; gap:.7cqw; text-align:left}
.arch .doc .ic{width:3cqh; height:3.7cqh; border:2px solid var(--ink); border-radius:3px;
      flex:none; position:relative; background:var(--paper)}
.arch .doc .ic::before{content:""; position:absolute; left:18%; top:16%; width:.85cqh; height:.85cqh;
      border:1.6px solid var(--sage-deep); border-radius:50%}
.arch .doc .ic::after{content:""; position:absolute; left:18%; right:18%; bottom:24%; height:1.6px;
      background:var(--ink); box-shadow:0 -.55cqh 0 var(--ink)}
.arch .doc b{display:block; font-size:1.95cqh; font-weight:700; color:var(--ink); line-height:1.3}
.arch .doc span{display:block; font-family:var(--f-mono); font-size:1.4cqh; color:var(--mute); line-height:1.35}
/* folder icon + label (DB artifacts) */
.arch .fol{display:flex; align-items:flex-start; gap:.7cqw; text-align:left}
.arch .fol .ic{width:4cqh; height:3cqh; border:2px solid var(--ink); border-radius:3px;
      flex:none; position:relative; background:var(--paper); margin-top:.4cqh}
.arch .fol .ic::before{content:""; position:absolute; left:10%; top:-1cqh; width:38%; height:.9cqh;
      border:2px solid var(--ink); border-bottom:0; border-radius:3px 3px 0 0}
.arch .fol .ic::after{content:"◉ ◉"; position:absolute; inset:0; display:grid; place-items:center;
      font-size:1.15cqh; color:var(--sage-deep); letter-spacing:.1em}
.arch .fol b{display:block; font-size:1.95cqh; font-weight:700; color:var(--ink); line-height:1.3}
.arch .fol span{display:block; font-size:1.45cqh; color:var(--mute); line-height:1.35}
/* BE octagon node */
.arch .node{background:var(--ink-soft); color:var(--on-dark); text-align:center;
      padding:2.1cqh 1.7cqw; min-width:15.5cqw; position:relative;
      clip-path:polygon(9% 0,91% 0,100% 26%,100% 74%,91% 100%,9% 100%,0 74%,0 26%);
      outline:2px solid var(--sage-deep); outline-offset:3px}
.arch .node b{display:block; font-size:2.15cqh; font-weight:700; line-height:1.3}
.arch .node span{display:block; font-size:1.5cqh; color:var(--on-dark-mute); margin-top:.2em; line-height:1.3}
/* arrows */
.arch .vdn,.arch .vup{width:0; height:0; position:absolute; left:50%; transform:translateX(-50%);
      border-left:.55cqw solid transparent; border-right:.55cqw solid transparent}
.arch .vdn{bottom:-.1cqh; border-top:1.35cqh solid var(--sage-deep)}
.arch .vup{top:-.1cqh; border-bottom:1.35cqh solid var(--sage-deep)}
.arch .stem-dn{position:absolute; bottom:1cqh; left:50%; transform:translateX(-50%);
      width:.3cqw; height:2.6cqh; background:var(--sage-deep)}
.arch .stem-up{position:absolute; top:1cqh; left:50%; transform:translateX(-50%);
      width:.3cqw; height:2.6cqh; background:var(--sage-deep)}
.arch .vout{width:0; height:0; position:absolute; left:50%; transform:translateX(-50%);
      bottom:3.2cqh; border-left:.55cqw solid transparent; border-right:.55cqw solid transparent;
      border-bottom:1.35cqh solid var(--sage-deep)}
.arch .stem-out{position:absolute; bottom:.6cqh; left:50%; transform:translateX(-50%);
      width:.3cqw; height:2.6cqh; background:var(--sage-deep)}
.arch .harw{position:absolute; right:-1.5cqw; top:50%; transform:translateY(-50%);
      z-index:2; width:2.6cqw; height:.55cqh; background:var(--sage-deep)}
.arch .harw::after{content:""; position:absolute; right:-1.1cqw; top:50%; transform:translateY(-50%);
      border-top:.95cqh solid transparent; border-bottom:.95cqh solid transparent;
      border-left:1.2cqw solid var(--sage-deep)}
/* orange law line inside the frame, bottom-right */
.arch .law{grid-column:2/5; text-align:right; padding:1.2cqh 1.6cqw 1.4cqh 0;
      font-size:1.95cqh; font-weight:700; color:var(--orange)}
```

## QA checklist (every item shipped as a bug once)

1. **Lane borders form one continuous line across all four columns.**
   The bug: `align-self:center` on `.lane-lbl` shrank the label to content
   height, floating its border mid-row while the cells' borders sat on the row
   boundary — a visibly stepped line. The fix is in the CSS (label stretches,
   content centers via inner flex). Verify: for each of `r1`,`r2`, every cell's
   `getBoundingClientRect().bottom` rounds to the same y.
2. **No emoji.** ✅/❌ in law lines render as colored glyph boxes that fight
   the single-orange rule. Words only (「全自動」「卡最兇」).
3. **Arrow spans are empty.** A leftover text 「→」 inside `.harw` ghosts
   beneath the CSS-drawn arrow.
4. **Output arrow points up from the cell's bottom edge** (`.vout`/`.stem-out`),
   never `.vup` at the top edge — the output must visually rise OUT of BE.
5. **One orange element per page. Total.** The law line is it.
6. **2–4 nodes; no clipped node text; diagram clears the footer.**
   Verify node `scrollHeight <= clientHeight` and the `.arch` bottom sits above
   the footer top.
7. **Screenshot-verify, don't just DOM-verify.** Both alignment bugs above
   passed geometric assertions and were caught only by rendering pixels
   (headless capture or a screenshot tool) and looking.
