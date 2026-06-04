import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { isUserLoggedIn } from "../../lib/businessReviews";
import {
  loadFavoriteBusinesses,
  removeBusinessFavorite,
  type FavoriteBusiness,
} from "../../lib/businessFavorites";
import {
  formatEventDateTime,
  formatEventLocation,
  getEventCover,
  getEventTitle,
  loadInterestedEvents,
  removeInterestedEvent,
} from "../../lib/mapEventDetails";
import type { EventMapItem } from "../../lib/mapEvents";
import { ensureLoggedInForSave } from "../../lib/savedActions";
import { theme } from "../../lib/theme";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=900";

export default function FavoritesScreen() {
  const [businesses, setBusinesses] = useState<FavoriteBusiness[]>([]);
  const [events, setEvents] = useState<EventMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [search, setSearch] = useState("");

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const authed = await isUserLoggedIn();
      setLoggedIn(authed);

      if (!authed) {
        setBusinesses([]);
        setEvents([]);
        return;
      }

      const [biz, ev] = await Promise.all([
        loadFavoriteBusinesses(),
        loadInterestedEvents(),
      ]);
      setBusinesses(biz);
      setEvents(ev);
    } catch (e) {
      console.log("Favorites load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const removeFavorite = async (id: string) => {
    const allowed = await ensureLoggedInForSave("manage your favorites");
    if (!allowed) return;
    await removeBusinessFavorite(id);
    setBusinesses((prev) => prev.filter((item) => item.id !== id));
  };

  const removeEvent = async (id: string) => {
    const allowed = await ensureLoggedInForSave("manage interested events");
    if (!allowed) return;
    await removeInterestedEvent(id);
    setEvents((prev) => prev.filter((item) => String(item.id) !== id));
  };

  const q = search.toLowerCase().trim();

  const filteredBusinesses = useMemo(() => {
    if (!q) return businesses;
    return businesses.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const category = String(item.category || "").toLowerCase();
      const address = String(item.address || "").toLowerCase();
      return name.includes(q) || category.includes(q) || address.includes(q);
    });
  }, [businesses, q]);

  const filteredEvents = useMemo(() => {
    if (!q) return events;
    return events.filter((item) => {
      const title = getEventTitle(item).toLowerCase();
      const location = formatEventLocation(item).toLowerCase();
      return title.includes(q) || location.includes(q);
    });
  }, [events, q]);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.ivory,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.turquoise} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        <View style={{ paddingTop: 18, paddingBottom: 12 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "900",
              color: theme.colors.charcoal,
            }}
          >
            Saved
          </Text>
          <Text style={{ marginTop: 6, fontSize: 15, color: theme.colors.muted }}>
            Businesses and events you care about
          </Text>
        </View>

        {!loggedIn ? (
          <View
            style={{
              marginTop: 12,
              padding: 20,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: theme.colors.charcoal,
              }}
            >
              Log in to see your saved items
            </Text>
            <Text style={{ marginTop: 8, color: theme.colors.muted, lineHeight: 21 }}>
              You can browse businesses and events as a guest. Sign in to save
              favorites and mark events you are interested in.
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)")}
              style={{
                marginTop: 14,
                height: 44,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.turquoise,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Log in</Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={{
            marginTop: 16,
            height: 52,
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
          }}
        >
          <Ionicons name="search-outline" size={20} color={theme.colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search saved businesses and events..."
            placeholderTextColor={theme.colors.muted}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: theme.colors.charcoal,
            }}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={theme.colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <SectionTitle
          icon="heart"
          title="Saved Businesses"
          count={filteredBusinesses.length}
          accent={theme.colors.danger}
        />

        {loggedIn && filteredBusinesses.length === 0 ? (
          <EmptyHint text="Businesses you favorite will appear here." />
        ) : null}

        {filteredBusinesses.map((item) => (
          <Pressable
            key={`biz-${item.id}`}
            onPress={() =>
              router.push({
                pathname: "/profile/v2",
                params: { id: String(item.id) },
              })
            }
            style={cardStyle}
          >
            <Image
              source={{ uri: item.image || FALLBACK_IMAGE }}
              style={{
                width: 88,
                height: 88,
                borderRadius: 14,
                backgroundColor: "#eee",
              }}
              resizeMode="cover"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 17,
                  fontWeight: "900",
                  color: theme.colors.charcoal,
                }}
              >
                {item.name || "Saved Business"}
              </Text>
              <Text style={{ marginTop: 4, color: theme.colors.muted }}>
                {item.category || "Local Business"}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 4, color: theme.colors.muted }}>
                {item.address || "Address not available"}
              </Text>
            </View>
            <Pressable onPress={() => removeFavorite(item.id)} hitSlop={8}>
              <Ionicons name="heart" size={24} color={theme.colors.danger} />
            </Pressable>
          </Pressable>
        ))}

        <SectionTitle
          icon="calendar"
          title="Interested Events"
          count={filteredEvents.length}
          accent={theme.colors.eventPurple}
        />

        {loggedIn && filteredEvents.length === 0 ? (
          <EmptyHint text="Events you mark as interested will appear here." />
        ) : null}

        {filteredEvents.map((item) => (
          <Pressable
            key={`event-${item.id}`}
            onPress={() =>
              router.push({
                pathname: "/event/[id]",
                params: { id: String(item.id) },
              })
            }
            style={cardStyle}
          >
            <Image
              source={{ uri: getEventCover(item) }}
              style={{
                width: 88,
                height: 88,
                borderRadius: 14,
                backgroundColor: "#eee",
              }}
              resizeMode="cover"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 17,
                  fontWeight: "900",
                  color: theme.colors.charcoal,
                }}
              >
                {getEventTitle(item)}
              </Text>
              <Text style={{ marginTop: 4, color: theme.colors.eventPurple, fontWeight: "700" }}>
                {formatEventDateTime(item)}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 4, color: theme.colors.muted }}>
                {formatEventLocation(item)}
              </Text>
            </View>
            <Pressable
              onPress={() => removeEvent(String(item.id))}
              hitSlop={8}
            >
              <Ionicons name="bookmark" size={24} color={theme.colors.eventPurple} />
            </Pressable>
          </Pressable>
        ))}

        {loggedIn &&
        filteredBusinesses.length === 0 &&
        filteredEvents.length === 0 &&
        !q ? (
          <View style={{ alignItems: "center", paddingTop: 48 }}>
            <Text style={{ fontSize: 40 }}>❤️</Text>
            <Text
              style={{
                marginTop: 12,
                fontSize: 20,
                fontWeight: "900",
                color: theme.colors.charcoal,
              }}
            >
              Nothing saved yet
            </Text>
            <Text
              style={{
                marginTop: 8,
                textAlign: "center",
                color: theme.colors.muted,
                lineHeight: 22,
              }}
            >
              Favorite a business on the map or mark an event as interested.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const cardStyle = {
  flexDirection: "row" as const,
  backgroundColor: theme.colors.card,
  borderRadius: theme.radius.md,
  padding: 12,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: theme.colors.border,
  alignItems: "center" as const,
};

function SectionTitle({
  icon,
  title,
  count,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  accent: string;
}) {
  return (
    <View
      style={{
        marginTop: 24,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons name={icon} size={22} color={accent} />
      <Text
        style={{
          marginLeft: 8,
          fontSize: 18,
          fontWeight: "900",
          color: theme.colors.charcoal,
          flex: 1,
        }}
      >
        {title}
      </Text>
      <Text style={{ fontWeight: "800", color: theme.colors.muted }}>{count}</Text>
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <Text
      style={{
        color: theme.colors.muted,
        marginBottom: 8,
        fontSize: 14,
      }}
    >
      {text}
    </Text>
  );
}
