# zynkr-gm private config

- **Private. Never commit.** The real config holds Drive IDs, emails, trigger and connector IDs; this repo is public, so only `config.example.json` (placeholders) lives here.
- Location: `~/.config/zynkr/gm.json` (override with env `ZYNKR_GM_CONFIG=<path>`). Create it by copying `config.example.json` and filling every `<...>` value; keep `onboarding_master.never_write = true`.
- The skill loads it at step 0 of every local run; a missing or placeholder value → fail loud (`config: sources.main_tracker.id unset`), never guess an ID.
- Cloud routine: the routine prompt is rendered from this file — `references/routine-prompt.tmpl` carries `{{sources.<key>.id}}` / `{{recipients}}` / `{{routine.*}}` placeholders that are substituted with these values on the local machine, then pasted into the routine. The rendered prompt is private too; only the template is committed.
- Roles → meaning: see `source-map.md`. `people{}` maps tracker `負責人` names to emails for asks and 1-on-1 packets.
- Rotate: when a doc is renamed/moved or a trigger is recreated, edit only this file; the skill files never change.
