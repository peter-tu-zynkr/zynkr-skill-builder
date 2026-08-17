#!/usr/bin/env python3
"""Build the Zynkr Skills Knowledge Map — one skill, one bullet list of the files it reads.

Why this exists as a Doc and not another Sheet tab: a Google Sheets cell can hold exactly one
clickable link (=HYPERLINK), but a skill reads up to 13 sources. On the index Sheet the URLs
therefore have to sit in the cell as plain text. A Doc has no such limit — every source below
is a real, clickable link — so this is the artifact to use when the question is
"open everything this skill depends on".

URL resolution is imported from build_index_sheet, not reimplemented: the Sheet and this Doc
must never disagree about where a source lives, and the link rules (what we will and won't
stand behind) are non-obvious enough that a second copy would drift.

Output: Zynkr-Skills-Knowledge-Map.html — import to Drive with
    import_to_google_doc(file_path=..., source_format='html', folder_id=<[6.0] folder>)
which converts headings, bullets and links to native Doc elements.
"""
import os, re, sys, json, html, collections, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import build_index_sheet as B  # noqa: E402  — single source of truth for URL resolution

OUT = os.path.join(HERE, 'Zynkr-Skills-Knowledge-Map.html')

# Verified against the Drive API on this date; carried into the Doc so the reader knows how
# stale the "link resolves" claim is. Re-run the audit and bump this when rebuilding later.
LINK_AUDIT_DATE = '2026-08-17'

SAGE, INK, MUTE, ORANGE = '#3F7A64', '#0F0F0E', '#6F6B62', '#C2410C'


def esc(s):
    return html.escape(str(s or ''), quote=True)


HOME_PATH = re.compile(r'(~/|/Users/)')
BRACKET_TMPL = re.compile(r'\[[A-Z_]{3,}\]')       # [STREAM_DIR], [chapter_prefix]-style templates
SECRETS = re.compile(r'\.secrets|\.env\b|secret', re.I)
# Wording that says, in the source's own words, that the target is chosen per run.
RUNTIME_WORDS = re.compile(
    r'user-supplied|supplied|per run|per-run|when Peter|whatever|arbitrary|candidate|'
    r'uploaded|optional|the proofed|competitor|prospect|live |each recording|'
    r'執行時|每次|首次執行|使用者|所提供|當次', re.I)
CONFIG_WORDS = re.compile(r'config|\bsources?\.|_id\b|_ids\b|gm\.json', re.I)

# Three kinds, because there are three actions: nothing, confirm, fix. Getting the split right
# matters more than the count — "133 sources have no link" reads as rot; "2 are broken" is a
# to-do list. REVIEW is the honest middle: the extraction cannot tell whether a Doc named with
# no ID is a per-run document (fine) or an ID someone forgot to write down (not fine).
BY_DESIGN, REVIEW, DEFECT = 'by-design', 'review', 'defect'


