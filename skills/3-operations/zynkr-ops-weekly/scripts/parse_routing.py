#!/usr/bin/env python3
"""Read department -> owner routing out of the weekly ops Doc.

The Doc's department headings already carry each owner's Google Docs person chip, so this
skill keeps no department table of its own. Fetch the Doc with `get_doc_as_markdown` (NOT
`get_doc_content` -- plain text silently strips person chips) and pipe it here.

    get_doc_as_markdown | parse_routing.py [--section "Aug 27, 2026"] > routing.json

Output: {"section": str|null, "headings": [...], "owners": {email: [headings]}, "unrouted": [...]}
"""
import argparse
import json
import re
import sys

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*\S)\s*$")
MAILTO_RE = re.compile(r"\[([^\]]*)\]\(mailto:([^)\s]+)\)")
BARE_MAIL_RE = re.compile(r"<?([\w.+-]+@[\w-]+\.[\w.-]+)>?")
# Section headings are dates: "Aug 27, 2026" / "Aug 27" (with or without a year).
DATE_HEADING_RE = re.compile(
    r"^[A-Z][a-z]{2}\.?\s+\d{1,2}(?:,\s*\d{4})?$|^\d{4}[-/]\d{1,2}[-/]\d{1,2}$"
)


def strip_md(text):
    """Drop inline markdown so a heading compares as its visible text."""
    text = MAILTO_RE.sub("", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[*_`~]", "", text)
    return re.sub(r"\s+", " ", text).strip()


LIST_ITEM_RE = re.compile(r"^\s*(?:[-*+・‧•]|\d+[.)])\s")


def find_chip(line, following):
    """A chip sits on the heading line, or on the next non-empty line when the heading wrapped.

    The next-line fallback must REFUSE a list item. Some sections (e.g. a shared "team
    update" block) chip each individual task line rather than the heading; treating the
    first task's owner as the section owner would route the whole section to whoever
    happens to be listed first. A wrapped heading is a plain continuation line, never a
    bullet, so excluding bullets keeps the fallback while removing the false positive.
    """
    for candidate, where in ((line, "heading"), (following, "next-line")):
        if not candidate:
            continue
        if where == "next-line" and LIST_ITEM_RE.match(candidate):
            continue  # item-level chips belong to the item, not the section
        m = MAILTO_RE.search(candidate)
        if m:
            return m.group(1).strip() or None, m.group(2).strip().lower(), where
        if where == "next-line":
            # A chip that lost its link still leaves a bare address behind.
            m = BARE_MAIL_RE.search(candidate)
            if m and "](" not in candidate:
                return None, m.group(1).lower(), "next-line-bare"
    return None, None, None


def parse(md, want_section=None):
    lines = md.splitlines()
    headings, unrouted = [], []
    current_section = None
    section_seen = None

    for i, line in enumerate(lines):
        m = HEADING_RE.match(line)
        if not m:
            continue
        level = len(m.group(1))
        raw = m.group(2)
        visible = strip_md(raw)

        if DATE_HEADING_RE.match(visible):
            current_section = visible
            if want_section and visible.lower().startswith(want_section.lower()):
                section_seen = visible
            continue

        # Headings above the first dated section are document chrome, not departments.
        if want_section:
            if section_seen is None or current_section != section_seen:
                continue
        elif current_section is None:
            continue

        following = ""
        for nxt in lines[i + 1 : i + 3]:
            if nxt.strip():
                following = nxt
                break

        name, email, where = find_chip(raw, following)
        entry = {
            "heading": visible,
            "level": level,
            "line": i + 1,
            "section": current_section,
            "owner_name": name,
            "owner_email": email,
            "chip_source": where,
        }
        if email:
            headings.append(entry)
        else:
            unrouted.append(entry)

    # Adjacent headings sharing an owner are one routing target; the shallowest is the parent.
    for idx, h in enumerate(headings):
        prev = headings[idx - 1] if idx else None
        h["grouped_with_previous"] = bool(
            prev and prev["owner_email"] == h["owner_email"] and h["level"] >= prev["level"]
        )

    owners = {}
    for h in headings:
        owners.setdefault(h["owner_email"], []).append(h["heading"])
    primary = {email: hs[0] for email, hs in owners.items()}
    for h in headings:
        h["primary"] = primary[h["owner_email"]] == h["heading"]

    return {
        "section": section_seen if want_section else None,
        "section_requested": want_section,
        "headings": headings,
        "owners": owners,
        "primary_heading": primary,
        "unrouted": unrouted,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--section", help='restrict to one dated section, e.g. "Aug 27, 2026"')
    ap.add_argument("--input", help="markdown file (default: stdin)")
    args = ap.parse_args()

    md = open(args.input, encoding="utf-8").read() if args.input else sys.stdin.read()
    out = parse(md, args.section)

    if args.section and not out["section"]:
        print(f"parse_routing: section {args.section!r} not found", file=sys.stderr)
        sys.exit(2)
    if not out["headings"]:
        print("parse_routing: no owner chips found -- did you use get_doc_content "
              "instead of get_doc_as_markdown?", file=sys.stderr)
        sys.exit(3)

    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
