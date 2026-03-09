# Backend

This backend provides a normalized read API for the Zynkr skill directory.

## Goals

- Keep the frontend independent from raw source structure
- Normalize source rows into one stable `Skill` contract
- Read from generated content artifacts produced by the ingest pipeline
- Keep a temporary local CSV fallback during migration

## Planned API

- `GET /health`
- `GET /skills`
- `GET /skills/:id`
- `GET /categories`

These routes are scaffolded in `src/routes.ts`.

## Data Sources

- `generated-json`: reads `generated/skills.json` produced by `scripts/ingest.ts`
- `csv`: reads the local `assistant-index.csv` as a temporary source

The intended direction is:

`GitHub repo(s) -> scripts/ingest.ts -> content/skills/*.md + generated/skills.json -> backend API`

Important contract note:
- the canonical IPO transform now lives in `scripts/ingest.ts`
- backend should prefer serving normalized artifact fields directly
- backend should not become a second place that reinterprets `description` into `input/process/output`

## Environment

Copy `.env.example` to `.env` and fill in the values you need.

Current backend env:

- `PORT`
- `DATA_SOURCE`
- `GENERATED_JSON_PATH`
- `CSV_PATH`

## Notes

- `generated-json` is now the intended default provider.
- The CSV reader is transitional, not the target architecture.
- The long-term source of truth is repo-managed structured content, not runtime CSV parsing.
- The frontend should eventually fetch this API instead of importing static data.
- The backend contract is meant to stay stable while the source system evolves underneath it.
- Normalized records may include `ipoProvenance` and `legacyIpoId` to explain where IPO came from.
- Use `cd ../scripts && npm run check-ipo` when you need to verify generated IPO against the legacy CSV.
