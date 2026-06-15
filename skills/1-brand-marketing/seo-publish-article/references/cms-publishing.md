# CMS publishing reference (zynkr-cms `articles`)

Everything the skill needs to know about the target system. Read this when a step
needs the exact schema, the category map, or you hit a gotcha.

## How the CMS is wired (the key insight)

`cms.zynkr.ai/content` is an **auth-gated dashboard page**, NOT a write API. There
is no public POST endpoint to "publish". The CMS editor and the public website both
read from one Supabase table: **`articles`**. So the fastest, most reliable way to
publish is to write that row directly via PostgREST with the service-role key.

- Supabase project: read `NEXT_PUBLIC_SUPABASE_URL` from the cms repo `.env.local`.
- Write key: `SUPABASE_SERVICE_ROLE_KEY` (same file, gitignored) — the admin key,
  needed because the public anon key is read-only by policy. Read it from the app's
  environment at runtime; never hard-code it.
- Read path (public): `GET <CMS>/api/blog/posts` (list, `status='published'` only,
  `?category=<slug>&page=&limit=`) and `GET <CMS>/api/blog/posts/[slug]` (single,
  returns `content_html`). RLS only serves `status='published'` to anon.
- Public page: `<site>/blog/<slug>` — server-rendered by the website's
  `api/blog/post.js`, which emits Article JSON-LD + OG + canonical from the row's
  `seo_title` / `meta_description` / `summary` / `content_html`. Listing surfaces on
  the site's resources/blog page.

## `articles` table (the columns that matter)

| column | type | notes |
|---|---|---|
| `id` | uuid | auto |
| `title` | text | from the article H1 |
| `slug` | text **UNIQUE** | English kebab-case; a duplicate insert returns **409** |
| `content` | jsonb | **Tiptap ProseMirror JSON** (what the editor loads) |
| `content_html` | text | **pre-rendered HTML** (what readers see) — keep consistent with `content` |
| `summary` | text | card / list blurb |
| `cover_image_url` | text | optional |
| `status` | text | `draft \| published \| scheduled \| private` |
| `category_id` | uuid | FK → `categories.id` (resolve by slug) |
| `author_id` | uuid | FK → `auth.users.id` **NOT NULL** (resolve by email) |
| `keywords` | text[] | SEO keywords |
| `seo_title` | text | `<title>` / OG title (falls back to `title`) |
| `meta_description` | text | meta description (falls back to `summary`) |
| `published_at` | timestamptz | **set this when publishing live** — the public list orders by it |

## Categories (resolve `category_id` by slug — don't hard-code UUIDs)

`SELECT id FROM categories WHERE slug = '<slug>';`

| slug | name (zh) | use for |
|---|---|---|
| `ai-literacy` | AI 素養 | mindset / "will AI replace me" / how to start |
| `workflow` | 工作流程 | process automation, agents, "which process first" |
| `ai-skills` | AI 技能 | skills / subagents / MCP build how-tos |
| `knowledge-management` | 知識管理 | KB / second-brain / context |
| `training` | 培訓 | courses / workshops |

## author_id

`SELECT id FROM auth.users WHERE email = '<your-author-email>';`
(`auth.users` isn't exposed via PostgREST — use the Supabase MCP / SQL for this.)

## Editor schema constraints (why the converter does what it does)

Live editor extensions (`src/components/editor/TiptapEditor.tsx`):
`StarterKit + TextStyle + Color + Highlight + Underline + TextAlign + Image + Link`.

- **No Table extension.** A `<table>` in `content_html` has no matching node in
  `content`; opening the article in the editor drops it, and the 2-second auto-save
  then erases it from `content_html` too. → **convert every table to a list.**
- Lists, blockquote, hr, bold are all in StarterKit → safe.
- House style (matches existing posts): H2 prefixed `▋`; an empty `<p><br></p>`
  spacer between blocks; headings/paragraphs carry `attrs.textAlign:null`.
- Always run `validate_payload.mjs` — it builds this exact schema and runs
  `nodeFromJSON(content).check()`, the definitive "will it round-trip" test.

## Field mapping: article Doc → row

| from the Doc | → column |
|---|---|
| H1 | `title` |
| body (lede → FAQ, excl. H1 + 交付物) | `content` / `content_html` |
| 交付物 ▸ Slug | `slug` |
| 交付物 ▸ SEO `<title>` variant | `seo_title` |
| 交付物 ▸ Meta description | `meta_description` |
| 交付物 ▸ keywords | `keywords[]` |
| 1–2 sentence blurb (or first lede para) | `summary` |
| 交付物 ▸ category (mapped) | `category_id` |

## Gotchas

- **Service-role write is gated** by Claude Code's safety classifier as a production
  write — approve the prompt each run. That + the Step-4 confirm are the human gates.
- **Slug is unique.** Existing slug → choose update-in-place (`PATCH …?slug=eq.<slug>`)
  or a new slug; never blind-insert (409).
- **`published_at` required for live** — without it the post may not surface / order
  correctly in the public list.
- **Unverified figures** in the body go public under the author's name — surface any
  specific numbers/claims you can't source in the Step-4 preview.
