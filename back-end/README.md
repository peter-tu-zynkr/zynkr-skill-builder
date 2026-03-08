# Backend

This backend provides a normalized read API for the Zynkr skill directory.

## Goals

- Keep the frontend independent from raw CSV or Google Sheets structure
- Normalize source rows into one stable `Skill` contract
- Support a local CSV fallback while Google Sheets access is being configured

## Planned API

- `GET /health`
- `GET /skills`
- `GET /skills/:id`
- `GET /categories`

These routes are scaffolded in `src/routes.ts`.

## Data Sources

- `csv`: reads the local `assistant-index.csv`
- `google-sheets`: reads from Google Sheets API using a service account

Set `DATA_SOURCE=csv` for local development until the Google Sheets credentials are ready.

## Environment

Copy `.env.example` to `.env` and fill in the values you need.

Required for Google Sheets mode:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEET_RANGE`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

## Materials Needed From You

To switch from local CSV mode to live Google Sheets mode, I need:

- the Google Sheet link
- the exact tab name to read from
- confirmation on which row is the real header row
- a Google service account email, if you already created one
- the service account private key JSON or the specific env values extracted from it
- confirmation that the sheet has been shared with the service account as a viewer

If you do not have the Google Cloud side set up yet, I can guide that next.

## Notes

- The Google Sheet should keep one assistant per row.
- The backend expects stable header names and enum values.
- The frontend should eventually fetch this API instead of importing static data.
- The current implementation should be treated as a scaffold until the real source sheet is connected and validated.
