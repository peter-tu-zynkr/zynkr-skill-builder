#!/usr/bin/env python3
"""Render a weekly project-status dashboard JSON into a styled HTML email body.

Why this exists: the *reasoning* over the tracker (what's overdue, what's blocked,
the % complete) is the model's job and changes every week. The *visual rendering*
should NOT change week to week — a stable template means every weekly email looks
identical and the reader's eye knows where to look. So the model produces a JSON
payload (see references/dashboard_schema.json) and this script turns it into HTML.

Usage:
    python render_dashboard_email.py data.json > email.html
    python render_dashboard_email.py data.json --out email.html

Email clients (Gmail in particular) strip <style> blocks and <head>, so every
style here is inline on the element. Layout uses simple block <div>s, which Gmail
renders reliably.
"""
import json
import sys
import argparse
import html as _html

# --- palette -----------------------------------------------------------------
INK = "#1a1a1a"
MUTED = "#6b7280"
LINE = "#e5e7eb"
CARD_BG = "#ffffff"
PAGE_BG = "#f4f5f7"

# The source tab name, kept here so the provenance footer can never drift from
# the SKILL.md constant. This is the TAB the data is read from.
SOURCE_TAB = "專案管理總表"

HEALTH = {
    "DELAYED":  ("#fee2e2", "#b91c1c", "🔴", "DELAYED 進度落後"),
    "AT_RISK":  ("#fef3c7", "#b45309", "🟡", "AT RISK 有風險"),
    "ON_TRACK": ("#dcfce7", "#15803d", "🟢", "ON TRACK 進度正常"),
    # Failing "loud but neutral": an unmapped/typo'd status renders grey, not the
    # reassuring green — a status report must never look calmer than reality.
    "UNKNOWN":  ("#f3f4f6", "#4b5563", "⚪", "UNKNOWN 狀態未判定"),
}


def esc(v):
    return _html.escape(str(v if v is not None else ""))


def _num(v, default=0):
    """Coerce a value to float, tolerating strings ('25'), None, and junk.

    The model assembles the JSON, so percent may arrive as "25" or be missing.
    round() throws on str/None, which would kill the whole render — so coerce."""
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def section(title, inner):
    return f"""
    <div style="background:{CARD_BG};border:1px solid {LINE};border-radius:12px;padding:18px 20px;margin:0 0 14px 0;">
      <div style="font-size:13px;font-weight:700;letter-spacing:.04em;color:{INK};margin:0 0 12px 0;">{title}</div>
      {inner}
    </div>"""


def render_health(h):
    status = (h.get("status") or "").strip().upper()
    bg, fg, dot, label = HEALTH.get(status, HEALTH["UNKNOWN"])
    summary = esc(h.get("summary", ""))
    return f"""
    <div style="background:{bg};border-radius:12px;padding:16px 20px;margin:0 0 14px 0;">
      <div style="font-size:12px;font-weight:700;color:{fg};letter-spacing:.06em;">🚦 PROJECT HEALTH</div>
      <div style="font-size:20px;font-weight:800;color:{fg};margin:6px 0 4px 0;">{dot} {esc(label)}</div>
      <div style="font-size:14px;color:{INK};line-height:1.5;">{summary}</div>
    </div>"""


def render_diff(items):
    if not items:
        return ""
    rows = "".join(
        f'<li style="margin:0 0 6px 0;font-size:14px;color:{INK};line-height:1.5;">{esc(x)}</li>'
        for x in items
    )
    return section("📊 本週進展（vs 上週）", f'<ul style="margin:0;padding-left:20px;">{rows}</ul>')


def render_blockers(items):
    if not items:
        inner = f'<div style="font-size:14px;color:{MUTED};">目前沒有阻擋項 ✅</div>'
        return section("🚧 BLOCKERS（0 active）", inner)
    rows = ""
    for b in items:
        rows += f"""
        <div style="padding:10px 12px;background:#fff7ed;border-left:3px solid #f97316;border-radius:6px;margin:0 0 8px 0;">
          <div style="font-size:14px;font-weight:700;color:{INK};">⚠️ {esc(b.get('title'))}</div>
          <div style="font-size:13px;color:{MUTED};margin-top:2px;line-height:1.5;">{esc(b.get('detail'))}</div>
        </div>"""
    return section(f"🚧 BLOCKERS（{len(items)} active）", rows)


