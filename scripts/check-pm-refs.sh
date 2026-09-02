#!/usr/bin/env bash
# check-pm-refs.sh — SKB-011 guard for the PM skill family (the 管控表 cohort).
#
# An installed skill gets ONLY its own folder. So nothing a PM-family skill needs at run time may
# live at repo root: pointing a 強制 step at ../../scripts/pm-schema.py or ../../docs/pm-shared/*.json
# breaks the moment the skill is installed (ruling R-B). Every shared artefact is therefore SEEDED
# once in this repo and COPIED, byte-identically, into every family skill. Five artefacts:
#
#   docs/pm-shared/pm-knowledge-pack.md      → skills/<member>/references/pm-knowledge-pack.md
#   docs/pm-shared/pm-sources.md             → skills/<member>/references/pm-sources.md
#   docs/pm-shared/pm-sheet-schema.json      → skills/<member>/references/pm-sheet-schema.json
#   docs/pm-shared/pm-status-crosswalk.json  → skills/<member>/references/pm-status-crosswalk.json
#   scripts/pm-schema.py                     → skills/<member>/scripts/pm-schema.py
#
# Every skill calls its OWN scripts/pm-schema.py, skill-folder-relative, exactly like
# render_dashboard_email.py — one root, no split. This gate keeps all five identical to their seed.
#
# On top of that, each SKILL.md declares which pack version and sha256 it was written against, so
# Step 0 can refuse to run on a stale pack. The declared sha is the sha of pm-knowledge-pack.md
# ONLY — it does NOT cover the other four artefacts; those are held identical by the md5 pass below.
#
#   scripts/check-pm-refs.sh              # exit 1 on drift, a missing copy, a missing family
#                                         # member, or a stale declaration
#   scripts/check-pm-refs.sh --sync       # re-copy all five seeds AND rewrite every declared sha,
#                                         # then check
#   scripts/check-pm-refs.sh --print-sha  # print pm-knowledge-pack.md's 12-hex sha256 prefix, exit
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEED="$ROOT/docs/pm-shared"
SCRIPT_SEED="$ROOT/scripts"

# Copied into skills/<member>/references/
FILES=(pm-knowledge-pack.md pm-sources.md pm-sheet-schema.json pm-status-crosswalk.json)
# Copied into skills/<member>/scripts/ — kept separate because the destination dir differs and the
# executable bit has to survive the copy.
SCRIPT_FILES=(pm-schema.py)
# The one artefact whose version + sha256 each SKILL.md declares.
PACK=pm-knowledge-pack.md

# The family is an EXPLICIT list, not the glob skills/3-operations/project-*. Enrolling a skill in
# the PM cohort must be a deliberate, reviewable line in the diff: a glob would silently adopt any
# future project-* skill and silently drop one that gets renamed, and this cohort has real edges —
# zynkr-ops-weekly (3.19) is frozen behind a live launchd plist and is NOT a member.
PM_FAMILY=(
  skills/3-operations/project-planning          # 3.07
  skills/3-operations/project-note-specialist   # 3.08
  skills/3-operations/project-status-update     # 3.09
  skills/3-operations/project-init              # 3.20 · new in SKB-011
  skills/3-operations/project-minutes-sync      # 3.21 · new in SKB-011
)

# The declaration a family SKILL.md must carry, verbatim:
#   知識來源：references/pm-knowledge-pack.md · v<N> · sha256 <first 12 hex>
# STRICT is what `check` demands (exactly 12 hex). LOOSE is what `--sync` is willing to repair, so
# a truncated or hand-edited sha still gets rewritten instead of only being complained about.
DECL_STRICT='知識來源：references/pm-knowledge-pack\.md · v[0-9]+ · sha256 [0-9a-f]{12}'
DECL_LOOSE='知識來源：references/pm-knowledge-pack\.md · v[0-9]+ · sha256 [0-9a-f]*'

md5_of()    { md5 -q "$1" 2>/dev/null || md5sum "$1" | cut -d' ' -f1; }
sha256_of() { shasum -a 256 "$1" 2>/dev/null | cut -d' ' -f1 || sha256sum "$1" | cut -d' ' -f1; }

for f in "${FILES[@]}"; do
  [[ -f "$SEED/$f" ]] || { echo "MISSING  $SEED/$f — no seed, nothing to check"; exit 1; }
done
for f in "${SCRIPT_FILES[@]}"; do
  [[ -f "$SCRIPT_SEED/$f" ]] || { echo "MISSING  $SCRIPT_SEED/$f — no seed, nothing to check"; exit 1; }
done

seed_sha12="$(sha256_of "$SEED/$PACK" | cut -c1-12)"
pack_version="$(LC_ALL=C sed -n 's/.*pack_version:[[:space:]]*\([0-9][0-9]*\).*/\1/p' "$SEED/$PACK" | head -1)"
[[ -n "$pack_version" ]] || { echo "NO-VERSION  $SEED/$PACK has no '<!-- pack_version: N ... -->' marker"; exit 1; }
WANT_DECL="知識來源：references/pm-knowledge-pack.md · v${pack_version} · sha256 ${seed_sha12}"

mode="${1:-check}"
case "$mode" in
  check|--sync) ;;
  --print-sha) echo "$seed_sha12"; echo "paste into each family SKILL.md:  $WANT_DECL" >&2; exit 0 ;;
  *) echo "usage: check-pm-refs.sh [--sync|--print-sha]" >&2; exit 1 ;;
esac

