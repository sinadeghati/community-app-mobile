import React, { useCallback, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { DeviceEventEmitter } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../lib/theme";
import { DISCOVER_LISTINGS_REFRESH_EVENT } from "../../lib/discoverListingsRefresh";
import {
  getActiveUserId,
  loadMyBusinessesForProfile,
  loadUserProfile,
} from "../../lib/userSessionStorage";

const titleFrom = (record: Record<string, unknown>) =>
  String(record.business_name || record.name || record.title || "Business");

export default function MyBusinessesScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Record<string, unknown>[]>([]);

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await getActiveUserId();
      if (!userId) {
        setBusinesses([]);
        return;
      }

      const profile = (await loadUserProfile(userId)) as Record<
        string,
        unknown
      > | null;
      const identity = {
        username: profile?.username ? String(profile.username) : undefined,
        email: profile?.email ? String(profile.email) : undefined,
      };

      const owned = await loadMyBusinessesForProfile(userId, identity);
      setBusinesses(owned);
    } catch (error) {
      console.log("MY BUSINESSES LOAD ERROR:", error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBusinesses();
    }, [loadBusinesses])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      DISCOVER_LISTINGS_REFRESH_EVENT,
      () => {
        void loadBusinesses();
      }
    );
    return () => sub.remove();
  }, [loadBusinesses]);

  const openBusiness = (biz: Record<string, unknown>) => {
    router.navigate({
      pathname: "/profile/v2",
      params: { id: String(biz.id) },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 18,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.card,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.turquoise} />
        </Pressable>

        <Text
          style={{
            fontSize: 30,
            fontWeight: "900",
            color: theme.colors.charcoal,
            letterSpacing: -0.5,
            marginBottom: 6,
          }}
        >
          My Businesses
        </Text>

        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: theme.colors.muted,
            marginBottom: 20,
          }}
        >
          Businesses you own or created on Korook.
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.turquoise} />
          </View>
        ) : businesses.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 22,
              padding: 26,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: "center",
              ...theme.shadow.soft,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "rgba(13,148,136,0.10)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="business-outline"
                size={34}
                color={theme.colors.turquoise}
              />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: theme.colors.charcoal,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No businesses yet
            </Text>

            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: theme.colors.muted,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Create your first business profile to appear in Korook.
            </Text>

            <Pressable
              onPress={() => router.push("/profile/create-business")}
              style={({ pressed }) => ({
                height: 48,
                paddingHorizontal: 20,
                borderRadius: 14,
                backgroundColor: theme.colors.turquoise,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                Add Business Profile
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
              ...theme.shadow.soft,
            }}
          >
            {businesses.map((biz, index) => {
              const subtitle = [
                biz.category || biz.business_category,
                biz.city,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <Pressable
                  key={String(biz.id || index)}
                  onPress={() => openBusiness(biz)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: index === businesses.length - 1 ? 0 : 1,
                    borderBottomColor: theme.colors.border,
                    backgroundColor: pressed
                      ? theme.colors.softCard
                      : theme.colors.card,
                  })}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: "rgba(13,148,136,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={22}
                      color={theme.colors.turquoise}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: theme.colors.charcoal,
                      }}
                    >
                      {titleFrom(biz)}
                    </Text>
                    {subtitle ? (
                      <Text
                        style={{
                          marginTop: 2,
                          fontSize: 13,
                          color: theme.colors.muted,
                        }}
                      >
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.muted}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
