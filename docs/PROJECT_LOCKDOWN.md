# Project Lockdown — Production, Staging, Backup & Release

**Rule:** Do not test new features against production. Use **development** for experiments and **staging** for QA before any merge to `main`.

**Release workflow:** [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md) · **Regression checklist:** [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

This document covers production inventory, backup/restore, staging setup, mobile environment switching, and release/rollback checklists.

---

## 1. Current production setup

### Backend service (Railway)

| Item | Value |
|------|--------|
| Platform | [Railway](https://railway.app) |
| Service name | `community-app-backend-production` (inferred from URL) |
| Public API host | `api.korook.com` |
| API base path | `/api` |
| Full API URL | `https://api.korook.com/api` |
| Source repo | Backend is separate from mobile — confirm in Railway dashboard → service → Settings → Source |

### Production database (Railway Postgres)

| Item | Notes |
|------|--------|
| Type | Railway-managed PostgreSQL (attached to backend service) |
| Connection | `DATABASE_URL` env var on the **production** Railway service (never commit this) |
| Access | Railway dashboard → project → Postgres plugin → **Connect** / **Variables** |

> **We do not document or store live credentials here.** Copy `DATABASE_URL` from Railway only when running a backup locally.

### Production API endpoints (mobile uses today)

| Endpoint | Path |
|----------|------|
| Login | `POST /api/accounts/login/` |
| Register | `POST /api/accounts/register/` |
| Profile | `GET /api/accounts/profile/` |
| Listings | `GET /api/listings/` |
| Token refresh | `POST /api/accounts/token/refresh/` or `/api/token/refresh/` |

### Mobile API config

| Item | Location |
|------|----------|
| Central config | `lib/apiConfig.ts` |
| Axios client | `lib/api.ts` → `API_BASE_URL` from `apiConfig` |
| Env override | `EXPO_PUBLIC_API_ENV` or `EXPO_PUBLIC_API_BASE_URL` in `.env` |
| Default | **production** if no env file is set |

Hardcoded production URLs were removed from `lib/api.ts`, `app/(tabs)/profile.tsx`, and `app/listing/[id].tsx` in favor of `apiConfig`.

---

## 2. Production backup plan

### What to backup

- **PostgreSQL** (users, listings, events, auth tables) — critical
- **Railway service env vars** (export/screenshot from dashboard — no secrets in git)
- **Media/uploads** (if stored on S3/Railway volume — confirm backend storage settings)

### How to backup Railway Postgres

**Option A — Railway dashboard (scheduled / manual)**

1. Railway → project → **Postgres** service
2. **Backups** tab → enable automated backups if available on your plan
3. For manual snapshot: use **Backup** / export if offered on your tier

**Option B — `pg_dump` (recommended for full control)**

Prerequisites: `pg_dump` installed locally ([PostgreSQL client tools](https://www.postgresql.org/download/)).

```bash
# Get DATABASE_URL from Railway → Postgres → Variables (do not commit)
export DATABASE_URL="postgresql://USER:PASS@HOST:PORT/railway"

# Custom-format dump (restorable with pg_restore)
mkdir -p backups
pg_dump "$DATABASE_URL" -Fc -f "backups/production-$(date +%Y%m%d-%H%M%S).dump"

# Or plain SQL
pg_dump "$DATABASE_URL" -f "backups/production-$(date +%Y%m%d-%H%M%S).sql"
```

**Option C — Railway CLI**

```bash
npm i -g @railway/cli
railway login
railway link   # select production project
railway run pg_dump "$DATABASE_URL" -Fc -f backups/production.dump
```

### Where to store backups

| Store | Use |
|-------|-----|
| Encrypted local disk | `backups/` (gitignored — see `.gitignore`) |
| Private cloud (S3, Google Drive, OneDrive) | Off-site copy; encrypt at rest |
| Password manager / vault | Store `DATABASE_URL` reference only, not in repo |

**Never commit** `.dump`, `.sql`, or `.env` files.

### Restore procedure (production — use only in emergency)

1. **Stop** or scale down the backend service to avoid writes during restore
2. Create a **new** Postgres database OR wipe staging first and practice there
3. Restore:

```bash
# Custom format
pg_restore -d "$DATABASE_URL" --clean --if-exists backups/production-YYYYMMDD.dump

# Plain SQL
psql "$DATABASE_URL" -f backups/production-YYYYMMDD.sql
```

4. Redeploy backend service
5. Smoke-test: login, profile, one listing, ownership check
6. Document incident and what was lost since last backup

> **Practice restore on staging first.** Never run restore against production without a written rollback plan.

### Backup cadence (recommended)

| When | Action |
|------|--------|
| Before every production deploy | Manual `pg_dump` |
| Weekly | Automated Railway backup or scheduled `pg_dump` to secure storage |
| Before schema migrations | Full dump + verify restore on staging |

---

## 3. Staging setup (design)

Create a **separate Railway project or environment** — never point staging code at production `DATABASE_URL`.

### Staging backend service

| Item | Recommended value |
|------|-------------------|
| Service name | `community-app-backend-staging` |
| Public URL | `https://community-app-backend-staging.up.railway.app` |
| API base | `https://community-app-backend-staging.up.railway.app/api` |
| Branch deploy | `staging` branch from backend repo (or manual deploy from `main` tag) |

### Staging Postgres

1. Railway → **New** → **Database** → **PostgreSQL** (dedicated to staging)
2. Attach to staging backend via `DATABASE_URL`
3. **Do not** copy production data unless sanitized; for beta testing, empty DB + test accounts is fine
4. Optional: restore a production dump to staging for realistic QA (scrub PII if needed)

### Staging environment variables (backend)

Set on the **staging** Railway service only:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | From **staging** Postgres plugin |
| `SECRET_KEY` | New random key — not production |
| `DEBUG` | `True` acceptable on staging only |
| `ALLOWED_HOSTS` | `community-app-backend-staging.up.railway.app`, `api-staging.korook.com` (if used) |
| `CORS_ALLOWED_ORIGINS` | Staging mobile / Expo dev origins if required |
| `DJANGO_SETTINGS_MODULE` | Same as production unless you add `settings_staging.py` |

Copy structure from production; **rotate all secrets**.

### Staging API URL (mobile)

Defined in `lib/apiConfig.ts`:

```
https://community-app-backend-staging.up.railway.app/api
```

Optional custom domain when DNS is ready: `https://api-staging.korook.com/api`

### Staging verification

```bash
npm run verify:api
# or
curl -s https://community-app-backend-staging.up.railway.app/api/listings/
# Expect [] or staging-only test data — not production listings
```

---

## 4. Mobile environment switch

### Configuration files

| File | Purpose |
|------|---------|
| `lib/apiConfig.ts` | Built-in production + staging URLs |
| `.env` | Local overrides (gitignored) |
| `.env.example` | Template — safe to commit |

### Run against **production** (default — avoid for feature dev)

```bash
cp .env.example .env
# EXPO_PUBLIC_API_ENV=production
npm run start:production
```

### Run against **staging** (use for all new feature QA)

```bash
# .env
EXPO_PUBLIC_API_ENV=staging
npm run start:staging
```

### Override with a custom URL (e.g. local backend)

```bash
# .env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000/api
npx expo start
```

**Important:** Restart Expo after changing `.env`. `EXPO_PUBLIC_*` vars are baked in at bundle time.

### Confirm active API in dev

Add temporarily to any screen or check Metro logs — `API_BASE_URL` from `lib/apiConfig` resolves at startup.

---

## 5. Release checklist

Complete on **staging** first. Only then deploy production backend + ship mobile build.

### Staging QA (required)

- [ ] Mobile points to staging (`EXPO_PUBLIC_API_ENV=staging`)
- [ ] Register new test account
- [ ] Login / logout / login again
- [ ] Profile loads without placeholder flash
- [ ] Create business
- [ ] **My Businesses** shows only current user's businesses (ownership isolation)
- [ ] Map loads, pan/zoom, Search This Area at metro zoom
- [ ] Explore search / categories
- [ ] Favorites save and persist
- [ ] Events create / view (if in scope)
- [ ] No crashes, no cross-user data leakage

### Production deploy (backend)

- [ ] `pg_dump` production backup completed and stored securely
- [ ] Deploy backend from reviewed commit/tag
- [ ] Run migrations if any
- [ ] Smoke-test production API (`/api/listings/`, login)

### Production deploy (mobile)

- [ ] Build with `EXPO_PUBLIC_API_ENV=production` (or default)
- [ ] TestFlight / internal build smoke test
- [ ] Release notes updated

### Post-deploy

- [ ] Monitor Railway logs for 30 minutes
- [ ] Verify login + profile + one business flow on production with a **non-test** account

---

## 6. Rollback checklist

### Revert last mobile commit

```bash
git log -3 --oneline
git revert HEAD          # preferred — keeps history
# or
git reset --hard HEAD~1  # destructive — only if not pushed
git push origin main
```

### Revert last backend deploy (Railway)

1. Railway → backend service → **Deployments**
2. Select last known-good deployment → **Redeploy** / **Rollback**
3. If migrations ran: may need DB rollback or forward-fix — restore from backup if schema broke

### Redeploy previous mobile version

- EAS / TestFlight: promote previous build or rebuild from git tag
- Expo Go dev: `git checkout <tag>` and `npx expo start`

### Restore database backup

1. Scale down backend (stop writes)
2. Restore dump to Postgres (see §2)
3. Redeploy backend at matching code version
4. Verify auth, listings, ownership
5. Post-mortem: what failed, backup age, data loss window

---

## Quick reference

| Environment | API base URL | Railway service |
|-------------|--------------|-----------------|
| **Production** | `https://api.korook.com/api` | `community-app-backend-production` |
| **Staging** | `https://community-app-backend-staging.up.railway.app/api` | `community-app-backend-staging` |

| Action | Command |
|--------|---------|
| Dev / Cursor (staging API) | `npm run start:dev` |
| QA on staging | `npm run start:staging` |
| Production smoke test only | `npm run start:production` |
| Verify API isolation | `npm run verify:api` |
| Backup DB | `pg_dump "$DATABASE_URL" -Fc -f backups/production-$(date +%Y%m%d).dump` |

**Architecture:** [RAILWAY_ARCHITECTURE.md](./RAILWAY_ARCHITECTURE.md) · **Env vars:** [RAILWAY_ENV_VARS.md](./RAILWAY_ENV_VARS.md) · **Staging setup:** [RAILWAY_STAGING_SETUP.md](./RAILWAY_STAGING_SETUP.md)

---

*Last updated: Railway audit 2026-06-22. Staging service verified live with isolated empty DB.*
