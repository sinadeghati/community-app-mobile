# Korook Brand Kit — Official Specification V1

Official brand system for the Korook Iranian Community Discovery Platform.

**Mission:** Korook helps users discover Persian-owned businesses, services, events, restaurants, professionals, and local community resources through a modern map-based experience.

## Brand personality

Modern · Trustworthy · Premium · Community driven · Clean · Minimal · Friendly · Discovery focused

## Logo system

| Element | Description |
|---------|-------------|
| Primary symbol | Map pin (location marker) |
| Inside symbol | Large capital **K** |
| Meaning | K = Korook; pin = discovery & location; grid = business network; micro-icons = local commerce |

**Style:** Flat modern vector. No 3D, realistic shadows, gloss, or skeuomorphism.

**Wordmark:** `KOROOK` — geometric sans (Montserrat SemiBold). All caps. **O** letters use turquoise accent `#18D3C5`.

**Tagline:** `DISCOVER. CONNECT. GROW.`

## Colors

| Role | Hex | Usage |
|------|-----|--------|
| Primary turquoise | `#18D3C5` | Pin mark, accent Os, highlights |
| Secondary turquoise | `#00C2B8` | CTAs, active states, gradient pair |
| Navy | `#0A1F44` | Headlines, wordmark (light bg) |
| Dark navy | `#071730` | Dark backgrounds, overlays |
| White | `#FFFFFF` | Cards, app icon background |
| Light gray | `#F5F7FA` | Screen backgrounds |

## Asset inventory

All files live in `assets/brand/korook/`.

### Vector (source of truth)

| File | Description |
|------|-------------|
| `logo-primary.svg` | Vertical lockup + tagline (transparent) |
| `logo-vertical.svg` | Pin above wordmark |
| `logo-horizontal.svg` | Pin left, wordmark right |
| `logo-dark.svg` | Lockup on light gray `#F5F7FA` |
| `logo-light.svg` | Lockup on dark navy `#071730` |
| `korook-pin-symbol.svg` | Icon only (pin + K) |
| `app-icon.svg` | 1024 app icon with Apple corner radius |
| `favicon.svg` | Pin + K only |

### Raster exports

| File | Description |
|------|-------------|
| `logo-primary.png` | Primary lockup @ 1280px wide |
| `logo-dark.png` | Light-background variant |
| `logo-light.png` | Dark-background variant |
| `logo-horizontal.png` | Horizontal lockup |
| `logo-vertical.png` | Vertical lockup |
| `transparent-logo.png` | Primary lockup, transparent bg |
| `korook-logo-primary.png` | Mobile app lockup (880px) |
| `app-icon-1024.png` | App Store / Play Store |
| `app-icon-512.png` | Medium app icon |
| `android-adaptive-foreground.svg` | Android adaptive launcher foreground (transparent pin) |
| `android-adaptive-foreground-1024.png` | Android adaptive launcher foreground export |
| `favicon-16.png` | 16x16 favicon |
| `favicon-32.png` | 32x32 favicon |
| `favicon-64.png` | 64x64 favicon |
| `favicon.ico` | Multi-size ICO |

Regenerate PNG/ICO from SVG: `npm run export:korook-brand`

## Usage rules

**Do use:** Store, restaurant, location pin, and service micro-icons inside the pin mark.

**Do not use:** Flags, government symbols, religious symbols, complex Persian patterns, crowded details.

**Do not:** Stretch, skew, or recolor the pin outside the approved palette.

## Header layouts

| Context | Layout |
|---------|--------|
| Desktop web | `[LOGO] KOROOK` |
| Mobile web | `[LOGO]` or `[LOGO] Korook` |

## App icon

- 1024x1024 PNG, white background
- Turquoise pin with white **K**
- Apple-standard corner radius (22.37%)
- No wordmark inside the icon

## Typography

- **Marketing / web:** Montserrat SemiBold (600–700)
- **Mobile:** System sans, weights 500–900
- **Hero titles:** 28px / 800
- **Section titles:** 20px / 800
- **Body:** 15px / 500

## Code reference

- Tokens: `lib/korookBrand.ts`
- Theme bridge: `lib/theme.ts`
- Components: `components/brand/KorookLogo.tsx`, `KorookHeroLogo.tsx`, `KorookStartupGate.tsx`
- Export script: `scripts/export-korook-brand.mjs`

## Legal

- Privacy Policy: `/legal/privacy-policy`
- Terms of Service: `/legal/terms-of-service`
- Contact: `/legal/contact-us`
