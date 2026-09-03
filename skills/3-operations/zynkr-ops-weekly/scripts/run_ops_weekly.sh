#!/bin/bash
# Zynkr — 營運每週彙報 scheduled runner (the skill half; the Apps Script scaffold is separate).
#
# WHY A TICK INSTEAD OF FIVE TIMED JOBS
#   The five beats are anchored to Asia/Taipei (the company's clock) but this Mac is not:
#   it is currently Europe/Amsterdam, six hours behind. launchd's StartCalendarInterval has
#   no timezone field — it always fires in MACHINE local time — so a plist that says 22:00
#   would put `decisions` at 04:00 Friday Taipei: after the 23:00 scaffold, into the wrong
#   week, and it MAILS THE WHOLE TEAM. So launchd only supplies a heartbeat (:05 and :35 every
#   hour) and this script decides, in Taipei time, whether a beat is due. Fly home to Taipei
#   and nothing needs changing.
#
# WHY IT IS SAFE TO RUN 48x A DAY
#   No beat due => exits in milliseconds without starting Claude. A beat runs at most once per
#   ISO week (stamp files in STATE_DIR). The stamp is written only when the run RECEIPTS itself
#   as ok, so a failed run retries on the next tick while its window is still open, and gives up
#   after MAX_ATTEMPTS so a permanently-broken beat cannot burn an invocation every 30 minutes.
#
# WHY THE EXIT CODE IS NOT TRUSTED
#   `claude -p` exits 0 even when its answer is "I could not do this". On 2026-08-31 the nudge
#   hit an MCP connection timeout, said so in plain English, and was stamped done 33 minutes
#   later with its window still wide open -- so it never retried and the team got no Monday
#   post. On 2026-09-02 the agenda wrote the Doc, failed its Chat post with a 404, and was also
#   stamped done. Both were recorded as successes. The beat therefore has to say, in a line this
#   script can parse, what it actually delivered; see SKILL.md Step 5.
#
# Usage: run_ops_weekly.sh [--dry-run] [--mode=nudge|rollup|chase|agenda|decisions|status]
set -uo pipefail
export PATH="/Users/petertu/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/petertu"

STATE_DIR="$HOME/.local/state/zynkr/ops-weekly"
LOG="$HOME/Library/Logs/zynkr-ops-weekly.log"
CFG="${ZYNKR_OPS_WEEKLY_CONFIG:-$HOME/.config/zynkr/ops-weekly.json}"
MAX_ATTEMPTS=3        # give up after this many non-ok runs in one window
mkdir -p "$STATE_DIR" "$(dirname "$LOG")"

DRY=0; FORCE=""
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --mode=*)  FORCE="${a#--mode=}" ;;
    *) echo "unknown arg: $a" >&2; exit 2 ;;
  esac
done

log() { printf '%s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*" >> "$LOG"; }

[ -f "$CFG" ] || { log "FATAL config missing: $CFG"; exit 1; }

# ── Which beat, if any, is due right now in Taipei? ──────────────────────────
SEL="$(python3 - "$FORCE" "$STATE_DIR" <<'PY'
import sys, os, datetime, zoneinfo
force, state = sys.argv[1], sys.argv[2]
now = datetime.datetime.now(zoneinfo.ZoneInfo("Asia/Taipei"))
y, w, dow = now.isocalendar()
week = f"{y}-W{w:02d}"
done    = lambda m: os.path.exists(os.path.join(state, f"{week}.{m}.done"))
gaveup  = lambda m: os.path.exists(os.path.join(state, f"{week}.{m}.gaveup"))
# Settled = succeeded OR exhausted its retries, so a broken beat stops being selected.
# The prerequisite check below accepts ONLY a real .done: `chase` must never run off
# the back of a `rollup` that gave up, or it will name people whose posts were never
# parsed at all.
settled = lambda m: done(m) or gaveup(m)
if force:
    print(f"{force}|{week}|forced (--mode)"); raise SystemExit
hm = now.strftime("%H:%M")
# mode, ISO weekday, window open, window close, prerequisite beat
BEATS = [("nudge",     1, "09:00", "20:00", None),
         ("rollup",    2, "09:00", "20:00", None),
         ("chase",     2, "09:30", "20:00", "rollup"),
         ("agenda",    3, "17:00", "23:00", None),
         ("decisions", 4, "22:00", "23:59", None)]
for mode, d, s, e, req in BEATS:
    if dow != d or not (s <= hm <= e) or settled(mode):
        continue
    if req and not done(req):
        print(f"|{week}|{mode} held: {req} has not run this week"); raise SystemExit
    print(f"{mode}|{week}|{now:%a %H:%M} Taipei, window {s}-{e}"); raise SystemExit
print(f"|{week}|nothing due at {now:%a %H:%M} Taipei")
PY
)"
MODE="${SEL%%|*}"; REST="${SEL#*|}"; WEEK="${REST%%|*}"; WHY="${REST#*|}"

