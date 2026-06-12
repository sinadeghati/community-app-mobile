import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  Keyboard,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";
import {
  buildMapDisplay,
  clampMapRegion,
  MAP_MIN_ZOOM_LEVEL,
  regionExceedsMapLimits,
  regionForCluster,
  regionForMapPoints,
  resolveMapPoints,
  type MapMarkerDisplay,
  type ResolvedMapPoint,
} from "../../lib/mapCoordinates";
import {
  APP_LOCATION_CHANGED_EVENT,
  DEFAULT_APP_LOCATION,
  bootstrapAppLocation,
  detectCurrentAppLocation,
  loadAppLocationState,
  regionFromAppLocationState,
  regionToBounds,
  saveSearchAppLocation,
  saveViewportAppLocation,
  type AppLocationState,
} from "../../lib/appLocation";
import { listingMatchesActiveLocation } from "../../lib/activeLocationFilter";
import type { PlaceSearchSuggestion } from "../../lib/addressAutocomplete";
import { AdvancedLocationFilters } from "../../components/location/AdvancedLocationFilters";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getListingMarkerKind,
  loadDiscoverableListings,
  MapMarkerKind,
  matchesListingCategory,
  matchesListingSearch,
} from "../../lib/discoverableListings";
import { CategoryIconBadge } from "../../components/category/CategoryIconBadge";
import { getCategoryChipVisual } from "../../lib/categoryChipTheme";
import {
  findDiscoveryFilterKey,
  QUICK_DISCOVERY_CATEGORY_CHIPS,
} from "../../lib/discoverySearch";
import {
  formatEventDateTime,
  formatEventLocation,
  getEventMarkerVisual,
  isMapEvent,
  isUpcomingEvent,
  matchesEventTimeFilter,
  sortEventsByDate,
  type EventMapItem,
  type EventTimeFilter,
} from "../../lib/mapEvents";
import {
  DISCOVER_LISTINGS_REFRESH_EVENT,
} from "../../lib/discoverListingsRefresh";
import { getCachedDiscoverListings } from "../../lib/discoverListingsCache";
import {
  ensureBusinessMapCoordinatesBatch,
  mergeBusinessProfileLocation,
} from "../../lib/businessLocation";
import { logLoadedListingEventIds } from "../../lib/eventDiagnostics";
import {
  formatEventHostLine,
  getEventCover,
  getEventTitle,
  openEventDirections,
  saveMapEventSnapshot,
} from "../../lib/mapEventDetails";
import {
  loadFavoriteBusinessMap,
  toggleBusinessFavorite,
} from "../../lib/businessFavorites";
import { ensureLoggedInForSave } from "../../lib/savedActions";
import { getItemHoursDisplay } from "../../lib/businessHours";
import {
  formatMapPreviewReviewText,
  getBusinessReviewSummary,
  type BusinessReviewSummary,
} from "../../lib/businessReviews";
import {
  getBusinessUpdateTypeLabel,
  getBusinessUpdates,
  getPrimaryActiveBusinessUpdate,
  type BusinessUpdate,
} from "../../lib/businessUpdates";
import { theme } from "../../lib/theme";
import {
  logLoaderDone,
  logLoaderStart,
  withTimeout,
} from "../../lib/asyncGuards";

type MapItem = {
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
  phone?: string;
  contact_info?: string;
  instagram?: string;
  image?: string;
  image_url?: string;
  cover_image?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  is_verified?: boolean;
  is_featured?: boolean;
  rating?: number;
  reviews?: number;
  business_hours?: unknown;
  businessHours?: unknown;
  hours_configured?: boolean;
  business_updates?: unknown;
  businessUpdates?: unknown;
  event_date?: string;
  eventDate?: string;
  starts_at?: string;
  start_date?: string;
  date?: string;
  datetime?: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200";

const SAN_DIEGO_REGION: Region = {
  latitude: 32.7157,
  longitude: -117.1611,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

const categoryFilters = [...QUICK_DISCOVERY_CATEGORY_CHIPS];

const offsetEventDate = (days = 0, months = 0) => {
  const date = new Date();
  if (months) date.setMonth(date.getMonth() + months);
  if (days) date.setDate(date.getDate() + days);
  return date.toISOString();
};

type MapTypeFilter = "all" | "businesses" | "events";

const EVENT_TIME_FILTERS: { key: EventTimeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "later", label: "Later" },
];

const demoEvents: MapItem[] = [
  {
    id: "event-live-music-tonight",
    title: "Persian Live Music Night",
    category: "Concert",
    city: "San Diego",
    state: "CA",
    event_date: offsetEventDate(0),
    latitude: 32.728,
    longitude: -117.15,
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200",
    description:
      "An evening of live Persian music, community, and culture in the heart of San Diego.",
    organizer: "Persian Cultural Center",
    rating: 4.8,
    reviews: 24,
    is_featured: true,
  },
  {
    id: "event-community-meetup",
    title: "Persian Community Meetup",
    category: "Community Gathering",
    city: "La Mesa",
    state: "CA",
    event_date: offsetEventDate(5),
    latitude: 32.7678,
    longitude: -117.0231,
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb4768f1?q=80&w=1200",
    description:
      "Meet neighbors, share stories, and connect with the local Persian community.",
    organizer: "Iranian Community Network",
  },
  {
    id: "event-food-festival",
    title: "Persian Food Festival",
    category: "Festival",
    city: "Chula Vista",
    state: "CA",
    event_date: offsetEventDate(18),
    latitude: 32.64,
    longitude: -117.0842,
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200",
  },
  {
    id: "event-nowruz",
    title: "Nowruz Community Celebration",
    category: "Persian Culture",
    city: "Escondido",
    state: "CA",
    event_date: offsetEventDate(0, 3),
    latitude: 33.1192,
    longitude: -117.0864,
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200",
  },
  {
    id: "event-yalda-concert",
    title: "Yalda Night Concert",
    category: "Concert",
    city: "Carlsbad",
    state: "CA",
    event_date: offsetEventDate(0, 6),
    latitude: 33.1581,
    longitude: -117.3506,
    image:
      "https://images.unsplash.com/photo-1459749411177-041980c57401?q=80&w=1200",
  },
];

const getId = (item: MapItem) => String(item?.id || "");

const getTitle = (item: MapItem) =>
  item?.business_name || item?.name || item?.title || "Local Business";

const getCategory = (item: MapItem) =>
  item?.business_category || item?.category || "Local Business";

const getImage = (item: MapItem) =>
  item?.cover_image || item?.image_url || item?.image || FALLBACK_IMAGE;

const getAddress = (item: MapItem) =>
  item?.address || [item?.city, item?.state].filter(Boolean).join(", ") || "San Diego, CA";

const getCityLine = (item: MapItem) => {
  if (isMapEvent(item)) {
    return formatEventLocation(item as EventMapItem);
  }

  const cityRaw = item.city ? String(item.city) : "";
  const city =
    cityRaw.includes(",") && cityRaw.length > 40
      ? cityRaw.split(",")[0]
      : cityRaw;
  const state = item.state ? String(item.state) : "";

  return [city, state].filter(Boolean).join(", ") || "San Diego area";
};

const findCategoryFilterByQuery = (query: string) => {
  const filterKey = findDiscoveryFilterKey(query, categoryFilters);
  if (!filterKey) return null;
  return categoryFilters.find((filter) => filter.key === filterKey) ?? null;
};

const matchesMapSearchFilter = (item: MapItem, query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const categoryFilter = findCategoryFilterByQuery(trimmed);
  if (categoryFilter) {
    return matchesMapCategoryFilter(item, categoryFilter.key);
  }

  return matchesListingSearch(item, trimmed);
};

/** Map-only category rules — All includes businesses + events; Events is events-only. */
const matchesMapCategoryFilter = (item: MapItem, category: string) => {
  if (category === "All") return true;
  if (category === "Events") return isMapEvent(item);
  if (isMapEvent(item)) return false;
  return matchesListingCategory(item, category);
};

const matchesMapTypeFilter = (item: MapItem, typeFilter: MapTypeFilter) => {
  if (typeFilter === "all") return true;
  if (typeFilter === "businesses") return !isMapEvent(item);
  return isMapEvent(item);
};

const matchesMapOpenNowFilter = (item: MapItem) => {
  if (isMapEvent(item)) return false;
  return getItemHoursDisplay(item).tone === "open";
};

const getDiscoveryFilterLabel = (
  searchQuery: string,
  categoryKey: string,
  searchMode: boolean
) => {
  if (searchMode && searchQuery.trim()) {
    const categoryFilter = findCategoryFilterByQuery(searchQuery);
    if (categoryFilter) return categoryFilter.label;

    const q = searchQuery.trim();
    return q.charAt(0).toUpperCase() + q.slice(1);
  }

  const chip = categoryFilters.find((filter) => filter.key === categoryKey);
  return chip?.label || categoryKey;
};

const getDiscoveryTitle = (
  count: number,
  searchQuery: string,
  categoryKey: string,
  searchMode: boolean
) => {
  const label = getDiscoveryFilterLabel(searchQuery, categoryKey, searchMode);
  const word = count === 1 ? "result" : "results";
  return `${count} ${word} for ${label}`;
};

const getPhone = (item: MapItem) => item?.phone || item?.contact_info || "";

const hoursStatusColor = (tone: "open" | "closed" | "neutral") =>
  tone === "open" ? theme.colors.success : theme.colors.muted;

const MapActiveUpdateLabel = ({
  update,
  compact = false,
  onPress,
}: {
  update: BusinessUpdate;
  compact?: boolean;
  onPress?: () => void;
}) => {
  const label = (
    <Text
      numberOfLines={1}
      style={{
        marginTop: compact ? 2 : 3,
        fontSize: compact ? 11 : 12,
      }}
    >
      <Text
        style={{
          fontWeight: "800",
          color: "#B8860B",
          letterSpacing: 0.3,
        }}
      >
        {getBusinessUpdateTypeLabel(update.type).toUpperCase()}
      </Text>
      <Text style={{ color: theme.colors.muted }}> · </Text>
      <Text style={{ fontWeight: "600", color: theme.colors.charcoal }}>
        {update.title}
      </Text>
    </Text>
  );

  if (!onPress) return label;

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {label}
    </Pressable>
  );
};