def render_this_week(items, week_range):
    title = f"📌 THIS WEEK（{esc(week_range)}）" if week_range else "📌 THIS WEEK"
    if not items:
        return section(title, f'<div style="font-size:14px;color:{MUTED};">本週無排定關鍵任務</div>')
    rows = ""
    for t in items:
        note = t.get("note")
        note_html = f'<div style="font-size:13px;color:{MUTED};margin-top:2px;line-height:1.5;">{esc(note)}</div>' if note else ""
        rows += f"""
        <div style="margin:0 0 10px 0;">
          <div style="font-size:14px;color:{INK};font-weight:600;">☐&nbsp; {esc(t.get('task'))}</div>
          {note_html}
        </div>"""
    return section(title, rows)


def render_progress_bar(percent):
    pct = max(0, min(100, int(round(_num(percent)))))
    return f"""
    <div style="margin:10px 0 4px 0;">
      <div style="background:{LINE};border-radius:999px;height:14px;width:100%;overflow:hidden;">
        <div style="background:#3b82f6;height:14px;width:{pct}%;border-radius:999px;"></div>
      </div>
      <div style="font-size:13px;font-weight:700;color:{INK};margin-top:6px;">整體進度 {pct}%</div>
    </div>"""


def render_current_stage(cs):
    pct = _num(cs.get("percent"))
    idx = cs.get("stage_index", "?")
    total = cs.get("total_stages", "?")
    stages = cs.get("stages", [])
    # Catch a malformed payload before it ships: the per-row "Stage N" labels are
    # positional, so they only line up with the "Stage idx / total" header when the
    # stages array spans the whole spine. Warn (don't crash) so a human can notice.
    if isinstance(total, int) and stages and len(stages) != total:
        print(f"[render warning] stages array has {len(stages)} items but total_stages={total}; "
              f"per-row numbering may not match the header.", file=sys.stderr)
    head = f'<div style="font-size:14px;color:{MUTED};margin-bottom:4px;">整體進度：{int(round(pct))}%　·　Stage {esc(idx)} / {esc(total)}</div>'
    rows = ""
    marks = {"done": "✅", "now": "📍🟡", "todo": "⬜"}
    for i, s in enumerate(stages, start=1):
        state = s.get("state", "todo")
        mark = marks.get(state, "⬜")
        weight = "800" if state == "now" else ("600" if state == "done" else "400")
        color = INK if state != "todo" else MUTED
        suffix = ' <span style="color:#b45309;font-weight:800;">← NOW</span>' if state == "now" else ""
        rows += f'<div style="font-size:14px;color:{color};font-weight:{weight};margin:0 0 5px 0;">{mark}&nbsp; Stage {i}　{esc(s.get("name"))}{suffix}</div>'
    return section("📍 CURRENT STAGE", head + rows + render_progress_bar(pct))


def render_next_milestone(m):
    due = esc(m.get("due"))
    if m.get("overdue"):
        due += ' <span style="color:#b91c1c;font-weight:800;">⚠️ 已逾期</span>'
    rows = [
        ("里程碑", esc(m.get("name"))),
        ("截止日期", due),
        ("完成條件", esc(m.get("criteria"))),
    ]
    inner = "".join(
        f'<div style="display:flex;margin:0 0 6px 0;"><div style="width:90px;font-size:13px;color:{MUTED};flex-shrink:0;">{k}</div>'
        f'<div style="font-size:14px;color:{INK};line-height:1.5;">{v}</div></div>'
        for k, v in rows
    )
    return section("🏁 NEXT MILESTONE", inner)


def render_overview(o):
    rows = [
        ("專案名稱", esc(o.get("project_name"))),
        ("核心目標", esc(o.get("goal"))),
        ("Owner / Facilitator", esc(o.get("owners"))),
        ("時程", esc(o.get("timeline"))),
    ]
    inner = "".join(
        f'<div style="display:flex;margin:0 0 6px 0;"><div style="width:140px;font-size:13px;color:{MUTED};flex-shrink:0;">{k}</div>'
        f'<div style="font-size:14px;color:{INK};line-height:1.5;">{v}</div></div>'
        for k, v in rows
    )
    return section("📋 PROJECT OVERVIEW", inner)


