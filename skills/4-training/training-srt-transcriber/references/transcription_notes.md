# Transcription notes

Reference for the `training-srt-transcriber` engine (`scripts/transcribe_srt.py`).

## Modes

| Mode | You have | It does | Timestamps from |
|---|---|---|---|
| `transcribe` | audio only | fresh Whisper speech-to-text | the audio (Whisper segmentation) |
| `retime` | audio + correct wording (wrong timing) | forced alignment of your words onto the audio | the audio (per-word DTW), your words untouched |

`retime` is the fix for "the `.srt` says the right things but the times are off" — e.g. an SRT re-used from a different take, or one whose later half degraded into round-number placeholder times. It reads only the *text* of a reference `.srt` (its timestamps are discarded) and re-derives clean timing.

## Model size trade-offs

| Model | Weights | Speed (CPU) | When |
|---|---|---|---|
| `small` | ~0.5 GB | fastest | quick drafts, clean audio |
| `medium` *(default)* | ~1.5 GB | ~1× realtime-ish for alignment | good default for Mandarin |
| `large-v3` | ~3 GB | slowest | hard audio, heavy accent/noise, max fidelity |

For **forced alignment** (`retime`) the model is teacher-forced through known tokens, so `medium` already tracks the text well; escalate to `large-v3` only if spot-checks show drift. For **transcription** (`transcribe`) larger models reduce word errors — but remember the wording gets cleaned downstream by `training-srt-optimizer`, so `medium` is usually enough.

## Device

- `--device cpu` (default) — always works, no GPU needed.
- `--device mps` — Apple Silicon GPU; faster, but some Whisper ops fall back to CPU. Set `PYTORCH_ENABLE_MPS_FALLBACK=1` if you hit an unsupported-op error.
- `--device cuda` — NVIDIA GPU.

## Dependency pins (why they exist)

The managed venv installs `torch numba>=0.60 llvmlite>=0.43 numpy>=1.26,<2.2 stable-ts`. Installing a bare `stable-ts` lets the resolver backtrack to `numba==0.53.1`, whose `llvmlite==0.36` refuses to build on Python ≥3.10 (`RuntimeError: only versions >=3.6,<3.10 are supported`). The lower bound on `numba`/`llvmlite` and the `numpy<2.2` cap keep resolution on a modern, Python-3.12-compatible set.

## Requirements

- `ffmpeg` on PATH (Whisper decodes audio through it).
- `uv` **or** a Python 3.12 interpreter to build the venv.
- ~2 GB disk for the venv + ~1.5 GB for the `medium` model cache (`~/.cache/whisper`).

## Validation

`validate` checks the produced SRT is monotonic, non-overlapping, has non-negative durations, and never runs past the audio's real length (via `ffprobe`). It does not judge wording — only timing structure.