function MapEventPreviewCard({
  event,
  onOpenDetails,
  onDirections,
}: {
  event: MapItem;
  onOpenDetails: () => void;
  onDirections: () => void;
}) {
  const visual = getEventMarkerVisual(event as EventMapItem);
  const hostLine = formatEventHostLine(event as EventMapItem);

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 100,
        zIndex: 20,
      }}
    >
      <Pressable
        onPress={onOpenDetails}
        style={{
          backgroundColor: "rgba(255,255,255,0.98)",
          borderRadius: 18,
          padding: 12,
          borderWidth: 1,
          borderColor: "rgba(124,58,237,0.28)",
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: getEventCover(event as EventMapItem) }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              backgroundColor: "#eee",
            }}
            resizeMode="cover"
          />

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: theme.colors.eventPurple,
                letterSpacing: 0.3,
              }}
            >
              {getCategory(event).toUpperCase()}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                marginTop: 4,
                fontSize: 16,
                fontWeight: "800",
                color: theme.colors.charcoal,
              }}
            >
              {getEventTitle(event as EventMapItem)}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                marginTop: 4,
                fontSize: 12,
                color: theme.colors.muted,
                fontWeight: "600",
              }}
            >
              {formatEventDateTime(event as EventMapItem)}
            </Text>
            {hostLine ? (
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 3,
                  fontSize: 11,
                  color: theme.colors.muted,
                  fontWeight: "600",
                }}
              >
                {hostLine}
              </Text>
            ) : null}
          </View>

          <Pressable onPress={onOpenDetails} hitSlop={8}>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={theme.colors.eventPurple}
            />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <Pressable
            onPress={onDirections}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 10,
              backgroundColor: theme.colors.turquoise,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Ionicons name="navigate" size={15} color="#fff" />
            <Text
              style={{
                marginLeft: 4,
                color: "#fff",
                fontWeight: "700",
                fontSize: 12,
              }}
            >
              Directions
            </Text>
          </Pressable>

          <Pressable
            onPress={onOpenDetails}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 10,
              backgroundColor: "rgba(124,58,237,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: visual.accent,
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              View details
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const MapPreviewStatusLine = ({
  item,
  reviewSummary,
  compact = false,
}: {
  item: MapItem;
  reviewSummary?: BusinessReviewSummary;
  compact?: boolean;
}) => {
  if (isMapEvent(item)) return null;

  const reviewText = formatMapPreviewReviewText(reviewSummary);
  const hours = getItemHoursDisplay(item);
  const hoursText = hours.primary;

  if (!reviewText && !hoursText) return null;

  return (
    <Text
      numberOfLines={1}
      style={{
        marginTop: compact ? 2 : 3,
        fontSize: compact ? 11 : 12,
      }}
    >
      {reviewText ? (
        <Text style={{ fontWeight: "600", color: theme.colors.charcoal }}>
          {reviewText}
        </Text>
      ) : null}
      {reviewText && hoursText ? (
        <Text style={{ color: theme.colors.muted }}> · </Text>
      ) : null}
      {hoursText ? (
        <Text
          style={{
            fontWeight: "600",
            color: hoursStatusColor(hours.tone),
          }}
        >
          {hoursText}
        </Text>
      ) : null}
    </Text>
  );
};

const MARKER_VISUALS: Record<
  MapMarkerKind,
  { icon: keyof typeof Ionicons.glyphMap; accent: string }
