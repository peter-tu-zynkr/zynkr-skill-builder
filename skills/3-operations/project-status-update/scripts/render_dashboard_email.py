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

# --- the 管控表 column map -----------------------------------------------------
# The third copy of one fact: references/dashboard_schema.json (_source_columns_*)
# and SKILL.md Step 2 carry the other two. Copies guarantee NOTHING on their own —
# `python3 scripts/pm-schema.py mirrors` is the check that proves the three still
# agree, and scripts/check-pm-refs.sh runs it. What the copy buys is that this
# script can derive its own footer from the map instead of restating it in prose.
#
# v2 (14 cols A-N) inserted `前置任務 Depends on` at K. A reader that assumes the
# legacy 13-column shape maps K as `Reference 連結` and shifts every column after
# it — that was the live bug fixed in SKB-011. Detect the version first, from the
# skill folder, with
#   python3 scripts/pm-schema.py headers --file <tmp>/headers.json \
#     --schema references/pm-sheet-schema.json \
#     --crosswalk references/pm-status-crosswalk.json
# (exit 0 = v2 · 2 = legacy v1 · 1 = stop), then map by header NAME, never by
# column letter.
COLUMNS_V2 = [
    "no.", "里程碑 Stage", "任務描述 Task", "Priority", "Owner", "Facilitator", "Agent",
    "Status", "Start (YYYY/M/D)", "End (YYYY/M/D)", "前置任務 Depends on",
    "Reference 連結", "Note", "DOD 完成定義／交付物",
]
COLUMNS_V1_LEGACY = [c for c in COLUMNS_V2 if c != "前置任務 Depends on"]
# The one column v2 has and legacy v1 does not — derived, so a change to the map
# above cannot leave a stale column name behind in the footer.
V2_ONLY_COLUMN = next(c for c in COLUMNS_V2 if c not in COLUMNS_V1_LEGACY)
SHEET_RANGE = {"v2": f"{SOURCE_TAB}!A1:N44", "v1": f"{SOURCE_TAB}!A1:M44"}
COLUMN_SPAN = {"v2": "A–N", "v1": "A–M"}

# The provenance footer's version label, built FROM the map rather than repeating
# it: column counts and the missing-column name come from the lists above, the
# documented range from SHEET_RANGE. Row 44 is the historical extent, not a law,
# so the range is labelled 預設範圍 — a run that extended it says so in chat.
VERSION_LABEL = {
    "v2": (f"管控表 v2（{len(COLUMNS_V2)} 欄 {COLUMN_SPAN['v2']}）"
           f"　·　預設範圍 {SHEET_RANGE['v2']}"),
    "v1": (f"管控表 legacy v1（{len(COLUMNS_V1_LEGACY)} 欄 {COLUMN_SPAN['v1']}，"
           f"無「{V2_ONLY_COLUMN}」）　·　預設範圍 {SHEET_RANGE['v1']}"),
}

# lifecycle axis — 鐵律 3 fixes tab 1 `Status` at exactly these four values
# (pack §2.1). There is no fifth bucket: `取消` is illegal on every axis and
# `暫停` is project-level only, so both arrive here as `data_errors`, never as a
# status. Used below to print the legal set in the data-errors block and to catch
# a payload that files a LEGAL literal as a data error.
LIFECYCLE_BUCKETS = {
    "Done": "done",
    "WIP": "in_progress",
    "Not started": "not_started",
    "Drop": "dropped",
}
LEGAL_STATUS_LITERALS = {k.strip().casefold() for k in LIFECYCLE_BUCKETS}
LEGAL_STATUS_DISPLAY = " · ".join(LIFECYCLE_BUCKETS)

# health is DERIVED (dates x lifecycle x open blockers), never typed and never
# written back to `Status` — pack §2.2 裁決三. These three keys are the dashboard
# surface of the health axis in pm-status-crosswalk.json.
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


def render_data_errors(items):
    """Status literals outside the four legal values — named, never bucketed.

    A row whose Status is not Done / WIP / Not started / Drop is a data error, not
    a fourth guess. The old skill folded `取消` into `Not started`, which left
    abandoned work in the percent denominator and understated completion forever.
    Deleting the row instead would err the other way — an unreadable row would
    become work nobody had to do. So the row STAYS IN the denominator, outside
    `done`, and gets printed here loudly enough that somebody fixes the sheet.
    Only `Drop` ever leaves a denominator (pack §2.2 裁決二).

    This block also carries spine stages removed for an empty denominator, whose
    `value` reads like `(no task rows)` rather than a Status literal."""
    if not items:
        return ""
    rows = ""
    for e in items:
        no = esc(e.get("no"))
        raw = e.get("value")
        val = esc(raw)
        msg = esc(e.get("message"))
        # A legal literal filed as a data error is a payload bug, not a sheet bug:
        # it would name an innocent row in the reader's email. Warn, don't crash.
        if str(raw or "").strip().casefold() in LEGAL_STATUS_LITERALS:
            print(f"[render warning] data_errors row {raw!r} is a LEGAL lifecycle "
                  f"value ({LEGAL_STATUS_DISPLAY}); it should have been bucketed, "
                  f"not reported.", file=sys.stderr)
        rows += f"""
        <div style="padding:10px 12px;background:#fef2f2;border-left:3px solid #b91c1c;border-radius:6px;margin:0 0 8px 0;">
          <div style="font-size:14px;font-weight:700;color:#b91c1c;">{no}　Status =「{val}」</div>
          <div style="font-size:13px;color:{MUTED};margin-top:2px;line-height:1.5;">{msg}</div>
        </div>"""
    note = (f'<div style="font-size:12px;color:{MUTED};margin-top:2px;line-height:1.6;">'
            f'合法值僅 {esc(LEGAL_STATUS_DISPLAY)}。這些列<b>仍計入</b>完成度分母（只有 Drop 會離開分母），'
            f'但不計為完成，本期百分比為暫定值</div>')
    return section(f"資料錯誤：Status 值不合法（{len(items)}）", rows + note)


