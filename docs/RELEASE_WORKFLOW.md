# Release workflow

Professional release process for IranianApp / PersianMap mobile — modeled after production apps (Instagram, Uber, Airbnb).

**Goal:** No feature, fix, UI change, routing change, or refactor reaches production users without passing development and staging validation.

---

## Environments

| Environment | Branch (typical) | API / config | Who uses it |
|-------------|------------------|--------------|-------------|
| **Development** | `develop` | `EXPO_PUBLIC_API_ENV=development` or `.env` override | Engineers, Cursor, experiments |
| **Staging** | `develop` or `release/*` | `EXPO_PUBLIC_API_ENV=staging` — mirrors production settings | QA, device testing, UAT |
| **Production** | `main` | `EXPO_PUBLIC_API_ENV=production` | End users only |

### Mobile commands

```bash
npm run start:dev          # development (default for new work)
npm run start:staging      # staging validation
npm run start:production   # production API — smoke tests only, not feature dev
```

Copy `.env.example` → `.env` for local overrides. Restart Expo after changes.

Backend staging must use a **separate** database and secrets from production. See `docs/PROJECT_LOCKDOWN.md`.

---

## Branch strategy

```
main      ← production releases only (protected)
develop   ← all active development
```

Optional short-lived branches:

- `feature/<name>` — branched from `develop`, merged back to `develop`
- `release/<version>` — cut from `develop` for final staging soak before `main`

### Rules

1. **Never** commit new work directly to `main`.
2. `main` must always build and match the last approved store / OTA release.
3. Hotfixes: branch from `main` → fix → staging verify → merge to `main` **and** back-merge to `develop`.

---

## Release pipeline

```
Feature request
      ↓
develop branch (implementation)
      ↓
Internal testing (development build)
      ↓
Staging validation (staging API + device QA)
      ↓
Regression checklist (docs/REGRESSION_CHECKLIST.md)
      ↓
Approval
      ↓
Merge develop → main
      ↓
Production release (build + deploy)
```

If regression fails at any step: **stop**, fix on `develop`, re-validate. Do not merge to `main`.

---

## Cursor / agent rules

When using Cursor on this repo:

1. Check out `develop` before making changes.
2. Do not modify production routes or production deploy config without explicit review.
3. Before commit: list changed files and affected screens.
4. Before merge to `main`: complete the regression checklist.
5. Flag routing and cache changes for extra review.

Project rules live in `.cursor/rules/`.

---

## Merge to `main` checklist (summary)

- [ ] All work merged to `develop` and tested
- [ ] Staging build tested on real devices
- [ ] `docs/REGRESSION_CHECKLIST.md` completed — all items pass
- [ ] No known P0/P1 bugs
- [ ] Release notes drafted
- [ ] Backend / DB migrations (if any) applied to staging first
- [ ] Production backup taken (if backend deploy accompanies mobile release)

---

## GitHub setup (recommended)

1. Set default branch to `develop` for day-to-day PRs (optional).
2. Protect `main`:
   - Require PR reviews
   - Require status checks (lint / CI when added)
   - Disallow direct pushes
3. Use PR template: `.github/pull_request_template.md`

---

## Philosophy

Users receive only tested, stable updates. Production stays usable while major features (Events, Messaging, Ticketing, Payments, Premium Memberships, Business Tools) are built on `develop`.

**Development** = experiment. **Staging** = validate. **Production** = protect.
