// build_payload.mjs — convert an SEO article body (markdown) into a CMS-safe
// payload row for the Supabase `articles` table: Tiptap ProseMirror JSON (`content`)
// + pre-rendered `content_html`, in the CMS house style.
//
// Node shapes match the live editor (StarterKit + TextStyle/Color/Highlight/
// Underline/TextAlign/Image/Link — NO Table). Tables are flattened to lists so
// they survive a future in-CMS edit. Validate the output with validate_payload.mjs.
//
// Usage:
//   node build_payload.mjs --body body.md --meta meta.json \
//        [--status draft|published] [--published-at ISO] \
//        [--author-id UUID] [--category-id UUID] [--out payload.json]
//
// body.md  : article body ONLY (no H1 title, no 「SEO 交付物」block; keep the FAQ).
// meta.json: { title, slug, seo_title, meta_description, summary, keywords:[...] }

import { readFileSync, writeFileSync } from 'node:fs'

const argv = process.argv
const arg = (n, d = null) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d }

const bodyPath = arg('body'); const metaPath = arg('meta'); const outPath = arg('out', 'payload.json')
const status = arg('status', 'draft'); const publishedAt = arg('published-at')
const authorId = arg('author-id'); const categoryId = arg('category-id')
if (!bodyPath || !metaPath) { console.error('need --body and --meta'); process.exit(2) }

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// inline: only **bold** is structural; everything else is literal text
function inlines(str) {
  const parts = String(str).split('**'); const nodes = []; let html = ''
  parts.forEach((seg, i) => {
    if (seg === '') return
    if (i % 2 === 1) { nodes.push({ type: 'text', text: seg, marks: [{ type: 'bold' }] }); html += `<strong>${esc(seg)}</strong>` }
    else { nodes.push({ type: 'text', text: seg }); html += esc(seg) }
  })
  if (nodes.length === 0) nodes.push({ type: 'text', text: ' ' })
  return { nodes, html }
}

const PA = { textAlign: null }
const J = []; let H = ''
const heading = (lvl, t) => { let x = t.trim(); if (lvl === 2 && !x.startsWith('▋')) x = '▋' + x; J.push({ type: 'heading', attrs: { level: lvl, textAlign: null }, content: [{ type: 'text', text: x }] }); H += `<h${lvl}>${esc(x)}</h${lvl}>` }
const para = s => { const { nodes, html } = inlines(s); J.push({ type: 'paragraph', attrs: PA, content: nodes }); H += `<p>${html}</p>` }
const spacer = () => { J.push({ type: 'paragraph', attrs: PA, content: [{ type: 'hardBreak' }] }); H += '<p><br></p>' }
const list = (items, ordered) => {
  const tag = ordered ? 'ol' : 'ul'; const node = ordered ? 'orderedList' : 'bulletList'
  J.push({ type: node, content: items.map(it => { const { nodes } = inlines(it); return { type: 'listItem', content: [{ type: 'paragraph', attrs: PA, content: nodes }] } }) })
  H += `<${tag}>` + items.map(it => `<li><p>${inlines(it).html}</p></li>`).join('') + `</${tag}>`
}
const quote = s => { const { nodes, html } = inlines(s); J.push({ type: 'blockquote', content: [{ type: 'paragraph', attrs: PA, content: nodes }] }); H += `<blockquote><p>${html}</p></blockquote>` }
const rule = () => { J.push({ type: 'horizontalRule' }); H += '<hr>' }

// ---- parse body.md (line-based; blank line = block separator/spacer) ----
const lines = readFileSync(bodyPath, 'utf8').replace(/\r\n/g, '\n').split('\n')
while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
let i = 0, prev = 'start'
const sep = () => { if (prev !== 'start' && prev !== 'spacer') { spacer(); prev = 'spacer' } }

while (i < lines.length) {
  const line = lines[i]
  if (line.trim() === '') { sep(); i++; continue }
  const h = line.match(/^(#{1,6})\s+(.*)$/)
  if (h) { heading(Math.min(Math.max(h[1].length, 2), 3), h[2]); prev = 'block'; i++; continue }
  if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { rule(); prev = 'block'; i++; continue }
  if (/^>\s?/.test(line)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++ } quote(buf.join(' ').trim()); prev = 'block'; continue }
  if (/^\s*[-*]\s+/.test(line)) { const buf = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*[-*]\s+/, '').trim()); i++ } list(buf, false); prev = 'block'; continue }
  if (/^\s*\d+[.)]\s+/.test(line)) { const buf = []; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+[.)]\s+/, '').trim()); i++ } list(buf, true); prev = 'block'; continue }
  if (/^\s*\|.*\|/.test(line)) {
    const buf = []; while (i < lines.length && /^\s*\|.*\|/.test(lines[i])) { buf.push(lines[i].trim()); i++ }
    const rows = buf.map(r => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()))
    const data = rows.filter(r => !r.every(c => c === '' || /^:?-{1,}:?$/.test(c)))   // drop |---| separator
    const body = data.length > 1 ? data.slice(1) : data                                // drop header row
    const items = body.map(cells => { const first = cells[0] || ''; const rest = cells.slice(1).filter(c => c !== ''); return rest.length ? `${first}：${rest.join(' · ')}` : first })
    list(items.length ? items : data.map(r => r.join(' · ')), false); prev = 'block'; continue
  }
  para(line.trim()); prev = 'block'; i++
}

// ---- merge metadata ----
const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
const payload = {
  title: meta.title,
  slug: meta.slug,
  status,
  summary: meta.summary ?? null,
  seo_title: meta.seo_title ?? null,
  meta_description: meta.meta_description ?? null,
  keywords: meta.keywords ?? [],
  content: { type: 'doc', content: J },
  content_html: H,
}
if (authorId) payload.author_id = authorId
if (categoryId) payload.category_id = categoryId
if (publishedAt) payload.published_at = publishedAt

writeFileSync(outPath, JSON.stringify(payload))

// ---- QA summary ----
const hist = {}; J.forEach(n => { hist[n.type] = (hist[n.type] || 0) + 1 })
console.log('wrote', outPath)
console.log('blocks:', J.length, '| node types:', JSON.stringify(hist))
console.log('content_html len:', H.length, '| has <table>:', /<table/i.test(H), '| stray ** :', H.includes('**'))
console.log('title:', payload.title)
console.log('slug:', payload.slug, '| status:', payload.status, '| published_at:', payload.published_at ?? '(none)')
console.log('author_id:', payload.author_id ?? '(unset)', '| category_id:', payload.category_id ?? '(unset)')
if (!payload.title || !payload.slug) { console.error('WARNING: missing title or slug in meta.json'); }
