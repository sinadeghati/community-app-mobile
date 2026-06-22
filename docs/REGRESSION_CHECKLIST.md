# Regression test checklist

Complete this checklist **before every merge from `develop` to `main`**.

Tester: _______________  
Date: _______________  
Build / branch: _______________  
Environment: **staging** (`npm run start:staging`)

Mark each item **Pass** or **Fail**. Any **Fail** blocks the release — fix on `develop` and re-test.

---

## Auth & account

| # | Flow | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| 1 | Login | ☐ | ☐ | |
| 2 | Logout | ☐ | ☐ | |
| 3 | Profile (user profile tab) | ☐ | ☐ | |

---

## Business ownership

| # | Flow | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| 4 | My Businesses list loads | ☐ | ☐ | |
| 5 | Create Business | ☐ | ☐ | |
| 6 | Edit Business (save persists) | ☐ | ☐ | |
| 7 | Delete Business (removed from lists/map) | ☐ | ☐ | |

---

## Discovery & profile

| # | Flow | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| 8 | Map markers (correct businesses, no deleted/stale) | ☐ | ☐ | |
| 9 | Business Profile V2 (`/profile/v2`) | ☐ | ☐ | |
| 10 | Favorites add / remove / list | ☐ | ☐ | |
| 11 | Gallery view & owner add photo | ☐ | ☐ | |
| 12 | Search | ☐ | ☐ | |
| 13 | Categories / filters | ☐ | ☐ | |

---

## Events & navigation

| # | Flow | Pass | Fail | Notes |
|---|------|:----:|:----:|-------|
| 14 | Events (existing flows — no regression) | ☐ | ☐ | |
| 15 | Routing (all entry points → correct screens) | ☐ | ☐ | |
| 16 | Navigation (tabs, back, deep links) | ☐ | ☐ | |
| 17 | Data refresh (pull/focus/reload — no stale cache) | ☐ | ☐ | |

---

## Routing spot-checks

Verify these open **Business Profile V2** (`/profile/v2`), not legacy routes:

- [ ] Map business preview / details
- [ ] Explore business card
- [ ] Favorites business card
- [ ] My Businesses row tap

---

## Cache spot-checks

- [ ] Deleted business does not appear on Map after refresh
- [ ] No stale profile flash when switching between businesses
- [ ] Discover listings refresh after delete / create

---

## Sign-off

| Role | Name | Date | Approved |
|------|------|------|:--------:|
| Developer | | | ☐ |
| QA / tester | | | ☐ |
| Release owner | | | ☐ |

**Merge to `main`:** ☐ Approved — all items pass  
**Blocked:** ☐ — failures documented below

### Failure log

```
(item #, description, repro steps, fix PR/commit)
```
