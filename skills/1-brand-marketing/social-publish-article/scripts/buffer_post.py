#!/usr/bin/env python3
"""
buffer_post.py — thin wrapper over Buffer's GraphQL API (api.buffer.com/graphql)
for the publish-article skill. One post per channel per call.

Auth + channel IDs are read from the sibling .secrets.env (never passed on the
CLI, never printed). See .secrets.env.example for the variable contract.

Usage:
  # list connected channels (read-only sanity check)
  python3 buffer_post.py --list-channels

  # create a post
  python3 buffer_post.py --channel threads --text "..." --mode draft
  python3 buffer_post.py --channel facebook --text "..." --mode now
  python3 buffer_post.py --channel instagram --image https://.../card.png --text "caption" --mode now
  python3 buffer_post.py --channel facebook --text "..." --mode schedule --due 2026-06-20T09:00:00Z

--mode:
  draft     -> saveToDraft:true            (safe; creates a Buffer draft, nothing public)
  now       -> mode:shareNow, automatic    (publishes immediately)
  schedule  -> mode:customScheduled + --due (queues for that time)

Exit code 0 on PostActionSuccess; non-zero on any GraphQL/API/typed error.
Notes:
  - Instagram REQUIRES --image (a publicly reachable URL). Text-only IG is rejected.
  - Threads/FB take text. This wrapper posts ONE Buffer post; it does not chain a
    Threads reply-thread. Keep Threads copy <=500 chars, or split upstream and call
    once per chunk.
"""
import argparse, json, os, sys, urllib.request, urllib.error

API = "https://api.buffer.com/graphql"
HERE = os.path.dirname(os.path.abspath(__file__))
SECRETS = os.path.join(os.path.dirname(HERE), ".secrets.env")

CHANNEL_ENV = {
    "facebook":  "BUFFER_CHANNEL_FACEBOOK",
    "threads":   "BUFFER_CHANNEL_THREADS",
    "instagram": "BUFFER_CHANNEL_INSTAGRAM",
}

def load_secrets(path=SECRETS):
    env = {}
    if not os.path.exists(path):
        sys.exit(f"ERROR: secrets file not found at {path} (copy .secrets.env.example -> .secrets.env)")
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env

def gql(token, query, variables=None):
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        API, data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            payload = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"ERROR: HTTP {e.code} from Buffer: {e.read().decode()[:300]}")
    except urllib.error.URLError as e:
        sys.exit(f"ERROR: network error reaching Buffer: {e}")
    if payload.get("errors"):
        sys.exit("ERROR: GraphQL: " + json.dumps(payload["errors"])[:400])
    return payload["data"]

def cmd_list(token, org_id):
    q = ('{ channels(input:{organizationId:"%s"}) { id name service type } }' % org_id)
    data = gql(token, q)
    for c in data["channels"]:
        print(f"{c['service']:10} {c['type']:9} {c['id']}  {c['name']}")

CREATE = """
mutation($input: CreatePostInput!) {
  createPost(input: $input) {
    __typename
    ... on PostActionSuccess { post { id status } }
    ... on InvalidInputError { message }
    ... on RestProxyError { message code }
    ... on UnauthorizedError { message }
    ... on LimitReachedError { message }
    ... on NotFoundError { message }
    ... on UnexpectedError { message }
  }
}
""".strip()

def cmd_post(token, channel_id, text, image, mode, due):
    inp = {
        "channelId": channel_id,
        "text": text or "",
        "assets": [],
        "mode": "shareNow",
        "schedulingType": "automatic",
    }
    if image:
        inp["assets"] = [{"image": {"url": image}}]
    if mode == "draft":
        inp["saveToDraft"] = True
    elif mode == "now":
        inp["mode"] = "shareNow"
    elif mode == "schedule":
        if not due:
            sys.exit("ERROR: --mode schedule requires --due (ISO8601, e.g. 2026-06-20T09:00:00Z)")
        inp["mode"] = "customScheduled"
        inp["dueAt"] = due
    data = gql(token, CREATE, {"input": inp})
    res = data["createPost"]
    if res["__typename"] == "PostActionSuccess":
        p = res["post"]
        print(f"OK  post id={p['id']} status={p.get('status')}")
        return 0
    print(f"FAIL  {res['__typename']}: {res.get('message')} {res.get('code','')}".strip())
    return 1

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list-channels", action="store_true")
    ap.add_argument("--channel", choices=list(CHANNEL_ENV))
    ap.add_argument("--text", default="")
    ap.add_argument("--image", help="public image URL (required for instagram)")
    ap.add_argument("--mode", choices=["draft", "now", "schedule"], default="draft")
    ap.add_argument("--due", help="ISO8601 timestamp for --mode schedule")
    a = ap.parse_args()

    env = load_secrets()
    token = env.get("BUFFER_ACCESS_TOKEN")
    if not token:
        sys.exit("ERROR: BUFFER_ACCESS_TOKEN missing from .secrets.env")

    if a.list_channels:
        org = env.get("BUFFER_ORG_ID")
        if not org:
            sys.exit("ERROR: BUFFER_ORG_ID missing from .secrets.env")
        return cmd_list(token, org)

    if not a.channel:
        sys.exit("ERROR: --channel is required (or use --list-channels)")
    channel_id = env.get(CHANNEL_ENV[a.channel])
    if not channel_id:
        sys.exit(f"ERROR: {CHANNEL_ENV[a.channel]} missing from .secrets.env")
    if a.channel == "instagram" and not a.image:
        sys.exit("ERROR: instagram requires --image (a public URL); text-only IG is rejected")
    sys.exit(cmd_post(token, channel_id, a.text, a.image, a.mode, a.due))

if __name__ == "__main__":
    main()
