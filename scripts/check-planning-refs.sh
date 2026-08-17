#!/usr/bin/env bash
# check-planning-refs.sh — SKB-007 AC-4 guard for the planning-* skill family.
#
# The two shared reference files (planning-knowledge-pack.md, planning-sources.md) have ONE
# canonical seed in docs/planning-shared/ and a byte-identical copy in every
# skills/0-strategy/planning-*/references/. This script proves that (default) or re-copies
# the seed into every skill (--sync).
#
#   scripts/check-planning-refs.sh          # exit 1 if any copy differs from the seed
#   scripts/check-planning-refs.sh --sync   # copy seed → every planning-* skill, then check
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEED="$ROOT/docs/planning-shared"
FILES=(planning-knowledge-pack.md planning-sources.md)
mode="${1:-check}"
if [[ "$mode" == "--sync" ]]; then
  for d in "$ROOT"/skills/0-strategy/planning-*/; do
    mkdir -p "$d/references"
    for f in "${FILES[@]}"; do cp "$SEED/$f" "$d/references/$f"; done
  done
fi
rc=0
for f in "${FILES[@]}"; do
  seed_hash="$(md5 -q "$SEED/$f" 2>/dev/null || md5sum "$SEED/$f" | cut -d' ' -f1)"
  n=0
  for d in "$ROOT"/skills/0-strategy/planning-*/; do
    copy="$d/references/$f"
    if [[ ! -f "$copy" ]]; then echo "MISSING  $copy"; rc=1; continue; fi
    h="$(md5 -q "$copy" 2>/dev/null || md5sum "$copy" | cut -d' ' -f1)"
    if [[ "$h" != "$seed_hash" ]]; then echo "DRIFT    $copy"; rc=1; fi
    n=$((n+1))
  done
  echo "$f: seed $seed_hash · $n copies checked"
done
if [[ $rc -eq 0 ]]; then echo "OK — every planning-* copy is byte-identical to docs/planning-shared/"; fi
exit $rc
