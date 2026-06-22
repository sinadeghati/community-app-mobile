# Railway architecture — audit & target state

**Audit date:** 2026-06-22  
**Status:** Production verified live. Staging service **already deployed** with isolated empty data. Mobile app was still pointing all environments at production — fixed in `lib/apiConfig.ts`.

> **Rule:** Do not use production for development or QA. Do not copy production data into staging without an explicit, sanitized restore plan.

---

## 1. Current state (audited)

### Production (unchanged — protected)

```
┌─────────────────────────────────────────────────────────────────┐
│  Mobile production builds (EXPO_PUBLIC_API_ENV=production)      │
│  Store / TestFlight / release channel                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Custom domain: api.korook.com                                  │
│  Railway service: community-app-backend-production              │
│  Default URL: community-app-backend-production.up.railway.app   │
│  Stack: Django + Django REST Framework                          │
│  Server header: railway-hikari                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL (production) — Railway-managed                      │
│  DATABASE_URL on production service only                        │
│  Live data: listings, users, media (do not modify from staging) │
└─────────────────────────────────────────────────────────────────┘
```

| Check | Result |
|-------|--------|
| `GET https://api.korook.com/api/listings/` | **200** — 2 live listings |
| `GET https://community-app-backend-production.up.railway.app/api/listings/` | **200** — same data |
| `GET /admin/` | **302** — Django admin present |
| `GET /api/health/` | **404** — no health route (optional to add later) |

**Production API base (canonical):** `https://api.korook.com/api`

---

### Staging (exists — separate backend + empty DB)

```
┌─────────────────────────────────────────────────────────────────┐
│  Mobile dev + staging builds                                    │
│  EXPO_PUBLIC_API_ENV=development | staging                      │
│  npm run start:dev | npm run start:staging                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Railway service: community-app-backend-staging                   │
│  URL: community-app-backend-staging.up.railway.app              │
│  Custom domain (optional, not configured yet):                  │
│    api-staging.korook.com                                       │
│  Stack: Django + DRF (same API shape as production)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL (staging) — separate Railway Postgres plugin        │
│  DATABASE_URL on staging service only                           │
│  Verified: GET /api/listings/ returns [] (not production data)  │
└─────────────────────────────────────────────────────────────────┘
```

| Check | Result |
|-------|--------|
| `GET https://community-app-backend-staging.up.railway.app/api/listings/` | **200** — `[]` (empty, not production) |
| `POST /api/accounts/login/` (empty body) | **400** — same API contract as production |
| `GET /admin/` | **302** — Django admin present |
| `https://api-staging.korook.com` | **DNS not configured** |

**Staging API base:** `https://community-app-backend-staging.up.railway.app/api`

---

## 2. Problem before this change

All three mobile environments (`development`, `staging`, `production`) pointed at:

```
https://api.korook.com/api   ← production only
```

Development and QA were hitting **live production data**.

---

## 3. Target state (implemented in mobile repo)

```
                    ┌──────────────────┐
                    │   PRODUCTION     │
                    │   main branch    │
                    │   EAS production │
                    └────────┬─────────┘
                             │
              EXPO_PUBLIC_API_ENV=production
                             │
                             ▼
                  https://api.korook.com/api
                             │
                             ▼
              community-app-backend-production
                             │
                             ▼
                    Production Postgres
                    (live user data)


     ┌────────────────────────────────────────────┐
     │  DEVELOPMENT + STAGING (develop branch)  │
     │  npm run start:dev / start:staging       │
     │  EAS development + staging profiles      │
     └────────────────────┬─────────────────────┘
                          │
        EXPO_PUBLIC_API_ENV=development | staging
                          │
                          ▼
   https://community-app-backend-staging.up.railway.app/api
                          │
                          ▼
              community-app-backend-staging
                          │
                          ▼
                    Staging Postgres
                    (test accounts only)
```

| Build type | Branch (typical) | API env var | API base URL |
|------------|------------------|-------------|--------------|
| Local dev / Cursor | `develop` | `development` | Staging Railway URL |
| QA / device testing | `develop` | `staging` | Staging Railway URL |
| App Store / production | `main` | `production` | `api.korook.com` |

---

## 4. Railway dashboard checklist (manual — no production changes)

Confirm in [Railway dashboard](https://railway.app):

### Production project/service (read-only audit)

- [ ] Service name: `community-app-backend-production`
- [ ] Custom domain: `api.korook.com` → production service
- [ ] Postgres plugin attached — note as **production DB** (do not run staging migrations here)
- [ ] Export env var **names** (not values) for staging parity — see [RAILWAY_ENV_VARS.md](./RAILWAY_ENV_VARS.md)

### Staging project/service (verify isolation)

- [ ] Service name: `community-app-backend-staging`
- [ ] **Separate** Postgres plugin — `DATABASE_URL` must differ from production
- [ ] Deploy source: same backend repo, `develop` or `staging` branch (recommended)
- [ ] `ALLOWED_HOSTS` includes `community-app-backend-staging.up.railway.app`
- [ ] `SECRET_KEY` is **not** the production value
- [ ] Migrations run on staging DB only: `railway run python manage.py migrate` (linked to staging)
- [ ] Optional: CNAME `api-staging.korook.com` → staging Railway hostname

### What we did **not** do (by design)

- No production deploys
- No production DB reads/writes
- No `pg_dump` / restore from production
- No Railway env var changes from this repo (dashboard/CLI only)

---

## 5. Verification commands (read-only)

From repo root:

```powershell
.\scripts\verify-api-environments.ps1
```

Expected:

- Production listings count ≥ 1 (live data)
- Staging listings count = 0 (or test-only data you created on staging)
- Production and staging listing counts **must not match** unless you intentionally copied data

---

## Related docs

- [RAILWAY_ENV_VARS.md](./RAILWAY_ENV_VARS.md) — variable names and per-environment values
- [RAILWAY_STAGING_SETUP.md](./RAILWAY_STAGING_SETUP.md) — step-by-step Railway setup / hardening
- [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md) — branch and release process
- [PROJECT_LOCKDOWN.md](./PROJECT_LOCKDOWN.md) — backup and rollback
