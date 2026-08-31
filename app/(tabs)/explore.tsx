import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  loadDiscoverableListings,
  matchesListingCategory,
} from "../../lib/discoverableListings";
import { DISCOVER_LISTINGS_REFRESH_EVENT } from "../../lib/discoverListingsRefresh";
import {
  getCachedDiscoverListings,
  sanitizeCachedDiscoverListings,
  setCachedDiscoverListings,
} from "../../lib/discoverListingsCache";
import { runDevStagingDiscoverCleanup } from "../../lib/discoverCacheCleanup";
import { logDiscoverIdStage, logDiscoverListStage, logExploreUiStage } from "../../lib/discoverListTrace";
import { logLoadedListingEventIds } from "../../lib/eventDiagnostics";
import {
  isMapEvent,
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
  getBusinessReviewSummary,
  type BusinessReviewSummary,
} from "../../lib/businessReviews";
import { theme } from "../../lib/theme";
import {
  APP_LOCATION_CHANGED_EVENT,
  DEFAULT_APP_LOCATION,
  bootstrapAppLocation,
  detectCurrentAppLocation,
  getLocationBarLabel,
  loadAppLocationState,
  saveSearchAppLocation,
  type AppLocationState,
} from "../../lib/appLocation";
import {
  listingMatchesActiveLocation,
  listingMatchesDiscoveryLocation,
  matchesDiscoverySearchQuery,
} from "../../lib/activeLocationFilter";
import type { PlaceSearchSuggestion } from "../../lib/addressAutocomplete";
import { AdvancedLocationFilters } from "../../components/location/AdvancedLocationFilters";
import {
  logLoaderDone,
  logLoaderStart,
  withTimeout,
} from "../../lib/asyncGuards";
import { CategoryIconBadge } from "../../components/category/CategoryIconBadge";
import { ExploreBusinessCard } from "../../components/explore/ExploreBusinessCard";
import { ExploreEventCard } from "../../components/explore/ExploreEventCard";
import { ExploreFadeIn } from "../../components/explore/ExploreFadeIn";
import { ExplorePopularRow } from "../../components/explore/ExplorePopularRow";
import { explorePremium } from "../../components/explore/explorePremiumTokens";
import { getCategoryChipVisual } from "../../lib/categoryChipTheme";
import { QUICK_DISCOVERY_CATEGORY_CHIPS } from "../../lib/discoverySearch";
import { useTranslation } from "../../lib/i18n";

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

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1200";

const categories = [...QUICK_DISCOVERY_CATEGORY_CHIPS];

const CATEGORY_CHIP_LABEL_KEYS: Record<string, string> = {
  All: "explore.categories.all",
  Restaurant: "explore.categories.food",
  Cafe: "explore.categories.cafe",
  "Auto Repair": "explore.categories.auto",
  Beauty: "explore.categories.beauty",
  Events: "explore.categories.events",
  Services: "explore.categories.services",
  "Real Estate": "explore.categories.realEstate",
  Legal: "explore.categories.legal",
  Medical: "explore.categories.medical",
  Insurance: "explore.categories.insurance",
  "Home Catering": "explore.categories.homeCatering",
};

const getId = (item: Listing) => String(item?.id || "");

const traceExploreSetListings = (source: string, items: Listing[]) => {
  logDiscoverListStage(`5_setListings:${source}`, items, { source });
  logExploreUiStage("setListings", items, {
    source: `explore.tsx → setListings (${source})`,
  });
};

const listingIds = (items: Listing[]) =>
  items.map((item) => getId(item)).filter(Boolean);

const isFeatured = (item: Listing) =>
  Boolean(item?.is_featured || item?.business_name || item?.cover_image);

type ExploreItemType = "business" | "event";

const goProfile = (item: Listing) => {
  router.push({
    pathname: "/profile/v2",
    params: { id: getId(item) },
  });
};

