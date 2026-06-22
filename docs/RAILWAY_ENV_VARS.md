# Railway environment variables

**Never commit secret values.** Copy from Railway dashboard → service → **Variables**.

---

## URL reference (exact)

| Environment | Public API base URL | Railway hostname |
|-------------|---------------------|------------------|
| **Production** | `https://api.korook.com/api` | `community-app-backend-production.up.railway.app` |
| **Staging** | `https://community-app-backend-staging.up.railway.app/api` | `community-app-backend-staging.up.railway.app` |
| **Staging (optional custom domain)** | `https://api-staging.korook.com/api` | CNAME → staging Railway hostname |

---

## Mobile app (Expo)

Set at build/start time. Baked into bundle — restart Expo after changes.

| Variable | Development | Staging QA | Production release |
|----------|-------------|------------|-------------------|
| `EXPO_PUBLIC_API_ENV` | `development` | `staging` | `production` |
| Resolved base URL | Staging Railway URL | Staging Railway URL | `https://api.korook.com/api` |
| npm script | `npm run start:dev` | `npm run start:staging` | `npm run start:production` |
| EAS profile | `development` | `staging` | `production` |

Optional override (any environment):

```bash
EXPO_PUBLIC_API_BASE_URL=https://community-app-backend-staging.up.railway.app/api
```

Config file: `lib/apiConfig.ts`

---

## Backend — production service

Service: `community-app-backend-production`  
Database: production Postgres (`DATABASE_URL` from **production** Postgres plugin)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | From production Postgres only |
| `SECRET_KEY` | Yes | Production Django secret — **do not reuse on staging** |
| `DJANGO_SETTINGS_MODULE` | Yes | e.g. `config.settings` (confirm in repo) |
| `ALLOWED_HOSTS` | Yes | Must include `api.korook.com`, `community-app-backend-production.up.railway.app` |
| `DEBUG` | No | `False` in production |
| `CORS_ALLOWED_ORIGINS` | If used | Production app origins only |
| `PORT` | Railway | Usually injected by Railway |

Media: listing images served from production host (e.g. `api.korook.com/media/...`).

---

## Backend — staging service

Service: `community-app-backend-staging`  
Database: staging Postgres (`DATABASE_URL` from **staging** Postgres plugin — must ≠ production)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | From **staging** Postgres only |
| `SECRET_KEY` | Yes | **New** random key — generate: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DJANGO_SETTINGS_MODULE` | Yes | Same module as production unless you add `settings_staging.py` |
| `ALLOWED_HOSTS` | Yes | `community-app-backend-staging.up.railway.app`, `api-staging.korook.com` (if DNS added) |
| `DEBUG` | Optional | `True` acceptable on staging only |
| `CORS_ALLOWED_ORIGINS` | If used | Expo dev, staging builds |
| `PORT` | Railway | Injected by Railway |

### Staging-only flags (recommended)

| Variable | Suggested value | Purpose |
|----------|-----------------|---------|
| `ENVIRONMENT` | `staging` | App-level guard in Django settings |
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` | Avoid sending real password emails during QA |

---

## Isolation rules

1. Production `DATABASE_URL` → production service **only**
2. Staging `DATABASE_URL` → staging service **only**
3. Never point staging at production Postgres
4. Never run experimental migrations against production first
5. Test accounts and seed data belong on staging only

---

## Quick verification

```powershell
# Production — expect live listing count
curl.exe -s "https://api.korook.com/api/listings/"

# Staging — expect [] or staging-only test data
curl.exe -s "https://community-app-backend-staging.up.railway.app/api/listings/"
```

If both return identical non-empty payloads, **stop** — databases are not isolated.
