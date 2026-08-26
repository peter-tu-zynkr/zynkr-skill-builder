# Scheduling the five beats

The skill half runs on **launchd**, on Peter's Mac. The Apps Script `scaffold` half is separate
and documented in `scaffold.md`.

## Why not a claude.ai cloud routine

The obvious home for a weekly job is a cloud routine (`/schedule`), the way `zynkr-gm` runs. It
does not work here, for three independent reasons — any one of them is fatal:

1. **There is no Google Chat connector.** The available connectors are Lucid, Google Drive,
   Canva, Gmail and Google Calendar. Four of the five beats *post to the space* and `rollup`
   *reads* it. Chat exists only in the local `google-workspace` MCP server.
2. **The cloud sandbox cannot read the private config.** Every identifier lives in
   `~/.config/zynkr/ops-weekly.json` on disk, precisely because this repo is public. A cloud
   agent has no local filesystem, and the skill fails loud on a missing config rather than guess.
3. **The Drive connector cannot do the Doc writes.** `rollup` inserts a marked block into one
   section of a tabbed Doc without disturbing the owner person-chips. The Drive connector reads
   files and creates files; it does not expose the Docs structural API.

`zynkr-gm` is not a counter-example: it only ever *reads* Drive and *sends* Gmail, both of which
have connectors.

## Why a heartbeat instead of five timed jobs

The five beats are anchored to **Asia/Taipei** — the company's clock. The Mac is not: it is
currently Europe/Amsterdam, six hours behind. `StartCalendarInterval` has **no timezone field**;
it always fires in machine-local time. A plist that said `Hour 22` for `decisions` would fire at
**04:00 Friday Taipei** — after the 23:00 scaffold, against the wrong week, and `decisions`
*mails every owner-chip address*. That is a wrong email to the whole team, not a stale line.

So launchd supplies only a heartbeat — `:05` and `:35` every hour — and
`scripts/run_ops_weekly.sh` decides in Taipei time whether a beat is due. Fly home and nothing
needs re-timing. With no beat due the script exits in milliseconds without starting Claude.

## The beat windows

| Beat | Day (Taipei) | Fires | Window closes | Notes |
|---|---|---|---|---|
| `nudge` | Mon | 09:05 | 20:00 | Also asserts last Thursday's scaffold landed |
| `rollup` | Tue | 09:05 | 20:00 | |
| `chase` | Tue | 09:35 | 20:00 | Never selected until `rollup` is stamped |
| `agenda` | Wed | 17:05 | 23:00 | |
| `decisions` | Thu | 22:05 | 23:59 | After the 21:00 meeting, before the 23:00 scaffold |

A window is a **catch-up range**, not a repeat: the beat runs at most once per ISO week. The
stamp (`~/.local/state/zynkr/ops-weekly/<ISO-week>.<beat>.done`) is written **only on exit 0**, so
a failed run is retried on the next tick while its window is still open, and simply gives up when
the window closes — a missed beat is better than a beat that fires into the wrong day.

## Least privilege

Each beat is invoked with only the tools it needs. `decisions` is the **only** beat given
`send_gmail_message`; `rollup` cannot post to the space; `status` is read-only. An unattended
agent that can post to a team space should not also be able to mail the team.

## Installing

```sh
cp scripts/run_ops_weekly.sh ~/.claude/skills/zynkr-ops-weekly/
chmod +x ~/.claude/skills/zynkr-ops-weekly/run_ops_weekly.sh
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.zynkr.ops-weekly.plist
```

Verify without side effects — `run_ops_weekly.sh --dry-run` prints the beat that is due now (or
nothing), and `--dry-run --mode=<beat>` prints the exact tool allowlist that beat would get.

**Installing mid-week:** seal the current week first, or the next open window fires a beat against
a week that never had a `rollup`:

```sh
W=$(TZ=Asia/Taipei python3 -c "import datetime,zoneinfo;y,w,_=datetime.datetime.now(zoneinfo.ZoneInfo('Asia/Taipei')).isocalendar();print(f'{y}-W{w:02d}')")
for m in nudge rollup chase agenda decisions; do echo skipped > ~/.local/state/zynkr/ops-weekly/$W.$m.done; done
```

`decisions` carries its own guard for this case (it refuses to recap a week with no `〔自動彙整〕`
stamp), but the seal is what keeps `agenda` from posting an agenda built from nothing.
