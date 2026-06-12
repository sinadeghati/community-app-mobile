import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  formatMapPreviewReviewText,
  getBusinessReviewSummary,
  type BusinessReviewSummary,
} from "../../lib/businessReviews";
import { getActiveUserId } from "../../lib/userSessionStorage";
import { getItemHoursDisplay } from "../../lib/businessHours";
import {
  loadFavoriteBusinesses,
  loadFavoriteBusinessesFromStorage,
  removeBusinessFavorite,
  type FavoriteBusiness,
} from "../../lib/businessFavorites";
import {
  formatEventDateTime,
  formatEventHostLine,
  formatEventLocation,
  getEventCover,
  getEventTitle,
  loadInterestedEvents,
  loadInterestedEventsFromStorage,
  removeInterestedEvent,
} from "../../lib/mapEventDetails";
import type { EventMapItem } from "../../lib/mapEvents";
import { ensureLoggedInForSave } from "../../lib/savedActions";
import { theme } from "../../lib/theme";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=900";

const favoritesCardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

const cardStyle = {
  flexDirection: "row" as const,
  backgroundColor: theme.colors.card,
  borderRadius: theme.radius.md,
  padding: 10,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: theme.colors.border,
  alignItems: "center" as const,
  ...favoritesCardShadow,
};