if [ -z "$MODE" ]; then
  [ "$DRY" = 1 ] && echo "no beat due — $WHY"
  exit 0
fi

# ── Least privilege: each beat gets only the tools it actually needs ─────────
READ_CORE="Read,Grep,Glob,mcp__google-workspace__list_spaces,mcp__google-workspace__get_messages,mcp__google-workspace__search_messages,mcp__google-workspace__get_doc_as_markdown,mcp__google-workspace__inspect_doc_structure,mcp__google-workspace__read_sheet_values,mcp__google-workspace__get_spreadsheet_info"
CHAT_WRITE="mcp__google-workspace__send_message"
DOC_WRITE="mcp__google-workspace__batch_update_doc,mcp__google-workspace__insert_doc_elements,mcp__google-workspace__modify_doc_text,mcp__google-workspace__find_and_replace_doc,mcp__google-workspace__update_paragraph_style"
MAIL="mcp__google-workspace__send_gmail_message,mcp__google-workspace__search_gmail_messages,mcp__google-workspace__get_gmail_message_content"

case "$MODE" in
  nudge|chase) TOOLS="$READ_CORE,$CHAT_WRITE" ;;
  rollup)      TOOLS="$READ_CORE,$DOC_WRITE" ;;
  agenda)      TOOLS="$READ_CORE,$CHAT_WRITE,$DOC_WRITE" ;;
  decisions)   TOOLS="$READ_CORE,$CHAT_WRITE,$DOC_WRITE,$MAIL" ;;   # the only beat that may mail
  status)      TOOLS="$READ_CORE" ;;
  *) log "FATAL unknown mode: $MODE"; exit 2 ;;
esac

MODEL="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('routine',{}).get('model') or 'sonnet')" "$CFG" 2>/dev/null || echo sonnet)"

if [ "$DRY" = 1 ]; then
  echo "WOULD RUN  mode=$MODE  week=$WEEK  model=$MODEL"
  echo "  why    : $WHY"
  echo "  tools  : $TOOLS"
  exit 0
fi

log "START mode=$MODE week=$WEEK model=$MODEL ($WHY)"
OUT="$(mktemp -t zynkr-ops-weekly.XXXXXX)"
claude -p "/zynkr-ops-weekly $MODE" --model "$MODEL" --allowedTools "$TOOLS" >"$OUT" 2>&1
STATUS=$?
cat "$OUT" >> "$LOG"

# ── Assert the side effect; do not trust the exit code ───────────────────────
# The beat ends its report with a machine-readable receipt (SKILL.md Step 5):
#   ZYNKR-OPS-WEEKLY-RESULT: mode=<mode> week=<week> status=ok|partial|failed delivered=<what>
# Only status=ok stamps. A missing receipt is a failure too: it means the run never got far
# enough to report, which is exactly the case the old exit-code check waved through.
RECEIPT="$(grep -a -o 'ZYNKR-OPS-WEEKLY-RESULT:.*' "$OUT" | tail -1)"
rm -f "$OUT"

case "$RECEIPT" in
  *status=ok*) VERDICT="ok" ;;
  "")          VERDICT="no-receipt (claude exit=$STATUS)" ;;
  *)           VERDICT="receipt not ok: $RECEIPT" ;;
esac

if [ "$VERDICT" = "ok" ] && [ $STATUS -eq 0 ]; then
  date '+%Y-%m-%dT%H:%M:%S%z' > "$STATE_DIR/$WEEK.$MODE.done"
  rm -f "$STATE_DIR/$WEEK.$MODE.attempts"
  log "OK    mode=$MODE week=$WEEK  $RECEIPT"
  exit 0
fi

ATT="$STATE_DIR/$WEEK.$MODE.attempts"
N=$(( $(cat "$ATT" 2>/dev/null || echo 0) + 1 ))
echo "$N" > "$ATT"

if [ "$N" -ge "$MAX_ATTEMPTS" ]; then
  printf 'gave up after %s attempts: %s\n' "$N" "$VERDICT" > "$STATE_DIR/$WEEK.$MODE.gaveup"
  log "GIVEUP mode=$MODE week=$WEEK attempts=$N — $VERDICT (no further retries this week)"
else
  log "FAIL  mode=$MODE week=$WEEK attempt=$N/$MAX_ATTEMPTS — $VERDICT (retry next tick inside the window)"
fi
exit 1