def why_no_link(typ, raw, name, purpose='', has_config=False):
    """State plainly why a declared source has no link, and whether that is a problem.

    Returns (reason, kind). Precedence matters: the *type* settles it first, because a Gmail
    query or a live SERP is not a file no matter what else the entry says. Only then do the
    per-run and config cases apply. What survives to DEFECT is a genuinely unopenable
    reference — a repo path that resolves nowhere, or a document named with no identifier
    anywhere in the skill or its config.
    """
    raw = (raw or '').strip()
    s = ' '.join(x for x in (raw, name, purpose) if x)
    t = (typ or '').lower()

    # 0. inherited: the parent lists what a sub-skill reads, and the sub-skill names no ID.
    #    Ahead of the type test because rollup() files these under type 'other', which would
    #    otherwise report them as MCP resources.
    if 'via sub-skill' in (purpose or ''):
        return 'named by a sub-skill, which states no ID for it', BY_DESIGN

    # 1. types that are not files at all
    if t == 'gmail':
        return ('a Gmail label, not a file' if 'Label_' in s
                else 'a Gmail search query, not a file'), BY_DESIGN
    if t == 'calendar':
        return 'a calendar, not a file', BY_DESIGN
    if t == 'web':
        return 'a web page fetched at run time, not a fixed document', BY_DESIGN
    if t == 'other':
        return 'not a file — an MCP resource, tool call or embedded fallback', BY_DESIGN
    if t == 'github':
        return 'a repo, branch or CLI query, not a single file', BY_DESIGN

    # 3. chosen or filled in at run time
    if B.PLACEHOLDER.search(s) or BRACKET_TMPL.search(s):
        return 'templated — the real ID is supplied per run', BY_DESIGN
    if RUNTIME_WORDS.search(s):
        return 'chosen per run — there is no one fixed document', BY_DESIGN

    # 4. the identifier is kept deliberately outside the repo
    if SECRETS.search(s):
        return 'a secrets file, deliberately not committed', BY_DESIGN
    if HOME_PATH.search(raw):
        return 'a file on the local machine, outside the repo', BY_DESIGN
    if has_config or CONFIG_WORDS.search(s):
        return "the ID lives in this skill's config file, outside the repo", BY_DESIGN

    # 5. a stated path that resolves nowhere is unambiguously wrong — the file was moved,
    #    renamed or never committed, and the skill will not find it either.
    if t in ('repo-file', 'local-file'):
        return 'path does not resolve anywhere in the repo', DEFECT

    # 6. a Drive document named with no ID. Usually a per-engagement or per-session doc that is
    #    correctly resolved at run time; occasionally an ID nobody wrote down. Not decidable
    #    from the source, so flag for confirmation rather than asserting a fault.
    return 'no ID declared — located at run time (by name, by link, or per engagement)', REVIEW


def declares_config(e):
    """True if the skill names a config file among its sources.

    zynkr-gm, guest-lecturer-program and training-process-video all keep their Drive IDs in a
    local config file and therefore name their Docs without IDs. That is a design, not an
    omission — but it is only visible by looking at the skill's *other* sources.
    """
    for k in (e.get('knowledge_sources') or []):
        s = f"{k.get('name') or ''} {k.get('id_or_url') or ''}"
        if re.search(r'config\.md|-config\b|\bconfig\b|\.json$|gm\.json', s, re.I):
            return True
    return False


def kind_note(e):
    bits = []
    if e.get('requires_mcp'):
        bits.append('needs MCP')
    r = B.readiness(e)
    if r:
        bits.append(r)
    return ' · '.join(bits)


