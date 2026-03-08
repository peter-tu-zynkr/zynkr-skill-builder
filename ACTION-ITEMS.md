# Action Items

This is the canonical project task list as of March 8, 2026.

## Current State Snapshot

- [x] Frontend scaffold exists in `front-end/`
- [x] Home page, category pages, project pages, and skill detail pages are implemented
- [x] Static data lives in `front-end/lib/skills-data.ts`
- [x] Taxonomy lives in `front-end/lib/taxonomy.ts`
- [x] Backend scaffold exists in `back-end/` with `GET /health`, `GET /skills`, `GET /skills/:id`, and `GET /categories`
- [x] CSV fallback source exists via `assistant-index.csv`
- [ ] Frontend is still using static imports instead of the backend API
- [ ] Google Sheets mode is scaffolded but not configured
- [ ] Deployment to Zeabur is not yet verified in docs

## Frontend

- [ ] Add real `link` URLs for each subagent in `front-end/lib/skills-data.ts`
- [ ] Decide whether to keep or remove unused catalog-era files such as `front-end/app/catalog-client.tsx`, `front-end/components/CategoryFilter.tsx`, and `front-end/components/SearchBar.tsx`
- [ ] Add global navigation or shared header/footer instead of repeating top-nav markup in route pages
- [ ] Decide whether the browser tab icon should use the final brand asset instead of the temporary recreated SVG in `front-end/app/icon.svg`

## Taxonomy And Data Model

- [ ] Document the current 4-level structure clearly: Category → Project → Subagent, plus how "Skill" should be interpreted in product copy
- [ ] Decide whether "Skill" should become an explicit first-class entity in the data model or remain equivalent to a project/workflow
- [ ] Add a `docLink` field to the frontend/backend `Skill` model for Google Drive prompt docs
- [ ] Confirm that all `project` slugs in `front-end/lib/skills-data.ts` map cleanly to `front-end/lib/taxonomy.ts`

## Backend

- [x] `back-end/.env.example` exists for local setup
- [ ] Confirm whether the final folder name should stay `back-end/` or be renamed to `backend/`
- [ ] Decide the initial production data source: local CSV fallback or live Google Sheets
- [ ] Verify backend normalization against the real source sheet once headers are finalized
- [ ] Wire the frontend to the backend API after the backend data contract is stable

## Google Sheets Integration

- [ ] Provide the Google Sheet link
- [ ] Confirm the exact sheet tab name
- [ ] Confirm the real header row
- [ ] Confirm canonical column names for the backend skill contract
- [ ] Create or confirm the Google Cloud project used for Sheets access
- [ ] Enable Google Sheets API
- [ ] Create a service account for backend read access
- [ ] Share the sheet with the service account email as a viewer
- [ ] Add `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_RANGE`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` to backend env
- [ ] Test backend reads in `DATA_SOURCE=google-sheets` mode

## Deploy To Zeabur

- [ ] Push repo changes to `main`
- [ ] Create the Zeabur project and connect the GitHub repo
- [ ] Set the frontend service root directory to `front-end`
- [ ] Confirm the frontend build passes and the `.zeabur.app` URL loads
- [ ] Add `NODE_ENV=production` in Zeabur environment variables
- [ ] Add custom domain `zynkr.ai` and copy the Zeabur CNAME target
- [ ] Update GoDaddy DNS to point to Zeabur
- [ ] Verify SSL and production routing for `https://zynkr.ai`

## Later

- [ ] Add a second Zeabur service pointing to `back-end/` when backend deployment is actually needed
- [ ] Add database schema and migration work under `database/` once Sheets-backed API is no longer enough
