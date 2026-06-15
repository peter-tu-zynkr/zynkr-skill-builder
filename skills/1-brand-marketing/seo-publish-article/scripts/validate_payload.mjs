// validate_payload.mjs — prove the generated Tiptap `content` is valid against
// the CMS editor's REAL ProseMirror schema, so it round-trips in the editor and
// won't be corrupted (e.g. a stray table node dropped) on a future in-CMS save.
//
// Usage:
//   node validate_payload.mjs --payload payload.json --repo "/path/to/zynkr-cms"
//
// --repo must point at the zynkr-cms checkout whose node_modules has the same
// @tiptap versions the editor uses. We import them by absolute file:// URL so
// resolution works regardless of cwd.

import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const argv = process.argv
const arg = (n, d = null) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d }
const payloadPath = arg('payload', 'payload.json')
const repo = arg('repo')
if (!repo) { console.error('need --repo <path to zynkr-cms>'); process.exit(2) }

const B = pathToFileURL(repo.replace(/\/$/, '') + '/node_modules/@tiptap/').href
const imp = async p => import(B + p)
const pick = (m, ...names) => m.default ?? names.map(n => m[n]).find(Boolean) ?? Object.values(m)[0]

let core, SK, TextStyle, TextAlign
try {
  core = await imp('core/dist/index.js')
  SK = (await imp('starter-kit/dist/index.js')).default
  TextStyle = pick(await imp('extension-text-style/dist/index.js'), 'TextStyle')
  TextAlign = pick(await imp('extension-text-align/dist/index.js'), 'TextAlign')
} catch (e) {
  console.error('Could not import @tiptap from the repo. Is node_modules installed at', repo, '?\n', e.message)
  process.exit(2)
}

// StarterKit covers heading/paragraph/text/bold/bulletList/orderedList/listItem/
// blockquote/horizontalRule/hardBreak — everything build_payload emits. TextAlign
// supplies the textAlign attr; TextStyle is harmless if unused.
const exts = [SK, TextStyle, TextAlign.configure({ types: ['heading', 'paragraph'] })]

const payload = JSON.parse(readFileSync(payloadPath, 'utf8'))
try {
  const schema = core.getSchema(exts)
  const node = schema.nodeFromJSON(payload.content)   // throws on unknown node/mark
  node.check()                                          // throws on invalid content structure
  const types = {}
  node.descendants(n => { types[n.type.name] = (types[n.type.name] || 0) + 1; return true })
  if (/<table/i.test(payload.content_html || '')) { console.log('SCHEMA INVALID ❌  content_html still contains a <table> (editor has no table node)'); process.exit(1) }
  console.log('SCHEMA VALID ✅  topChildren:', node.childCount)
  console.log('node histogram:', JSON.stringify(types))
} catch (e) {
  console.log('SCHEMA INVALID ❌', e.message)
  process.exit(1)
}