if [[ "$mode" == "--sync" ]]; then
  for d in "${PM_FAMILY[@]}"; do
    dir="$ROOT/$d"
    # No bootstrap escape hatch here either: a member with no SKILL.md does not get seeded, and the
    # check pass below turns it into rc=1 rather than a WARN that scrolls past.
    if [[ ! -f "$dir/SKILL.md" ]]; then echo "MISSING  $d/SKILL.md — not synced"; continue; fi
    mkdir -p "$dir/references" "$dir/scripts"
    for f in "${FILES[@]}"; do cp "$SEED/$f" "$dir/references/$f"; done
    for f in "${SCRIPT_FILES[@]}"; do
      cp "$SCRIPT_SEED/$f" "$dir/scripts/$f"
      # cp does not carry the mode onto an existing destination; restore it explicitly so the copy
      # stays runnable the way the seed is.
      if [[ -x "$SCRIPT_SEED/$f" ]]; then chmod +x "$dir/scripts/$f"; fi
    done
    if LC_ALL=C grep -qE "$DECL_LOOSE" "$dir/SKILL.md"; then
      tmp="$(mktemp)"
      # \1 = everything up to and including the `v`, \2 = ` · sha256 `. Only the version number
      # and the sha are rewritten; the author's own line prefix and indent survive untouched.
      LC_ALL=C sed -E "s/(知識來源：references\/pm-knowledge-pack\.md · v)[0-9]+( · sha256 )[0-9a-f]*/\1${pack_version}\2${seed_sha12}/" \
        "$dir/SKILL.md" > "$tmp"
      cat "$tmp" > "$dir/SKILL.md"   # redirect back in: keeps the file's mode and inode
      rm -f "$tmp"
      echo "SYNCED   $d — 5 artefacts + declaration"
    else
      echo "SYNCED   $d — 5 artefacts only (no declaration line to rewrite)"
    fi
  done
fi

rc=0

# 1. Every declared family member must actually exist. This used to be a WARN-and-skip so the
# family could be half-built mid-spec; a verifier proved that hole lets the whole gate pass
# vacuously (move a SKILL.md aside, tamper with its pack copy → "OK", exit 0). 3.20 and 3.21 now
# exist, so the affordance is gone: a missing member is an ERROR.
members=0
for d in "${PM_FAMILY[@]}"; do
  if [[ ! -f "$ROOT/$d/SKILL.md" ]]; then
    echo "MISSING  $d/SKILL.md — declared PM-family member has no SKILL.md"
    rc=1
    continue
  fi
  members=$((members+1))
done
# Belt and braces: the count also catches a member silently dropped from the loop.
if [[ "$members" -ne "${#PM_FAMILY[@]}" ]]; then
  echo "COUNT    $members of ${#PM_FAMILY[@]} PM-family members checked"
  rc=1
fi

# 2. All five artefacts, byte-identical in every member. Checked for EVERY declared member, not
# only the ones that happen to have a SKILL.md — so hiding a SKILL.md cannot hide a tampered copy.
check_copies() { # $1 = seed dir, $2 = destination subdir under the skill, $3.. = filenames
  local seed_dir="$1" sub="$2"; shift 2
  local f seed_hash n d copy h
  for f in "$@"; do
    seed_hash="$(md5_of "$seed_dir/$f")"
    n=0
    for d in "${PM_FAMILY[@]}"; do
      copy="$ROOT/$d/$sub/$f"
      if [[ ! -f "$copy" ]]; then echo "MISSING  $copy"; rc=1; continue; fi
      h="$(md5_of "$copy")"
      if [[ "$h" != "$seed_hash" ]]; then echo "DRIFT    $copy"; rc=1; fi
      if [[ -x "$seed_dir/$f" && ! -x "$copy" ]]; then echo "WARN     $copy is not executable — run --sync"; fi
      n=$((n+1))
    done
    echo "$sub/$f: seed $seed_hash · $n copies checked"
    if [[ "$n" -ne "${#PM_FAMILY[@]}" ]]; then
      echo "COUNT    $f — $n of ${#PM_FAMILY[@]} copies present"
      rc=1
    fi
  done
}
check_copies "$SEED"        references "${FILES[@]}"
check_copies "$SCRIPT_SEED" scripts    "${SCRIPT_FILES[@]}"

# 3. A copy can be byte-identical while the SKILL.md still promises the reader an older pack.
# Step 0 trusts the declaration, so the declaration is checked separately from the bytes.
for d in "${PM_FAMILY[@]}"; do
  skill="$ROOT/$d/SKILL.md"
  [[ -f "$skill" ]] || continue   # already an ERROR in pass 1; don't double-report
  decl="$(LC_ALL=C grep -oE "$DECL_STRICT" "$skill" | tail -1 || true)"
  if [[ -z "$decl" ]]; then
    echo "NO-DECL  $d/SKILL.md — add:  $WANT_DECL"
    rc=1
    continue
  fi
  declared_sha="${decl##* }"
  declared_v="$(printf '%s' "$decl" | LC_ALL=C sed -E 's/.* · v([0-9]+) · .*/\1/')"
  if [[ "$declared_sha" != "$seed_sha12" ]]; then
    echo "SHA-MISMATCH $d/SKILL.md declared=$declared_sha actual=$seed_sha12"
    rc=1
  fi
  if [[ "$declared_v" != "$pack_version" ]]; then
    echo "WARN     $d/SKILL.md declares v$declared_v · seed pack_version is v$pack_version"
  fi
done

if [[ $rc -eq 0 ]]; then
  echo "OK — all ${#PM_FAMILY[@]} PM-family members present, all 5 shared artefacts byte-identical to their seeds, every SKILL.md declares v${pack_version} · sha256 ${seed_sha12}"
fi
exit $rc
