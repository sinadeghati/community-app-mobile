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
  invalidateAuthSession,
  isApiTokenInvalidResponse,
  logAuthEvent,
  shouldInvalidateStoredSession,
  tryRefreshStoredAccessToken,
} from "../../lib/authSession";
import {
  clearUserSession,
  cleanupPollutedTestBusinessStorage,
  diagnoseBusinessStorageDuplication,
  explainMyBusinessOwnershipMatch,
  inspectPollutedTestBusinessStorage,
  TEST_BUSINESS_NAME_NEEDLES,
  gatherRawMyBusinessCandidatesWithProvenance,
  getMyBusinessesStorageKey,
  getActiveUserId,
  hydrateAuthSession,
  loadMyBusinessesForProfile,
  loadUserProfile,
  adoptLegacyProfileIfMatching,
  mergeProfileWithApi,
  prepareSessionForUser,
  saveUserProfile,
  toMyBusinessLogRow,
} from "../../lib/userSessionStorage";
import * as ImagePicker from "expo-image-picker";
import { countCommunityEventsForOwner } from "../../lib/communityEvents";
import { countSavedFavorites } from "../../lib/favoritesCount";
import { FAVORITES_CHANGED_EVENT } from "../../lib/favoritesRefresh";
import { resolveProfileDisplayName } from "../../lib/profileDisplay";

const USER_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900";

type AuthHydrationState = "loading" | "authenticated" | "guest";