def main():
    inv = json.load(open(os.path.join(B.J, 'inventory.json')))
    ex = json.load(open(os.path.join(B.J, 'extracted.json')))
    sx = {r['id']: r for r in ex.get('skills', [])}
    ax = {r['id']: r for r in ex.get('subagents', [])}
    B.rollup(inv, sx, ax)  # a parent reads whatever its sub-skills read

    skills = [r for r in inv if not r['is_agent']]
    skills.sort(key=lambda r: (B.CATS.get(r['category'], ('9',))[0], r['id']))

    # ---- pass 1: resolve every source once, and count how many skills share it
    shared = collections.Counter()
    resolved = {}          # (skill id, index) -> (url|None, reason|None, kind|None, dead|None)
    for r in skills:
        e = sx.get(r['id'], {})
        owner = os.path.dirname(r.get('source_path') or '') or None
        cfg = declares_config(e)
        for i, k in enumerate(e.get('knowledge_sources') or []):
            shared[B.ks_key(k)] += 1
            raw, nm, typ = k.get('id_or_url'), k.get('name'), k.get('type')
            dead = next((v for idd, v in B.DEAD_IDS.items() if raw and idd in raw), None)
            url = None if dead else B.ks_url(typ, raw, nm, owner)
            reason, kind = (None, None)
            if not url and not dead:
                reason, kind = why_no_link(typ, raw, nm, k.get('purpose'), cfg)
            resolved[(r['id'], i)] = (url, reason, kind, dead)

    n_src = len(resolved)
    n_url = sum(1 for v in resolved.values() if v[0])
    n_dead = sum(1 for v in resolved.values() if v[3])
    n_design = sum(1 for v in resolved.values() if v[2] == BY_DESIGN)
    n_review = sum(1 for v in resolved.values() if v[2] == REVIEW)
    n_defect = sum(1 for v in resolved.values() if v[2] == DEFECT)
    n_rt = sum(1 for r in skills
               for k in (sx.get(r['id'], {}).get('knowledge_sources') or []) if k.get('runtime_read'))
    with_src = [r for r in skills if (sx.get(r['id'], {}).get('knowledge_sources') or [])]
    today = datetime.date.today().isoformat()

    o = []
    w = o.append
    w('<meta charset="utf-8">')
    w('<h1>Zynkr Skills — Knowledge Map</h1>')
    w(f'<p><i>Every file each skill reads, as a clickable link. '
      f'{len(skills)} skills · {n_src} declared sources · snapshot {today}.</i></p>')

    w('<p><b>What this is.</b> The companion to the Skills Index Sheet, for one question the '
      'Sheet cannot answer well: <i>which documents does this skill actually read, and can I '
      'open them?</i> A Sheets cell holds only one clickable link, so on the Sheet these URLs are '
      'plain text. Here every source is a real link.</p>')
    w('<p><b>How to read.</b> Skills are grouped by category. Under each skill is one bullet per '
      'declared knowledge source: the source name (linked where it resolves), then its type and '
      'what the skill reads it for. '
      f'<b style="color:{SAGE}">⟳</b> marks a <b>live-read</b> source — re-fetched on every run, so '
      'editing that document changes the skill\'s behaviour with no code change. A trailing '
      '<i>(shared with N other skills)</i> is the blast radius of editing it.</p>')
    w('<p><b>What a missing link means.</b> A link is only shown when it can be stood behind. '
      'Where none could be derived the bullet says why — and the reasons are not equivalent. '
      'Most are correct by design: a templated ID is filled in per run, a Gmail search is not a '
      'file, an ID that lives in a config file outside the repo cannot be printed here. A few are '
      'genuine defects, and those are collected in Appendix A. '
      f'Drive IDs were checked against the Drive API on {LINK_AUDIT_DATE}; repo links are only '
      'emitted after the path is confirmed to exist in the repository. Web and dashboard URLs are '
      'taken as declared. Supabase sources link to the shared Zynkr project\'s table editor, '
      'since a table is not a document.</p>')

    w('<h2>At a glance</h2>')
    w('<table border="1" cellpadding="6" cellspacing="0"><tbody>')
    for k, v in [
        ('Skills covered', f'{len(skills)} — {len(with_src)} declare at least one knowledge source, '
                           f'{len(skills) - len(with_src)} declare none'),
        ('Declared sources', f'{n_src} source references in total'),
        ('Openable links', f'{n_url} ({round(100 * n_url / max(1, n_src))}%) resolve to a URL you can click'),
        ('No link, by design', f'{n_design} — templated IDs, Gmail queries, calendars, local config '
                               f'files, MCP resources, web pages fetched per run. Nothing to fix.'),
        ('No link, worth confirming', f'{n_review} — a Google Doc or folder named with no ID. Almost '
                                      f'certainly resolved per engagement, but the source cannot '
                                      f'prove it. Appendix A.'),
        ('Broken', f'{n_defect} — a stated repo path that resolves nowhere. Appendix A.'),
        ('Dead', f'{n_dead} — declared, but the file no longer exists. Fails at runtime. Appendix A.'),
        ('Live-read ⟳', f'{n_rt} of {n_src} sources are re-read on every run — those documents are '
                        f'configuration, and editing one is a behaviour change'),
    ]:
        w(f'<tr><td><b>{esc(k)}</b></td><td>{esc(v)}</td></tr>')
    w('</tbody></table>')

    # ---- the body
    bycat = collections.OrderedDict()
    for r in skills:
        bycat.setdefault(r['category'], []).append(r)

    for cat, rows in bycat.items():
        w(f'<h2>{esc(B.cat_label(cat))}</h2>')
        for r in rows:
            e = sx.get(r['id'], {})
            ks = e.get('knowledge_sources') or []
            su = B.source_url(r.get('source_path'))
            title = f"{r['slug']} ({r['id']})"
            head = f'<a href="{esc(su)}">{esc(title)}</a>' if su else esc(title)
            w(f'<h3>{head}</h3>')

            note = kind_note(e)
            oneline = e.get('one_liner_en') or (r.get('summary') or '')
            meta = f'{len(ks)} source' + ('' if len(ks) == 1 else 's')
            nrt = sum(1 for k in ks if k.get('runtime_read'))
            if nrt:
                meta += f' · {nrt} live-read ⟳'
            if note:
                meta += f' · {note}'
            w(f'<p style="color:{MUTE}"><i>{esc(oneline)}</i><br>{esc(meta)}</p>')

            if not ks:
                w(f'<p style="color:{MUTE}"><i>No knowledge source declared — this skill works from '
                  f'its own prompt and the user\'s input.</i></p>')
                continue

            w('<ul>')
            for i, k in enumerate(ks):
                url, reason, kind, dead = resolved[(r['id'], i)]
                nm = esc(k.get('name') or k.get('id_or_url') or '(unnamed)')
                label = f'<a href="{esc(url)}">{nm}</a>' if url else f'<b>{nm}</b>'
                flag = f'<b style="color:{SAGE}">⟳ </b>' if k.get('runtime_read') else ''
                tail = [B.KST.get(k.get('type'), k.get('type') or '')]
                if k.get('purpose'):
                    tail.append(esc(k['purpose']))
                line = f'<li>{flag}{label} — {" · ".join(tail)}'
                if dead:
                    line += (f'<br><span style="color:{ORANGE}"><b>{esc(dead)}</b> — declared as '
                             f'<code>{esc(k.get("id_or_url"))}</code></span>')
                elif reason:
                    col = ORANGE if kind == DEFECT else MUTE
                    tag = {DEFECT: '⚠ no link', REVIEW: '? no link'}.get(kind, 'no link')
                    line += f'<br><i style="color:{col}">{tag} — {esc(reason)}</i>'
                n_share = shared[B.ks_key(k)]
                if n_share > 1:
                    line += (f'<br><span style="color:{MUTE}">shared with {n_share - 1} other '
                             f'skill{"" if n_share == 2 else "s"}</span>')
                w(line + '</li>')
            w('</ul>')

    # ---- appendix: what to fix, and what has the widest blast radius
    w('<h2>Appendix A — sources that need attention</h2>')
    w('<p>Two lists, in priority order: what is broken, then what cannot be proved either way. '
      'Everything not named here is fine as it stands.</p>')

    dead_rows = [(r, i, k) for r in skills
                 for i, k in enumerate(sx.get(r['id'], {}).get('knowledge_sources') or [])
                 if resolved[(r['id'], i)][3]]
    w('<h3>Dead — declared, but gone</h3>')
    if dead_rows:
        w('<p>The skill will fail at runtime when it reaches for this.</p><ul>')
        for r, i, k in dead_rows:
            w(f'<li><b>{esc(r["slug"])} ({esc(r["id"])})</b> → {esc(k.get("name"))} — '
              f'<span style="color:{ORANGE}">{esc(resolved[(r["id"], i)][3])}</span> '
              f'(<code>{esc(k.get("id_or_url"))}</code>)</li>')
        w('</ul>')
    else:
        w('<p>None.</p>')

    def listing(want_kind, heading, blurb):
        groups = collections.OrderedDict()
        for r in skills:
            for i, k in enumerate(sx.get(r['id'], {}).get('knowledge_sources') or []):
                _u, reason, kind, _d = resolved[(r['id'], i)]
                if kind == want_kind:
                    groups.setdefault(reason, []).append((r, k))
        n = sum(len(v) for v in groups.values())
        w(f'<h3>{esc(heading)} — {n}</h3>')
        if not n:
            w('<p>None.</p>')
            return
        w(f'<p>{blurb}</p>')
        for reason, items in groups.items():
            if len(groups) > 1:      # one group means the heading already said the reason
                w(f'<p><i>{esc(reason)}</i></p>')
            w('<ul>')
            for r, k in items:
                idu = (k.get('id_or_url') or '').strip()
                w(f'<li><b>{esc(r["slug"])} ({esc(r["id"])})</b> → {esc(k.get("name"))}'
                  + (f' — <code>{esc(idu)}</code>' if idu else '') + '</li>')
            w('</ul>')

    listing(DEFECT, 'Broken — a stated path that resolves nowhere',
            'The skill names a file by path and that path is not in the repository. Either the '
            'file moved and the reference is stale, or it was never committed.')
    listing(REVIEW, 'Worth confirming — named, but with no ID',
            'These are Google Docs and folders the skill names in prose without an ID. If the '
            'document is chosen per engagement or handed over as a link, this is correct and '
            'nothing needs doing. If it is a fixed document, the ID belongs in the skill so it '
            'shows up in this map.')

    w('<h2>Appendix B — most-shared sources</h2>')
    w('<p>Editing one of these changes several skills at once — the blast radius of a document. '
      'Ordered by how many skills read it.</p>')
    # Group on the resolved URL where there is one. The Sheet's dedup key is a text key, so the
    # same file stated two ways ("./x.md" here, "seo-article-pipeline/x.md" there) counts twice;
    # once resolved, both are provably the same file. Deliberately not fixed in ks_key(), which
    # decides the Knowledge Sources tab's row set — Peter's review comments are anchored to
    # those rows, so changing that grouping would silently detach them.
    agg = {}
    for r in skills:
        owner = os.path.dirname(r.get('source_path') or '') or None
        for k in (sx.get(r['id'], {}).get('knowledge_sources') or []):
            url = B.ks_url(k.get('type'), k.get('id_or_url'), k.get('name'), owner)
            # Every Supabase source resolves to the one project-level table editor, so URL
            # grouping would fuse a dozen distinct tables into a single row. Group those by name.
            specific = url and k.get('type') not in ('supabase-table', 'supabase-kb')
            key = ('url', url) if specific else B.ks_key(k)
            a = agg.setdefault(key, {'skills': set(), 'k': k, 'url': url})
            a['skills'].add(r['slug'])
            if len(k.get('name') or '') < len(a['k'].get('name') or ''):
                a['k'] = k          # shortest name is the least qualified phrasing
    tops = sorted(agg.values(), key=lambda a: -len(a['skills']))
    w('<ul>')
    for a in [x for x in tops if len(x['skills']) >= 3]:
        k, url = a['k'], a['url']
        nm = esc(k.get('name') or k.get('id_or_url'))
        label = f'<a href="{esc(url)}">{nm}</a>' if url else f'<b>{nm}</b>'
        w(f'<li>{label} — read by <b>{len(a["skills"])}</b> skills · '
          f'{esc(B.KST.get(k.get("type"), k.get("type")))}</li>')
    w('</ul>')

    w(f'<p style="color:{MUTE}"><i>Generated by scripts/skills-index/build_knowledge_doc.py in '
      f'peter-tu-zynkr/zynkr-skill-builder. Re-run it after skill changes rather than editing this '
      f'Doc — edits here are overwritten on the next rebuild. Row set: the live marketplace API; '
      f'column meaning: each SKILL.md and its agents/ files.</i></p>')

    with open(OUT, 'w') as f:
        f.write('\n'.join(o))
    print('WROTE', OUT)
    print(f'skills {len(skills)} · sources {n_src} · linked {n_url} · '
          f'by-design {n_design} · review {n_review} · broken {n_defect} · dead {n_dead}')
    rs = collections.Counter((v[2], v[1]) for v in resolved.values() if v[1])
    for (kind, reason), v in rs.most_common():
        print(f'  {kind:9s} {v:3d}  {reason}')


if __name__ == '__main__':
    main()
