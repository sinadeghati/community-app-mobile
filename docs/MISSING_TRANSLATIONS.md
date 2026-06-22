# Missing translation report

Generated for Persian Language MVP (`locales/en.json` vs `locales/fa.json`).

## Catalog parity

All keys defined in `locales/en.json` have matching keys in `locales/fa.json` (0 missing FA keys).

Run audit in Node:

```bash
node -e "const {getMissingTranslationKeys,getExtraTranslationKeys}=require('./lib/i18n/translate.ts');"
```

Or import `getMissingTranslationKeys("en","fa")` from `lib/i18n` during development.

## Screens wired to i18n (MVP)

| Screen | Coverage |
|--------|----------|
| Tab bar (Home, Map, Explore, Favorites, Profile) | Full |
| Settings → Language (English / فارسی) | Full |
| Home (login overlay) | Core strings |
| Explore | Core sections + search + empty states |
| Map | Search bar + search-this-area |
| Favorites | Sections + search + empty states |
| Profile | Business + Account menu rows |
| Create Business | Title + main form labels |
| Edit Business | Title + main form labels |
| Create Event | Full form labels |
| Edit Event | Full form labels |
| Event Details | Details rows + actions + Buy Tickets |

## Not yet translated (intentional / follow-up)

These areas still render English hardcoded strings:

### Map (`app/(tabs)/map.tsx`)
- Category chips (from `QUICK_DISCOVERY_CATEGORY_CHIPS` labels)
- Event time filters (Today / This week / …)
- Nearby panel copy, empty states, business preview strings
- Alerts (location permission, delete confirmations)

### Explore (`app/(tabs)/explore.tsx`)
- Category chip labels (shared discovery catalog)
- Dynamic business/event content (API data)

### Profile (`app/(tabs)/profile.tsx`)
- Guest/login hero, stats labels (My Businesses / Favorites / Reviews)
- About section, verification flow, logout alerts
- Delete account block

### Home (`app/(tabs)/index.tsx`)
- Hero slide titles/subtitles (content from `homeHeroData`)
- Logged-in welcome line

### Business forms
- `create-business.tsx`: alerts, category picker modal, Instagram/website placeholders, logo upload
- `edit-business.tsx`: offers/services modals, save alerts, gallery section

### Events
- `profile/events.tsx` list screen (My Events management)
- Success/error alerts on create/edit/delete
- `getBuyTicketsLabel` provider suffix stays English brand names (Eventbrite, Luma, …)

### Global / system
- Login, register, forgot-password screens
- Business profile v2 (`app/profile/v2.tsx`)
- Messages, gallery, account, privacy, about sub-screens
- Push notification copy
- API error messages from backend

## RTL notes

- Root `direction: rtl` applied when locale is `fa`
- `I18nManager.forceRTL` updated on language change
- Settings uses mirrored back chevron and `marginEnd` spacing
- Some legacy screens still use hardcoded `marginLeft` / `flexDirection: "row"` — visual polish pass recommended

## Testing checklist

- [ ] Profile → Settings → **English** → tab labels and Explore copy in English, LTR
- [ ] Profile → Settings → **فارسی** → tab labels and Explore copy in Persian, RTL
- [ ] Switch English → فارسی → English without restart (verify layout)
- [ ] Create Event form labels RTL in Persian
- [ ] Event Details Buy Tickets + Interested in both languages
- [ ] Create/Edit Business main labels in both languages
