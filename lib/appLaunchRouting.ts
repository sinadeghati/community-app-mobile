import { APP_INITIAL_TAB_ROUTE } from "./appTabConfig";

export const GUEST_MAP_ENTRY_HREF = `/(tabs)/${APP_INITIAL_TAB_ROUTE}` as const;

const AUTH_ONLY_ROOT_SEGMENTS = new Set([
  "login",
  "register",
  "forgot-password",
  "verify-email",
]);

export type ColdStartAuthIntent =
  | { kind: "none" }
  | { kind: "claim" }
  | { kind: "returnTo"; path: string };

export const resolveGuestColdStartRedirect = (
  rootSegment: string | undefined,
  intent: ColdStartAuthIntent
): typeof GUEST_MAP_ENTRY_HREF | null => {
  if (intent.kind !== "none") return null;
  if (!rootSegment || !AUTH_ONLY_ROOT_SEGMENTS.has(rootSegment)) return null;
  return GUEST_MAP_ENTRY_HREF;
};

export type GuestColdStartDecision = {
  /** True after the initial root segment has been observed. Later auth routes are intentional. */
  settled: boolean;
  redirectHref: typeof GUEST_MAP_ENTRY_HREF | null;
};

/**
 * Logged-out cold launch may replace a restored auth route with Map.
 * Once that initial route is known, in-app visits to login/register must stay put.
 */
export const evaluateGuestColdStart = (
  rootSegment: string | undefined,
  intent: ColdStartAuthIntent,
  alreadySettled: boolean
): GuestColdStartDecision => {
  if (alreadySettled || !rootSegment) {
    return { settled: alreadySettled, redirectHref: null };
  }

  return {
    settled: true,
    redirectHref: resolveGuestColdStartRedirect(rootSegment, intent),
  };
};

export const isAuthOnlyRootSegment = (segment: string | undefined) =>
  Boolean(segment && AUTH_ONLY_ROOT_SEGMENTS.has(segment));
