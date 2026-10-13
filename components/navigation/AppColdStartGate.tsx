import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  router,
  useGlobalSearchParams,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import { hydrateAuthSession } from "../../lib/userSessionStorage";
import {
  GUEST_MAP_ENTRY_HREF,
  resolveGuestColdStartRedirect,
} from "../../lib/appLaunchRouting";
import { theme } from "../../lib/theme";

type AppColdStartGateProps = {
  children: React.ReactNode;
};

/**
 * Ensures logged-out cold launches land on Map instead of a persisted /login route.
 * Waits for navigation + session hydration before rendering auth stack routes.
 */
export function AppColdStartGate({ children }: AppColdStartGateProps) {
  const segments = useSegments();
  const params = useGlobalSearchParams();
  const navigationState = useRootNavigationState();
  const [ready, setReady] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!navigationState?.key) return;

    let cancelled = false;

    void (async () => {
      const session = await hydrateAuthSession();
      if (cancelled) return;

      const rootSegment = segments[0];
      const hasAuthIntent = Boolean(
        params.returnTo || params.profileId || params.serverListingId
      );
      if (!session && !redirectedRef.current) {
        const redirectHref = resolveGuestColdStartRedirect(
          rootSegment,
          hasAuthIntent ? { kind: "returnTo", path: String(params.returnTo || "") } : { kind: "none" }
        );
        if (redirectHref) {
          redirectedRef.current = true;
          router.replace(redirectHref);
        }
      }

      if (!cancelled) {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigationState?.key, segments]);

  if (!navigationState?.key || !ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.ivory,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.turquoise} />
      </View>
    );
  }

  return <>{children}</>;
}