def render_dropped(items):
    """Dropped rows: out of the denominator, but never out of the report.

    `Drop` is the ONLY thing that leaves a denominator (pack §2.2 裁決二) — it
    leaves each stage's own denominator, since the reported percent is the mean of
    the per-stage fractions. This block is the other half of that rule: a reader
    who cannot see what left the plan cannot tell a finished project from an
    abandoned one."""
    if not items:
        return ""
    rows = ""
    for d in items:
        no = esc(d.get("no"))
        task = esc(d.get("task"))
        reason = esc(d.get("reason")) if d.get("reason") else ""
        reason_html = (f'<div style="font-size:13px;color:{MUTED};margin-top:2px;line-height:1.5;">{reason}</div>'
                       if reason else "")
        unlogged = "" if d.get("logged") else (
            f'<div style="font-size:13px;color:#b45309;margin-top:2px;line-height:1.5;">'
            f'(Change & Decision Log 無對應紀錄)</div>')
        rows += f"""
        <div style="margin:0 0 10px 0;padding-left:10px;border-left:2px solid {LINE};">
          <div style="font-size:14px;color:{MUTED};text-decoration:line-through;">{no}　{task}</div>
          {reason_html}{unlogged}
        </div>"""
    note = (f'<div style="font-size:12px;color:{MUTED};margin-top:2px;line-height:1.6;">'
            f'已 Drop 的任務不計入該階段的完成度分母；只有 Drop 會離開分母</div>')
    return section(f"已 Drop 的任務（{len(items)}）", rows + note)


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
    # Data errors ride high, directly under the health badge: they are the reason
    # the percent below them is provisional, so the reader must meet them first.
    parts.append(render_data_errors(d.get("data_errors")))
    parts.append(render_diff(d.get("weekly_diff")))
    parts.append(render_blockers(d.get("blockers", [])))
    parts.append(render_this_week(d.get("this_week", []), d.get("week_range", "")))
    if d.get("current_stage"):
        parts.append(render_current_stage(d["current_stage"]))
    # Dropped work sits right under the percent it was excluded from.
    parts.append(render_dropped(d.get("dropped")))
    if d.get("next_milestone"):
        parts.append(render_next_milestone(d["next_milestone"]))
    if d.get("overview"):
        parts.append(render_overview(d["overview"]))
    parts.append(render_decisions(d.get("decisions")))
    parts.append(render_timeline(d.get("timeline")))
    body = "".join(parts)
    ver = (d.get("sheet_version") or "").strip().lower()
    # Record which shape was read. A v1 sheet is legal but lossy (no 前置任務), and
    # a report that does not say which map it used cannot be audited later. The
    # label is derived from COLUMNS_V2 / COLUMNS_V1_LEGACY / SHEET_RANGE above.
    ver_label = VERSION_LABEL.get(ver, "管控表版本未標示")
    return f"""<div style="background:{PAGE_BG};padding:24px 0;font-family:-apple-system,'Segoe UI','PingFang TC','Microsoft JhengHei',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:0 16px;">
    <div style="margin:0 0 16px 0;">
      <div style="font-size:22px;font-weight:800;color:{INK};line-height:1.3;">📊 PROJECT DASHBOARD</div>
      <div style="font-size:15px;color:{INK};margin-top:2px;">{title}</div>
      <div style="font-size:13px;color:{MUTED};margin-top:4px;">最後更新 {update_date}</div>
    </div>
    {body}
    <div style="font-size:12px;color:{MUTED};text-align:center;margin:8px 0 0 0;line-height:1.6;">
      本週報由「{SOURCE_TAB}」自動彙整生成，資料來源為 Google Sheet 專案管控表。<br>
      讀取版本：{ver_label}<br>
      完成度＝各交付階段完成率的平均；每階段完成率＝該階段 Done ÷（該階段任務列 − Drop）。<br>
      只有 Drop 會離開分母；狀態值不合法的列仍留在分母內，且不計為完成。
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
