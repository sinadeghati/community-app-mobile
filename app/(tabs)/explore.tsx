import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  isEventListing,
  loadDiscoverableListings,
  matchesDiscoverySearchFilter,
  matchesListingCategory,
} from "../../lib/discoverableListings";
import { DISCOVER_LISTINGS_REFRESH_EVENT } from "../../lib/discoverListingsRefresh";
import {
  getCachedDiscoverListings,
  setCachedDiscoverListings,
} from "../../lib/discoverListingsCache";
import { logLoadedListingEventIds } from "../../lib/eventDiagnostics";
import {
  formatEventDateTime,
  getEventCover,
  getEventTitle,
} from "../../lib/mapEventDetails";
import {
  isUpcomingEvent,
  sortEventsByDate,
  type EventMapItem,
} from "../../lib/mapEvents";
import {
  loadFavoriteBusinessMap,
  toggleBusinessFavorite,
} from "../../lib/businessFavorites";
import { ensureLoggedInForSave } from "../../lib/savedActions";
import {
  formatMapPreviewReviewText,
  getBusinessReviewSummary,
  type BusinessReviewSummary,
} from "../../lib/businessReviews";
import { theme } from "../../lib/theme";
import {
  APP_LOCATION_CHANGED_EVENT,
  DEFAULT_APP_LOCATION,
  detectCurrentAppLocation,
  getLocationBarLabel,
  loadAppLocationState,
  saveSearchAppLocation,
  type AppLocationState,
} from "../../lib/appLocation";
import { listingMatchesActiveLocation } from "../../lib/activeLocationFilter";
import type { PlaceSearchSuggestion } from "../../lib/addressAutocomplete";
import { AdvancedLocationFilters } from "../../components/location/AdvancedLocationFilters";
import {
  logLoaderDone,
  logLoaderStart,
  withTimeout,
} from "../../lib/asyncGuards";

type Listing = {
  id: number | string;
  title?: string;
  name?: string;
  business_name?: string;
  category?: string;
  business_category?: string;
  city?: string;
  state?: string;
  address?: string;
  description?: string;
  price?: string | number;
  image?: string;
  image_url?: string;
  cover_image?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  rating?: number;
  reviews?: number;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1200";

const exploreCardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

const exploreHeroShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

const categories = [
  { key: "All", label: "All", icon: "apps-outline" },
  { key: "Restaurant", label: "Restaurant", icon: "restaurant-outline" },
  { key: "Cafe", label: "Cafe", icon: "cafe-outline" },
  { key: "Auto Repair", label: "Auto", icon: "car-outline" },
  { key: "Beauty", label: "Beauty", icon: "sparkles-outline" },
  { key: "Real Estate", label: "Real Estate", icon: "home-outline" },
  { key: "Events", label: "Events", icon: "calendar-outline" },
  { key: "Services", label: "Services", icon: "briefcase-outline" },
];

const getId = (item: Listing) => String(item?.id || "");

const getTitle = (item: Listing) =>
  item?.business_name || item?.name || item?.title || "Local Business";

const getCategory = (item: Listing) =>
  item?.business_category || item?.category || "Local Business";

const getImage = (item: Listing) =>
  item?.cover_image || item?.image_url || item?.image || FALLBACK_IMAGE;

const getAddress = (item: Listing) =>
  item?.address || [item?.city, item?.state].filter(Boolean).join(", ");

const isFeatured = (item: Listing) =>
  Boolean(item?.is_featured || item?.business_name || item?.cover_image);

type ExploreItemType = "business" | "event";

const goProfile = (item: Listing) => {
  router.push({
    pathname: "/profile/v2",
    params: { id: getId(item) },
  });
};

const FEATURED_CARD_WIDTH = 168;
const FEATURED_IMAGE_HEIGHT = 116;
const CARD_WIDTH = 154;
const CARD_IMAGE_HEIGHT = 100;
const REVIEW_LINE_MIN_HEIGHT = 18;

type ExploreBusinessCardProps = {
  item: Listing;
  large?: boolean;
  saved: boolean;
  reviewLine: string;
  onPress: (item: Listing) => void;
  onToggleFavorite: (item: Listing) => void;
};

const ExploreBusinessCard = React.memo(function ExploreBusinessCard({
  item,
  large = false,
  saved,
  reviewLine,
  onPress,
  onToggleFavorite,
}: ExploreBusinessCardProps) {
  const imageUri = getImage(item);
  const cardWidth = large ? FEATURED_CARD_WIDTH : CARD_WIDTH;
  const imageHeight = large ? FEATURED_IMAGE_HEIGHT : CARD_IMAGE_HEIGHT;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={{
        width: cardWidth,
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        marginRight: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...exploreCardShadow,
      }}
    >
      <Image
        recyclingKey={`explore-card-${getId(item)}`}
        source={{ uri: imageUri }}
        style={{
          width: cardWidth,
          height: imageHeight,
          backgroundColor: "#eee",
        }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />

      <Pressable
        onPress={() => onToggleFavorite(item)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: "rgba(255,255,255,0.94)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(229,231,235,0.9)",
        }}
      >
        <Ionicons
          name={saved ? "heart" : "heart-outline"}
          size={19}
          color={saved ? theme.colors.danger : theme.colors.charcoal}
        />
      </Pressable>

      <View style={{ padding: 11, minHeight: large ? 88 : 82 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: large ? 15 : 14,
              fontWeight: "800",
              color: theme.colors.charcoal,
            }}
          >
            {getTitle(item)}
          </Text>

          {item.is_verified ? (
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={theme.colors.turquoise}
            />
          ) : null}
        </View>

        <Text
          numberOfLines={1}
          style={{
            marginTop: 3,
            color: theme.colors.muted,
            fontSize: 12,
            fontWeight: "600",
          }}
        >
          {getCategory(item)}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            marginTop: 6,
            minHeight: REVIEW_LINE_MIN_HEIGHT,
            fontSize: 12,
            fontWeight: "600",
            color: reviewLine ? theme.colors.charcoal : "transparent",
          }}
        >
          {reviewLine || " "}
        </Text>
      </View>
    </Pressable>
  );
});