> = {
  auto: { icon: "car-outline", accent: "#2563EB" },
  food: { icon: "restaurant-outline", accent: "#C2410C" },
  cafe: { icon: "cafe-outline", accent: "#0D9488" },
  events: { icon: "calendar-outline", accent: "#7C3AED" },
  beauty: { icon: "sparkles-outline", accent: "#A21CAF" },
  health: { icon: "medkit-outline", accent: "#DC2626" },
  services: { icon: "briefcase-outline", accent: "#0F4C5C" },
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const PREVIEW_CARD_WIDTH = SCREEN_WIDTH - 32;
const PREVIEW_CARD_GAP = 12;
const PREVIEW_CARD_BOTTOM = 84;

type MapPreviewCarouselEntry = {
  item: MapItem;
  point: ResolvedMapPoint;
};

type MapBusinessPreviewCarouselProps = {
  carouselData: MapPreviewCarouselEntry[];
  selectedItem: MapItem;
  favorites: Record<string, boolean>;
  reviewSummaries: Record<string, BusinessReviewSummary>;
  activeUpdatesById: Record<string, BusinessUpdate | null>;
  onSelectItem: (item: MapItem) => void;
  onOpenProfile: (item: MapItem) => void;
  onToggleFavorite: (item: MapItem) => void;
  onOpenDirections: (point: ResolvedMapPoint) => void;
  onOpenCall: (item: MapItem) => void;
  onOpenProfileUpdates: (item: MapItem) => void;
};

const MapBusinessPreviewCarousel = memo(function MapBusinessPreviewCarousel({
  carouselData,
  selectedItem,
  favorites,
  reviewSummaries,
  activeUpdatesById,
  onSelectItem,
  onOpenProfile,
  onToggleFavorite,
  onOpenDirections,
  onOpenCall,
  onOpenProfileUpdates,
}: MapBusinessPreviewCarouselProps) {
  const listRef = useRef<FlatList<MapPreviewCarouselEntry>>(null);
  const enterAnim = useRef(new Animated.Value(1)).current;
  const selectedItemId = getId(selectedItem);
  const snapInterval = PREVIEW_CARD_WIDTH + PREVIEW_CARD_GAP;

  useEffect(() => {
    const index = carouselData.findIndex(
      (entry) => getId(entry.item) === selectedItemId
    );

    if (index >= 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index, animated: false });
      });
    }
  }, [carouselData, selectedItemId]);

  useEffect(() => {
    enterAnim.setValue(0);
    Animated.spring(enterAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [enterAnim, selectedItemId]);

  const translateY = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const renderPreviewCard = ({
    item,
    point,
  }: MapPreviewCarouselEntry) => {
    const id = getId(item);
    const saved = favorites[id];
    const active = selectedItemId === id;

    return (
      <View
        style={{
          width: PREVIEW_CARD_WIDTH,
          marginRight: PREVIEW_CARD_GAP,
          opacity: active ? 1 : 0.94,
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.98)",
            borderRadius: 18,
            padding: 11,
            borderWidth: 1,
            borderColor: active
              ? "rgba(13,148,136,0.35)"
              : theme.colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 5,
          }}
        >
          <Pressable onPress={() => onOpenProfile(item)}>
            <View style={{ flexDirection: "row" }}>
              <Image
                source={{ uri: getImage(item) }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  backgroundColor: "#eee",
                }}
                resizeMode="cover"
              />

              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontWeight: "800",
                      color: theme.colors.charcoal,
                    }}
                  >
                    {getTitle(item)}
                  </Text>

                  <Pressable onPress={() => onToggleFavorite(item)} hitSlop={8}>
                    <Ionicons
                      name={saved ? "heart" : "heart-outline"}
                      size={20}
                      color={saved ? theme.colors.danger : theme.colors.charcoal}
                    />
                  </Pressable>
                </View>

                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 2,
                    color: theme.colors.muted,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  {getCategory(item)}
                </Text>

                {activeUpdatesById[id] ? (
                  <MapActiveUpdateLabel
                    update={activeUpdatesById[id]!}
                    onPress={() => onOpenProfileUpdates(item)}
                  />
                ) : null}

                <MapPreviewStatusLine
                  item={item}
                  reviewSummary={reviewSummaries[id]}
                />

                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 3,
                    color: theme.colors.muted,
                    fontSize: 11,
                  }}
                >
                  {getAddress(item)}
                </Text>
              </View>
            </View>
          </Pressable>

          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
            <Pressable
              onPress={() => onOpenDirections(point)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 10,
                backgroundColor: theme.colors.turquoise,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <Ionicons name="navigate" size={15} color="#fff" />
              <Text
                style={{
                  marginLeft: 4,
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                Directions
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onOpenCall(item)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 10,
                backgroundColor: "rgba(15,76,92,0.1)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <Ionicons name="call" size={15} color={theme.colors.deepTeal} />
              <Text
                style={{
                  marginLeft: 4,
                  color: theme.colors.deepTeal,
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                Call
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onOpenProfile(item)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 10,
                backgroundColor: "rgba(13,148,136,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.turquoise,
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                Profile
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: PREVIEW_CARD_BOTTOM,
        zIndex: 20,
        opacity: enterAnim,
        transform: [{ translateY }],
      }}
    >
      {carouselData.length > 1 ? (
        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            fontWeight: "600",
            color: theme.colors.muted,
            marginBottom: 6,
          }}
        >
          Swipe for nearby businesses
        </Text>
      ) : null}

      <FlatList
        ref={listRef}
        horizontal
        data={carouselData}
        extraData={selectedItemId}
        keyExtractor={(entry) => `preview-${getId(entry.item)}`}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        disableIntervalMomentum
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        getItemLayout={(_, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        })}
        onScrollToIndexFailed={() => {}}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / snapInterval
          );
          const next = carouselData[index]?.item;

          if (next && getId(next) !== selectedItemId) {
            onSelectItem(next);
          }
        }}
        renderItem={({ item: entry }) => renderPreviewCard(entry)}
      />
    </Animated.View>
  );
});

const SHEET_SNAP = {
  collapsed: 96,
  half: Math.round(SCREEN_HEIGHT * 0.38),
  expanded: Math.round(SCREEN_HEIGHT * 0.58),
};

const MAP_CONTROL_GAP = 10;
const MAP_CHIP_ROW_TOP = 10;

type MapSheetSnap = "collapsed" | "half" | "expanded";

const snapKindFromHeight = (height: number): MapSheetSnap => {
  if (height <= SHEET_SNAP.collapsed + 24) return "collapsed";
  if (height <= SHEET_SNAP.half + 40) return "half";
  return "expanded";
};

const regionsAreSimilar = (a: Region, b: Region) =>
  Math.abs(a.latitude - b.latitude) < 0.0001 &&
  Math.abs(a.longitude - b.longitude) < 0.0001 &&
  Math.abs(a.latitudeDelta - b.latitudeDelta) < 0.0001 &&
  Math.abs(a.longitudeDelta - b.longitudeDelta) < 0.0001;

function useMapBottomSheet(initialHeight: number) {
  const sheetHeight = useRef(new Animated.Value(initialHeight)).current;
  const dragStartHeight = useRef(initialHeight);
  const [sheetSnap, setSheetSnap] = useState<MapSheetSnap>(
    snapKindFromHeight(initialHeight)
  );

  const snapTo = useCallback(
    (height: number) => {
      setSheetSnap(snapKindFromHeight(height));
      Animated.spring(sheetHeight, {
        toValue: height,
        useNativeDriver: false,
        friction: 8,
        tension: 68,
      }).start();
    },
    [sheetHeight]
  );

  const snapToNearest = useCallback(
    (height: number, velocityY = 0) => {
      const snaps = [SHEET_SNAP.collapsed, SHEET_SNAP.half, SHEET_SNAP.expanded];
      let nearestIndex = snaps.reduce(
        (bestIdx, curr, idx) =>
          Math.abs(curr - height) < Math.abs(snaps[bestIdx] - height) ? idx : bestIdx,
        0
      );

      if (velocityY < -0.35) {
        nearestIndex = Math.min(snaps.length - 1, nearestIndex + 1);
      } else if (velocityY > 0.35) {
        nearestIndex = Math.max(0, nearestIndex - 1);
      }

      snapTo(snaps[nearestIndex]);
    },
    [snapTo]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation((value) => {
          dragStartHeight.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(
          SHEET_SNAP.expanded,
          Math.max(SHEET_SNAP.collapsed, dragStartHeight.current - gesture.dy)
        );
        sheetHeight.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const projected = dragStartHeight.current - gesture.dy;
        snapToNearest(projected, gesture.vy);
      },
    })
  ).current;

  const listCanScroll = sheetSnap === "expanded" || sheetSnap === "half";

  return {
    sheetHeight,
    sheetSnap,
    snapTo,
    panResponder,
    listCanScroll,
  };
}

