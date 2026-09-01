import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { theme } from "../../lib/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authStorage from "../utils/authStorage";
import {
  AUTH_SESSION_USER_CHANGED,
  invalidateAuthSession,
  isApiTokenInvalidResponse,
  logAuthEvent,
  resolveStoredAccessToken,
  shouldInvalidateStoredSession,
  tryRefreshStoredAccessToken,
} from "../../lib/authSession";
import {
  clearUserSession,
  getActiveUserId,
  hydrateAuthSession,
  loadMyBusinessesForProfile,
  loadUserProfile,
  adoptLegacyProfileIfMatching,
  mergeProfileWithApi,
  prepareSessionForUser,
  reconcileSessionBusinessCache,
  saveUserProfile,
} from "../../lib/userSessionStorage";
import * as ImagePicker from "expo-image-picker";
import { countCommunityEventsForOwner } from "../../lib/communityEvents";
import { countSavedFavorites } from "../../lib/favoritesCount";
import { FAVORITES_CHANGED_EVENT } from "../../lib/favoritesRefresh";
import { resolveProfileDisplayName } from "../../lib/profileDisplay";
import { apiUrl } from "../../lib/apiConfig";
import { confirmDeleteAccount } from "../../lib/accountActions";
import { showComingSoon } from "../profile/comingSoon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "../../lib/i18n";

const USER_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900";

const PROFILE_HYDRATION_TIMEOUT_MS = 5000;

type AuthHydrationState = "loading" | "authenticated" | "guest";
type MyBusinessesLoadState = "idle" | "loading" | "loaded" | "error";
type MyEventsLoadState = "idle" | "loading" | "loaded" | "error";

