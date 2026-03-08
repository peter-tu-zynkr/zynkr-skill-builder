# Zynkr Skill Directory — Deploy Plan

**Domain:** zynkr.ai (GoDaddy)
**Platform:** Zeabur
**App root:** `frontend/` (Next.js)

---

## Pre-requisites (do once)

- [x] GitHub repo exists for this project
- [ ] Zeabur account (zeabur.com)
- [ ] GoDaddy access to zynkr.ai DNS settings

---

## Phase 1 — Push to GitHub

- [x] Git repo initialized at `zynkr-skill-directory/` root
- [x] GitHub remote configured
- [ ] Push current code to `main`
- [ ] Confirm `frontend/`, `backend/`, `database/`, and `deploy/` appear on GitHub

---

## Phase 2 — Deploy Frontend on Zeabur

- [ ] Log in to Zeabur → Create a new **Project**
- [ ] Add a new **Service** → choose "GitHub" → select the repo
- [ ] In service settings, set **Root Directory** to `frontend`
- [ ] Zeabur auto-detects Next.js and runs `npm run build`
- [ ] Confirm the build passes and the app loads on the temporary `.zeabur.app` URL
- [ ] Note down the Zeabur-assigned hostname (e.g. `zynkr-xxxx.zeabur.app`)

---

## Phase 3 — Connect zynkr.ai Domain

### In Zeabur
- [ ] Go to the service → **Domain** tab
- [ ] Click "Add Custom Domain" → enter `zynkr.ai`
- [ ] Zeabur will show you a target hostname (CNAME value) — copy it

### In GoDaddy
- [ ] Log in → DNS Management for `zynkr.ai`
- [ ] **Remove or update** any existing A record on `@` (root)
- [ ] Add a new record:
  - Type: `CNAME`
  - Name: `@` (or use `www` if GoDaddy doesn't allow CNAME on root — see note)
  - Value: ← paste Zeabur hostname
  - TTL: 1 hour
- [ ] If GoDaddy blocks CNAME on root `@`, use their **Domain Forwarding** or add a `www` CNAME + redirect `@` → `www`

### Back in Zeabur
- [ ] Click "Verify" — DNS propagation can take 5–30 min
- [ ] Zeabur auto-provisions SSL (Let's Encrypt) once DNS resolves
- [ ] Test: visit https://zynkr.ai → should load the skill directory

---

## Phase 4 — Environment & Config

- [ ] In Zeabur service settings → **Environment Variables**
  - Add `NODE_ENV=production`
  - (Future) add backend env vars when the backend service is deployed
- [ ] Confirm no `.env` files are committed to GitHub

---

## Phase 5 — Continuous Deployment

- [ ] Every push to `main` automatically re-deploys on Zeabur (default behavior)
- [ ] Consider protecting `main` with branch rules and using `dev` branch for WIP

---

## Notes

- **Zeabur root directory bug:** if auto-detection fails, manually set build command to `npm run build` and output to `.next` inside Zeabur settings
- **GoDaddy CNAME on root:** Some registrars don't allow CNAME on `@`. If blocked, an alternative is to transfer DNS management to Cloudflare (free) which supports CNAME flattening on root
- **www redirect:** Add `www` CNAME pointing to the same Zeabur hostname so both `zynkr.ai` and `www.zynkr.ai` work

---

## Future: Adding BE Service

When the backend needs to be deployed, add a second Zeabur service in the same project pointing to `backend/`.
