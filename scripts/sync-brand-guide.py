#!/usr/bin/env python3
"""Sync Zynkr-Brand-Guide.md (git, canonical) -> the Drive Doc the slide relay reads.

    python3 scripts/sync-brand-guide.py            # writes the HTML + prints the MCP call
    python3 scripts/sync-brand-guide.py --check    # verify only; non-zero exit if out of date

Why HTML and not a plain .md import: `import_to_google_doc` converts headings and lists but
DROPS tables, and this guide is 43 tables / ~270 rows of colour roles, ratios and type scale —
the operative part of it. HTML tables survive the same conversion, so the guide goes through
HTML. Verified 2026-08-17: 43/43 tables, 723 cells, 108/108 headings.

Direction of truth: the git .md is canonical, the Doc is a MIRROR. The Doc carries a banner
saying so. Editing the Doc is silently lost on the next run of this script — that is the
intended, stated behaviour, not a bug to work around.

In-document anchor links become plain text: Docs cannot resolve `#anchor` targets, and a table
of contents full of dead links is worse than a list of labels (the Docs outline pane already
provides real navigation).
"""
import argparse
import hashlib
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
REL = os.path.join('1.0 brand-marketing', '1.1 brand', 'Zynkr-Brand-Guide.md')


def find_guide(start):
    """Walk up looking for the guide.

    It lives in the (non-git) zynkr working root, which is two levels above a normal checkout
    but four above a worktree under .claude/worktrees/ — so search rather than count levels.
    """
    d = start
    for _ in range(8):
        c = os.path.join(d, REL)
        if os.path.exists(c):
            return c
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    return os.path.normpath(os.path.join(start, '..', '..', REL))


SRC = find_guide(REPO)
ATTACH = os.path.expanduser('~/.workspace-mcp/attachments')
OUT = os.path.join(ATTACH, 'Zynkr-Brand-Guide.html')

DOC_NAME = 'Zynkr-Brand-Guide'
FOLDER = '[4] Zynkr-Brandbook'
DOC_ID = None   # resolved by name; see search_drive_files call printed below

BANNER = """<table border="1" cellpadding="8" cellspacing="0"><tbody><tr><td>
<b>MIRROR — do not edit this Doc.</b><br>
Canonical source is the git file <b>1.0 brand-marketing/1.1 brand/Zynkr-Brand-Guide.md</b>.
This Doc is generated from it so the /zynkr-slide relay can read the guide from Drive at run
time instead of depending on a path on one laptop. <b>Edits made here are overwritten on the
next sync</b> — change the .md, then re-sync.<br>
<b>Colour VALUES</b> come from the token manifest <b>zynkr.ai/data/tokens.json</b>; per SDD §4
the website styles.css :root wins over any hex table below. This guide is canonical for
<b>roles, ratios, voice and usage rules</b> — the intent, not the values.<br>
Synced {stamp} · {tables} tables · {headings} headings.
</td></tr></tbody></table>
<hr>"""

INLINE_CODE = re.compile(r'`([^`]+)`')
BOLD = re.compile(r'\*\*([^*]+)\*\*')
ITAL = re.compile(r'(?<![\*\w])\*([^*\n]+)\*(?!\*)')
LINK = re.compile(r'\[([^\]]*)\]\(([^)]+)\)')
TABLE_SEP = re.compile(r'^\s*\|?[\s:-]*-[-\s:|]*\|?\s*$')
import html as _html


def inline(s):
    s = _html.escape(s, quote=False)
    parts, last = [], 0
    for m in INLINE_CODE.finditer(s):
        parts.append(('t', s[last:m.start()]))
        parts.append(('c', m.group(1)))
        last = m.end()
    parts.append(('t', s[last:]))
    out = []
    for kind, txt in parts:
        if kind == 'c':
            out.append(f'<code>{txt}</code>')
            continue
        txt = LINK.sub(lambda m: m.group(1) if m.group(2).strip().startswith('#')
                       else f'<a href="{_html.escape(m.group(2).strip(), quote=True)}">{m.group(1)}</a>', txt)
        out.append(ITAL.sub(r'<i>\1</i>', BOLD.sub(r'<b>\1</b>', txt)))
    return ''.join(out)


def cells(row):
    r = row.strip().strip('|')
    return [c.strip() for c in r.split('|')]