function MarkerPulseRing({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;

    const anim = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      })
    );

    pulse.setValue(0);
    anim.start();

    return () => anim.stop();
  }, [active, pulse]);

  if (!active) return null;

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0.06],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 2,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export default function MapScreenV25() {
  const cachedOnMount = getCachedDiscoverListings();
  const hasDisplayedMapItemsRef = useRef(Boolean(cachedOnMount?.length));
  const mapItemsLoadInFlightRef = useRef<Promise<void> | null>(null);
  const [items, setItems] = useState<MapItem[]>(
    () => (cachedOnMount as MapItem[] | null) ?? []
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [loading, setLoading] = useState(!hasDisplayedMapItemsRef.current);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [reviewSummaries, setReviewSummaries] = useState<
    Record<string, BusinessReviewSummary>
  >({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [mapTypeFilter, setMapTypeFilter] = useState<MapTypeFilter>("all");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationState, setLocationState] =
    useState<AppLocationState>(DEFAULT_APP_LOCATION);
  const [mapFilterLocation, setMapFilterLocation] =
    useState<AppLocationState>(DEFAULT_APP_LOCATION);
  const [viewportAreaRefreshing, setViewportAreaRefreshing] = useState(false);
  const [viewportDirty, setViewportDirty] = useState(false);
  const suppressViewportDirtyRef = useRef(false);
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);
  const layoutReadyRef = useRef(false);
  const pendingViewportRef = useRef<{
    region: Region;
    animate: boolean;
  } | null>(null);
  const [mapLayout, setMapLayout] = useState({ width: 0, height: 0 });
  const mapLayoutReady = mapLayout.width > 0 && mapLayout.height > 0;
  const MAP_SURFACE_KEY = "map-main";
  const [mapSurfaceMounted, setMapSurfaceMounted] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>(SAN_DIEGO_REGION);
  const mapRegionRef = useRef<Region>(SAN_DIEGO_REGION);
  const pendingMapRegionRef = useRef<Region | null>(null);
  const businessPreviewOpenRef = useRef(false);
  const suppressMapDeselectRef = useRef(false);
  const [previewCarouselData, setPreviewCarouselData] = useState<
    MapPreviewCarouselEntry[]
  >([]);
  const insets = useSafeAreaInsets();
  const {
    sheetHeight: resultSheetHeight,
    sheetSnap: resultSheetSnap,
    snapTo: snapResultSheet,
    panResponder: resultSheetPanResponder,
    listCanScroll: resultListCanScroll,
  } = useMapBottomSheet(SHEET_SNAP.collapsed);
  const [eventTimeFilter, setEventTimeFilter] = useState<EventTimeFilter>("all");
  const lastDiscoverySheetMode = useRef<boolean | null>(null);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const commitMapRegion = useCallback((region: Region) => {
    const clamped = clampMapRegion(region);
    mapRegionRef.current = clamped;
    setMapRegion((prev) => (regionsAreSimilar(prev, clamped) ? prev : clamped));
  }, []);

  const resolveViewportRegion = useCallback(
    (state: AppLocationState, points: ResolvedMapPoint[]): Region =>
      regionForMapPoints(points) ?? regionFromAppLocationState(state),
    []
  );

  const flushPendingMapViewport = useCallback(() => {
    const pending = pendingViewportRef.current;
    if (
      !pending ||
      !mapReadyRef.current ||
      !layoutReadyRef.current ||
      !isFocusedRef.current
    ) {
      return;
    }

    pendingViewportRef.current = null;
    mapRef.current?.animateToRegion(pending.region, pending.animate ? 450 : 0);
  }, []);

  const scheduleMapViewport = useCallback(
    (region: Region, animate = true) => {
      suppressViewportDirtyRef.current = true;
      const clamped = clampMapRegion(region);
      commitMapRegion(clamped);
      pendingViewportRef.current = { region: clamped, animate };

      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            flushPendingMapViewport();
            setTimeout(() => {
              suppressViewportDirtyRef.current = false;
            }, animate ? 500 : 50);
          });
        });
      });
    },
    [commitMapRegion, flushPendingMapViewport]
  );

  const handleMapContainerLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout;
      if (width <= 0 || height <= 0) return;

      layoutReadyRef.current = true;
      setMapLayout((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
      flushPendingMapViewport();
    },
    [flushPendingMapViewport]
  );

  const handleMapReady = useCallback(() => {
    mapReadyRef.current = true;
    flushPendingMapViewport();
  }, [flushPendingMapViewport]);

  useEffect(() => {
    if (isFocused) return;
    mapReadyRef.current = false;
    pendingViewportRef.current = null;
    setMapSurfaceMounted(false);
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused || !mapLayoutReady) {
      setMapSurfaceMounted(false);
      return;
    }

    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) {
            setMapSurfaceMounted(true);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      task.cancel();
      setMapSurfaceMounted(false);
    };
  }, [isFocused, mapLayoutReady]);

  const applyMapLocationState = useCallback(
    (next: AppLocationState, options?: { immediate?: boolean }) => {
      setLocationState(next);

      if (options?.immediate) {
        setMapFilterLocation(next);
        setViewportAreaRefreshing(false);
        return;
      }

      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          setMapFilterLocation(next);
          setViewportAreaRefreshing(false);
        });
      });
    },
    []
  );

  const goToCurrentLocation = async () => {
    dismissKeyboard();
    setLocating(true);

    try {
      const result = await detectCurrentAppLocation();

      if (!result.ok) {
        if (result.reason === "permission_denied") {
          Alert.alert(
            "Location permission needed",
            "Allow location access to center the map near you, or search for a city or region instead."
          );
        } else {
          Alert.alert(
            "Location unavailable",
            "We could not find your current location. Check that location services are enabled and try again."
          );
        }
        return;
      }

      const locationChanged =
        result.state.locationKey !== locationState.locationKey;
      if (locationChanged) {
        applyMapLocationState(result.state);
        scheduleMapViewport(regionFromAppLocationState(result.state), true);
      } else {
        setLocationState(result.state);
        setMapFilterLocation(result.state);
        scheduleMapViewport(
          resolveViewportRegion(result.state, mapPoints),
          true
        );
      }
      setFilterVisible(false);
    } catch (error) {
      console.log("Map current location error:", error);
      Alert.alert(
        "Location unavailable",
        "We could not find your current location. Check that location services are enabled and try again."
      );
    } finally {
      setLocating(false);
    }
  };

  const openEventDetails = async (event: MapItem) => {
    dismissKeyboard();
    const id = getId(event);
    if (!id) return;

    if (!id.startsWith("event-") && !id.startsWith("festival-")) {
      router.push({
        pathname: "/listing/[id]",
        params: { id },
      });
      return;
    }

    await saveMapEventSnapshot(event as EventMapItem);
    router.push({
      pathname: "/event/[id]",
      params: { id },
    });
  };

  const allMapEvents = useMemo(
    () =>
      items.filter(
        (item) => isMapEvent(item) && isUpcomingEvent(item as EventMapItem)
      ),
    [items]
  );

  const flushPendingMapRegion = useCallback(() => {
    const pending = pendingMapRegionRef.current;
    if (!pending) return;
    pendingMapRegionRef.current = null;
    setMapRegion((prev) => (regionsAreSimilar(prev, pending) ? prev : pending));
  }, []);

  const clearSelectedMapItem = useCallback(() => {
    businessPreviewOpenRef.current = false;
    setSelectedItem(null);
    flushPendingMapRegion();
  }, [flushPendingMapRegion]);

  const applyPlaceSearch = async (place: PlaceSearchSuggestion) => {
    dismissKeyboard();
    clearSelectedMapItem();
    const next = await saveSearchAppLocation(place.label, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
    applyMapLocationState(next);
    scheduleMapViewport(regionFromAppLocationState(next), true);
    setViewportDirty(false);
    setFilterVisible(false);
  };

  const handleSearchThisArea = async () => {
    if (viewportAreaRefreshing) return;

    dismissKeyboard();
    clearSelectedMapItem();
    setViewportAreaRefreshing(true);

    try {
      const region = mapRegionRef.current;
      const next = await saveViewportAppLocation(
        "Selected map area",
        regionToBounds(region),
        {
          latitude: region.latitude,
          longitude: region.longitude,
        },
        {
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        }
      );
      applyMapLocationState(next);
      setViewportDirty(false);
      setFilterVisible(false);
    } catch (error) {
      console.log("Search this area error:", error);
      setViewportAreaRefreshing(false);
    }
  };

  const applyMapTypeFilter = (typeFilter: MapTypeFilter) => {
    dismissKeyboard();
    clearSelectedMapItem();
    setMapTypeFilter(typeFilter);
  };

  const handleMapBackgroundPress = (action?: string) => {
    dismissKeyboard();
    if (suppressMapDeselectRef.current || action === "marker-press") {
      return;
    }
    clearSelectedMapItem();
  };

  const enrichMapItemsWithProfileUpdates = async (
    list: MapItem[]
  ): Promise<MapItem[]> => {
    const businessIds = list
      .filter((item) => !isMapEvent(item))
      .map((item) => getId(item))
      .filter(Boolean);

    if (!businessIds.length) return list;

    const profilePairs = await AsyncStorage.multiGet(
      businessIds.map((id) => `profile_v2_${id}`)
    );

    const profileById = new Map<string, MapItem>();
    profilePairs.forEach(([key, value]) => {
      if (!value) return;
      const id = key.replace("profile_v2_", "");
      try {
        profileById.set(id, JSON.parse(value) as MapItem);
      } catch {
        // skip invalid profile payload
      }
    });

    return list.map((item) => {
      if (isMapEvent(item)) return item;

      const id = getId(item);
      const profile = profileById.get(id);
      const withLocation = mergeBusinessProfileLocation(item, profile);

      const itemUpdates = getBusinessUpdates(withLocation);
      const profileUpdates = profile ? getBusinessUpdates(profile) : [];

      if (itemUpdates.length > 0) return withLocation;
      if (!profileUpdates.length) return withLocation;

      return {
        ...withLocation,
        business_updates:
          profile?.business_updates ?? profile?.businessUpdates ?? profileUpdates,
      };
    });
  };

  const loadMapItems = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? hasDisplayedMapItemsRef.current;

    if (mapItemsLoadInFlightRef.current) {
      await mapItemsLoadInFlightRef.current;
      return;
    }

    const run = async () => {
      logLoaderStart("map.loadMapItems");
      try {
        if (!background) {
          setLoading(true);
        }

        const cachedFallback =
          (getCachedDiscoverListings() as MapItem[] | null) ?? itemsRef.current;

        const data = await withTimeout(
          loadDiscoverableListings(),
          15000,
          "map.loadDiscoverableListings",
          background ? cachedFallback : []
        );
        const enriched = await withTimeout(
          enrichMapItemsWithProfileUpdates([...data, ...demoEvents]),
          5000,
          "map.enrichMapItems",
          background ? [...cachedFallback, ...demoEvents] : [...data, ...demoEvents]
        );

        if (background) {
          if (enriched.length) {
            hasDisplayedMapItemsRef.current = true;
            setItems(enriched);
          }
          void withTimeout(
            ensureBusinessMapCoordinatesBatch(enriched),
            30000,
            "map.ensureBusinessCoordinates",
            enriched
          ).then((geocoded) => {
            if (geocoded.length) {
              hasDisplayedMapItemsRef.current = true;
              setItems(geocoded);
            }
          });
        } else {
          const merged = await withTimeout(
            ensureBusinessMapCoordinatesBatch(enriched),
            30000,
            "map.ensureBusinessCoordinates",
            enriched
          );

          logLoadedListingEventIds("map", merged);
          console.log("[map/load]", {
            totalLoaded: merged.length,
            businessesLoaded: merged.filter((item) => !isMapEvent(item)).length,
            eventsLoaded: merged.filter((item) => isMapEvent(item)).length,
          });

          if (merged.length) {
            hasDisplayedMapItemsRef.current = true;
          }
          setItems(merged);
        }

        businessPreviewOpenRef.current = false;
        setSelectedItem(null);

        void loadFavoriteBusinessMap().then(setFavorites).catch(() => undefined);
      } catch (e) {
        console.log("[loader] map.loadMapItems error:", e);
        if (!background) {
          setItems([...demoEvents]);
        }
      } finally {
        logLoaderDone("map.loadMapItems");
        if (!background) {
          setLoading(false);
        }
      }
    };

    mapItemsLoadInFlightRef.current = run();
    try {
      await mapItemsLoadInFlightRef.current;
    } finally {
      mapItemsLoadInFlightRef.current = null;
    }
  }, []);

  useEffect(() => {
    void loadMapItems({ background: hasDisplayedMapItemsRef.current });
    void (async () => {
      logLoaderStart("map.location");
      try {
        const state = await withTimeout(
          bootstrapAppLocation(),
          12000,
          "map.bootstrapAppLocation",
          DEFAULT_APP_LOCATION
        );
        applyMapLocationState(state, { immediate: true });
        if (state.source !== "viewport") {
          scheduleMapViewport(regionFromAppLocationState(state), false);
        }
      } finally {
        logLoaderDone("map.location");
      }
    })();
  }, [applyMapLocationState, loadMapItems, scheduleMapViewport]);

  useFocusEffect(
    useCallback(() => {
      void loadAppLocationState().then((state) => {
        applyMapLocationState(state, { immediate: true });
      });
      if (hasDisplayedMapItemsRef.current) {
        void loadMapItems({ background: true });
      }
    }, [applyMapLocationState, loadMapItems])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      DISCOVER_LISTINGS_REFRESH_EVENT,
      () => {
        void loadMapItems({ background: hasDisplayedMapItemsRef.current });
      }
    );
    return () => sub.remove();
  }, [loadMapItems]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      APP_LOCATION_CHANGED_EVENT,
      () => {
        void loadAppLocationState().then((state) => {
          applyMapLocationState(state);
          if (state.source !== "viewport") {
            scheduleMapViewport(regionFromAppLocationState(state), true);
          }
          setViewportDirty(false);
        });
      }
    );
    return () => sub.remove();
  }, [applyMapLocationState, scheduleMapViewport]);

  useEffect(() => {
    setViewportDirty(false);
  }, [locationState.locationKey]);

  const isSearchMode = search.trim() !== "";

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesLocation = listingMatchesActiveLocation(item, mapFilterLocation);
      if (!matchesLocation) return false;

      if (!matchesMapTypeFilter(item, mapTypeFilter)) return false;

      if (openNowOnly && !matchesMapOpenNowFilter(item)) return false;

      if (isSearchMode) {
        return matchesMapSearchFilter(item, search);
      }

      return matchesMapCategoryFilter(item, selectedCategory);
    });
  }, [
    items,
    search,
    selectedCategory,
    mapFilterLocation,
    isSearchMode,
    mapTypeFilter,
    openNowOnly,
  ]);

  useEffect(() => {
    if (!selectedItem) return;

    const stillVisible = filteredItems.some(
      (item) => getId(item) === getId(selectedItem)
    );

    if (!stillVisible) {
      const nextBusiness =
        filteredItems.find((item) => !isMapEvent(item)) ?? null;
      setSelectedItem(nextBusiness);
    }
  }, [filteredItems, selectedItem]);

  const mapPoints = useMemo(
    () => resolveMapPoints(filteredItems),
    [filteredItems]
  );

  const mapInitialRegion = useMemo(
    () => clampMapRegion(regionFromAppLocationState(locationState)),
    [locationState]
  );

  useEffect(() => {
    if (!mapSurfaceMounted) return;
    commitMapRegion(mapInitialRegion);
  }, [mapSurfaceMounted, mapInitialRegion, commitMapRegion]);

  useEffect(() => {
    const businessesLoaded = items.filter((item) => !isMapEvent(item));
    const eventsLoaded = items.filter((item) => isMapEvent(item));
    const businessMarkers = mapPoints.filter((point) => !isMapEvent(point.item));
    const eventMarkers = mapPoints.filter((point) => isMapEvent(point.item));

    console.log("[map/markers]", {
      totalBusinessesLoaded: businessesLoaded.length,
      totalEventsLoaded: eventsLoaded.length,
      activeFilter: selectedCategory,
      searchQuery: search,
      filteredItemCount: filteredItems.length,
      finalMarkersCount: mapPoints.length,
      finalBusinessMarkerCount: businessMarkers.length,
      finalEventMarkerCount: eventMarkers.length,
    });
  }, [items, filteredItems, mapPoints, selectedCategory, search]);

  const mapDisplay = useMemo(
    () => buildMapDisplay(mapPoints, mapRegion),
    [mapPoints, mapRegion]
  );

  const nearbyBusinesses = useMemo(
    () =>
      mapPoints
        .filter((point) => !isMapEvent(point.item))
        .map((point) => ({ item: point.item as MapItem, point })),
    [mapPoints]
  );

  const activeUpdatesById = useMemo(() => {
    const map: Record<string, BusinessUpdate | null> = {};

    items.forEach((item) => {
      if (isMapEvent(item)) return;
      const id = getId(item);
      if (!id) return;
      map[id] = getPrimaryActiveBusinessUpdate(item);
    });

    return map;
  }, [items]);

  const hasVisibleBusinesses = nearbyBusinesses.length > 0;

  const syncReviewSummaries = useCallback(async (businessIds: string[]) => {
    const ids = [...new Set(businessIds.filter(Boolean))];
    if (!ids.length) return;

    const pairs = await Promise.all(
      ids.map(async (id) => [id, await getBusinessReviewSummary(id)] as const)
    );

    setReviewSummaries((prev) => {
      const next = { ...prev };
      for (const [id, summary] of pairs) {
        next[id] = summary;
      }
      return next;
    });
  }, []);

  const isDiscoveryActive = isSearchMode || selectedCategory !== "All";

  const handleMapRegionChangeComplete = useCallback((region: Region) => {
    const clamped = clampMapRegion(region);

    if (regionExceedsMapLimits(region)) {
      suppressViewportDirtyRef.current = true;
      mapRegionRef.current = clamped;
      mapRef.current?.animateToRegion(clamped, 150);
      setMapRegion((prev) => (regionsAreSimilar(prev, clamped) ? prev : clamped));
      setTimeout(() => {
        suppressViewportDirtyRef.current = false;
      }, 200);
      return;
    }

    mapRegionRef.current = clamped;
    if (businessPreviewOpenRef.current) {
      pendingMapRegionRef.current = clamped;
      return;
    }
    setMapRegion((prev) => (regionsAreSimilar(prev, clamped) ? prev : clamped));
    if (!suppressViewportDirtyRef.current) {
      setViewportDirty(true);
    }
  }, []);

  const mapResultEntries = useMemo(
    () =>
      filteredItems
        .map((item) => {
          const point =
            mapPoints.find((p) => getId(p.item) === getId(item)) ??
            resolveMapPoints([item])[0];

          if (!point) return null;

          return { item, point };
        })
        .filter(Boolean) as { item: MapItem; point: ResolvedMapPoint }[],
    [filteredItems, mapPoints]
  );

  const discoveryResults = useMemo(() => {
    if (!isDiscoveryActive) return [];

    if (selectedCategory === "Events" && !isSearchMode) {
      return mapResultEntries.filter(({ item }) =>
        matchesEventTimeFilter(item as EventMapItem, eventTimeFilter)
      );
    }

    return mapResultEntries;
  }, [
    isDiscoveryActive,
    mapResultEntries,
    selectedCategory,
    isSearchMode,
    eventTimeFilter,
  ]);

  const nearbyBrowseResults = useMemo(() => {
    if (isDiscoveryActive || selectedCategory !== "All") return [];
    return mapResultEntries;
  }, [isDiscoveryActive, mapResultEntries, selectedCategory]);

  useEffect(() => {
    if (!selectedItem || isMapEvent(selectedItem)) {
      businessPreviewOpenRef.current = false;
      setPreviewCarouselData([]);
      return;
    }

    businessPreviewOpenRef.current = true;

    if (
      isDiscoveryActive &&
      discoveryResults.some((entry) => !isMapEvent(entry.item))
    ) {
      setPreviewCarouselData(
        discoveryResults.filter((entry) => !isMapEvent(entry.item))
      );
      return;
    }

    const point =
      mapPoints.find((p) => getId(p.item) === getId(selectedItem)) ??
      resolveMapPoints([selectedItem])[0];

    if (nearbyBusinesses.length > 0) {
      setPreviewCarouselData(nearbyBusinesses);
      return;
    }

    setPreviewCarouselData(point ? [{ item: selectedItem, point }] : []);
    // Freeze carousel rows at selection time — do not rebuild on map pan/region updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getId(selectedItem ?? ""), isDiscoveryActive, discoveryResults]);

  const previewBusinessIds = useMemo(() => {
    const ids: string[] = [];

    if (isDiscoveryActive) {
      discoveryResults
        .filter((entry) => !isMapEvent(entry.item))
        .forEach((entry) => ids.push(getId(entry.item)));
    } else {
      nearbyBusinesses.forEach((entry) => ids.push(getId(entry.item)));
    }

    if (selectedItem && !isMapEvent(selectedItem)) {
      ids.push(getId(selectedItem));
    }

    return ids;
  }, [isDiscoveryActive, discoveryResults, nearbyBusinesses, selectedItem]);

  useEffect(() => {
    syncReviewSummaries(previewBusinessIds);
  }, [previewBusinessIds, syncReviewSummaries]);

  const refreshFavorites = useCallback(async () => {
    setFavorites(await loadFavoriteBusinessMap());
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncReviewSummaries(previewBusinessIds);
      refreshFavorites();
    }, [previewBusinessIds, syncReviewSummaries, refreshFavorites])
  );

  useEffect(() => {
    if (lastDiscoverySheetMode.current === isDiscoveryActive) return;
    lastDiscoverySheetMode.current = isDiscoveryActive;
    snapResultSheet(
      isDiscoveryActive ? SHEET_SNAP.half : SHEET_SNAP.collapsed
    );
  }, [isDiscoveryActive, snapResultSheet]);

  const displayedEvents = useMemo(() => {
    return sortEventsByDate(
      allMapEvents.filter((event) => {
        if (isSearchMode && !matchesMapSearchFilter(event, search)) return false;
        return matchesEventTimeFilter(event as EventMapItem, eventTimeFilter);
      })
    );
  }, [eventTimeFilter, search, allMapEvents, isSearchMode]);

  const discoveryTitle = getDiscoveryTitle(
    discoveryResults.length,
    search,
    selectedCategory,
    isSearchMode
  );

  const focusOnMapItem = (
    item: MapItem,
    options?: { animate?: boolean }
  ) => {
    const point =
      mapPoints.find((p) => getId(p.item) === getId(item)) ??
      resolveMapPoints([item])[0];

    if (!point) return;

    const latOffset = isMapEvent(item) ? 0.006 : 0.012;
    const region: Region = {
      latitude: point.latitude - latOffset,
      longitude: point.longitude,
      latitudeDelta: 0.055,
      longitudeDelta: 0.055,
    };

    scheduleMapViewport(region, options?.animate !== false);
  };

  const selectMapItem = (
    item: MapItem,
    options?: { focus?: boolean; animate?: boolean }
  ) => {
    dismissKeyboard();
    suppressMapDeselectRef.current = true;
    businessPreviewOpenRef.current = !isMapEvent(item);
    setSelectedItem(item);

    if (options?.focus !== false) {
      focusOnMapItem(item, { animate: options?.animate !== false });
    }

    requestAnimationFrame(() => {
      suppressMapDeselectRef.current = false;
    });
  };

  const zoomToCluster = (cluster: Extract<MapMarkerDisplay, { type: "cluster" }>) => {
    dismissKeyboard();
    scheduleMapViewport(regionForCluster(cluster), true);
  };

  const toggleFavorite = async (item: MapItem) => {
    dismissKeyboard();
    const id = getId(item);
    const currently = Boolean(favorites[id]);
    const allowed = await ensureLoggedInForSave(
      currently ? "manage your favorites" : "save businesses"
    );
    if (!allowed) return;

    const next = await toggleBusinessFavorite(item, currently);
    setFavorites((prev) => ({ ...prev, [id]: next }));
  };

  const openProfile = (
    item: MapItem,
    options?: { focusUpdates?: boolean }
  ) => {
    dismissKeyboard();
    router.push({
      pathname: "/profile/v2",
      params: {
        id: getId(item),
        ...(options?.focusUpdates ? { focus: "updates" } : {}),
      },
    });
  };

  const openProfileUpdates = (item: MapItem) => {
    openProfile(item, { focusUpdates: true });
  };

  const renderDiscoveryRow = (entry: {
    item: MapItem;
    point: ResolvedMapPoint;
  }) => {
    const { item } = entry;
    const active = selectedItem && getId(selectedItem) === getId(item);
    const eventItem = isMapEvent(item);

    return (
      <Pressable
        key={`discovery-${getId(item)}`}
        onPress={() => {
          if (eventItem) {
            openEventDetails(item);
            return;
          }
          selectMapItem(item, { focus: true, animate: true });
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 76,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: active ? "rgba(13,148,136,0.06)" : "#FFFFFF",
        }}
      >
        <Image
          source={{ uri: getImage(item) }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: "#eee",
          }}
          resizeMode="cover"
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
            {getTitle(item)}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              marginTop: 3,
              fontSize: 12,
              color: theme.colors.muted,
            }}
          >
            {getCategory(item)}
          </Text>
          {!eventItem && activeUpdatesById[getId(item)] ? (
            <MapActiveUpdateLabel
              update={activeUpdatesById[getId(item)]!}
              compact
              onPress={() => openProfileUpdates(item)}
            />
          ) : null}
          {!eventItem ? (
            <MapPreviewStatusLine
              item={item}
              reviewSummary={reviewSummaries[getId(item)]}
              compact
            />
          ) : null}
          <Text
            numberOfLines={1}
            style={{
              marginTop: 3,
              fontSize: 12,
              color: theme.colors.muted,
            }}
          >
            {getCityLine(item)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
      </Pressable>
    );
  };

  const openCall = (item: MapItem) => {
    dismissKeyboard();
    const phone = getPhone(item);

    if (!phone) return;

    Linking.openURL(`tel:${phone}`);
  };

  const openDirections = (point: ResolvedMapPoint) => {
    dismissKeyboard();
    const label = encodeURIComponent(getTitle(point.item));

    if (point.hasExactCoordinate) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}&query_place_id=${label}`
      );
      return;
    }

    const address = String(
      point.item.address ||
        [point.item.city, point.item.state].filter(Boolean).join(", ")
    ).trim();

    if (!address) return;

    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    );
  };

  const ClusterBubble = ({
    cluster,
  }: {
    cluster: Extract<MapMarkerDisplay, { type: "cluster" }>;
  }) => (
    <Marker
      coordinate={{
        latitude: cluster.latitude,
        longitude: cluster.longitude,
      }}
      onPress={(e) => {
        e.stopPropagation?.();
        zoomToCluster(cluster);
      }}
      tracksViewChanges={false}
    >
      <View
        pointerEvents="none"
        style={{
          minWidth: 30,
          height: 30,
          paddingHorizontal: 6,
          borderRadius: 15,
          backgroundColor: "#FFFFFF",
          borderWidth: 1.5,
          borderColor: theme.colors.turquoise,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "800",
            color: theme.colors.turquoise,
          }}
        >
          {cluster.count}
        </Text>
      </View>
    </Marker>
  );

  const MarkerBubble = ({ point }: { point: ResolvedMapPoint }) => {
    const item = point.item;
    const active = selectedItem && getId(selectedItem) === getId(item);
    const kind = getListingMarkerKind(item);
    const visual = isMapEvent(item)
      ? getEventMarkerVisual(item as EventMapItem)
      : MARKER_VISUALS[kind];
    const pinSize = active ? 34 : 30;
    const iconSize = active ? 15 : 13;
    const activeUpdate = isMapEvent(item)
      ? null
      : activeUpdatesById[getId(item)];

    return (
      <Marker
        coordinate={{
          latitude: point.latitude,
          longitude: point.longitude,
        }}
        onPress={(e) => {
          e.stopPropagation?.();
          selectMapItem(item, { focus: true, animate: true });
        }}
        tracksViewChanges={Boolean(active)}
      >
        <View
          pointerEvents="none"
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MarkerPulseRing
            active={Boolean(active)}
            color={active ? theme.colors.turquoise : visual.accent}
          />

          {activeUpdate && !active ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: pinSize + 10,
                height: pinSize + 10,
                borderRadius: (pinSize + 10) / 2,
                borderWidth: 1,
                borderColor: "rgba(196, 154, 58, 0.35)",
                backgroundColor: "rgba(196, 154, 58, 0.06)",
              }}
            />
          ) : null}

          <View
            style={{
              width: pinSize,
              height: pinSize,
              borderRadius: pinSize / 2,
              backgroundColor: active ? theme.colors.turquoise : "#FFFFFF",
              borderWidth: active ? 2 : 1.5,
              borderColor: active
                ? theme.colors.turquoise
                : activeUpdate
                  ? "#C49A3A"
                  : visual.accent,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: activeUpdate ? 0.14 : 0.1,
              shadowRadius: activeUpdate ? 5 : 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
          >
            <Ionicons
              name={visual.icon}
              size={iconSize}
              color={active ? "#FFFFFF" : visual.accent}
            />
          </View>

          {activeUpdate ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: "#C49A3A",
                borderWidth: 1,
                borderColor: "#FFFFFF",
              }}
            />
          ) : null}
        </View>
      </Marker>
    );
  };

  const FilterPill = ({ item }: { item: any }) => {
    const active = !isSearchMode && selectedCategory === item.key;
    const visual = getCategoryChipVisual(item.key);

    return (
      <Pressable
        onPress={() => {
          dismissKeyboard();
          setSearch("");
          setSelectedCategory(item.key);
          clearSelectedMapItem();
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 32,
          paddingLeft: 5,
          paddingRight: 10,
          borderRadius: 999,
          backgroundColor: active ? theme.colors.turquoise : "rgba(255,255,255,0.94)",
          marginRight: 6,
          borderWidth: 1,
          borderColor: active ? "rgba(13,148,136,0.25)" : "rgba(229,231,235,0.95)",
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <CategoryIconBadge visual={visual} size="compact" active={active} />

        <Text
          style={{
            marginLeft: 6,
            fontSize: 12,
            fontWeight: "600",
            color: active ? "#fff" : theme.colors.charcoal,
          }}
        >
          {item.label}
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
    <View
      style={{ flex: 1, backgroundColor: theme.colors.ivory }}
      onLayout={handleMapContainerLayout}
    >
      {isFocused && mapLayoutReady && mapSurfaceMounted ? (
        <MapView
          key={MAP_SURFACE_KEY}
          ref={mapRef}
          style={{
            width: mapLayout.width,
            height: mapLayout.height,
          }}
          initialRegion={mapInitialRegion}
          minZoomLevel={MAP_MIN_ZOOM_LEVEL}
          maxZoomLevel={20}
          showsUserLocation
          showsMyLocationButton={false}
          onMapReady={handleMapReady}
          onRegionChangeComplete={handleMapRegionChangeComplete}
          onPress={(e) => handleMapBackgroundPress(e.nativeEvent?.action)}
        >
          {mapDisplay.map((entry) =>
            entry.type === "cluster" ? (
              <ClusterBubble key={`cluster-${entry.id}`} cluster={entry} />
            ) : (
              <MarkerBubble
                key={`marker-${getId(entry.point.item)}-${entry.point.index}`}
                point={entry.point}
              />
            )
          )}
        </MapView>
      ) : (
        <View style={StyleSheet.absoluteFillObject} />
      )}

      <SafeAreaView
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{
            paddingHorizontal: 16,
            paddingTop: 6,
            paddingBottom: 8,
          }}
        >
          <View
            pointerEvents="box-none"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: MAP_CONTROL_GAP,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 46,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.97)",
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 12,
                paddingRight: 10,
                borderWidth: 1,
                borderColor: "rgba(229,231,235,0.95)",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
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
                returnKeyType="search"
                onSubmitEditing={dismissKeyboard}
                placeholder="Search map, events, businesses..."
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontSize: 15,
                  color: theme.colors.charcoal,
                  paddingVertical: 0,
                }}
              />

              {search.length > 0 ? (
                <Pressable
                  onPress={() => {
                    dismissKeyboard();
                    setSearch("");
                  }}
                  hitSlop={8}
                  style={{ padding: 2 }}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    dismissKeyboard();
                    setFilterVisible(true);
                  }}
                  hitSlop={8}
                  style={{ padding: 2 }}
                >
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={theme.colors.muted}
                  />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={goToCurrentLocation}
              disabled={locating}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.97)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(229,231,235,0.95)",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
                opacity: locating ? 0.65 : 1,
              }}
            >
              {locating ? (
                <ActivityIndicator size="small" color={theme.colors.turquoise} />
              ) : (
                <Ionicons
                  name="locate-outline"
                  size={20}
                  color={theme.colors.turquoise}
                />
              )}
            </Pressable>
          </View>

          {viewportDirty ? (
            <View
              style={{
                marginTop: 8,
                alignItems: "center",
              }}
            >
              <Pressable
                onPress={() => {
                  void handleSearchThisArea();
                }}
                disabled={viewportAreaRefreshing}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.98)",
                  borderWidth: 1,
                  borderColor: "rgba(229,231,235,0.95)",
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                  opacity: viewportAreaRefreshing ? 0.85 : 1,
                }}
              >
                {viewportAreaRefreshing ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.deepTeal}
                  />
                ) : (
                  <Ionicons
                    name="refresh-outline"
                    size={15}
                    color={theme.colors.deepTeal}
                  />
                )}
                <Text
                  style={{
                    marginLeft: 6,
                    color: theme.colors.deepTeal,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {viewportAreaRefreshing ? "Searching…" : "Search this area"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!isSearchMode ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{
                marginTop: viewportDirty ? 8 : MAP_CHIP_ROW_TOP,
              }}
              contentContainerStyle={{
                paddingRight: 4,
                paddingBottom: 4,
                alignItems: "center",
              }}
            >
              {categoryFilters.map((item) => (
                <FilterPill key={item.key} item={item} />
              ))}
            </ScrollView>
          ) : null}
        </View>
      </SafeAreaView>

      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(15, 43, 51, 0.45)",
            }}
            onPress={() => setFilterVisible(false)}
          />

          <View
            style={{
              backgroundColor: theme.colors.card,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              paddingTop: 10,
              paddingBottom: 28,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#D1D5DB",
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: theme.colors.charcoal,
                marginBottom: 4,
              }}
            >
              Advanced Filters
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.muted,
                marginBottom: 16,
              }}
            >
              Location, type, and hours. Use chips above for categories.
            </Text>

            <AdvancedLocationFilters
              locationState={locationState}
              locating={locating}
              mapTypeFilter={mapTypeFilter}
              openNowOnly={openNowOnly}
              showTypeFilters
              showOpenNow
              showSearchThisArea
              viewportDirty={viewportDirty}
              onCurrentLocation={() => {
                void goToCurrentLocation();
              }}
              onPlaceSelected={(place) => {
                void applyPlaceSearch(place);
              }}
              onSearchThisArea={() => {
                void handleSearchThisArea();
              }}
              onMapTypeFilterChange={applyMapTypeFilter}
              onOpenNowChange={(value) => {
                dismissKeyboard();
                clearSelectedMapItem();
                setOpenNowOnly(value);
              }}
            />
          </View>
        </View>
      </Modal>

      {!hasVisibleBusinesses &&
      !isDiscoveryActive &&
      selectedCategory !== "Events" &&
      (!selectedItem || isMapEvent(selectedItem)) ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 112,
            zIndex: 12,
            alignItems: "center",
          }}
        >
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.94)",
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: theme.colors.muted,
              }}
            >
              No businesses nearby
            </Text>
          </View>
        </View>
      ) : null}

      {selectedItem &&
      !isMapEvent(selectedItem) &&
      previewCarouselData.length > 0 ? (
        <MapBusinessPreviewCarousel
          carouselData={previewCarouselData}
          selectedItem={selectedItem}
          favorites={favorites}
          reviewSummaries={reviewSummaries}
          activeUpdatesById={activeUpdatesById}
          onSelectItem={(item) =>
            selectMapItem(item, { focus: true, animate: false })
          }
          onOpenProfile={openProfile}
          onToggleFavorite={toggleFavorite}
          onOpenDirections={openDirections}
          onOpenCall={openCall}
          onOpenProfileUpdates={openProfileUpdates}
        />
      ) : selectedItem && isMapEvent(selectedItem) ? (
        <MapEventPreviewCard
          event={selectedItem}
          onOpenDetails={() => openEventDetails(selectedItem)}
          onDirections={() => {
            void openEventDirections(selectedItem as EventMapItem);
          }}
        />
      ) : (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: resultSheetHeight,
            backgroundColor: "rgba(255,255,255,0.97)",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
            zIndex: 15,
            overflow: "hidden",
          }}
        >
          <View {...resultSheetPanResponder.panHandlers}>
            <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#D1D5DB",
                }}
              />
            </View>

            <Pressable
              onPress={() => {
                dismissKeyboard();
                if (resultSheetSnap === "collapsed") {
                  snapResultSheet(SHEET_SNAP.half);
                } else if (resultSheetSnap === "half") {
                  snapResultSheet(SHEET_SNAP.expanded);
                } else {
                  snapResultSheet(SHEET_SNAP.collapsed);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingBottom: 10,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDiscoveryActive
                    ? "rgba(13,148,136,0.12)"
                    : "rgba(13,148,136,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name={
                    isDiscoveryActive ? "search-outline" : "musical-notes-outline"
                  }
                  size={20}
                  color={
                    isDiscoveryActive
                      ? theme.colors.turquoise
                      : theme.colors.eventPurple
                  }
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
                  {isDiscoveryActive
                    ? discoveryTitle
                    : selectedCategory === "All"
                      ? "Nearby"
                      : "Upcoming Persian Events"}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    color: theme.colors.muted,
                  }}
                >
                  {isDiscoveryActive
                    ? "Tap a result to view it on the map"
                    : selectedCategory === "All"
                      ? `${nearbyBrowseResults.length} place${
                          nearbyBrowseResults.length === 1 ? "" : "s"
                        } nearby`
                      : `${displayedEvents.length} upcoming event${
                          displayedEvents.length === 1 ? "" : "s"
                        }`}
                </Text>
              </View>

              <Ionicons
                name={
                  resultSheetSnap === "expanded" ? "chevron-down" : "chevron-up"
                }
                size={20}
                color={theme.colors.turquoise}
              />
            </Pressable>
          </View>

          {selectedCategory === "Events" && !isSearchMode ? (
            <View style={{ marginBottom: 12 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {EVENT_TIME_FILTERS.map((filter) => {
                  const active = eventTimeFilter === filter.key;

                  return (
                    <Pressable
                      key={filter.key}
                      onPress={() => setEventTimeFilter(filter.key)}
                      style={{
                        height: 30,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        backgroundColor: active
                          ? theme.colors.eventPurple
                          : "rgba(124,58,237,0.08)",
                        borderWidth: 1,
                        borderColor: active
                          ? theme.colors.eventPurple
                          : theme.colors.border,
                        justifyContent: "center",
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: active ? "#fff" : theme.colors.charcoal,
                        }}
                      >
                        {filter.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {isDiscoveryActive ? (
            discoveryResults.length === 0 ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 88 }}>
                <Text
                  style={{
                    color: theme.colors.muted,
                    textAlign: "center",
                    paddingVertical: 20,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  No results found
                </Text>
                <Text
                  style={{
                    color: theme.colors.muted,
                    textAlign: "center",
                    fontSize: 12,
                  }}
                >
                  Try another keyword or category.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={resultListCanScroll}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingBottom: insets.bottom + 88,
                }}
              >
                {discoveryResults.map((entry) => renderDiscoveryRow(entry))}
              </ScrollView>
            )
          ) : selectedCategory === "All" ? (
            nearbyBrowseResults.length === 0 ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 88 }}>
                <Text
                  style={{
                    color: theme.colors.muted,
                    textAlign: "center",
                    paddingVertical: 20,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  No places found nearby
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={resultListCanScroll}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingBottom: insets.bottom + 88,
                }}
              >
                {nearbyBrowseResults.map((entry) => renderDiscoveryRow(entry))}
              </ScrollView>
            )
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              scrollEnabled={resultListCanScroll}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 88,
              }}
            >
              {displayedEvents.length === 0 ? (
                <Text
                  style={{
                    color: theme.colors.muted,
                    textAlign: "center",
                    paddingVertical: 16,
                  }}
                >
                  No events found
                </Text>
              ) : (
                displayedEvents.map((event) => {
                  const hostLine = formatEventHostLine(event as EventMapItem);

                  return (
                  <Pressable
                    key={`event-${getId(event)}`}
                    onPress={() => openEventDetails(event)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <Image
                      source={{ uri: getImage(event) }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        backgroundColor: "#eee",
                      }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 15,
                          fontWeight: "800",
                          color: theme.colors.charcoal,
                        }}
                      >
                        {getTitle(event)}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: theme.colors.muted,
                        }}
                      >
                        {formatEventDateTime(event as EventMapItem)}
                      </Text>
                      {hostLine ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            marginTop: 3,
                            fontSize: 12,
                            color: theme.colors.muted,
                          }}
                        >
                          {hostLine}
                        </Text>
                      ) : null}
                      <Text
                        numberOfLines={1}
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: theme.colors.muted,
                        }}
                      >
                        {formatEventLocation(event as EventMapItem)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => openEventDetails(event)}
                      hitSlop={10}
                      style={{ paddingLeft: 8 }}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.colors.muted}
                      />
                    </Pressable>
                  </Pressable>
                  );
                })
              )}
            </ScrollView>
          )}
        </Animated.View>
      )}
    </View>
  );
}