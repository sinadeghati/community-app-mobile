# IranianApp / PersianMap Mobile

Expo 54 React Native app for the Iranian community discovery platform.

## Branch strategy

| Branch | Purpose |
|--------|---------|
| **`develop`** | All active development — **work here** |
| **`main`** | Production releases only — do not commit features directly |

See [docs/RELEASE_WORKFLOW.md](docs/RELEASE_WORKFLOW.md) and [docs/REGRESSION_CHECKLIST.md](docs/REGRESSION_CHECKLIST.md).

```bash
git checkout develop
```

## Quick start

```bash
npm install
git checkout develop
npm run start:dev        # development (default for Cursor / new work)
npm run start:staging    # QA — validate before release
npm run start:production # production API — smoke tests only
```

Copy `.env.example` to `.env` to customize `EXPO_PUBLIC_API_ENV` or `EXPO_PUBLIC_API_BASE_URL`. Restart Expo after changes.

## Environments

| Environment | API base URL | Command |
|-------------|--------------|---------|
| **Development** | `https://community-app-backend-staging.up.railway.app/api` | `npm run start:dev` |
| **Staging** | `https://community-app-backend-staging.up.railway.app/api` | `npm run start:staging` |
| **Production** | `https://api.korook.com/api` | `npm run start:production` |

Verify isolation: `npm run verify:api`

Config: `lib/apiConfig.ts`. Railway details: `docs/RAILWAY_ARCHITECTURE.md`.

## Project structure

- `app/` — Expo Router screens (tabs, profile, auth)
- `lib/api.ts` — Axios API client
- `lib/apiConfig.ts` — Environment-specific API URLs
- `.cursor/rules/` — Cursor agent release & routing policies
- `docs/` — Release workflow, regression checklist, lockdown

## Learn more

- [Expo documentation](https://docs.expo.dev/)