export default function ProfileV2Clean() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [authHydration, setAuthHydration] =
    useState<AuthHydrationState>("loading");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [localBusinesses, setLocalBusinesses] = useState<any[]>([]);
  const [myBusinessesLoadState, setMyBusinessesLoadState] =
    useState<MyBusinessesLoadState>("idle");
  const [myBusinessId, setMyBusinessId] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [myEventsCount, setMyEventsCount] = useState(0);
  const [myEventsLoadState, setMyEventsLoadState] =
    useState<MyEventsLoadState>("idle");
  const [profileIdentityLoading, setProfileIdentityLoading] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const activeAccountKeyRef = useRef<string | null>(null);
  const lastHydratedUserIdRef = useRef<string | null>(null);
  const hasCompletedInitialHydrationRef = useRef(false);
  const hydrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const profileDisplayName = resolveProfileDisplayName(profile);

  const handleDeleteAccount = () =>
    confirmDeleteAccount({
      title: t("account.deleteAccount"),
      message: t("account.deleteAccountConfirm"),
      cancelLabel: t("common.cancel"),
      confirmLabel: t("account.deleteAccount"),
      finalConfirmMessage: t("account.deleteAccountFinalConfirm"),
      successTitle: t("account.deleteAccountSuccessTitle"),
      successMessage: t("account.deleteAccountSuccessMessage"),
      unavailableTitle: t("account.deleteAccountUnavailableTitle"),
      unavailableMessage: t("account.deleteAccountUnavailableMessage"),
      errorTitle: t("account.deleteAccountErrorTitle"),
    });

  const loadLocalBusinesses = async (
    userId: string | null,
    identity?: { username?: string; email?: string }
  ) => {
    if (!userId) {
      setMyBusinessesLoadState("idle");
      setLocalBusinesses([]);
      return;
    }

    const accountKey = `${userId}:${String(identity?.username || "").toLowerCase()}:${String(identity?.email || "").toLowerCase()}`;
    if (activeAccountKeyRef.current !== accountKey) {
      activeAccountKeyRef.current = accountKey;
      setLocalBusinesses([]);
    }
    setMyBusinessesLoadState("loading");

    try {
      const filteredBusinesses = await loadMyBusinessesForProfile(
        userId,
        identity
      );

      setLocalBusinesses(filteredBusinesses);
      setMyBusinessesLoadState("loaded");
    } catch (error) {
      console.log("LOCAL BUSINESSES LOAD ERROR:", error);
      setMyBusinessesLoadState("error");
    }
  };

  const resetProfileState = () => {
    setProfile(null);
    setProfileImage(null);
    setLocalBusinesses([]);
    setMyBusinessesLoadState("idle");
    setMyBusinessId(null);
    setFavoritesCount(0);
    setMyEventsCount(0);
    setMyEventsLoadState("idle");
    setProfileIdentityLoading(false);
    setProfileLoadError(null);
    setAuthHydration("guest");
    activeAccountKeyRef.current = null;
    lastHydratedUserIdRef.current = null;
    hasCompletedInitialHydrationRef.current = false;
    if (hydrationTimeoutRef.current) {
      clearTimeout(hydrationTimeoutRef.current);
      hydrationTimeoutRef.current = null;
    }
  };

  const ensureUserSwitchReset = (userId: string) => {
    if (lastHydratedUserIdRef.current === userId) {
      return;
    }

    lastHydratedUserIdRef.current = userId;
    activeAccountKeyRef.current = null;
    setProfile(null);
    setProfileImage(null);
    setLocalBusinesses([]);
    setMyBusinessesLoadState("idle");
    setMyBusinessId(null);
    setMyEventsCount(0);
    setMyEventsLoadState("idle");
    setProfileLoadError(null);
  };

  const finishProfileHydration = () => {
    setProfileIdentityLoading(false);
    setAuthHydration("authenticated");
    if (hydrationTimeoutRef.current) {
      clearTimeout(hydrationTimeoutRef.current);
      hydrationTimeoutRef.current = null;
    }
  };

  const syncFavoritesCount = React.useCallback(async () => {
    try {
      setFavoritesCount(await countSavedFavorites());
    } catch {
      setFavoritesCount(0);
    }
  }, []);

  const syncMyEventsCount = React.useCallback(async (userId?: string | null) => {
    const resolvedUserId = userId ?? (await getActiveUserId());
    if (!resolvedUserId) {
      setMyEventsLoadState("idle");
      setMyEventsCount(0);
      return;
    }

    setMyEventsLoadState("loading");

    try {
      setMyEventsCount(await countCommunityEventsForOwner(resolvedUserId));
      setMyEventsLoadState("loaded");
    } catch {
      setMyEventsLoadState("error");
    }
  }, []);

  React.useEffect(() => {
    const favoritesSubscription = DeviceEventEmitter.addListener(
      FAVORITES_CHANGED_EVENT,
      () => {
        void syncFavoritesCount();
        void syncMyEventsCount();
      }
    );
    const sessionSubscription = DeviceEventEmitter.addListener(
      AUTH_SESSION_USER_CHANGED,
      ({ userId }: { userId?: string | null }) => {
        if (!userId) {
          resetProfileState();
          return;
        }
        ensureUserSwitchReset(userId);
      }
    );
    return () => {
      favoritesSubscription.remove();
      sessionSubscription.remove();
    };
  }, [syncFavoritesCount]);

  const identityFromProfile = (record: Record<string, unknown> | null) => ({
    username: String(record?.username || "").trim() || undefined,
    email: String(record?.email || "").trim() || undefined,
  });

  const updateProfileAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow photo access to update your profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const uri = result.assets[0].uri;
      setProfileImage(uri);

      const userId = await getActiveUserId();
      if (!userId) {
        return;
      }

      const identity = identityFromProfile(profile);
      const current =
        ((await loadUserProfile(userId, identity)) as Record<string, unknown> | null) ||
        ({
          ...(profile || {}),
          id: userId,
          user_id: userId,
        } as Record<string, unknown>);

      const updated = {
        ...current,
        profileImage: uri,
        profile_image: uri,
      };

      await saveUserProfile(userId, updated);
      setProfile(updated);
    } catch {
      Alert.alert("Error", "Could not update your profile photo.");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      const applyFallbackProfile = async (
        userId: string,
        identity: ReturnType<typeof identityFromProfile>,
        reason: string
      ) => {
        if (cancelled) return;

        const cached = (await loadUserProfile(userId, identity)) as Record<
          string,
          unknown
        > | null;

        if (cached && resolveProfileDisplayName(cached)) {
          setProfile(cached);
          setProfileImage(
            (cached.profileImage as string) ||
              (cached.profile_image as string) ||
              null
          );
          setProfileLoadError(null);
          return;
        }

        const fallback = {
          id: userId,
          user_id: userId,
          username: identity.username ?? `user_${userId}`,
          email: identity.email ?? "",
        };

        setProfile(fallback);
        setProfileLoadError(reason);
        await saveUserProfile(userId, fallback);
        logAuthEvent("profile_fallback_applied", { userId, reason });
      };

      const refreshProfileFromApi = async (
        session: Awaited<ReturnType<typeof hydrateAuthSession>>,
        userId: string,
        initialIdentity: ReturnType<typeof identityFromProfile>
      ) => {
        let identity = initialIdentity;

        try {
          const fetchProfile = async (accessToken: string) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              PROFILE_HYDRATION_TIMEOUT_MS
            );
            try {
              return await fetch(apiUrl("/accounts/profile/"), {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                signal: controller.signal,
              });
            } finally {
              clearTimeout(timeoutId);
            }
          };

          let access = String(session?.access || "").trim();
          if (!access) {
            const tokens = await authStorage.getTokens();
            access = String(tokens?.access || "").trim();
          }
          if (!access) {
            access = (await resolveStoredAccessToken()) ?? "";
          }

          if (!access) {
            logAuthEvent("profile_api_skipped_no_access_kept_cache", {
              userId,
            });
            await applyFallbackProfile(
              userId,
              identity,
              "Could not load profile. Pull to refresh or sign in again."
            );
            return;
          }

          let res = await fetchProfile(access);
          let data: Record<string, unknown> = {};

          try {
            data = (await res.json()) as Record<string, unknown>;
          } catch {
            data = {};
          }

          if (isApiTokenInvalidResponse(res.status, data)) {
            logAuthEvent("profile_api_token_invalid", { status: res.status });
            const refreshedAccess = await tryRefreshStoredAccessToken();
            if (refreshedAccess) {
              access = refreshedAccess;
              res = await fetchProfile(access);
              try {
                data = (await res.json()) as Record<string, unknown>;
              } catch {
                data = {};
              }
            }
          }

          identity = {
            username:
              String(data?.username || identity.username || "").trim() ||
              undefined,
            email:
              String(data?.email || identity.email || "").trim() || undefined,
          };

          if (!res.ok) {
            logAuthEvent("profile_api_error_kept_session", {
              status: res.status,
              code: data?.code ?? null,
            });

            if (isApiTokenInvalidResponse(res.status, data)) {
              if (await shouldInvalidateStoredSession()) {
                if (cancelled) return;
                await invalidateAuthSession(
                  "profile_api_token_invalid_after_refresh"
                );
                activeAccountKeyRef.current = null;
                setIsLoggedIn(false);
                resetProfileState();
                return;
              }

              if (cancelled) return;
              await applyFallbackProfile(
                userId,
                identity,
                "Session expired. Sign in again to refresh your profile."
              );
              void loadLocalBusinesses(userId, identity);
              void syncMyEventsCount(userId);
              return;
            }

            if (cancelled) return;
            await applyFallbackProfile(
              userId,
              identity,
              "Could not reach profile service. Showing saved details."
            );
            void loadLocalBusinesses(userId, identity);
            void syncMyEventsCount(userId);
            return;
          }

          await adoptLegacyProfileIfMatching(userId, identity);
          const cachedProfile = (await loadUserProfile(userId, identity)) as Record<
            string,
            unknown
          > | null;

          const mergedProfile = mergeProfileWithApi(cachedProfile, data);
          if (cancelled) return;

          setProfile(mergedProfile);
          setProfileImage(
            (mergedProfile.profileImage as string) ||
              (mergedProfile.profile_image as string) ||
              null
          );
          setProfileLoadError(null);
          await saveUserProfile(userId, mergedProfile);

          const resolvedIdentity = identityFromProfile(
            mergedProfile as Record<string, unknown>
          );
          try {
            await reconcileSessionBusinessCache(userId, resolvedIdentity);
          } catch (reconcileError) {
            logAuthEvent("reconcile_session_business_cache_profile_error", {
              error: String(reconcileError),
            });
          }
          void loadLocalBusinesses(userId, resolvedIdentity);
          void syncMyEventsCount(userId);

          if (data?.business_id) {
            setMyBusinessId(String(data.business_id));
          } else {
            setMyBusinessId(null);
          }
        } catch (e) {
          logAuthEvent("profile_load_error_kept_session", {
            error: String(e),
          });
          if (cancelled) return;
          await applyFallbackProfile(
            userId,
            identity,
            "Profile load failed. Showing offline details."
          );
          void loadLocalBusinesses(userId, identity);
          void syncMyEventsCount(userId);
        }
      };

      const armHydrationTimeout = (userId: string) => {
        if (hydrationTimeoutRef.current) {
          clearTimeout(hydrationTimeoutRef.current);
        }
        hydrationTimeoutRef.current = setTimeout(() => {
          if (cancelled) return;
          logAuthEvent("profile_hydration_timeout", { userId });
          finishProfileHydration();
          void applyFallbackProfile(
            userId,
            { username: undefined, email: undefined },
            "Profile is taking longer than expected. Showing basic details."
          );
        }, PROFILE_HYDRATION_TIMEOUT_MS);
      };

      const hydrateProfile = async () => {
        setProfileLoadError(null);

        if (hasCompletedInitialHydrationRef.current) {
          const session = await hydrateAuthSession();
          const userId = session?.userId || (await getActiveUserId());

          if (!userId) {
            if (cancelled) return;
            activeAccountKeyRef.current = null;
            setIsLoggedIn(false);
            resetProfileState();
            return;
          }

          if (cancelled) return;

          ensureUserSwitchReset(userId);
          armHydrationTimeout(userId);
          setIsLoggedIn(true);
          const cachedProfile = (await loadUserProfile(userId)) as Record<
            string,
            unknown
          > | null;
          const identity = identityFromProfile(cachedProfile);

          const hasCachedIdentity = Boolean(
            resolveProfileDisplayName(cachedProfile)
          );

          if (cachedProfile && hasCachedIdentity) {
            setProfile(cachedProfile);
            setProfileImage(
              (cachedProfile.profileImage as string) ||
                (cachedProfile.profile_image as string) ||
                null
            );
            finishProfileHydration();
            void loadLocalBusinesses(userId, identity);
            void syncMyEventsCount(userId);
            void syncFavoritesCount();
            void refreshProfileFromApi(session, userId, identity);
            return;
          }

          setProfileIdentityLoading(true);
          try {
            await refreshProfileFromApi(session, userId, identity);
            if (cancelled) return;
            void syncFavoritesCount();
            void syncMyEventsCount();
          } finally {
            if (!cancelled) {
              finishProfileHydration();
            }
          }
          return;
        }

        setAuthHydration("loading");

        const session = await hydrateAuthSession();
        const userId = session?.userId || (await getActiveUserId());

        if (!userId) {
          if (cancelled) return;
          activeAccountKeyRef.current = null;
          setIsLoggedIn(false);
          resetProfileState();
          return;
        }

        if (cancelled) return;

        ensureUserSwitchReset(userId);
        armHydrationTimeout(userId);
        setIsLoggedIn(true);

        try {
          await prepareSessionForUser(userId);

          const cachedProfile = (await loadUserProfile(userId)) as Record<
            string,
            unknown
          > | null;
          const identity = identityFromProfile(cachedProfile);

          const hasCachedIdentity = Boolean(
            resolveProfileDisplayName(cachedProfile)
          );

          if (cachedProfile && hasCachedIdentity) {
            setProfile(cachedProfile);
            setProfileImage(
              (cachedProfile.profileImage as string) ||
                (cachedProfile.profile_image as string) ||
                null
            );
            finishProfileHydration();
            void loadLocalBusinesses(userId, identity);
            void syncMyEventsCount(userId);
            void syncFavoritesCount();
            void refreshProfileFromApi(session, userId, identity);
          } else {
            setProfileIdentityLoading(true);
            try {
              await refreshProfileFromApi(session, userId, identity);
              if (cancelled) return;
              void syncFavoritesCount();
            void syncMyEventsCount();
            } finally {
              if (!cancelled) {
                finishProfileHydration();
              }
            }
          }
        } catch (hydrateError) {
          logAuthEvent("profile_hydration_error", {
            userId,
            error: String(hydrateError),
          });
          if (!cancelled) {
            await applyFallbackProfile(
              userId,
              { username: undefined, email: undefined },
              "Could not finish loading profile."
            );
            finishProfileHydration();
          }
        } finally {
          if (!cancelled) {
            hasCompletedInitialHydrationRef.current = true;
          }
        }
      };

      void hydrateProfile();

      return () => {
        cancelled = true;
        if (hydrationTimeoutRef.current) {
          clearTimeout(hydrationTimeoutRef.current);
          hydrationTimeoutRef.current = null;
        }
      };
    }, [])
  );

  const go = (path: string) => {
    router.push(path as any);
  };

  const isVerifiedMember = Boolean(
    profile?.is_verified === true || profile?.verified === true
  );

  const profileReviewsCount = (() => {
    const raw =
      profile?.reviews_count ??
      profile?.reviewsCount ??
      profile?.review_count;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  })();

  const hasProfileIdentity = Boolean(profileDisplayName || profile?.email);

  const openMyBusinesses = () => {
    router.push("/profile/my-businesses");
  };

  const showMyBusinessesLoading =
    myBusinessesLoadState === "loading" && localBusinesses.length === 0;
  const myBusinessesStatValue =
    myBusinessesLoadState === "error"
      ? "—"
      : String(localBusinesses.length);
  const showMyEventsLoading =
    myEventsLoadState === "loading" && myEventsCount === 0;
  const myEventsStatValue =
    myEventsLoadState === "error" ? "—" : String(myEventsCount);

  const StatBox = ({
    value,
    label,
    icon,
    showDivider,
    loading,
  }: {
    value: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    showDivider?: boolean;
    loading?: boolean;
  }) => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRightWidth: showDivider ? 1 : 0,
        borderRightColor: theme.colors.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: "rgba(13,148,136,0.10)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
        }}
      >
        <Ionicons name={icon} size={17} color={theme.colors.turquoise} />
      </View>
      <View style={{ minHeight: 22, alignItems: "center", justifyContent: "center" }}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.turquoise} />
        ) : (
          <Text
            style={{
              fontSize: 19,
              fontWeight: "900",
              color: theme.colors.charcoal,
              letterSpacing: -0.5,
              textAlign: "center",
            }}
          >
            {value}
          </Text>
        )}
      </View>

      <Text
        numberOfLines={2}
        style={{
          marginTop: 2,
          fontSize: 10,
          color: theme.colors.muted,
          fontWeight: "700",
          letterSpacing: 0.1,
          textAlign: "center",
          lineHeight: 13,
        }}
      >
        {label}
      </Text>
    </View>
  );

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    isLast,
    comingSoon,
    trailing,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress?: () => void;
    isLast?: boolean;
    comingSoon?: boolean;
    trailing?: React.ReactNode;
  }) => (
    <Pressable
      onPress={comingSoon ? () => showComingSoon(title, subtitle) : onPress}
      disabled={!onPress && !comingSoon}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.border,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: "rgba(13,148,136,0.10)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={20} color={theme.colors.turquoise} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: theme.colors.charcoal,
            }}
          >
            {title}
          </Text>
          {comingSoon ? (
            <View
              style={{
                backgroundColor: "rgba(107,114,128,0.12)",
                borderRadius: theme.radius.pill,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: theme.colors.muted,
                  letterSpacing: 0.4,
                }}
              >
                SOON
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={{
            marginTop: 2,
            fontSize: 13,
            color: theme.colors.muted,
            fontWeight: "500",
            lineHeight: 18,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {trailing ||
        (onPress || comingSoon ? (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
        ) : null)}
    </Pressable>
  );

  if (authHydration === "loading" || profileIdentityLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.turquoise} />
          <Text
            style={{
              marginTop: 14,
              fontSize: 15,
              fontWeight: "700",
              color: theme.colors.muted,
            }}
          >
            {t("profile.loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn || authHydration === "guest") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
        <View
          style={{
            flex: 1,
            padding: 22,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 32,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...theme.shadow.medium,
            }}
          >
            <Text
              style={{
                fontSize: 30,
                fontWeight: "900",
                color: theme.colors.charcoal,
              }}
            >
              {t("profile.welcomeTitle")}
            </Text>

            <Text
              style={{
                marginTop: 10,
                fontSize: 15,
                lineHeight: 23,
                color: theme.colors.muted,
              }}
            >
              {t("profile.welcomeSubtitle")}
            </Text>

            <Pressable
              onPress={() => go("/(tabs)")}
              style={{
                marginTop: 22,
                height: 54,
                borderRadius: 18,
                backgroundColor: theme.colors.turquoise,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
                {t("home.signIn")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => go("/register")}
              style={{
                marginTop: 12,
                height: 54,
                borderRadius: 18,
                backgroundColor: "rgba(13,148,136,0.10)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.turquoise,
                  fontSize: 16,
                  fontWeight: "900",
                }}
              >
                {t("home.createAccount")}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 96,
        }}
      >
        {profileLoadError ? (
          <View
            style={{
              marginHorizontal: 18,
              marginTop: insets.top + 8,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#FEF3C7",
              borderWidth: 1,
              borderColor: "#FCD34D",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#92400E",
              }}
            >
              {profileLoadError}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            paddingTop: insets.top + 10,
            paddingHorizontal: 20,
            paddingBottom: 48,
            backgroundColor: theme.colors.turquoise,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#fff",
                letterSpacing: -0.3,
              }}
            >
              {t("profile.title")}
            </Text>

            <Pressable
              onPress={() => go("/profile/settings")}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.16)",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Ionicons name="settings-outline" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View
          style={{
            marginHorizontal: 18,
            marginTop: -32,
            backgroundColor: theme.colors.card,
            borderRadius: 20,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadow.medium,
          }}
        >
          {!hasProfileIdentity ? (
            <View style={{ paddingVertical: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="person-circle-outline"
                  size={40}
                  color={theme.colors.muted}
                />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 14,
                    fontWeight: "700",
                    color: theme.colors.muted,
                    lineHeight: 20,
                  }}
                >
                  {t("profile.profileUnavailable")}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/profile/edit-v2")}
                style={({ pressed }) => ({
                  alignSelf: "flex-start",
                  marginTop: 10,
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: "rgba(13,148,136,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 5,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={theme.colors.turquoise}
                />
                <Text
                  style={{
                    color: theme.colors.turquoise,
                    fontSize: 13,
                    fontWeight: "800",
                  }}
                >
                  {t("profile.editProfile")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <Image
                    source={{ uri: profileImage || USER_AVATAR }}
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      backgroundColor: "#eee",
                      borderWidth: 3,
                      borderColor: "#fff",
                    }}
                  />
                  <Pressable
                    onPress={updateProfileAvatar}
                    style={({ pressed }) => ({
                      position: "absolute",
                      right: 0,
                      bottom: 0,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: theme.colors.turquoise,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: theme.colors.card,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Ionicons name="camera" size={14} color="#fff" />
                  </Pressable>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 19,
                        fontWeight: "900",
                        color: theme.colors.charcoal,
                        letterSpacing: -0.3,
                      }}
                      numberOfLines={1}
                    >
                      {profileDisplayName || t("profile.communityMember")}
                    </Text>
                    {isVerifiedMember ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={theme.colors.success}
                      />
                    ) : null}
                  </View>

                  <Text
                    style={{
                      marginTop: 3,
                      fontSize: 13,
                      color: theme.colors.muted,
                      fontWeight: "600",
                    }}
                    numberOfLines={1}
                  >
                    {profile?.email || t("profile.noEmail")}
                  </Text>

                  {!isVerifiedMember ? (
                    <View
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 6,
                        backgroundColor: "rgba(13,148,136,0.12)",
                        borderRadius: theme.radius.pill,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.turquoise,
                          fontWeight: "800",
                          fontSize: 11,
                        }}
                      >
                        {t("profile.communityMember")}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <Pressable
                onPress={() => router.push("/profile/edit-v2")}
                style={({ pressed }) => ({
                  alignSelf: "flex-start",
                  marginTop: 10,
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: "rgba(13,148,136,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 5,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={theme.colors.turquoise}
                />
                <Text
                  style={{
                    color: theme.colors.turquoise,
                    fontSize: 13,
                    fontWeight: "800",
                  }}
                >
                  {t("profile.editProfile")}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            marginTop: 14,
            marginHorizontal: 18,
            backgroundColor: theme.colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: "hidden",
            ...theme.shadow.soft,
          }}
        >
          <StatBox
            value={myBusinessesStatValue}
            label={t("profile.myBusinesses")}
            icon="business-outline"
            showDivider
            loading={showMyBusinessesLoading}
          />
          <StatBox
            value={myEventsStatValue}
            label={t("profile.myEvents")}
            icon="calendar-outline"
            showDivider
            loading={showMyEventsLoading}
          />
          <StatBox
            value={String(favoritesCount)}
            label={t("tabs.favorites")}
            icon="heart-outline"
            showDivider
          />
          <StatBox
            value={String(profileReviewsCount)}
            label={t("profile.reviews")}
            icon="star-outline"
          />
        </View>

        {profile?.bio ? (
          <>
            <Text style={sectionLabelStyle}>{t("profile.about")}</Text>
            <View style={sectionCardStyle}>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: theme.colors.muted,
                  fontWeight: "500",
                }}
              >
                {profile.bio}
              </Text>
            </View>
          </>
        ) : null}

        <Text style={sectionLabelStyle}>{t("profile.businessSection")}</Text>
        <View style={sectionCardStyle}>
          <MenuItem
            icon="briefcase-outline"
            title={t("profile.myBusinesses")}
            subtitle={
              showMyBusinessesLoading
                ? t("profile.myBusinessesSubtitle")
                : localBusinesses.length > 0
                ? t(
                    localBusinesses.length === 1
                      ? "profile.listingCount"
                      : "profile.listingCount_plural",
                    { count: localBusinesses.length }
                  )
                : t("profile.myBusinessesSubtitle")
            }
            onPress={openMyBusinesses}
          />
          <MenuItem
            icon="calendar-outline"
            title={t("profile.myEvents")}
            subtitle={t("profile.myEventsSubtitle")}
            onPress={() => go("/profile/events")}
          />
          <MenuItem
            icon="add-circle-outline"
            title={t("profile.addBusiness")}
            subtitle={t("profile.addBusinessSubtitle")}
            onPress={() => router.push("/profile/create-business")}
            isLast
          />
        </View>

        <Text style={sectionLabelStyle}>{t("profile.accountSection")}</Text>
        <View style={sectionCardStyle}>
          <MenuItem
            icon="shield-checkmark-outline"
            title={t("profile.verification")}
            subtitle={t("profile.verificationSubtitle")}
            onPress={() => go("/profile/verification")}
          />

          <MenuItem
            icon="settings-outline"
            title={t("profile.settings")}
            subtitle={t("profile.settingsSubtitle")}
            onPress={() => go("/profile/settings")}
          />

          <MenuItem
            icon="log-out-outline"
            title={t("profile.logout")}
            subtitle={t("profile.logoutSubtitle")}
            onPress={async () => {
              await clearUserSession();
              activeAccountKeyRef.current = null;
              setIsLoggedIn(false);
              resetProfileState();

              Alert.alert(
                t("profile.loggedOut"),
                t("profile.loggedOutMessage"),
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/explore"),
                  },
                ]
              );
            }}
            isLast
          />
        </View>

        <Pressable
          onPress={handleDeleteAccount}
          style={({ pressed }) => ({
            marginHorizontal: 18,
            marginTop: 16,
            marginBottom: 10,
            backgroundColor: theme.colors.card,
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.22)",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: pressed ? 0.88 : 1,
            ...theme.shadow.soft,
          })}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: theme.colors.danger,
              }}
            >
              {t("profile.deleteAccount")}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 12,
                lineHeight: 17,
                color: theme.colors.muted,
              }}
            >
              {t("profile.deleteAccountHint")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.danger} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const sectionLabelStyle = {
  fontSize: 12,
  fontWeight: "700" as const,
  color: theme.colors.muted,
  letterSpacing: 0.8,
  textTransform: "uppercase" as const,
  marginTop: 24,
  marginBottom: 8,
  marginLeft: 20,
};

const sectionCardStyle = {
  marginHorizontal: 18,
  backgroundColor: theme.colors.card,
  borderRadius: 22,
  paddingHorizontal: 16,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: theme.colors.border,
  ...theme.shadow.soft,
};
