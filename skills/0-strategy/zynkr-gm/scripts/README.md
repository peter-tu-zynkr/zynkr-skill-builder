# zynkr-gm scripts (Python 3 stdlib only — every script has `--help` and `--selftest`)

| Script | One-line usage |
|---|---|
| `extract_newest_block.py` | `python3 scripts/extract_newest_block.py <weekly-log.md> [--blocks N] [--json]` — newest N `## <Mon DD, YYYY>` blocks of the 營運每週彙報 dump (verbatim, or JSON with per-section text) |
| `derive_state.py` | `python3 scripts/derive_state.py rows.json --today YYYY-MM-DD [--prev prev_rows.json] [--json]` — ENDS_SOON / OVERDUE / UNDATED / CHANGED / PROPOSE_DONE per tracker row + summary + per-owner rollup |
| `tracker_diff.py` | `python3 scripts/tracker_diff.py before.json after.json [--json]` — added / removed / changed (狀態·開始·結束·負責人·Priority) between two 「H2 專案項目」 snapshots |
| `kpi_locate.py` | `python3 scripts/kpi_locate.py values.json --tracker 1.03` or `--metric-substring Runway` — row + A1 cells (Actual / As of / Source) on the KPI Dashboard tab, columns resolved by header text |
| `render_routine_prompt.py` | `python3 scripts/render_routine_prompt.py --config config.json --template x.tmpl [--out f] [--check]` — fill `{{dotted.key}}` / `{{today_tpe}}` placeholders; exit 2 listing any unresolved key |

Run all selftests: `for s in scripts/*.py; do python3 "$s" --selftest || exit 1; done`