def render_decisions(items):
    if not items:
        return ""
    rows = (f'<tr style="border-bottom:1px solid {LINE};">'
            f'<td style="padding:8px 10px;font-size:12px;color:{MUTED};white-space:nowrap;vertical-align:top;">日期</td>'
            f'<td style="padding:8px 10px;font-size:12px;color:{MUTED};vertical-align:top;">決策</td>'
            f'<td style="padding:8px 10px;font-size:12px;color:{MUTED};vertical-align:top;">原因</td></tr>')
    for d in items:
        rows += (f'<tr style="border-bottom:1px solid {LINE};">'
                 f'<td style="padding:8px 10px;font-size:13px;color:{INK};white-space:nowrap;vertical-align:top;">{esc(d.get("date"))}</td>'
                 f'<td style="padding:8px 10px;font-size:13px;color:{INK};vertical-align:top;line-height:1.5;">{esc(d.get("decision"))}</td>'
                 f'<td style="padding:8px 10px;font-size:13px;color:{MUTED};vertical-align:top;line-height:1.5;">{esc(d.get("reason"))}</td></tr>')
    table = f'<table style="width:100%;border-collapse:collapse;">{rows}</table>'
    return section("📝 RECENT DECISIONS", table)


def render_timeline(items):
    if not items:
        return ""
    rows = ""
    icons = {"done": "✅", "overdue": "🔴 逾期", "todo": "⬜", "target": "🎯"}
    for t in items:
        state = t.get("state", "todo")
        icon = icons.get(state, "⬜")
        color = "#b91c1c" if state == "overdue" else (INK if state == "done" else MUTED)
        rows += (f'<div style="display:flex;margin:0 0 7px 0;align-items:baseline;">'
                 f'<div style="width:96px;font-size:13px;color:{MUTED};flex-shrink:0;">{esc(t.get("date"))}</div>'
                 f'<div style="width:64px;font-size:13px;flex-shrink:0;">{icon}</div>'
                 f'<div style="font-size:14px;color:{color};line-height:1.5;">{esc(t.get("label"))}</div></div>')
    return section("📅 TIMELINE", rows)


def build_html(d):
    title = esc(d.get("title", "專案週報"))
    update_date = esc(d.get("update_date", ""))
    parts = [render_health(d.get("health", {}))]
    parts.append(render_diff(d.get("weekly_diff")))
    parts.append(render_blockers(d.get("blockers", [])))
    parts.append(render_this_week(d.get("this_week", []), d.get("week_range", "")))
    if d.get("current_stage"):
        parts.append(render_current_stage(d["current_stage"]))
    if d.get("next_milestone"):
        parts.append(render_next_milestone(d["next_milestone"]))
    if d.get("overview"):
        parts.append(render_overview(d["overview"]))
    parts.append(render_decisions(d.get("decisions")))
    parts.append(render_timeline(d.get("timeline")))
    body = "".join(parts)
    return f"""<div style="background:{PAGE_BG};padding:24px 0;font-family:-apple-system,'Segoe UI','PingFang TC','Microsoft JhengHei',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:0 16px;">
    <div style="margin:0 0 16px 0;">
      <div style="font-size:22px;font-weight:800;color:{INK};line-height:1.3;">📊 PROJECT DASHBOARD</div>
      <div style="font-size:15px;color:{INK};margin-top:2px;">{title}</div>
      <div style="font-size:13px;color:{MUTED};margin-top:4px;">最後更新 {update_date}</div>
    </div>
    {body}
    <div style="font-size:12px;color:{MUTED};text-align:center;margin:8px 0 0 0;line-height:1.6;">
      本週報由「{SOURCE_TAB}」自動彙整生成，資料來源為 Google Sheet 專案管控表。
    </div>
  </div>
</div>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("json_path", help="Path to the dashboard JSON payload")
    ap.add_argument("--out", help="Write HTML here instead of stdout")
    args = ap.parse_args()
    with open(args.json_path, encoding="utf-8") as f:
        data = json.load(f)
    out_html = build_html(data)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(out_html)
        print(f"Wrote {len(out_html)} bytes to {args.out}", file=sys.stderr)
    else:
        sys.stdout.write(out_html)


if __name__ == "__main__":
    main()