export default function ExploreScreen() {
  const { t, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const titleAlign = isRTL ? "right" : "left";
  const cachedOnMount = getCachedDiscoverListings();
  const hasDisplayedListingsRef = useRef(Boolean(cachedOnMount?.length));
  const lastListingsRefreshAtRef = useRef(0);
  const LISTINGS_STALE_MS = 30_000;
  const [listings, setListings] = useState<Listing[]>(() => {
    const initial = (cachedOnMount as Listing[] | null) ?? [];
    logExploreUiStage("setListings_initialState", initial, {
      source: "explore.tsx:308 useState initializer (getCachedDiscoverListings)",
    });
    return initial;
  });
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
  const heroCardHeight =
    Platform.OS === "android"
      ? explorePremium.heroHeight + 28
      : explorePremium.heroHeight;
  const androidHeroTextMetrics =
    Platform.OS === "android" ? ({ includeFontPadding: false } as const) : {};

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
              t("explore.locationPermission"),
              t("explore.locationPermissionBody"),
              [
                {
                  text: t("common.searchCity"),
                  onPress: () => setLocationPickerVisible(true),
                },
                { text: t("common.cancel"), style: "cancel" },
              ]
            );
          } else {
            Alert.alert(
              t("explore.locationUnavailable"),
              t("explore.locationUnavailableBody"),
              [
                {
                  text: t("common.searchCity"),
                  onPress: () => setLocationPickerVisible(true),
                },
                { text: t("common.cancel"), style: "cancel" },
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
    void (async () => {
      await runDevStagingDiscoverCleanup();
      const sanitized = await sanitizeCachedDiscoverListings();
      if (!sanitized.length) return;

      const allowedIds = new Set(
        sanitized.map((item) => String((item as { id?: unknown }).id ?? ""))
      );

      setListings((prev) => {
        const next = prev.filter((item) => allowedIds.has(getId(item)));
        if (next.length !== prev.length) {
          logExploreUiStage("setListings", next, {
            source:
              "explore.tsx:417 useEffect → sanitizeCachedDiscoverListings filter",
            inputIds: listingIds(prev),
            removedIds: listingIds(prev).filter((id) => !allowedIds.has(id)),
          });
        }
        return next.length === prev.length ? prev : next;
      });
    })();
  }, []);

  useEffect(() => {
    loadListings();
    void (async () => {
      logLoaderStart("explore.location");
      try {
        const state = await withTimeout(
          bootstrapAppLocation(),
          12000,
          "explore.bootstrapAppLocation",
          DEFAULT_APP_LOCATION
        );
        setLocationState(state);
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
      traceExploreSetListings("refreshListings", data);
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
      traceExploreSetListings("loadListings", data);
      setListings(data);
      void syncReviewSummaries(data);
      void loadFavorites();
    } catch (e) {
      console.log("[loader] explore.loadListings error:", e);
      if (!hasDisplayedListingsRef.current) {
        logExploreUiStage("setListings", [], {
          source: "explore.tsx:522 loadListings catch → setListings([])",
        });
        setListings([]);
      }
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
      if (isMapEvent(item)) {
        openEvent(item);
        return;
      }
      goProfile(item);
    },
    [openEvent]
  );

  const locationListings = useMemo(() => {
    const result = listings.filter((item) =>
      listingMatchesActiveLocation(item, locationState)
    );
    const resultIdSet = new Set(listingIds(result));
    const removedIds = listingIds(listings).filter((id) => !resultIdSet.has(id));
    logExploreUiStage("locationListings", result, {
      source:
        "explore.tsx:578-583 useMemo → listings.filter(listingMatchesActiveLocation)",
      inputIds: listingIds(listings),
      removedIds,
      extra: {
        filterFunction: "listingMatchesActiveLocation",
        filterFile: "lib/activeLocationFilter.ts:129",
        regionLabel: locationState.regionLabel,
        radiusKm: locationState.radiusKm,
        locationSource: locationState.source,
      },
    });
    return result;
  }, [listings, locationState]);

  const browseListings = useMemo(() => {
    const result = locationListings.filter((item) =>
      matchesListingCategory(item, selectedCategory)
    );
    const resultIdSet = new Set(listingIds(result));
    const removedIds = listingIds(locationListings).filter(
      (id) => !resultIdSet.has(id)
    );
    logExploreUiStage("browseListings", result, {
      source:
        "explore.tsx:586-591 useMemo → locationListings.filter(matchesListingCategory)",
      inputIds: listingIds(locationListings),
      removedIds,
      extra: { selectedCategory },
    });
    return result;
  }, [locationListings, selectedCategory]);

  const searchResults = useMemo(
    () =>
      listings.filter(
        (item) =>
          listingMatchesDiscoveryLocation(item, locationState, {
            searchQuery: search,
          }) && matchesDiscoverySearchQuery(item, search)
      ),
    [listings, locationState, search]
  );

  const browseBusinessListings = useMemo(() => {
    const result = browseListings.filter((item) => !isMapEvent(item));
    const resultIdSet = new Set(listingIds(result));
    const removedIds = listingIds(browseListings).filter(
      (id) => !resultIdSet.has(id)
    );
    logExploreUiStage("browseBusinessListings", result, {
      source:
        "explore.tsx:605-607 useMemo → browseListings.filter(!isMapEvent)",
      inputIds: listingIds(browseListings),
      removedIds,
    });
    return result;
  }, [browseListings]);

  const upcomingEventListings = useMemo(
    () =>
      browseListings.filter(
        (item) =>
          isMapEvent(item) && isUpcomingEvent(item as EventMapItem)
      ) as EventMapItem[],
    [browseListings]
  );

  const featured = useMemo(() => {
    const list = browseBusinessListings.filter(isFeatured);
    return list.length ? list.slice(0, 6) : browseBusinessListings.slice(0, 6);
  }, [browseBusinessListings]);

  const popular = useMemo(() => {
    const sliced = browseBusinessListings.slice(0, 8);
    const removedIds = listingIds(browseBusinessListings).filter(
      (id) => !new Set(listingIds(sliced)).has(id)
    );
    const result = sliced.map((item) => ({
      item,
      type: "business" as const,
    }));
    logExploreUiStage("popular", result.map((entry) => entry.item), {
      source:
        "explore.tsx:624-630 useMemo → browseBusinessListings.slice(0, 8)",
      inputIds: listingIds(browseBusinessListings),
      removedIds,
      extra: { sliceLimit: 8 },
    });
    return result;
  }, [browseBusinessListings]);

  const searchListEntries = useMemo(
    () =>
      searchResults.map((item) => ({
        item,
        type: (isMapEvent(item) ? "event" : "business") as ExploreItemType,
      })),
    [searchResults]
  );

  const listEntries = isSearchMode ? searchListEntries : popular;

  useEffect(() => {
    const flatListBusinessIds = listEntries
      .filter((entry) => entry.type === "business")
      .map((entry) => getId(entry.item))
      .filter(Boolean);

    logExploreUiStage(
      "flatList_data",
      listEntries.map((entry) => entry.item),
      {
        source: isSearchMode
          ? "explore.tsx:642 listEntries = searchListEntries (search mode)"
          : "explore.tsx:642 listEntries = popular (browse mode)",
        inputIds: listingIds(listings),
        extra: {
          isSearchMode,
          flatListBusinessIds,
          listingsStateCount: listings.length,
        },
      }
    );

    logDiscoverIdStage("6_explore_flatlist_render", flatListBusinessIds, {
      flatListEntryCount: listEntries.length,
      listingsStateCount: listings.length,
      locationListingsCount: locationListings.length,
      browseBusinessListingsCount: browseBusinessListings.length,
      popularCount: popular.length,
      isSearchMode,
      selectedCategory,
    });
  }, [
    listEntries,
    listings.length,
    locationListings.length,
    browseBusinessListings.length,
    popular.length,
    isSearchMode,
    selectedCategory,
  ]);

  const locationEvents = useMemo(
    () => sortEventsByDate(upcomingEventListings).slice(0, 6),
    [upcomingEventListings]
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: explorePremium.horizontalPad,
        marginTop: explorePremium.sectionTop,
        marginBottom: explorePremium.sectionBottom,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 22,
          fontWeight: "800",
          color: theme.colors.charcoal,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );

  const CategoryPill = ({ item }: { item: any }) => {
    const active = selectedCategory === item.key;
    const visual = getCategoryChipVisual(item.key);

    return (
      <Pressable
        onPress={() => setSelectedCategory(item.key)}
        style={({ pressed }) => [
          {
            width: 94,
            height: 102,
            borderRadius: explorePremium.cardRadius,
            backgroundColor: active ? "#FFFFFF" : theme.colors.card,
            borderWidth: active ? 2 : 1,
            borderColor: active ? theme.colors.turquoise : "rgba(226,232,240,0.95)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 6,
            marginRight: 12,
            ...(active ? explorePremium.shadow.card : explorePremium.shadow.cardSoft),
            transform: [{ scale: pressed ? 0.97 : active ? 1.02 : 1 }],
          },
        ]}
      >
        <CategoryIconBadge visual={visual} size="regular" active={active} />
        <Text
          numberOfLines={1}
          style={{
            marginTop: 10,
            fontSize: 12,
            fontWeight: "700",
            color: active ? theme.colors.turquoise : theme.colors.charcoal,
          }}
        >
          {CATEGORY_CHIP_LABEL_KEYS[item.key]
            ? t(CATEGORY_CHIP_LABEL_KEYS[item.key])
            : item.label}
        </Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F9FA" }}>
      <FlatList
        data={listEntries}
        keyExtractor={(entry) => `${entry.type}-${getId(entry.item)}`}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={{ paddingBottom: 108 }}
        ListHeaderComponent={
          <>
            <ExploreFadeIn>
              <View
                style={{
                  paddingHorizontal: explorePremium.horizontalPad,
                  paddingTop: Platform.OS === "android" ? insets.top + 16 : 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 34,
                    fontWeight: "800",
                    color: theme.colors.charcoal,
                    letterSpacing: -0.8,
                    textAlign: titleAlign,
                  }}
                >
                  {t("explore.title")}
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: theme.colors.muted,
                    fontSize: 15,
                    fontWeight: "600",
                    lineHeight: 22,
                    textAlign: titleAlign,
                  }}
                >
                  {t("explore.subtitle")}
                </Text>

                <View
                  style={{
                    marginTop: 18,
                    height: 50,
                    borderRadius: 16,
                    backgroundColor: "#FFFFFF",
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 8,
                    borderWidth: 1,
                    borderColor: "rgba(226,232,240,0.95)",
                    ...explorePremium.shadow.cardSoft,
                  }}
                >
                  <Pressable
                    onPress={() => void refreshCurrentLocation({ showFallbackPicker: true })}
                    disabled={locating}
                    hitSlop={6}
                    style={({ pressed }) => ({
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: pressed
                        ? "rgba(13,148,136,0.08)"
                        : "rgba(13,148,136,0.06)",
                      opacity: locating ? 0.65 : 1,
                    })}
                  >
                    {locating ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.turquoise}
                      />
                    ) : (
                      <Ionicons
                        name="location-outline"
                        size={19}
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
                        marginLeft: 4,
                        fontSize: 15,
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
                    marginTop: 12,
                    height: 54,
                    borderRadius: 16,
                    backgroundColor: "#FFFFFF",
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "rgba(226,232,240,0.95)",
                    ...explorePremium.shadow.cardSoft,
                  }}
                >
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={theme.colors.turquoise}
                  />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t("explore.searchPlaceholder")}
                    placeholderTextColor="#9CA3AF"
                    style={{
                      flex: 1,
                      marginLeft: 10,
                      fontSize: 15,
                      color: theme.colors.charcoal,
                      fontWeight: "500",
                    }}
                  />
                  {search.length > 0 ? (
                    <Pressable onPress={() => setSearch("")} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </ExploreFadeIn>

            <ExploreFadeIn delay={60}>
              <View
                style={{
                  marginTop: 20,
                  paddingHorizontal: explorePremium.horizontalPad,
                }}
              >
                <ImageBackground
                  source={{ uri: HERO_IMAGE }}
                  imageStyle={{ borderRadius: explorePremium.cardRadiusLg }}
                  style={{
                    height: heroCardHeight,
                    borderRadius: explorePremium.cardRadiusLg,
                    overflow: "hidden",
                    ...explorePremium.shadow.hero,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      backgroundColor: "rgba(6,31,36,0.22)",
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(6,31,36,0.38)",
                      paddingHorizontal: 22,
                      paddingVertical: 22,
                      justifyContent: "flex-end",
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "78%",
                        backgroundColor: "rgba(4,24,30,0.55)",
                      }}
                    />

                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "rgba(0,194,184,0.95)",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: explorePremium.pillRadius,
                        marginBottom: 14,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: "800",
                          letterSpacing: 0.8,
                          textTransform: "uppercase",
                          ...androidHeroTextMetrics,
                        }}
                      >
                        {t("explore.communityBadge")}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 28,
                        lineHeight: 34,
                        fontWeight: "800",
                        letterSpacing: -0.6,
                        width: "92%",
                        ...androidHeroTextMetrics,
                      }}
                    >
                      {t("explore.heroTitle")}
                    </Text>

                    <Text
                      style={{
                        marginTop: 8,
                        color: "rgba(255,255,255,0.92)",
                        fontSize: 15,
                        lineHeight: 22,
                        width: "94%",
                        fontWeight: "500",
                        ...androidHeroTextMetrics,
                      }}
                    >
                      {t("explore.heroSubtitle")}
                    </Text>

                    <Pressable
                      onPress={() => router.push("/(tabs)/map")}
                      style={({ pressed }) => ({
                        marginTop: 16,
                        alignSelf: "flex-start",
                        backgroundColor: theme.colors.turquoise,
                        borderRadius: explorePremium.pillRadius,
                        paddingHorizontal: 18,
                        paddingVertical: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        opacity: pressed ? 0.92 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        ...explorePremium.shadow.cta,
                      })}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "800",
                          fontSize: 14,
                          letterSpacing: 0.2,
                          ...androidHeroTextMetrics,
                        }}
                      >
                        {t("common.openMap")}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </ImageBackground>
              </View>
            </ExploreFadeIn>

            {!isSearchMode ? (
              <ExploreFadeIn delay={120}>
                <>
                  <SectionHeader title={t("explore.popularCategories")} />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingLeft: explorePremium.horizontalPad,
                      paddingRight: 10,
                      paddingBottom: 4,
                    }}
                  >
                    {categories.map((item) => (
                      <CategoryPill key={item.key} item={item} />
                    ))}
                  </ScrollView>
                </>
              </ExploreFadeIn>
            ) : null}

            {!isSearchMode ? (
              <ExploreFadeIn delay={180}>
                <>
                  <SectionHeader title={t("explore.featuredBusinesses")} />
                  {featured.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingLeft: explorePremium.horizontalPad,
                        paddingRight: 10,
                        paddingBottom: 4,
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
                            reviewSummary={reviewSummaries[id]}
                            onPress={handleBusinessCardPress}
                            onToggleFavorite={toggleFavorite}
                          />
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <Text
                      style={{
                        marginHorizontal: explorePremium.horizontalPad,
                        color: theme.colors.muted,
                        fontSize: 14,
                        lineHeight: 22,
                      }}
                    >
                      {t("explore.noFeatured", { location: selectedLocation })}
                    </Text>
                  )}

                  <SectionHeader title={t("explore.upcomingEvents")} />
                  {locationEvents.length > 0 ? (
                    <View
                      style={{
                        paddingHorizontal: explorePremium.horizontalPad,
                        gap: 14,
                      }}
                    >
                      {locationEvents.map((item) => (
                        <ExploreEventCard
                          key={`event-${getId(item)}`}
                          item={item}
                          onPress={openEvent}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text
                      style={{
                        marginHorizontal: explorePremium.horizontalPad,
                        color: theme.colors.muted,
                        fontSize: 14,
                        lineHeight: 22,
                      }}
                    >
                      {t("explore.noEvents", { location: selectedLocation })}
                    </Text>
                  )}
                </>
              </ExploreFadeIn>
            ) : null}

            <SectionHeader
              title={
                isSearchMode
                  ? t("explore.searchResults")
                  : t("explore.popularThisWeek")
              }
            />
          </>
        }
        renderItem={({ item: entry }) => (
          <ExplorePopularRow
            item={entry.item}
            type={entry.type}
            saved={Boolean(favorites[getId(entry.item)])}
            reviewSummary={reviewSummaries[getId(entry.item)]}
            onPress={goProfile}
            onToggleFavorite={toggleFavorite}
            onOpenEvent={openEvent}
          />
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
                {t("explore.noResultsTitle")}
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
                {t("explore.noResultsBody", { query: search.trim() })}
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
                {t("explore.noBusinessesTitle")}
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
                {t("explore.noBusinessesInLocation", { location: selectedLocation })}
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
              {t("explore.changeLocation")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.muted,
                marginBottom: 14,
              }}
            >
              {t("explore.changeLocationHint")}
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
                {t("common.close")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}