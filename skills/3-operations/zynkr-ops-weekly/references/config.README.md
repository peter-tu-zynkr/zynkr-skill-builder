# zynkr-ops-weekly private config

- **Private. Never commit.** The real file holds a Doc id, a Chat space id, six permanent Google
  user ids and everyone's email. This repo is public, so only the placeholder
  `config.example.json` lives here.
- Location: `~/.config/zynkr/ops-weekly.json` (override with `ZYNKR_OPS_WEEKLY_CONFIG`). Create
  it by copying the example and filling every `<...>`.
- Loaded at Step 1 of **every** run. A missing or still-placeholder value → **fail loud**
  (`config: doc.id unset`). Never guess an id: a wrong Doc id writes a bot block into somebody
  else's file, and a wrong space id posts a nudge to the wrong room.
- `space.id` **must** carry the `spaces/` prefix. A bare id is rejected by `get_messages` with a
  pattern error — this is the first thing to check when a sweep returns nothing.
- `chat_ids` is the only hardcoded map, by necessity: Chat exposes **no email field at all**, the
  Doc exposes email with no user id, and the People API resolves the id but returns no name or
  email for domain profiles. Everything else — which department belongs to whom, who receives the
  recap mail — is read from the Doc's owner chips at run time.
- **Two key forms, and you need both.** The MCP renders a sender as a **display name** when that
  person is in the account's personal Contacts, and as `users/<21-digit id>` when they are not.
  So the same space yields a mix — verified 2026-08-24, where three of six reporters came back as
  names and three as ids. Key each person by the form their messages actually arrive as; keeping
  both entries is harmless and means nothing breaks the day somebody is added to Contacts.
- To pin an unknown id: find where someone **@-mentions a name in a thread** and see which id
  replies in that same thread. @-mentions render as names even when the sender does not.
- Adding a person: add their `chat_ids` row **and** put their chip on a Doc heading. Only the
  first is a code change; the second is what actually routes them.
- Removing a person: drop them from `reporters` so `chase` stops naming them. Old Doc sections
  keep their chips — that is history, leave it.
- Rotate: when the Doc is renamed or moved, or a trigger is recreated, edit only this file. No
  skill file changes.
