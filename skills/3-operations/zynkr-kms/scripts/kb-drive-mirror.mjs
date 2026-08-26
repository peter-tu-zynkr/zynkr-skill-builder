#!/usr/bin/env node
/**
 * kb-drive-mirror.mjs — render the Zynkr platform 知識庫 to local Markdown for the Drive mirror.
 *
 * The platform KB (Supabase `crm_kb_*`) is the source of truth. This script only READS it and
 * renders one Markdown file per section plus a full-fidelity JSON snapshot. It never writes to
 * Supabase and never uploads — the upload half is done by /zynkr-kms via the google-workspace
 * MCP (`update_drive_file`), so the mirror always flows Platform → Drive, one way.
 *
 * Usage:
 *   node kb-drive-mirror.mjs --out <dir> --workspace <uuid> [--sections slug,slug] [--env <path>]
 *
 * --workspace is REQUIRED and non-negotiable: crm_kb_* is a SHARED multi-tenant table. Peter's
 * workspace is 19881fe1-0081-452e-9141-8ba196e61abe. Omitting the filter mirrors OTHER TENANTS'
 * cards into Peter's Drive — a data leak, and it inflates every count.
 *
 * Prints a small JSON summary to stdout (counts + filenames); card bodies stay on disk.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const arg = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1] }

const outDir = arg('out')
if (!outDir) { console.error('--out <dir> is required'); process.exit(1) }
const onlySections = arg('sections') ? arg('sections').split(',').map(s => s.trim()) : null
const workspaceId = arg('workspace')
if (!workspaceId) { console.error('--workspace <uuid> is required (crm_kb_* is shared/multi-tenant)'); process.exit(1) }
if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) { console.error('--workspace must be a uuid'); process.exit(1) }

// --- credentials: env vars win, else read a Next-style .env.local -----------------------------
let URL = process.env.NEXT_PUBLIC_SUPABASE_URL
let KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const envPath = arg('env')
if ((!URL || !KEY) && envPath && existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (!m) continue
    const v = m[2].replace(/^["']|["']$/g, '')
    if (m[1] === 'NEXT_PUBLIC_SUPABASE_URL') URL ||= v
    if (m[1] === 'SUPABASE_SERVICE_ROLE_KEY') KEY ||= v
  }
}
if (!URL || !KEY) { console.error('missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const rest = async (path) => {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}: ${await r.text()}`)
  return r.json()
}

const pad2 = (n) => String(n).padStart(2, '0')
const esc = (s) => (s ?? '').toString()

// --- pull ------------------------------------------------------------------------------------
const wsq = `workspace_id=eq.${workspaceId}`
const sections = await rest(`crm_kb_sections?select=id,slug,nn,title,title_zh,description&${wsq}&order=nn.asc`)
const articles = await rest(
  'crm_kb_articles?select=id,type,fact_id,title,body_md,section_id,cites,keywords,status,flags,' +
  'source_type,source_url,source_note,version,verification_state,last_verified_at,verify_interval_days,' +
  `created_at,updated_at&${wsq}&order=type.desc,title.asc`
)
if (!sections.length) { console.error(`no sections for workspace ${workspaceId} — wrong workspace id?`); process.exit(1) }

mkdirSync(outDir, { recursive: true })
const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
const bySection = new Map(sections.map(s => [s.id, []]))
const orphans = []
for (const a of articles) {
  if (bySection.has(a.section_id)) bySection.get(a.section_id).push(a)
  else orphans.push(a)
}

// --- render ----------------------------------------------------------------------------------
const HEADER = (title, count) => [
  `# ${title}`,
  '',
  '> **⚠️ AUTO-GENERATED MIRROR — do not edit this Doc.**',
  '> Source of truth is the Zynkr platform 知識庫 (https://platform.zynkr.ai/kb).',
  '> Edits made here are **not** read back and will be overwritten on the next mirror run.',
  `> Mirrored: ${stamp} · ${count} cards`,
  '',
  '---',
  '',
].join('\n')

const renderCard = (a) => {
  const meta = []
  if (a.fact_id) meta.push(`**fact_id:** \`${a.fact_id}\``)
  meta.push(`**type:** ${a.type}`)
  meta.push(`**status:** ${a.status}`)
  meta.push(`**version:** ${a.version ?? '—'}`)
  if (a.verification_state) meta.push(`**verification:** ${a.verification_state}${a.last_verified_at ? ` (${a.last_verified_at})` : ''}`)
  if (a.flags?.length) meta.push(`**flags:** ${a.flags.join(', ')}`)
  if (a.cites?.length) meta.push(`**cites:** ${a.cites.map(c => `\`${c}\``).join(', ')}`)
  if (a.keywords?.length) meta.push(`**keywords:** ${a.keywords.join(' · ')}`)
  if (a.source_note) meta.push(`**source:** ${esc(a.source_note)}`)
  if (a.source_url) meta.push(`**source_url:** ${esc(a.source_url)}`)
  meta.push(`**updated:** ${esc(a.updated_at)}`)
  return [`## ${esc(a.title)}`, '', meta.join('  \n'), '', esc(a.body_md).trim(), '', '---', ''].join('\n')
}

const files = []
const counts = {}
for (const s of sections) {
  if (onlySections && !onlySections.includes(s.slug)) continue
  const cards = bySection.get(s.id) ?? []
  counts[s.slug] = cards.length
  const docTitle = `Zynkr Support KB — ${pad2(s.nn)} ${s.title}`
  const body = HEADER(docTitle, cards.length) +
    (s.description ? `_${esc(s.description)}_\n\n---\n\n` : '') +
    (cards.length ? cards.map(renderCard).join('\n') : '_(no cards in this section)_\n')
  const fname = `${pad2(s.nn)}-${s.slug}.md`
  writeFileSync(join(outDir, fname), body, 'utf8')
  files.push({ slug: s.slug, nn: s.nn, docTitle, file: fname, cards: cards.length })
}

// --- index + snapshot + manifest ---------------------------------------------------------------
if (!onlySections) {
  const indexTitle = 'Zynkr Support KB — 00 INDEX & Retrieval Map'
  const idx = HEADER(indexTitle, articles.length) +
    '| # | Section | slug | cards | aliases / covers |\n|---|---|---|---|---|\n' +
    sections.map(s => `| ${pad2(s.nn)} | ${esc(s.title)} ${esc(s.title_zh)} | \`${s.slug}\` | ${(bySection.get(s.id) ?? []).length} | ${esc(s.description).replace(/\|/g, '/')} |`).join('\n') +
    `\n\n**Totals:** ${articles.length} cards · ${articles.filter(a => a.type === 'fact').length} fact · ${articles.filter(a => a.type === 'qa').length} qa` +
    (orphans.length ? `\n\n⚠️ **${orphans.length} card(s) with an unknown section_id** — see snapshot.` : '') + '\n'
  writeFileSync(join(outDir, '00-index.md'), idx, 'utf8')
  files.unshift({ slug: '_index', nn: 0, docTitle: indexTitle, file: '00-index.md', cards: articles.length })

  writeFileSync(join(outDir, '_KB-SNAPSHOT.json'),
    JSON.stringify({ mirrored_at: stamp, workspace_id: workspaceId, source: `${URL}/rest/v1`, counts: { total: articles.length, sections: sections.length }, sections, articles }, null, 2), 'utf8')
}

const summary = { mirrored_at: stamp, workspace_id: workspaceId, total_cards: articles.length, facts: articles.filter(a => a.type === 'fact').length, qa: articles.filter(a => a.type === 'qa').length, sections: sections.length, orphans: orphans.length, counts, files }
writeFileSync(join(outDir, '_MANIFEST.json'), JSON.stringify(summary, null, 2), 'utf8')
console.log(JSON.stringify(summary, null, 2))