export default function ExploreScreen() {
  const cachedOnMount = getCachedDiscoverListings();
  const hasDisplayedListingsRef = useRef(Boolean(cachedOnMount?.length));
  const lastListingsRefreshAtRef = useRef(0);
  const LISTINGS_STALE_MS = 30_000;
  const [listings, setListings] = useState<Listing[]>(
    () => (cachedOnMount as Listing[] | null) ?? []
  );
  const [loading, setLoading] = useState(!hasDisplayedListingsRef.current);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [reviewSummaries, setReviewSummaries] = useState<
    Record<string, BusinessReviewSummary>
  >({});
  const [locationState, setLocationState] =
    useState<AppLocationState>(DEFAULT_APP_LOCATION);
  const [locating, setLocating] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const favoritePendingRef = useRef<Set<string>>(new Set());

  const selectedLocation = locationState.regionLabel;
  const isSearchMode = search.trim().length > 0;
  const locationBarLabel = getLocationBarLabel(locationState);

  const syncReviewSummaries = useCallback(async (items: Listing[]) => {
    const ids = [...new Set(items.map(getId).filter(Boolean))];
    if (!ids.length) return;

    const pairs = await Promise.all(
      ids.map(async (id) => [id, await getBusinessReviewSummary(id)] as const)
    );

    setReviewSummaries((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [id, summary] of pairs) {
        if (prev[id] !== summary) {
          next[id] = summary;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const loadFavorites = async () => {
    try {
      setFavorites(await loadFavoriteBusinessMap());
    } catch (e) {
      console.log("Explore favorites load error:", e);
    }
  };

  const refreshCurrentLocation = useCallback(
    async (options?: { showFallbackPicker?: boolean }) => {
      setLocating(true);
      try {
        const result = await detectCurrentAppLocation();
        if (result.ok) {
          setLocationState(result.state);
          return true;
        }

        if (options?.showFallbackPicker) {
          if (result.reason === "permission_denied") {
            Alert.alert(
              "Location permission needed",
              "Allow location access to show businesses near you, or search for a city or region instead.",
              [
                {
                  text: "Search city",
                  onPress: () => setLocationPickerVisible(true),
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          } else {
            Alert.alert(
              "Location unavailable",
              "We could not detect your current location. Search for a city or region instead.",
              [
                {
                  text: "Search city",
                  onPress: () => setLocationPickerVisible(true),
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          }
        }

        return false;
      } finally {
        setLocating(false);
      }
    },
    []
  );

  const syncLocationState = useCallback(async () => {
    setLocationState(await loadAppLocationState());
  }, []);

  useEffect(() => {
    loadListings();
    void (async () => {
      logLoaderStart("explore.location");
      try {
        const stored = await loadAppLocationState();
        setLocationState(stored);
        if (stored.source === "current") {
          await withTimeout(
            refreshCurrentLocation(),
            10000,
            "explore.detectCurrentLocation",
            false
          );
        }
      } finally {
        logLoaderDone("explore.location");
      }
    })();
  }, [refreshCurrentLocation]);

  const refreshListings = useCallback(async () => {
    try {
      const data = await loadDiscoverableListings();
      logLoadedListingEventIds("explore", data);
      setCachedDiscoverListings(data);
      if (data.length) hasDisplayedListingsRef.current = true;
      setListings(data);
      void syncReviewSummaries(data);
    } catch (e) {
      console.log("Explore refresh listings error:", e);
    }
  }, [syncReviewSummaries]);

  useFocusEffect(
    useCallback(() => {
      void syncLocationState();
      loadFavorites();
      if (
        hasDisplayedListingsRef.current &&
        Date.now() - lastListingsRefreshAtRef.current >= LISTINGS_STALE_MS
      ) {
        lastListingsRefreshAtRef.current = Date.now();
        void refreshListings();
      }
    }, [syncLocationState, refreshListings])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      DISCOVER_LISTINGS_REFRESH_EVENT,
      () => {
        void refreshListings();
      }
    );
    return () => sub.remove();
  }, [refreshListings]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      APP_LOCATION_CHANGED_EVENT,
      () => {
        void syncLocationState();
      }
    );
    return () => sub.remove();
  }, [syncLocationState]);

  const applyPlaceSearch = async (place: PlaceSearchSuggestion) => {
    const next = await saveSearchAppLocation(place.label, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setLocationState(next);
    setLocationPickerVisible(false);
  };

  const loadListings = async () => {
    logLoaderStart("explore.loadListings");
    const showBlockingLoader = !hasDisplayedListingsRef.current;
    if (showBlockingLoader) setLoading(true);

    try {
      const data = await withTimeout(
        loadDiscoverableListings(),
        15000,
        "explore.loadListings",
        hasDisplayedListingsRef.current
          ? (getCachedDiscoverListings() ?? [])
          : []
      );
      logLoadedListingEventIds("explore", data);
      setCachedDiscoverListings(data);
      if (data.length) hasDisplayedListingsRef.current = true;
      setListings(data);
      void syncReviewSummaries(data);
      void loadFavorites();
    } catch (e) {
      console.log("[loader] explore.loadListings error:", e);
      if (!hasDisplayedListingsRef.current) setListings([]);
    } finally {
      logLoaderDone("explore.loadListings");
      setLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (item: Listing) => {
    const id = getId(item);
    if (!id || favoritePendingRef.current.has(id)) return;

    let previous = false;
    setFavorites((prev) => {
      previous = Boolean(prev[id]);
      return { ...prev, [id]: !previous };
    });

    favoritePendingRef.current.add(id);

    try {
      const allowed = await ensureLoggedInForSave(
        previous ? "manage your favorites" : "save businesses"
      );
      if (!allowed) {
        setFavorites((prev) => ({ ...prev, [id]: previous }));
        return;
      }

      const next = await toggleBusinessFavorite(item, previous);
      setFavorites((prev) => ({ ...prev, [id]: next }));
    } catch (e) {
      console.log("Explore favorite toggle error:", e);
      setFavorites((prev) => ({ ...prev, [id]: previous }));
    } finally {
      favoritePendingRef.current.delete(id);
    }
  }, []);

  const openEvent = useCallback((item: Listing) => {
    router.push({
      pathname: "/event/[id]",
      params: { id: getId(item) },
    });
  }, []);

  const handleBusinessCardPress = useCallback(
    (item: Listing) => {
      if (isEventListing(item)) {
        openEvent(item);
        return;
      }
      goProfile(item);
    },
    [openEvent]
  );

  const locationListings = useMemo(
    () =>
      listings.filter((item) =>
        listingMatchesActiveLocation(item, locationState)
      ),
    [listings, locationState]
  );

  const browseListings = useMemo(
    () =>
      locationListings.filter((item) =>
        matchesListingCategory(item, selectedCategory)
      ),
    [locationListings, selectedCategory]
  );

  const searchResults = useMemo(
    () =>
      locationListings.filter((item) =>
        matchesDiscoverySearchFilter(item, search)
      ),
    [locationListings, search]
  );

  const browseBusinessListings = useMemo(
    () => browseListings.filter((item) => !isEventListing(item)),
    [browseListings]
  );

  const upcomingEventListings = useMemo(
    () =>
      browseListings.filter(
        (item) =>
          isEventListing(item) && isUpcomingEvent(item as EventMapItem)
      ) as EventMapItem[],
    [browseListings]
  );

  const featured = useMemo(() => {
    const list = browseBusinessListings.filter(isFeatured);
    return list.length ? list.slice(0, 6) : browseBusinessListings.slice(0, 6);
  }, [browseBusinessListings]);

  const popular = useMemo(
    () =>
      browseBusinessListings.slice(0, 8).map((item) => ({
        item,
        type: "business" as const,
      })),
    [browseBusinessListings]
  );

  const searchListEntries = useMemo(
    () =>
      searchResults.map((item) => ({
        item,
        type: (isEventListing(item) ? "event" : "business") as ExploreItemType,
      })),
    [searchResults]
  );

  const listEntries = isSearchMode ? searchListEntries : popular;

  const locationEvents = useMemo(
    () => sortEventsByDate(upcomingEventListings).slice(0, 6),
    [upcomingEventListings]
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 18,
          fontWeight: "800",
          color: theme.colors.charcoal,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
    </View>
  );

  const CategoryPill = ({ item }: { item: any }) => {
    const active = selectedCategory === item.key;

    return (
      <Pressable
        onPress={() => setSelectedCategory(item.key)}
        style={{
          width: 80,
          height: 72,
          borderRadius: theme.radius.md,
          backgroundColor: active ? "rgba(13,148,136,0.10)" : theme.colors.card,
          borderWidth: 1,
          borderColor: active ? "rgba(13,148,136,0.28)" : theme.colors.border,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
          ...exploreCardShadow,
        }}
      >
        <Ionicons
          name={item.icon as any}
          size={22}
          color={active ? theme.colors.turquoise : theme.colors.charcoal}
        />
        <Text
          numberOfLines={1}
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: "700",
            color: theme.colors.charcoal,
          }}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  const PopularRow = ({
    item,
    type,
  }: {
    item: Listing;
    type: ExploreItemType;
  }) => {
    const id = getId(item);
    const isEvent = type === "event";
    const saved = favorites[id];
    const reviewLine = formatMapPreviewReviewText(reviewSummaries[id]);
    const eventItem = item as EventMapItem;

    return (
      <Pressable
        onPress={() => (isEvent ? openEvent(item) : goProfile(item))}
        style={{
          marginHorizontal: theme.spacing.md,
          marginBottom: 10,
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          padding: 10,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...exploreCardShadow,
        }}
      >
        <Image
          recyclingKey={`explore-popular-${type}-${id}`}
          source={{
            uri: isEvent ? getEventCover(eventItem) : getImage(item),
          }}
          style={{
            width: 60,
            height: 60,
            borderRadius: theme.radius.sm,
            backgroundColor: "#eee",
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={isEvent ? 2 : 1}
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: theme.colors.charcoal,
            }}
          >
            {isEvent ? getEventTitle(eventItem) : getTitle(item)}
          </Text>

          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              color: isEvent ? theme.colors.eventPurple : theme.colors.muted,
              fontSize: 12,
              fontWeight: isEvent ? "700" : "600",
            }}
          >
            {isEvent ? formatEventDateTime(eventItem) : getCategory(item)}
          </Text>

          {!isEvent && reviewLine ? (
            <Text
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
        </View>

        {!isEvent ? (
          <Pressable onPress={() => toggleFavorite(item)} hitSlop={8}>
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={22}
              color={saved ? theme.colors.danger : theme.colors.charcoal}
            />
          </Pressable>
        ) : (
          <Ionicons
            name="calendar-outline"
            size={22}
            color={theme.colors.eventPurple}
          />
        )}
      </Pressable>
    );
  };

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
      <FlatList
        data={listEntries}
        keyExtractor={(entry) => `${entry.type}-${getId(entry.item)}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingTop: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: theme.colors.charcoal,
                  letterSpacing: -0.5,
                }}
              >
                Explore
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  color: theme.colors.muted,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Discover the heart of your community
              </Text>

              <View
                style={{
                  marginTop: theme.spacing.sm,
                  height: 42,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 6,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  ...exploreCardShadow,
                }}
              >
                <Pressable
                  onPress={() => void refreshCurrentLocation({ showFallbackPicker: true })}
                  disabled={locating}
                  hitSlop={6}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: locating ? 0.65 : 1,
                  }}
                >
                  {locating ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.turquoise}
                    />
                  ) : (
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={theme.colors.turquoise}
                    />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setLocationPickerVisible(true)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingRight: 8,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      marginLeft: 2,
                      fontSize: 14,
                      fontWeight: "700",
                      color: theme.colors.charcoal,
                    }}
                  >
                    {locationBarLabel}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={theme.colors.muted}
                  />
                </Pressable>
              </View>

              <View
                style={{
                  marginTop: theme.spacing.sm,
                  height: 46,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  ...exploreCardShadow,
                }}
              >
                <Ionicons
                  name="search-outline"
                  size={19}
                  color={theme.colors.turquoise}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search businesses, services, events..."
                  placeholderTextColor="#9CA3AF"
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 14,
                    color: theme.colors.charcoal,
                  }}
                />
                {search.length > 0 ? (
                  <Pressable onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={19} color="#999" />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View
              style={{
                marginTop: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
              }}
            >
              <ImageBackground
                source={{ uri: HERO_IMAGE }}
                imageStyle={{ borderRadius: theme.radius.md }}
                style={{
                  height: 168,
                  borderRadius: theme.radius.md,
                  overflow: "hidden",
                  ...exploreHeroShadow,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(6,31,36,0.52)",
                    padding: 18,
                    justifyContent: "flex-end",
                  }}
                >
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "rgba(13,148,136,0.92)",
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: theme.radius.pill,
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: "800",
                        letterSpacing: 0.4,
                      }}
                    >
                      PERSIAN COMMUNITY
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 22,
                      lineHeight: 28,
                      fontWeight: "800",
                      width: "90%",
                    }}
                  >
                    Persian businesses & events near you
                  </Text>

                  <Text
                    style={{
                      marginTop: 6,
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 13,
                      lineHeight: 19,
                      width: "92%",
                    }}
                  >
                    Local businesses, events, services, and culture on the map.
                  </Text>

                  <Pressable
                    onPress={() => router.push("/(tabs)/map")}
                    style={{
                      marginTop: 12,
                      alignSelf: "flex-start",
                      backgroundColor: theme.colors.turquoise,
                      borderRadius: theme.radius.sm,
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
                      Open Map
                    </Text>
                  </Pressable>
                </View>
              </ImageBackground>
            </View>

            {!isSearchMode ? (
              <>
            <SectionHeader title="Popular Categories" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: theme.spacing.md,
                paddingRight: 8,
              }}
            >
              {categories.map((item) => (
                <CategoryPill key={item.key} item={item} />
              ))}
            </ScrollView>
              </>
            ) : null}

            {!isSearchMode ? (
              <>
            <SectionHeader title="Featured Businesses" />
            {featured.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingLeft: theme.spacing.md,
                  paddingRight: 8,
                }}
              >
                {featured.map((item) => {
                  const id = getId(item);
                  return (
                    <ExploreBusinessCard
                      key={`featured-${id}`}
                      item={item}
                      large
                      saved={Boolean(favorites[id])}
                      reviewLine={formatMapPreviewReviewText(
                        reviewSummaries[id]
                      )}
                      onPress={handleBusinessCardPress}
                      onToggleFavorite={toggleFavorite}
                    />
                  );
                })}
              </ScrollView>
            ) : (
              <Text
                style={{
                  marginHorizontal: theme.spacing.md,
                  color: theme.colors.muted,
                  fontSize: 13,
                  lineHeight: 20,
                }}
              >
                {`No featured businesses in ${selectedLocation} yet.`}
              </Text>
            )}

            <SectionHeader title="Upcoming Events" />
            {locationEvents.length > 0 ? (
              <View style={{ paddingHorizontal: theme.spacing.md, gap: 10 }}>
                {locationEvents.map((item) => (
                  <Pressable
                    key={`event-${getId(item)}`}
                    onPress={() => openEvent(item)}
                    style={{
                      borderRadius: theme.radius.md,
                      overflow: "hidden",
                      backgroundColor: theme.colors.card,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      ...exploreCardShadow,
                    }}
                  >
                    <ImageBackground
                      source={{
                        uri: getEventCover(item as EventMapItem),
                      }}
                      style={{ height: 118 }}
                      resizeMode="cover"
                    >
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(15,43,51,0.45)",
                          padding: 14,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 17,
                            fontWeight: "800",
                          }}
                          numberOfLines={2}
                        >
                          {getEventTitle(item as EventMapItem)}
                        </Text>
                        <Text
                          style={{
                            marginTop: 4,
                            color: "rgba(255,255,255,0.9)",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {formatEventDateTime(item as EventMapItem)}
                        </Text>
                      </View>
                    </ImageBackground>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text
                style={{
                  marginHorizontal: theme.spacing.md,
                  color: theme.colors.muted,
                  fontSize: 13,
                  lineHeight: 20,
                }}
              >
                {`No upcoming events in ${selectedLocation} yet.`}
              </Text>
            )}
              </>
            ) : null}

            <SectionHeader
              title={isSearchMode ? "Search Results" : "Popular This Week"}
            />
          </>
        }
        renderItem={({ item: entry }) => (
          <PopularRow item={entry.item} type={entry.type} />
        )}
        ListEmptyComponent={
          isSearchMode ? (
            <View
              style={{
                alignItems: "center",
                paddingTop: 56,
                paddingHorizontal: theme.spacing.lg,
              }}
            >
              <Ionicons
                name="search-outline"
                size={36}
                color={theme.colors.turquoise}
              />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 17,
                  fontWeight: "800",
                  color: theme.colors.charcoal,
                }}
              >
                No results found
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  color: theme.colors.muted,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {`Nothing matches "${search.trim()}". Try another business name, category, or event.`}
              </Text>
            </View>
          ) : (
            <View
              style={{
                alignItems: "center",
                paddingTop: 56,
                paddingHorizontal: theme.spacing.lg,
              }}
            >
              <Ionicons
                name="search-outline"
                size={36}
                color={theme.colors.turquoise}
              />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 17,
                  fontWeight: "800",
                  color: theme.colors.charcoal,
                }}
              >
                No businesses found
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  color: theme.colors.muted,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {`No businesses in ${selectedLocation} yet. Try another location or category.`}
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={locationPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: 18,
              paddingBottom: 28,
              maxHeight: "70%",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: theme.colors.charcoal,
                marginBottom: 4,
              }}
            >
              Change location
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.muted,
                marginBottom: 14,
              }}
            >
              Search any city or region, or use your current location.
            </Text>

            <AdvancedLocationFilters
              locationState={locationState}
              locating={locating}
              onCurrentLocation={() => {
                void (async () => {
                  const ok = await refreshCurrentLocation({
                    showFallbackPicker: true,
                  });
                  if (ok) setLocationPickerVisible(false);
                })();
              }}
              onPlaceSelected={(place) => {
                void applyPlaceSearch(place);
              }}
            />

            <Pressable
              onPress={() => setLocationPickerVisible(false)}
              style={{
                marginTop: 8,
                height: 46,
                borderRadius: 14,
                backgroundColor: theme.colors.softCard,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: theme.colors.charcoal,
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}