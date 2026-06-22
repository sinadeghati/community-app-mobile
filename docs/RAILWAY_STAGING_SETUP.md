# Railway staging setup & hardening

Use this after reading [RAILWAY_ARCHITECTURE.md](./RAILWAY_ARCHITECTURE.md).

**Audit finding:** `community-app-backend-staging.up.railway.app` is already live with an **empty** listings table — separate from production. This guide completes formal isolation and optional custom domain.

---

## Prerequisites

- Railway account access
- Backend source repo (Django) linked to Railway
- DNS access for `korook.com` (optional custom staging domain)

Install Railway CLI (optional):

```bash
npm i -g @railway/cli
railway login
```

---

## Step 1 — Confirm production (read-only)

1. Open Railway → production project
2. Note services:
   - `community-app-backend-production` (web)
   - Postgres plugin (production DB)
3. Confirm custom domain `api.korook.com` on production service
4. **Do not** change production variables or redeploy for this task

---

## Step 2 — Verify staging isolation

1. Open Railway → staging project (or same project with separate staging service)
2. Confirm services:
   - `community-app-backend-staging` (web)
   - **Separate** Postgres plugin
3. Compare `DATABASE_URL` host between staging and production — **must differ**

```powershell
curl.exe -s "https://community-app-backend-staging.up.railway.app/api/listings/"
# Expected: [] until you seed staging test data
```

---

## Step 3 — Staging environment variables

On **staging service only**, set variables per [RAILWAY_ENV_VARS.md](./RAILWAY_ENV_VARS.md):

1. `DATABASE_URL` ← reference staging Postgres plugin
2. `SECRET_KEY` ← generate new (not production)
3. `ALLOWED_HOSTS` ← include `community-app-backend-staging.up.railway.app`
4. `DEBUG=True` (staging only)
5. `ENVIRONMENT=staging` (recommended)

Copy non-secret structure from production; rotate all secrets.

Redeploy staging service after variable changes.

---

## Step 4 — Run migrations on staging DB only

```bash
railway link          # select STAGING project/service
railway run python manage.py migrate
railway run python manage.py createsuperuser   # staging admin only
```

**Never** run `migrate` against production `DATABASE_URL` from a staging shell.

---

## Step 5 — Optional custom domain

1. Railway → staging service → **Settings** → **Networking** → **Custom Domain**
2. Add `api-staging.korook.com`
3. DNS: CNAME `api-staging` → `community-app-backend-staging.up.railway.app`
4. Add `api-staging.korook.com` to Django `ALLOWED_HOSTS`
5. Update `lib/apiConfig.ts` staging URL if you prefer the custom domain

---

## Step 6 — Branch deploy strategy

| Branch | Deploy target |
|--------|---------------|
| `main` | Production service |
| `develop` / `staging` | Staging service |

Configure in Railway → service → **Settings** → **Source** → branch.

---

## Step 7 — Seed staging test data (optional)

Create test users and businesses **on staging only**:

- Register via mobile with `npm run start:staging`
- Or Django admin on staging URL `/admin/`

**Do not** restore production `pg_dump` to staging without PII scrubbing and explicit approval.

---

## Step 8 — Mobile verification

```bash
git checkout develop
npm run start:dev        # → staging API
npm run start:staging    # → staging API
npm run start:production # → api.korook.com (smoke test only)
```

Run `.\scripts\verify-api-environments.ps1`

Complete [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md) on staging before any `develop` → `main` merge.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Staging returns production listings | Shared `DATABASE_URL` | Fix staging vars; redeploy |
| 400 DisallowedHost | Missing `ALLOWED_HOSTS` | Add Railway hostname |
| CORS errors from Expo | Staging CORS not configured | Add Expo dev origin to staging |
| Media URLs point at production | Django `MEDIA_URL` / storage config | Set staging-specific media config or accept cross-env media for QA |