export default function FavoritesScreen() {
  const [businesses, setBusinesses] = useState<FavoriteBusiness[]>([]);
  const [events, setEvents] = useState<EventMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [reviewSummaries, setReviewSummaries] = useState<
    Record<string, BusinessReviewSummary>
  >({});
  const [hoursByBusinessId, setHoursByBusinessId] = useState<Record<string, string>>(
    {}
  );
  const hasDisplayedContentRef = useRef(false);
  const lastRefreshAtRef = useRef(0);
  const FAVORITES_STALE_MS = 30_000;
  const [showContent, setShowContent] = useState(false);

  const markHasContent = useCallback((value: boolean) => {
    hasDisplayedContentRef.current = value;
    setShowContent(value);
  }, []);

  const hydrateFromCache = useCallback(async () => {
    const [biz, ev] = await Promise.all([
      loadFavoriteBusinessesFromStorage(),
      loadInterestedEventsFromStorage(),
    ]);

    if (!biz.length && !ev.length) return false;

    setBusinesses(biz);
    setEvents(ev);
    setLoggedIn(true);
    setLoading(false);
    markHasContent(true);
    return true;
  }, [markHasContent]);

  const refreshAll = useCallback(async () => {
    const showBlockingLoader = !hasDisplayedContentRef.current;
    if (showBlockingLoader) setLoading(true);

    try {
      const authed = Boolean(await getActiveUserId());
      setLoggedIn(authed);

      if (!authed) {
        setBusinesses([]);
        setEvents([]);
        setReviewSummaries({});
        setHoursByBusinessId({});
        markHasContent(false);
        return;
      }

      const [biz, ev] = await Promise.all([
        loadFavoriteBusinesses(),
        loadInterestedEvents(),
      ]);
      setBusinesses(biz);
      setEvents(ev);
      markHasContent(biz.length > 0 || ev.length > 0);
    } catch (e) {
      console.log("Favorites load error:", e);
    } finally {
      setLoading(false);
    }
  }, [markHasContent]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const run = async () => {
        if (!hasDisplayedContentRef.current) {
          const hydrated = await hydrateFromCache();
          if (cancelled) return;
          if (!hydrated) setLoading(true);
          await refreshAll();
          lastRefreshAtRef.current = Date.now();
          return;
        }

        if (Date.now() - lastRefreshAtRef.current < FAVORITES_STALE_MS) {
          return;
        }

        lastRefreshAtRef.current = Date.now();
        await refreshAll();
      };

      void run();

      return () => {
        cancelled = true;
      };
    }, [hydrateFromCache, refreshAll])
  );

  useEffect(() => {
    if (!businesses.length) {
      setReviewSummaries({});
      setHoursByBusinessId({});
      return;
    }

    let cancelled = false;

    const enrichBusinessCards = async () => {
      const reviewPairs = await Promise.all(
        businesses.map(
          async (item) =>
            [item.id, await getBusinessReviewSummary(item.id)] as const
        )
      );

      const hoursPairs = await Promise.all(
        businesses.map(async (item) => {
          try {
            const raw = await AsyncStorage.getItem(`profile_v2_${item.id}`);
            if (!raw) return [item.id, ""] as const;
            const record = JSON.parse(raw) as Record<string, unknown>;
            const hours = getItemHoursDisplay(record);
            return [item.id, hours?.primary || ""] as const;
          } catch {
            return [item.id, ""] as const;
          }
        })
      );

      if (cancelled) return;

      setReviewSummaries(Object.fromEntries(reviewPairs));
      setHoursByBusinessId(Object.fromEntries(hoursPairs));
    };

    void enrichBusinessCards();

    return () => {
      cancelled = true;
    };
  }, [businesses]);

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

  const formatBusinessLocation = (item: FavoriteBusiness) => {
    if (item.address?.trim()) return item.address.trim();
    return [item.city, item.state].filter(Boolean).join(", ") || "Address not available";
  };

  const showSkeleton = loading && !showContent;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingBottom: 100,
        }}
      >
        <View style={{ paddingTop: 12, paddingBottom: theme.spacing.sm }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: theme.colors.charcoal,
              letterSpacing: -0.5,
            }}
          >
            Saved
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontSize: 13,
              fontWeight: "600",
              color: theme.colors.muted,
            }}
          >
            Businesses and events you care about
          </Text>
        </View>

        {!loggedIn ? (
          <View
            style={{
              marginTop: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...favoritesCardShadow,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: theme.colors.charcoal,
              }}
            >
              Log in to see your saved items
            </Text>
            <Text
              style={{
                marginTop: 6,
                color: theme.colors.muted,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              You can browse businesses and events as a guest. Sign in to save
              favorites and mark events you are interested in.
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)")}
              style={{
                marginTop: 12,
                height: 42,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.turquoise,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
                Log in
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={{
            marginTop: theme.spacing.md,
            height: 46,
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            ...favoritesCardShadow,
          }}
        >
          <Ionicons name="search-outline" size={19} color={theme.colors.turquoise} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search saved businesses and events..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              color: theme.colors.charcoal,
            }}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={19} color={theme.colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {showSkeleton ? (
          <>
            <FavoritesSkeletonSection />
            <FavoritesSkeletonSection />
          </>
        ) : null}

        <SectionTitle
          icon="heart"
          title="Saved Businesses"
          count={showSkeleton ? 0 : filteredBusinesses.length}
          accent={theme.colors.danger}
        />

        {loggedIn && !showSkeleton && filteredBusinesses.length === 0 ? (
          <EmptyHint text="Businesses you favorite will appear here." />
        ) : null}

        {!showSkeleton
          ? filteredBusinesses.map((item) => {
          const reviewLine = formatMapPreviewReviewText(reviewSummaries[item.id]);
          const hoursLine = hoursByBusinessId[item.id];

          return (
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
                  width: 64,
                  height: 64,
                  borderRadius: theme.radius.sm,
                  backgroundColor: "#eee",
                }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
                recyclingKey={`fav-biz-${item.id}`}
              />
              <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: theme.colors.charcoal,
                  }}
                >
                  {item.name || "Saved Business"}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme.colors.muted,
                  }}
                >
                  {item.category || "Local Business"}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    color: theme.colors.muted,
                  }}
                >
                  {formatBusinessLocation(item)}
                </Text>
                {reviewLine ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.colors.charcoal,
                    }}
                  >
                    {reviewLine}
                  </Text>
                ) : null}
                {hoursLine ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: reviewLine ? 2 : 4,
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.colors.turquoise,
                    }}
                  >
                    {hoursLine}
                  </Text>
                ) : null}
              </View>
              <Pressable onPress={() => removeFavorite(item.id)} hitSlop={8}>
                <Ionicons name="heart" size={22} color={theme.colors.danger} />
              </Pressable>
            </Pressable>
          );
        })
          : null}

        <SectionTitle
          icon="calendar"
          title="Interested Events"
          count={showSkeleton ? 0 : filteredEvents.length}
          accent={theme.colors.eventPurple}
        />

        {loggedIn && !showSkeleton && filteredEvents.length === 0 ? (
          <EmptyHint text="Events you mark as interested will appear here." />
        ) : null}

        {!showSkeleton
          ? filteredEvents.map((item) => (
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
                width: 64,
                height: 64,
                borderRadius: theme.radius.sm,
                backgroundColor: "#eee",
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
              recyclingKey={`fav-event-${item.id}`}
            />
            <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: theme.colors.charcoal,
                }}
              >
                {getEventTitle(item)}
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  fontWeight: "700",
                  color: theme.colors.eventPurple,
                }}
              >
                {formatEventDateTime(item)}
              </Text>
              {formatEventHostLine(item) ? (
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    color: theme.colors.muted,
                  }}
                >
                  {formatEventHostLine(item)}
                </Text>
              ) : null}
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  color: theme.colors.muted,
                }}
              >
                {formatEventLocation(item)}
              </Text>
            </View>
            <Pressable
              onPress={() => removeEvent(String(item.id))}
              hitSlop={8}
            >
              <Ionicons
                name="bookmark"
                size={22}
                color={theme.colors.eventPurple}
              />
            </Pressable>
          </Pressable>
        ))
          : null}

        {loggedIn &&
        !showSkeleton &&
        filteredBusinesses.length === 0 &&
        filteredEvents.length === 0 &&
        !q ? (
          <PremiumEmptyState />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function FavoritesSkeletonSection() {
  return (
    <View style={{ marginTop: theme.spacing.md, gap: 10 }}>
      {[0, 1].map((key) => (
        <View
          key={key}
          style={{
            flexDirection: "row",
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.md,
            padding: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: "center",
            ...favoritesCardShadow,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.softCard,
            }}
          />
          <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
            <View
              style={{
                height: 14,
                width: "68%",
                borderRadius: 6,
                backgroundColor: theme.colors.softCard,
              }}
            />
            <View
              style={{
                height: 12,
                width: "42%",
                borderRadius: 6,
                backgroundColor: theme.colors.softCard,
              }}
            />
            <View
              style={{
                height: 12,
                width: "78%",
                borderRadius: 6,
                backgroundColor: theme.colors.softCard,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

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
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: `${accent}18`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text
        style={{
          marginLeft: 10,
          fontSize: 17,
          fontWeight: "800",
          color: theme.colors.charcoal,
          flex: 1,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontWeight: "700",
          fontSize: 13,
          color: theme.colors.muted,
        }}
      >
        {count}
      </Text>
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <View
      style={{
        marginBottom: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.softCard,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text
        style={{
          color: theme.colors.muted,
          fontSize: 13,
          lineHeight: 19,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function PremiumEmptyState() {
  return (
    <View style={{ alignItems: "center", paddingTop: 40, paddingHorizontal: 12 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "rgba(239,68,68,0.10)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Ionicons name="heart-outline" size={30} color={theme.colors.danger} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: theme.colors.charcoal,
        }}
      >
        Nothing saved yet
      </Text>
      <Text
        style={{
          marginTop: 6,
          textAlign: "center",
          color: theme.colors.muted,
          fontSize: 13,
          lineHeight: 20,
          maxWidth: 280,
        }}
      >
        Favorite a business on the map or mark an event you are interested in.
      </Text>
      <Pressable
        onPress={() => router.push("/(tabs)/explore")}
        style={{
          marginTop: 16,
          height: 42,
          paddingHorizontal: 18,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.turquoise,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
          Explore businesses
        </Text>
      </Pressable>
    </View>
  );
}
