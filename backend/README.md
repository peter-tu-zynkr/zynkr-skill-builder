# Backend

This backend provides a normalized read API for the Zynkr skill directory.

## Goals

- Keep the frontend independent from raw source structure
- Normalize source rows into one stable `Skill` contract
- Support a temporary local CSV fallback until repo-managed content ingestion is implemented

## Planned API

- `GET /health`
- `GET /skills`
- `GET /skills/:id`
- `GET /categories`

These routes are scaffolded in `src/routes.ts`.

## Data Sources

- `csv`: reads the local `assistant-index.csv` as a temporary source

The intended direction is to replace the CSV input with validated repo-managed content and a generated JSON artifact.

## Environment

Copy `.env.example` to `.env` and fill in the values you need.

Current backend env:

- `PORT`
- `DATA_SOURCE`
- `CSV_PATH`

## Notes

- The CSV reader is transitional, not the target architecture.
- The long-term source of truth should be repo-managed structured content.
- The frontend should eventually fetch this API instead of importing static data.
- The current implementation should be treated as a scaffold until the generated content artifact is connected and validated.
