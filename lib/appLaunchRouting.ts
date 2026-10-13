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
): string | null => {
  if (intent.kind !== "none") return null;
  if (!rootSegment || !AUTH_ONLY_ROOT_SEGMENTS.has(rootSegment)) return null;
  return GUEST_MAP_ENTRY_HREF;
};

export const isAuthOnlyRootSegment = (segment: string | undefined) =>
  Boolean(segment && AUTH_ONLY_ROOT_SEGMENTS.has(segment));