def convert(md):
    lines, out, stack = md.split('\n'), [], []
    i, n = 0, len(lines)

    def close(to=0):
        while len(stack) > to:
            out.append('</ul>' if stack.pop() == 'u' else '</ol>')

    while i < n:
        ln, s = lines[i], lines[i].strip()
        if s.startswith('```'):
            close(); i += 1; buf = []
            while i < n and not lines[i].strip().startswith('```'):
                buf.append(_html.escape(lines[i], quote=False)); i += 1
            i += 1; out.append('<pre>' + '\n'.join(buf) + '</pre>'); continue
        if not s:
            close(); i += 1; continue
        m = re.match(r'^(#{1,6})\s+(.*)$', s)
        if m:
            close(); out.append(f'<h{len(m.group(1))}>{inline(m.group(2))}</h{len(m.group(1))}>'); i += 1; continue
        if re.match(r'^(-{3,}|\*{3,}|_{3,})$', s):
            close(); out.append('<hr>'); i += 1; continue
        if s.startswith('|') and i + 1 < n and TABLE_SEP.match(lines[i + 1]) and '|' in lines[i + 1]:
            close(); head = cells(s); i += 2; body = []
            while i < n and lines[i].strip().startswith('|'):
                body.append(cells(lines[i])); i += 1
            t = ['<table border="1" cellpadding="6" cellspacing="0"><thead><tr>']
            t += [f'<th>{inline(c)}</th>' for c in head]
            t.append('</tr></thead><tbody>')
            for row in body:
                row = (row + [''] * len(head))[:len(head)]
                t.append('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in row) + '</tr>')
            out.append(''.join(t) + '</tbody></table>'); continue
        if s.startswith('>'):
            close(); buf = []
            while i < n and lines[i].strip().startswith('>'):
                buf.append(re.sub(r'^\s*>\s?', '', lines[i])); i += 1
            out.append('<blockquote>' + '<br>'.join(inline(b) for b in buf if b.strip()) + '</blockquote>'); continue
        m = re.match(r'^(\s*)([-*+]|\d+[.)])\s+(.*)$', ln)
        if m:
            depth, kind = len(m.group(1)) // 2, ('u' if m.group(2) in '-*+' else 'o')
            while len(stack) > depth + 1:
                close(len(stack) - 1)
            if len(stack) < depth + 1:
                out.append('<ul>' if kind == 'u' else '<ol>'); stack.append(kind)
            out.append(f'<li>{inline(m.group(3))}</li>'); i += 1; continue
        close(); buf = [s]; i += 1
        while i < n and lines[i].strip() and not re.match(
                r'^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\||```|-{3,}$)', lines[i]):
            buf.append(lines[i].strip()); i += 1
        out.append('<p>' + inline(' '.join(buf)) + '</p>')
    close()
    return '\n'.join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='verify only; exit 1 if the Doc is stale')
    a = ap.parse_args()

    if not os.path.exists(SRC):
        sys.exit(f'brand guide not found at {SRC}')
    md = open(SRC, encoding='utf-8').read()
    body = convert(md)
    n_tables, n_head = body.count('<table'), sum(body.count(f'<h{k}>') for k in range(1, 7))

    md_tables = len([l for l in md.split('\n') if TABLE_SEP.match(l) and '|' in l])
    md_head = len([l for l in md.split('\n') if re.match(r'^#{1,6}\s', l.strip())])
    if (n_tables, n_head) != (md_tables, md_head):
        sys.exit(f'REFUSING: converted {n_tables}/{md_head} vs source {md_tables}/{md_head} '
                 f'(tables/headings) — the converter dropped something.')

    stamp = subprocess.run(['date', '+%Y-%m-%d'], capture_output=True, text=True).stdout.strip()
    doc = ('<meta charset="utf-8">\n'
           + BANNER.format(stamp=stamp, tables=n_tables, headings=n_head) + '\n' + body + '\n')

    print(f'source : {SRC}')
    print(f'         {len(md)} chars · {md_tables} tables · {md_head} headings '
          f'· sha {hashlib.sha256(md.encode()).hexdigest()[:12]}')
    print(f'output : {n_tables} tables · {n_head} headings (banner adds 1 table)')
    if a.check:
        print('check only — nothing written')
        return
    os.makedirs(ATTACH, exist_ok=True)
    open(OUT, 'w', encoding='utf-8').write(doc)
    print(f'WROTE  : {OUT}')
    print()
    print('Now push it to the Doc the slide relay reads (the MCP can only read files under')
    print(f'{ATTACH}, which is why the file lands there):')
    print()
    print(f'  1. search_drive_files(query="name = \'{DOC_NAME}\' and trashed = false")')
    print(f'     -> the Doc in the {FOLDER} folder')
    print(f'  2. update_drive_file(file_id=<that id>, file_path="{OUT}", source_format="html")')
    print()
    print('update_drive_file keeps the file id, so the relay\'s name lookup and every existing')
    print('link and comment survive. Do NOT import_to_google_doc again — that makes a second Doc')
    print('with the same name and the name lookup becomes ambiguous.')


if __name__ == '__main__':
    main()
