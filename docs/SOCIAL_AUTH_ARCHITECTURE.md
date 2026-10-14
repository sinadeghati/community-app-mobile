# Mobile auth architecture (with social login)

See backend `docs/SOCIAL_AUTH_ARCHITECTURE.md` in the Django repo for JWT and account endpoints.

## Session

- Tokens in `app/utils/authStorage.ts` (SecureStore).
- Hydration: `lib/userSessionStorage.ts`, refresh: `lib/authSession.ts`.
- Post-login navigation: `lib/postAuthNavigation.ts` (claim intent, Explore default).
- Guest cold start: `app/index.tsx` → `/(tabs)/map`.

## Social login (this feature)

| Layer | File |
|-------|------|
| Public client IDs | `lib/oauthPublicConfig.ts` |
| Native providers | `lib/socialAuth.ts` |
| UI | `components/auth/SocialSignInButtons.tsx` |
| Token → session | `lib/completeSocialLogin.ts` |
| API | `lib/api.ts` → `/accounts/auth/google/`, `/accounts/auth/apple/` |
| Profile link/unlink | `app/profile/connected-accounts.tsx` |

Provider **secrets never** go in `EXPO_PUBLIC_*`. Mobile sends only ID tokens to Korook staging over HTTPS.

## Development build

`@react-native-google-signin/google-signin` and `expo-apple-authentication` require a **custom EAS/dev client** — not Expo Go. See `docs/SOCIAL_AUTH_STAGING_SETUP.md` in the backend repo.
