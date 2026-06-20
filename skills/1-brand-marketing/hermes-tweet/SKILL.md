---
name: hermes-tweet
description: "Use Hermes Tweet when a Hermes Agent workflow needs X/Twitter search, reply reading, public profile lookup, follower export, trend checks, monitoring, or approval-gated posting through the Hermes Tweet plugin. Trigger on 'search X from Hermes', 'read tweet replies', 'monitor this hashtag', 'export followers', or 'draft a supervised X reply'. Does not collect credentials in chat or bypass the plugin action gate."
category: brand-marketing
project: hermes-tweet
platform: multi
status: Done
author: Xquik
input: "A Hermes Agent task involving X/Twitter search, account research, monitoring, or approved social actions"
process: "Install and enable Hermes Tweet, discover catalog endpoints with tweet_explore, use tweet_read for public reads, and reserve tweet_action for explicit approval-gated operations"
output: "Structured X/Twitter research, monitoring, or supervised action handoffs from a Hermes Agent session"
synergy: []
upstream_repo: https://github.com/Xquik-dev/hermes-tweet
original_source_url: https://github.com/Xquik-dev/hermes-tweet/blob/master/skills/hermes-tweet/SKILL.md
original_author: Xquik
---

# Hermes Tweet

```bash
npx skills add https://github.com/Xquik-dev/hermes-tweet --skill hermes-tweet
```

Hermes Tweet is a native Hermes Agent plugin skill for X/Twitter work. Use it when a brand, launch, support, or creator workflow needs structured tweet search, reply analysis, public user lookup, follower export, monitoring, trend checks, or supervised publishing from inside Hermes Agent.

---

## Step 1 - Install the plugin

Install and enable Hermes Tweet on the Hermes runtime host:

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
```

For Python environments that need the published package, install it into the Hermes environment:

```bash
uv pip install --python ~/.hermes/hermes-agent/venv/bin/python hermes-tweet
hermes plugins enable hermes-tweet
```

## Step 2 - Configure local runtime secrets

Set credentials only in the local Hermes runtime environment:

```bash
export XQUIK_API_KEY="set-this-locally"
export HERMES_TWEET_ENABLE_ACTIONS="false"
```

Never ask the user to paste API keys, cookies, passwords, signing keys, or TOTP secrets into chat. If `XQUIK_API_KEY` is missing, use only endpoint discovery and tell the user to configure the local runtime.

## Step 3 - Discover the endpoint

Use `tweet_explore` first for capability and route discovery. Keep the query short and specific:

```text
tweet search
tweet replies
user lookup
followers export
trends
monitor hashtag
```

Do not invent endpoint paths. Copied endpoint URLs are acceptable only when they resolve to catalog-listed `/api/v1/...` paths.

## Step 4 - Route reads safely

Use `tweet_read` only for catalog-listed public read endpoints. Good fits include:

- Searching recent tweets for product feedback.
- Reading replies to a launch announcement.
- Looking up public profile context for a creator or customer.
- Exporting followers for review.
- Checking trends or monitoring public topics.

If an endpoint touches private account state, writes data, starts a monitor, creates an extraction job, or changes an account, treat it as an action.

## Step 5 - Gate actions

Use `tweet_action` only when all of these are true:

1. The user explicitly requested the operation.
2. The exact endpoint and payload are known.
3. The operation has been summarized back to the user.
4. `HERMES_TWEET_ENABLE_ACTIONS=true` is configured in the runtime.

For posts, replies, DMs, follows, likes, retweets, deletions, profile changes, monitors, webhooks, extraction jobs, and draws, keep a human approval step before the final tool call.

## Outputs

Return one of these artifacts:

- A concise X/Twitter research summary with cited account, tweet, or trend fields from tool output.
- A monitoring or extraction handoff with endpoint, query, scope, and safety constraints.
- A supervised draft action payload that the user can approve or reject.
- A setup diagnostic explaining which local Hermes runtime setting is missing.

## Limitations

- Does not bypass Hermes plugin enablement.
- Does not accept credentials in chat or tool arguments.
- Does not retry failed writes through alternate routes.
- Does not use non-catalog X/Twitter endpoints.
- Does not replace target-native marketplace submission rules.

## Attribution

This entry rehosts the public Hermes Tweet skill for the Zynkr marketplace with compact routing and safety guidance. The canonical source remains `Xquik-dev/hermes-tweet`, authored by Xquik.