export default function ProfileV2Clean() {
  const [authHydration, setAuthHydration] =
    useState<AuthHydrationState>("loading");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [localBusinesses, setLocalBusinesses] = useState<any[]>([]);
  const [myBusinessId, setMyBusinessId] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [profileIdentityLoading, setProfileIdentityLoading] = useState(false);
  const activeAccountKeyRef = useRef<string | null>(null);
  const hasCompletedInitialHydrationRef = useRef(false);

  const profileDisplayName = resolveProfileDisplayName(profile);

  const loadLocalBusinesses = async (
    userId: string | null,
    identity?: { username?: string; email?: string }
  ) => {
    if (!userId) {
      return;
    }

    const accountKey = `${userId}:${String(identity?.username || "").toLowerCase()}:${String(identity?.email || "").toLowerCase()}`;
    if (activeAccountKeyRef.current !== accountKey) {
      activeAccountKeyRef.current = accountKey;
      setLocalBusinesses([]);
    }

    try {
      const currentUser = {
        id: userId,
        username: identity?.username ?? null,
        email: identity?.email ?? null,
        storageKey: getMyBusinessesStorageKey(userId),
      };

      console.log("CURRENT_USER_FOR_MY_BUSINESSES", currentUser);

      await inspectPollutedTestBusinessStorage(TEST_BUSINESS_NAME_NEEDLES);
      await cleanupPollutedTestBusinessStorage(TEST_BUSINESS_NAME_NEEDLES);

      await diagnoseBusinessStorageDuplication(TEST_BUSINESS_NAME_NEEDLES);

      const rawWithSources =
        await gatherRawMyBusinessCandidatesWithProvenance(userId);

      console.log(
        "RAW_BUSINESSES",
        rawWithSources.map((entry) => ({
          ...toMyBusinessLogRow(entry.business),
          loadedFrom: entry.loadedFrom,
          mergeOrder: entry.mergeOrder,
        }))
      );

      rawWithSources.forEach((entry) => {
        const check = explainMyBusinessOwnershipMatch(
          entry.business,
          userId,
          identity
        );
        console.log("MY_BUSINESS_FILTER_CHECK", {
          ...toMyBusinessLogRow(entry.business),
          loadedFrom: entry.loadedFrom,
          mergeOrder: entry.mergeOrder,
          owned: check.owned,
          reason: check.reason,
        });
      });

      const filteredBusinesses = await loadMyBusinessesForProfile(
        userId,
        identity
      );

      const filteredWithSources = rawWithSources.filter((entry) =>
        filteredBusinesses.some(
          (b) => String(b.id) === String(entry.business.id)
        )
      );

      console.log(
        "FILTERED_MY_BUSINESSES",
        filteredWithSources.map((entry) => ({
          ...toMyBusinessLogRow(entry.business),
          loadedFrom: entry.loadedFrom,
          mergeOrder: entry.mergeOrder,
        }))
      );

      filteredWithSources.forEach((entry) => {
        const check = explainMyBusinessOwnershipMatch(
          entry.business,
          userId,
          identity
        );
        console.log("MY_BUSINESS_SHOWN_REASON", {
          ...toMyBusinessLogRow(entry.business),
          loadedFrom: entry.loadedFrom,
          mergeOrder: entry.mergeOrder,
          owned: check.owned,
          reason: check.reason,
        });
      });

      console.log("FINAL_MY_BUSINESSES_AFTER_FIX", {
        userId,
        username: identity?.username ?? null,
        email: identity?.email ?? null,
        count: filteredBusinesses.length,
        businesses: filteredBusinesses.map((b) => {
          const row = toMyBusinessLogRow(b);
          return {
            id: row.id,
            name: row.name,
            ownerId: row.ownerId,
            ownerUsername: row.ownerUsername,
            ownerEmail: row.ownerEmail,
          };
        }),
      });

      console.log("FINAL_MY_BUSINESSES_AFTER_CLEANUP", {
        userId,
        username: identity?.username ?? null,
        email: identity?.email ?? null,
        count: filteredBusinesses.length,
        businesses: filteredBusinesses.map((b) => {
          const row = toMyBusinessLogRow(b);
          return {
            id: row.id,
            name: row.name,
            ownerId: row.ownerId,
            ownerUsername: row.ownerUsername,
            ownerEmail: row.ownerEmail,
          };
        }),
      });

      setLocalBusinesses(filteredBusinesses);
    } catch (error) {
      console.log("LOCAL BUSINESSES LOAD ERROR:", error);
    }
  };

  const resetProfileState = () => {
    setProfile(null);
    setProfileImage(null);
    setLocalBusinesses([]);
    setMyBusinessId(null);
    setFavoritesCount(0);
    setEventsCount(0);
    setProfileIdentityLoading(false);
    setAuthHydration("guest");
    hasCompletedInitialHydrationRef.current = false;
  };

  const syncFavoritesCount = React.useCallback(async () => {
    try {
      setFavoritesCount(await countSavedFavorites());
    } catch {
      setFavoritesCount(0);
    }
  }, []);

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      FAVORITES_CHANGED_EVENT,
      () => {
        void syncFavoritesCount();
      }
    );
    return () => subscription.remove();
  }, [syncFavoritesCount]);

  const identityFromProfile = (record: Record<string, unknown> | null) => ({
    username: String(record?.username || "").trim() || undefined,
    email: String(record?.email || "").trim() || undefined,
  });

  const syncEventsCount = async (userId: string) => {
    try {
      setEventsCount(await countCommunityEventsForOwner(userId));
    } catch {
      setEventsCount(0);
    }
  };

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      const refreshProfileFromApi = async (
        session: Awaited<ReturnType<typeof hydrateAuthSession>>,
        userId: string,
        initialIdentity: ReturnType<typeof identityFromProfile>
      ) => {
        let identity = initialIdentity;

        try {
          const fetchProfile = async (accessToken: string) =>
            fetch(
              "https://community-app-backend-production.up.railway.app/api/accounts/profile/",
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

          let access = String(session?.access || "").trim();
          if (!access) {
            const tokens = await authStorage.getTokens();
            access = String(tokens?.access || "").trim();
          }

          if (!access) {
            logAuthEvent("profile_api_skipped_no_access_kept_cache", {
              userId,
            });
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
              await loadLocalBusinesses(userId, identity);
              await syncEventsCount(userId);
              return;
            }

            if (cancelled) return;
            await loadLocalBusinesses(userId, identity);
            await syncEventsCount(userId);
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
          await saveUserProfile(userId, mergedProfile);

          await loadLocalBusinesses(
            userId,
            identityFromProfile(mergedProfile as Record<string, unknown>)
          );
          await syncEventsCount(userId);

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
          await loadLocalBusinesses(userId, identity);
          await syncEventsCount(userId);
        }
      };

      const hydrateProfile = async () => {
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
            void loadLocalBusinesses(userId, identity);
            void syncEventsCount(userId);
            void syncFavoritesCount();
            void refreshProfileFromApi(session, userId, identity);
            return;
          }

          setProfileIdentityLoading(true);
          try {
            await refreshProfileFromApi(session, userId, identity);
            if (cancelled) return;
            void loadLocalBusinesses(userId, identity);
            void syncEventsCount(userId);
            void syncFavoritesCount();
          } finally {
            if (!cancelled) {
              setProfileIdentityLoading(false);
            }
          }
          return;
        }

        const showBlockingLoader = !hasCompletedInitialHydrationRef.current;
        if (showBlockingLoader) {
          setAuthHydration("loading");
        }

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

        setIsLoggedIn(true);
        await prepareSessionForUser(userId);

        let cachedProfile = (await loadUserProfile(userId)) as Record<
          string,
          unknown
        > | null;
        let identity = identityFromProfile(cachedProfile);

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
        } else if (!hasCachedIdentity) {
          setProfileIdentityLoading(true);
        }

        await loadLocalBusinesses(userId, identity);
        await syncEventsCount(userId);
        if (!cancelled) {
          await syncFavoritesCount();
        }

        if (cancelled) return;

        if (!hasCachedIdentity) {
          await refreshProfileFromApi(session, userId, identity);
          if (cancelled) return;
          setProfileIdentityLoading(false);
        } else {
          void refreshProfileFromApi(session, userId, identity);
        }

        setAuthHydration("authenticated");
        hasCompletedInitialHydrationRef.current = true;
      };

      void hydrateProfile();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const go = (path: string) => {
    router.push(path as any);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    isLast,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          backgroundColor: "rgba(13,148,136,0.10)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 13,
        }}
      >
        <Ionicons name={icon} size={21} color={theme.colors.turquoise} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "900",
            color: theme.colors.charcoal,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: 3,
            fontSize: 13,
            color: theme.colors.muted,
            fontWeight: "600",
          }}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={21} color={theme.colors.muted} />
    </Pressable>
  );

  const StatBox = ({
    value,
    label,
  }: {
    value: string;
    label: string;
  }) => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 13,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "900",
          color: theme.colors.charcoal,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          marginTop: 3,
          fontSize: 12,
          color: theme.colors.muted,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (
    authHydration === "loading" ||
    profileIdentityLoading ||
    (isLoggedIn && authHydration === "authenticated" && !profileDisplayName)
  ) {
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
            Loading your profile...
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
              Welcome to IranianApp
            </Text>

            <Text
              style={{
                marginTop: 10,
                fontSize: 15,
                lineHeight: 23,
                color: theme.colors.muted,
              }}
            >
              Sign in to manage your listings, favorites, events, and community
              profile.
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
                Sign In
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
                Create Account
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View
          style={{
            paddingTop: 24,
            paddingHorizontal: 18,
            paddingBottom: 72,
            backgroundColor: theme.colors.turquoise,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff" }}>
              Profile
            </Text>

            <Pressable
              onPress={() => go("/profile/settings")}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View
          style={{
            marginHorizontal: 18,
            marginTop: -48,
            backgroundColor: theme.colors.card,
            borderRadius: 30,
            padding: 18,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadow.medium,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: profileImage || USER_AVATAR }}
              style={{
                width: 92,
                height: 92,
                borderRadius: 30,
                backgroundColor: "#eee",
                borderWidth: 4,
                borderColor: "#fff",
              }}
            />

            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text
                style={{
                  fontSize: 25,
                  fontWeight: "900",
                  color: theme.colors.charcoal,
                }}
              >
                {profileDisplayName}
              </Text>

              <Text
                style={{
                  marginTop: 4,
                  color: theme.colors.muted,
                  fontWeight: "700",
                }}
              >
                {profile?.email || "Complete your profile"}
              </Text>

              {profile?.city ? (
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 13.5,
                    color: theme.colors.muted,
                    fontWeight: "700",
                  }}
                >
                  📍 {profile.city}
                </Text>
              ) : null}

              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: 10,
                  backgroundColor: "rgba(13,148,136,0.12)",
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.turquoise,
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  Community Member
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/profile/edit-v2")}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(13,148,136,0.10)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="pencil" size={18} color={theme.colors.turquoise} />
            </Pressable>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginTop: 18,
            marginHorizontal: 18,
            backgroundColor: theme.colors.card,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadow.soft,
          }}
        >
          <StatBox value={String(localBusinesses.length)} label="My Businesses" />
          <StatBox value={String(favoritesCount)} label="Favorites" />
          <StatBox value={String(eventsCount)} label="Events" />
        </View>

        {profile?.bio ? (
          <>
            <Text style={sectionLabelStyle}>About</Text>
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

        <Text style={sectionLabelStyle}>Business</Text>
        <View style={sectionCardStyle}>
          <MenuItem
            icon="briefcase-outline"
            title="Add Business Profile"
            subtitle="Create or connect your business page"
            onPress={() => router.push("/profile/create-business")}
          />

          {localBusinesses.length > 0 ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                paddingTop: 14,
                paddingBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  marginBottom: 12,
                  color: theme.colors.charcoal,
                }}
              >
                My Businesses
              </Text>

              {localBusinesses.map((biz, index) => (
                <Pressable
                  key={String(biz?.id || index)}
                  onPress={() =>
                    router.navigate({
                      pathname: "/profile/v2",
                      params: { id: String(biz.id) },
                    })
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F7F4EE",
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: index === localBusinesses.length - 1 ? 8 : 12,
                  }}
                >
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      backgroundColor: "#DFF3F1",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 14,
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={28}
                      color="#0F8F87"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: theme.colors.charcoal,
                      }}
                    >
                      {biz.name || biz.business_name || "Business"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 14,
                        color: "#777",
                        marginTop: 3,
                      }}
                    >
                      {[biz.category || biz.business_category, biz.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.muted}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}

          <MenuItem
            icon="chatbubble-ellipses-outline"
            title="Messages"
            subtitle="Community conversations and chats"
            onPress={() => go("/profile/messages")}
          />

          <MenuItem
            icon="calendar-outline"
            title="Events"
            subtitle="Community events and gatherings"
            onPress={() => go("/profile/events")}
            isLast={localBusinesses.length === 0}
          />
        </View>

        <Text style={sectionLabelStyle}>Account</Text>
        <View style={[sectionCardStyle, { marginBottom: 24 }]}>
          <MenuItem
            icon="shield-checkmark-outline"
            title="Verification"
            subtitle="Get verified as a trusted member"
            onPress={() => go("/profile/verification")}
          />

          <MenuItem
            icon="settings-outline"
            title="Settings"
            subtitle="Notifications, privacy, and preferences"
            onPress={() => go("/profile/settings")}
          />

          <MenuItem
            icon="log-out-outline"
            title="Logout"
            subtitle="Sign out from your account"
            onPress={async () => {
              await clearUserSession();
              activeAccountKeyRef.current = null;
              setIsLoggedIn(false);
              resetProfileState();

              Alert.alert(
                "Logged out",
                "You've been logged out successfully.",
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
      </ScrollView>
    </SafeAreaView>
  );
}

const sectionLabelStyle = {
  fontSize: 13,
  fontWeight: "800" as const,
  color: theme.colors.muted,
  letterSpacing: 0.6,
  textTransform: "uppercase" as const,
  marginTop: 18,
  marginBottom: 10,
  marginLeft: 22,
};

const sectionCardStyle = {
  marginHorizontal: 18,
  backgroundColor: theme.colors.card,
  borderRadius: 30,
  paddingHorizontal: 18,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: theme.colors.border,
  ...theme.shadow.soft,
};
