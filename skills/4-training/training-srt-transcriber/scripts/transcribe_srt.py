#!/usr/bin/env python3
"""Turn an audio file into an .srt subtitle file.

Two modes:
  transcribe  AUDIO --out OUT.srt   -> fresh Whisper transcription (raw STT, timestamps from audio)
  retime      AUDIO REF --out OUT.srt -> keep REF's exact words, re-derive every timestamp
                                          from AUDIO via forced alignment (REF = .srt or .txt)

This is the upstream step to `training-srt-optimizer`: it produces the raw-STT .srt
that the optimizer then minimally cleans into readable Traditional Chinese.

The heavy work runs on local Whisper (stable-ts + torch). The script self-bootstraps
a dedicated virtualenv on first run (no system pollution, no API keys, offline).
Override its location with env var SRT_VENV. The Whisper model is cached by stable-ts
under ~/.cache/whisper on first use.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# --------------------------------------------------------------------------- #
# Managed virtualenv (local Whisper stack)                                     #
# --------------------------------------------------------------------------- #
VENV_DIR = Path(
    os.environ.get("SRT_VENV", Path.home() / ".cache" / "zynkr-srt-transcriber" / "venv")
)
# Pins matter: a bare `stable-ts` install backtracks to an ancient numba that
# refuses to build on Python >=3.10. These pins keep resolution on a modern set.
PIP_PKGS = ["torch", "numba>=0.60", "llvmlite>=0.43", "numpy>=1.26,<2.2", "stable-ts"]


def _venv_python() -> Path:
    if os.name == "nt":
        return VENV_DIR / "Scripts" / "python.exe"
    return VENV_DIR / "bin" / "python"


def _has_stable_whisper(py: Path) -> bool:
    return subprocess.run(
        [str(py), "-c", "import stable_whisper"], capture_output=True
    ).returncode == 0


def ensure_venv() -> Path:
    """Create the managed venv + install the Whisper stack if missing. Idempotent."""
    py = _venv_python()
    if py.exists() and _has_stable_whisper(py):
        return py

    VENV_DIR.parent.mkdir(parents=True, exist_ok=True)
    uv = shutil.which("uv")
    print(f"[setup] provisioning Whisper venv at {VENV_DIR} (one-time, ~2GB)…", flush=True)
    if uv:
        subprocess.run([uv, "venv", "--python", "3.12", str(VENV_DIR)], check=True)
        subprocess.run([uv, "pip", "install", "--python", str(py), *PIP_PKGS], check=True)
    else:
        base = shutil.which("python3.12") or shutil.which("python3") or sys.executable
        subprocess.run([base, "-m", "venv", str(VENV_DIR)], check=True)
        subprocess.run([str(py), "-m", "pip", "install", "--upgrade", "pip"], check=True)
        subprocess.run([str(py), "-m", "pip", "install", *PIP_PKGS], check=True)
    if not _has_stable_whisper(py):
        raise SystemExit("[setup] venv created but stable_whisper still not importable")
    print("[setup] Whisper venv ready.", flush=True)
    return py


def _in_managed_venv() -> bool:
    """True when the current interpreter is running inside the managed venv.
    Compares sys.prefix (not a resolved exe path): a venv's bin/python is a symlink to
    its base interpreter, so resolving it would collapse onto the base and misdetect a
    base-interpreter run as an in-venv run."""
    try:
        return Path(sys.prefix).resolve() == VENV_DIR.resolve()
    except OSError:
        return False


def reexec_in_venv() -> None:
    """Ensure stable_whisper is importable; re-run this script inside the managed venv if not."""
    try:
        import stable_whisper  # noqa: F401
        return
    except Exception:
        pass
    py = ensure_venv()
    if _in_managed_venv():
        import stable_whisper  # noqa: F401  # in the managed venv but broken -> surface the real error
        return
    os.execv(str(py), [str(py), os.path.abspath(__file__), *sys.argv[1:]])


# --------------------------------------------------------------------------- #
# SRT helpers (pure stdlib — used by validate, and to read a reference .srt)   #
# --------------------------------------------------------------------------- #
_TS_LINE = re.compile(r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})")
_INDEX = re.compile(r"^\d+$")


def _t(h, m, s, ms) -> float:
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def load_reference_segments(ref_path: Path) -> list[str]:
    """Ordered cue text from a reference. For a .txt: one segment per non-empty line.
    For a .srt: one segment per cue — a leading sequence number and a leading timecode
    are stripped per block, then the remaining (possibly wrapped) cue lines are joined.
    Only the block's FIRST line is treated as an index, so a cue whose text is bare
    digits is preserved. A block with neither index nor timecode (a malformed header)
    is kept as text."""
    raw = ref_path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    if ref_path.suffix.lower() != ".srt":
        return [l.strip() for l in raw.split("\n") if l.strip()]
    segs: list[str] = []
    for block in re.split(r"\n\s*\n", raw.strip()):
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        if not lines:
            continue
        if _INDEX.match(lines[0]):               # drop a leading sequence number
            lines = lines[1:]
        if lines and _TS_LINE.search(lines[0]):  # drop a leading timecode (timing ignored)
            lines = lines[1:]
        if lines:
            segs.append(" ".join(lines))         # join a wrapped multi-line cue into one segment
    if not segs:
        raise SystemExit(f"No subtitle text found in reference: {ref_path}")
    return segs


def parse_srt_cues(path: Path) -> list[tuple[float, float, str]]:
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    cues = []
    for block in re.split(r"\n\s*\n", text.strip()):
        lines = [l for l in block.splitlines() if l.strip()]
        for i, l in enumerate(lines):
            m = _TS_LINE.search(l)
            if m:
                start = _t(*m.group(1, 2, 3, 4))
                end = _t(*m.group(5, 6, 7, 8))
                cues.append((start, end, " ".join(lines[i + 1:])))
                break
    return cues


def _ffprobe_duration(audio: str) -> float | None:
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", audio],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return float(out)
    except Exception:
        return None


# --------------------------------------------------------------------------- #
# Commands                                                                     #
# --------------------------------------------------------------------------- #
def cmd_setup(args: argparse.Namespace) -> int:
    ensure_venv()
    return 0


def cmd_transcribe(args: argparse.Namespace) -> int:
    import stable_whisper
    model = stable_whisper.load_model(args.model, device=args.device)
    result = model.transcribe(args.audio, language=args.lang, verbose=False)
    if not result.segments:
        print(f"ERROR: no speech segments detected in {args.audio}.", file=sys.stderr)
        return 1
    out = Path(args.out)
    result.to_srt_vtt(str(out), word_level=False, segment_level=True)
    print(f"Wrote transcription SRT: {out}")
    print(f"Cues: {len(result.segments)}  "
          f"Span: {result.segments[0].start:.2f}s -> {result.segments[-1].end:.2f}s")
    return 0


def cmd_retime(args: argparse.Namespace) -> int:
    import stable_whisper
    segs = load_reference_segments(Path(args.reference))
    model = stable_whisper.load_model(args.model, device=args.device)
    # original_split=True -> keep the reference's newline boundaries as cue boundaries
    result = model.align(args.audio, "\n".join(segs), language=args.lang, original_split=True)
    if not result.segments:
        print(f"ERROR: alignment produced no segments — check that {args.reference} "
              f"matches what is spoken in {args.audio}.", file=sys.stderr)
        return 1
    out = Path(args.out)
    result.to_srt_vtt(str(out), word_level=False, segment_level=True)
    print(f"Re-timed {len(segs)} reference segments -> {out}")
    print(f"Cues: {len(result.segments)}  "
          f"Span: {result.segments[0].start:.2f}s -> {result.segments[-1].end:.2f}s")
    if len(result.segments) != len(segs):
        print(f"NOTE: produced {len(result.segments)} cues from {len(segs)} reference "
              f"segments (alignment merged/dropped some — inspect before shipping).",
              file=sys.stderr)
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    cues = parse_srt_cues(Path(args.input))
    if not cues:
        print("ERROR: no cues parsed — not a valid SRT.")
        return 1
    dur = args.audio_dur if args.audio_dur else (_ffprobe_duration(args.audio) if args.audio else None)
    errors, warnings = [], []
    prev_end = -1.0
    for i, (st, en, tx) in enumerate(cues, start=1):
        if en < st:
            errors.append(f"Cue {i}: end < start ({en:.2f} < {st:.2f})")
        if en - st < 0.02:
            warnings.append(f"Cue {i}: near-zero duration")
        if st < prev_end - 0.05:
            errors.append(f"Cue {i}: overlaps previous cue (start {st:.2f} < prev end {prev_end:.2f})")
        if dur and en > dur + 0.5:
            errors.append(f"Cue {i}: ends past audio ({en:.2f} > {dur:.2f})")
        prev_end = en
    print(f"Cues: {len(cues)}  Span: {cues[0][0]:.2f}s -> {cues[-1][1]:.2f}s"
          + (f"  (audio {dur:.2f}s)" if dur else ""))
    for w in warnings:
        print(f"WARN: {w}")
    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        print(f"Validation FAILED with {len(errors)} error(s).")
        return 1
    print("OK: SRT passed validation.")
    return 0


# --------------------------------------------------------------------------- #
# CLI                                                                          #
# --------------------------------------------------------------------------- #
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Audio -> SRT: transcribe or re-time a known transcript.")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("setup", help="Provision the local Whisper venv (one-time)")
    s.set_defaults(func=cmd_setup)

    t = sub.add_parser("transcribe", help="Fresh Whisper transcription of AUDIO into an SRT")
    t.add_argument("audio", help="Path to input audio (.m4a/.mp3/.wav/…, decoded via ffmpeg)")
    t.add_argument("--out", required=True, help="Path to output .srt")
    t.add_argument("--model", default="medium", help="Whisper model (tiny/base/small/medium/large-v3)")
    t.add_argument("--lang", default="zh", help="Spoken language code (default zh)")
    t.add_argument("--device", default="cpu", help="cpu | cuda | mps")
    t.set_defaults(func=cmd_transcribe)

    r = sub.add_parser("retime", help="Force-align a known transcript to AUDIO (keep words, fix timing)")
    r.add_argument("audio", help="Path to input audio")
    r.add_argument("reference", help="Reference .srt (words taken, timing ignored) or .txt (one cue per line)")
    r.add_argument("--out", required=True, help="Path to output .srt")
    r.add_argument("--model", default="medium", help="Whisper model")
    r.add_argument("--lang", default="zh", help="Spoken language code (default zh)")
    r.add_argument("--device", default="cpu", help="cpu | cuda | mps")
    r.set_defaults(func=cmd_retime)

    v = sub.add_parser("validate", help="Structural checks: monotonic, no overlaps, within audio")
    v.add_argument("input", help="Path to .srt")
    v.add_argument("--audio", help="Optional audio path (checks cues don't run past its duration)")
    v.add_argument("--audio-dur", type=float, help="Optional audio duration in seconds (skips ffprobe)")
    v.set_defaults(func=cmd_validate)

    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    if args.command in ("transcribe", "retime"):
        reexec_in_venv()  # imports stable_whisper or re-execs into the managed venv
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
