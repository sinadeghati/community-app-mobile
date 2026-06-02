import React, { useState } from "react";
import {
  Alert,
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
import authStorage from "../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const USER_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900";

export default function ProfileV2Clean() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [localBusinesses, setLocalBusinesses] = useState<any[]>([]);
  const [myBusinessId, setMyBusinessId] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      const loadSavedProfile = async () => {
        try {
          const raw = await AsyncStorage.getItem("user_profile_v2");

          if (!raw) return;

          const saved = JSON.parse(raw);

          const favoritesRaw = await AsyncStorage.getItem("favorites");
          const favoritesList = favoritesRaw ? JSON.parse(favoritesRaw) : [];

          setFavoritesCount(
            Array.isArray(favoritesList) ? favoritesList.length : 0
          );

          if (saved?.profileImage || saved?.profile_image) {
            setProfileImage(saved.profileImage || saved.profile_image);
          }

          setProfile((prev: any) => ({
            ...(prev || {}),
            ...saved,
          }));
        } catch (error) {
          console.log("PROFILE CACHE LOAD ERROR:", error);
        }
      };

      loadSavedProfile();
    }, [])
  );


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
      const checkLogin = async () => {
        const tokens = await authStorage.getTokens();

        

        if (tokens?.access) {
          await AsyncStorage.setItem("is_logged_in", "true");
          setIsLoggedIn(true);

          try {
            const cachedRaw = await AsyncStorage.getItem("user_profile_v2");

            const cachedProfile = cachedRaw
              ? JSON.parse(cachedRaw)
              : {};

            if (cachedProfile && Object.keys(cachedProfile).length > 0) {
              setProfile(cachedProfile);

              setProfileImage(
                cachedProfile.profileImage ||
                cachedProfile.profile_image ||
                null
              );
            }


            const res = await fetch(
              "https://community-app-backend-production.up.railway.app/api/accounts/profile/",
              {
                headers: {
                  Authorization: `Bearer ${tokens.access}`,
                },
              }
            );

            const data = await res.json();
            if (!res.ok || data?.code === "token_not_valid") {
              console.log("PROFILE API INVALID, USING LOCAL CACHE:", data);
              return;
            }
            const mergedProfile = {
              ...data,
              ...cachedProfile,
              
            };

            setProfile(mergedProfile);

            setProfileImage(
              mergedProfile.profileImage ||
              mergedProfile.profile_image ||
              null
            );

            await AsyncStorage.setItem(
              "user_profile_v2",
              JSON.stringify(mergedProfile)
            );
            const localRaw = await AsyncStorage.getItem("my_local_businesses");
            const localList = localRaw ? JSON.parse(localRaw) : [];

            setLocalBusinesses(localList);

            console.log("PROFILE RESPONSE:", data);

            if (data?.business_id) {
              setMyBusinessId(String(data.business_id));
            }
          } catch (e) {
            console.log("PROFILE LOAD ERROR:", e);
          }
        } else {
          // No tokens = guest UI. Keep user_profile_v2 in storage for the next login.
          setIsLoggedIn(false);
        }
      };

      checkLogin();
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
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        borderBottomWidth: 1,
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
  ); const StatBox = ({
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

  if (!isLoggedIn) {
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
              Sign in to manage your listings, favorites, events, and community profile.
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
  } return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View
          style={{
            backgroundColor: theme.colors.turquoise,
            paddingHorizontal: 22,
            paddingTop: 24,
            paddingBottom: 72,
            borderBottomLeftRadius: 34,
            borderBottomRightRadius: 34,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "900",
                }}
              >
                Your Profile
              </Text>

              <Text
                style={{
                  marginTop: 5,
                  color: "rgba(255,255,255,0.82)",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Your space. Your community.
              </Text>
            </View>

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
                {isLoggedIn
                  ? profile?.name ||
                    profile?.username ||
                    profile?.email ||
                    "User"
                  : "Community Member"}
              </Text>

              <Text
                style={{
                  marginTop: 4,
                  color: theme.colors.muted,
                  fontWeight: "700",
                }}
              >
                {isLoggedIn ? profile?.email || "Complete your profile" : "Complete your profile"}
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
        </View>        <View
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
          <StatBox value={String(localBusinesses.length)} label="Listings" />
          <StatBox value={String(favoritesCount)} label="Favorites" />
          <StatBox value={String(eventsCount)} label="Events" />
        </View>

        <View
          style={{
            marginHorizontal: 18,
            marginTop: 18,
            backgroundColor: theme.colors.card,
            borderRadius: 30,
            padding: 18,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadow.soft,
          }}
        >
          {profile?.bio ? (
            <View
              style={{
                backgroundColor: "#fff",
                marginHorizontal: 18,
                marginTop: 14,
                marginBottom: 12,
                borderRadius: 22,
                padding: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                ...theme.shadow.medium,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: theme.colors.charcoal,
                  marginBottom: 8,
                }}
              >
                About
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: theme.colors.muted,
                  fontWeight: "500",
                }}
              >
                {profile.bio}
              </Text>
            </View>
          ) : null}
          <Text
            style={{
              fontSize: 23,
              fontWeight: "900",
              color: theme.colors.charcoal,
              marginBottom: 12,
            }}
          >
            Quick Access
          </Text>

          <MenuItem
            icon="briefcase-outline"
            title="Add Business Profile"
            subtitle="Create or connect your business page"
            onPress={() => router.push("/profile/create-business")}
          />

          {localBusinesses.length > 0 && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 22,
                padding: 16,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  marginBottom: 14,
                  color: theme.colors.charcoal,
                }}
              >
                My Businesses
              </Text>

              {localBusinesses.map((biz, index) => (
                <Pressable
                  key={index}
                  onPress={() =>
                    router.push(`/profile/v2?id=${biz.id}` as any)
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F7F4EE",
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 12,
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
                      {biz.name}
                    </Text>

                    <Text
                      style={{
                        fontSize: 14,
                        color: "#777",
                        marginTop: 3,
                      }}
                    >
                      {biz.category} • {biz.city}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#999"
                  />
                </Pressable>
              ))}
            </View>
          )}

          {isLoggedIn ? (
            <MenuItem
              icon="grid-outline"
              title="My Listings"
              subtitle="Manage your business listings"
              onPress={() => go("/mylistings")}
            />
          ) : null}

          <MenuItem
            icon="heart-outline"
            title="Favorites"
            subtitle="Saved businesses and places"
            onPress={() => go("/favorites")}
          />

          <MenuItem
            icon="images-outline"
            title="Gallery"
            subtitle="Your uploaded photos and highlights"
            onPress={() => go("/profile/gallery")}
          />

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
            onPress={() => go("/profile/events")
            }
          />
        </View>

        <View
          style={{
            marginHorizontal: 18,
            marginTop: 18,
            backgroundColor: theme.colors.card,
            borderRadius: 30,
            padding: 18,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadow.soft,
          }}
        >
          <Text
            style={{
              fontSize: 23,
              fontWeight: "900",
              color: theme.colors.charcoal,
              marginBottom: 12,
            }}
          >
            Account
          </Text>



          <MenuItem
            icon="shield-checkmark-outline"
            title="Verification"
            subtitle="Get verified as a trusted member"
            onPress={() =>
              go("/profile/verification")
            }
          />



          <MenuItem
            icon="log-out-outline"
            title="Logout"
            subtitle="Sign out from your account"
            onPress={async () => {
              await authStorage.clearTokens();

              await AsyncStorage.setItem("is_logged_in", "false");
              setIsLoggedIn(false);

              Alert.alert(
                "Logged out",
                "You’ve been logged out successfully.",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/explore"),
                  },
                ]
              );
            }}

          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}