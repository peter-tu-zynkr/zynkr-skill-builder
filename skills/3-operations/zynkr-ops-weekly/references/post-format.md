# The four-line `#週報` format

Pinned in the space. Every line exists because something downstream consumes it — drop a line
and a piece of the automation has nothing to work with.

```
#週報
上週:
- 事項 — Done / WIP / Blocked
本週:
- 事項
數字: 報名 72 / 訂閱 +18        （沒有就寫 —）
卡關: 需要誰決定什麼            （沒有就寫 無）
```

| Line | Consumer | If it is missing |
|---|---|---|
| `#週報` | The sweep filter | The post is invisible to every mode. The space is a mixed channel — banners, screenshots, chatter — so the tag is the only reliable selector |
| `上週:` | The Doc's 進度 column; `Done` removes the item from next week's skeleton, `WIP` increments `↻N週` | No carry-over tracking; items rot silently, which is diagnosis 01 |
| `本週:` | The Doc's 本週待辦 column | Thursday has no forward-looking half |
| `數字:` | The Doc's Metrics slots | The slot stays empty unless a configured tracker can backfill it |
| `卡關:` | Wednesday's **≤3 decisions** | The meeting has no decision candidates and reverts to reading progress aloud |

`卡關:` is the load-bearing line. It is the only field that forces a decision, and the whole
point of the Thursday meeting is to make decisions rather than narrate status.

## Parse rules (`scripts/parse_reports.py`)

- **Selector**: the literal `#週報` anywhere in the message text. Case-sensitive, no fuzzy match.
- **Sections**: split on the four labels. Accept `上週`/`上周`, `本週`/`本周`, both `:` and `：`,
  and optional whitespace. People type both, and rejecting half of them is not worth a rule.
- **Items**: lines under `上週:` / `本週:` starting with `-`, `*`, `・`, `‧` or a digit-dot.
  A section written as one prose line and no bullets is kept whole as a single item.
- **Status**: for `上週` items, look for `Done` / `WIP` / `Blocked` (any case) after an em dash,
  hyphen, or at end of line. Nothing found → `UNSET`, which is reported, not guessed.
- **Numbers**: `數字:` is kept as a raw string *and* parsed opportunistically into
  `{label: value}` pairs on `/` separators. A lone `—`, `-`, `無` or empty → no metrics.
- **Blockers**: `卡關:` kept whole. `無`, `—`, `-`, `沒有`, `n/a` → no blocker.
- **One post per person per week**: if somebody posts twice, the **latest** wins, and the report
  says so. Editing by re-posting is normal behaviour and should not double-write.
- **Unknown sender**: a `users/<id>` not in `chat_ids` is never dropped silently — it is
  reported as `unmapped_sender` so the config can be fixed. Reporting works; guessing does not.

## Before the format is adopted — `--accept-untagged`

As of 2026-08-24 **nobody was using the tagged format yet**. The shapes actually in the space
were `上禮拜進度` … `本週待辦` / `這禮拜待辦` (2026-08-24) and `這個禮拜我的 focus` (2026-08-17),
written as bare lines with no bullets and no `#週報` tag. A tag-only parser matches zero
messages against that, which would make the first roll-up look like total non-compliance.

`parse_reports.py --accept-untagged` also recognises those shapes, so the loop produces real
output from day one while the Monday nudge migrates everyone onto the tagged format. Each
record carries `format: "tagged" | "legacy"`, and the run report names who is still on the old
shape — which is the number that should go to zero.

Because the legacy shape has no bullets, **every non-empty line under a label is its own item**.
Joining them would fuse five distinct tasks into one blob and destroy both per-item status and
carry-over tracking.

Retire the flag once `legacy` reaches zero for two consecutive weeks. Keeping it forever would
make the pinned format optional, and an optional format is not a format.

## Format drift

The ask has already drifted once between weeks. Treat the pinned message as the single source
and re-post it verbatim in every `nudge`, so a new variant never becomes the norm by repetition.
Do **not** teach the parser to accept a new shape — fix the pinned format instead. A parser that
accepts everything makes the format meaningless, and the format is what makes the roll-up cheap.
