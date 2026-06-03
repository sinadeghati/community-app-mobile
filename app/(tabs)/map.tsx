import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getListingMarkerKind,
  isEventListing,
  loadDiscoverableListings,
  MapMarkerKind,
  matchesListingCategory,
  matchesListingSearch,
} from "../../lib/discoverableListings";
import { theme } from "../../lib/theme";

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
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200";

const SAN_DIEGO_REGION: Region = {
  latitude: 32.7157,
  longitude: -117.1611,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

const categoryFilters = [
  { key: "All", label: "All", icon: "apps-outline" },
  { key: "Restaurant", label: "Food", icon: "restaurant-outline" },
  { key: "Cafe", label: "Cafe", icon: "cafe-outline" },
  { key: "Auto Repair", label: "Auto", icon: "car-outline" },
  { key: "Beauty", label: "Beauty", icon: "sparkles-outline" },
  { key: "Events", label: "Events", icon: "calendar-outline" },
  { key: "Services", label: "Services", icon: "briefcase-outline" },
];

const demoEvents: MapItem[] = [
  {
    id: "event-nowruz",
    title: "Nowruz Community Event",
    category: "Events",
    city: "San Diego",
    state: "CA",
    latitude: 32.728,
    longitude: -117.15,
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200",
    rating: 4.8,
    reviews: 24,
    is_featured: true,
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

const getPhone = (item: MapItem) => item?.phone || item?.contact_info || "";

const getLat = (item: MapItem) => {
  const raw = item.latitude || item.lat;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const getLng = (item: MapItem) => {
  const raw = item.longitude || item.lng;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const fallbackCoordinate = (index: number) => ({
  latitude: SAN_DIEGO_REGION.latitude + (index % 4) * 0.025 - 0.035,
  longitude: SAN_DIEGO_REGION.longitude + (index % 5) * 0.025 - 0.04,
});

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

const SCREEN_HEIGHT = Dimensions.get("window").height;

const SHEET_SNAP = {
  collapsed: 96,
  half: Math.round(SCREEN_HEIGHT * 0.38),
  expanded: Math.round(SCREEN_HEIGHT * 0.58),
};

const getCoordinate = (item: MapItem, index: number) => {
  const lat = getLat(item);
  const lng = getLng(item);

  if (lat && lng) {
    return { latitude: lat, longitude: lng };
  }

  return fallbackCoordinate(index);
};

const MAP_CONTROL_GAP = 10;
const MAP_CHIP_ROW_TOP = 10;

export default function MapScreenV25() {
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapView>(null);
  const suppressMapDeselectRef = useRef(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const goToCurrentLocation = async () => {
    dismissKeyboard();
    setLocating(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location permission needed",
          "Allow location access to center the map on your current position."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        Alert.alert(
          "Location unavailable",
          "We could not determine your current location. Please try again."
        );
        return;
      }

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        },
        600
      );
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

  const applyCategoryFilter = (categoryKey: string) => {
    dismissKeyboard();
    setSelectedCategory(categoryKey);
    setSelectedItem(null);
    setFilterVisible(false);
  };

  const selectMapItem = (item: MapItem) => {
    dismissKeyboard();
    suppressMapDeselectRef.current = true;
    setSelectedItem(item);
    requestAnimationFrame(() => {
      suppressMapDeselectRef.current = false;
    });
  };

  const handleMapBackgroundPress = (action?: string) => {
    dismissKeyboard();
    if (suppressMapDeselectRef.current || action === "marker-press") {
      return;
    }
    setSelectedItem(null);
  };

  useEffect(() => {
    loadMapItems();
  }, []);

  const loadMapItems = async () => {
    try {
      setLoading(true);

      const data = await loadDiscoverableListings();
      const merged = [...data, ...demoEvents];

      setItems(merged);

      if (merged.length > 0) {
        setSelectedItem(merged[0]);
      }

      const keys = await AsyncStorage.getAllKeys();
      const favoriteKeys = keys.filter((key) =>
        key.startsWith("favorite-business-")
      );

      const favMap: Record<string, boolean> = {};

      favoriteKeys.forEach((key) => {
        const id = key.replace("favorite-business-", "");
        if (!key.includes("data")) favMap[id] = true;
      });

      setFavorites(favMap);
    } catch (e) {
      console.log("Map V2.5 load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = matchesListingSearch(item, q);
      const matchesCategory = matchesListingCategory(
        item,
        selectedCategory,
        search
      );

      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  useEffect(() => {
    if (!selectedItem) return;

    const stillVisible = filteredItems.some(
      (item) => getId(item) === getId(selectedItem)
    );

    if (!stillVisible) {
      setSelectedItem(filteredItems[0] ?? null);
    }
  }, [filteredItems, selectedCategory]);

  const toggleFavorite = async (item: MapItem) => {
    dismissKeyboard();
    const id = getId(item);
    const next = !favorites[id];

    setFavorites((prev) => ({ ...prev, [id]: next }));

    if (next) {
      await AsyncStorage.setItem(`favorite-business-${id}`, "true");
      await AsyncStorage.setItem(
        `favorite-business-data-${id}`,
        JSON.stringify({
          id,
          name: getTitle(item),
          title: getTitle(item),
          category: getCategory(item),
          image: getImage(item),
          address: getAddress(item),
          city: item.city,
          state: item.state,
          rating: item.rating || 4.8,
          reviews: item.reviews || 24,
        })
      );
    } else {
      await AsyncStorage.removeItem(`favorite-business-${id}`);
      await AsyncStorage.removeItem(`favorite-business-data-${id}`);
    }
  };

  const openProfile = (item: MapItem) => {
    dismissKeyboard();
    router.push({
      pathname: "/profile/v2",
      params: { id: getId(item) },
    });
  };

  const openCall = (item: MapItem) => {
    dismissKeyboard();
    const phone = getPhone(item);

    if (!phone) return;

    Linking.openURL(`tel:${phone}`);
  };

  const openDirections = (item: MapItem, index = 0) => {
    dismissKeyboard();
    const coordinate = getCoordinate(item, index);
    const label = encodeURIComponent(getTitle(item));

    const url = `https://www.google.com/maps/search/?api=1&query=${coordinate.latitude},${coordinate.longitude}&query_place_id=${label}`;

    Linking.openURL(url);
  };

  const MarkerBubble = ({
    item,
    index,
  }: {
    item: MapItem;
    index: number;
  }) => {
    const active = selectedItem && getId(selectedItem) === getId(item);
    const kind = getListingMarkerKind(item);
    const visual = MARKER_VISUALS[kind];
    const pinSize = active ? 34 : 30;
    const iconSize = active ? 15 : 13;

    return (
      <Marker
        coordinate={getCoordinate(item, index)}
        onPress={(e) => {
          e.stopPropagation?.();
          selectMapItem(item);
        }}
        tracksViewChanges={false}
      >
        <View
          pointerEvents="none"
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {active ? (
            <View
              style={{
                position: "absolute",
                width: 42,
                height: 42,
                borderRadius: 21,
                borderWidth: 2,
                borderColor: "rgba(13,148,136,0.32)",
                backgroundColor: "rgba(13,148,136,0.08)",
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
              borderColor: active ? theme.colors.turquoise : visual.accent,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
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
        </View>
      </Marker>
    );
  };

  const eventListings = useMemo(
    () =>
      filteredItems.filter(
        (item) => isEventListing(item) || getListingMarkerKind(item) === "events"
      ),
    [filteredItems]
  );

  const EventsBottomSheet = () => {
    const insets = useSafeAreaInsets();
    const sheetHeight = useRef(new Animated.Value(SHEET_SNAP.collapsed)).current;
    const dragStartHeight = useRef(SHEET_SNAP.collapsed);
    const [sheetSnap, setSheetSnap] = useState<"collapsed" | "half" | "expanded">(
      "collapsed"
    );

    const snapTo = (height: number) => {
      const snap =
        height <= SHEET_SNAP.collapsed + 24
          ? "collapsed"
          : height <= SHEET_SNAP.half + 40
            ? "half"
            : "expanded";

      setSheetSnap(snap);
      Animated.spring(sheetHeight, {
        toValue: height,
        useNativeDriver: false,
        friction: 9,
        tension: 72,
      }).start();
    };

    const snapToNearest = (height: number) => {
      const snaps = [SHEET_SNAP.collapsed, SHEET_SNAP.half, SHEET_SNAP.expanded];
      const nearest = snaps.reduce((prev, curr) =>
        Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
      );
      snapTo(nearest);
    };

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
          snapToNearest(projected);
        },
      })
    ).current;

    const listCanScroll = sheetSnap === "expanded" || sheetSnap === "half";

    return (
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetHeight,
          backgroundColor: theme.colors.card,
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
        <View {...panResponder.panHandlers}>
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
              if (sheetSnap === "collapsed") snapTo(SHEET_SNAP.half);
              else if (sheetSnap === "half") snapTo(SHEET_SNAP.expanded);
              else snapTo(SHEET_SNAP.collapsed);
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
                backgroundColor: "rgba(13,148,136,0.12)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
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
                Tonight & upcoming events
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  color: theme.colors.muted,
                }}
              >
                {eventListings.length} event{eventListings.length === 1 ? "" : "s"} nearby
              </Text>
            </View>

            <Ionicons
              name={
                sheetSnap === "expanded"
                  ? "chevron-down"
                  : "chevron-up"
              }
              size={20}
              color={theme.colors.turquoise}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={listCanScroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 88,
          }}
        >
          {eventListings.length === 0 ? (
            <Text
              style={{
                color: theme.colors.muted,
                textAlign: "center",
                paddingVertical: 16,
              }}
            >
              No upcoming events match your filters.
            </Text>
          ) : (
            eventListings.map((event) => (
              <Pressable
                key={`event-${getId(event)}`}
                onPress={() => {
                  dismissKeyboard();
                  selectMapItem(event);
                  snapTo(SHEET_SNAP.collapsed);
                }}
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
                    {getCategory(event)} · {getAddress(event)}
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      fontWeight: "700",
                      color: theme.colors.turquoise,
                    }}
                  >
                    View on map
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  const FilterPill = ({ item }: { item: any }) => {
    const active = selectedCategory === item.key;

    return (
      <Pressable
        onPress={() => {
          dismissKeyboard();
          setSelectedCategory(item.key);
          setSelectedItem(null);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 30,
          paddingHorizontal: 10,
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
        <Ionicons
          name={item.icon as any}
          size={14}
          color={active ? "#fff" : theme.colors.muted}
        />

        <Text
          style={{
            marginLeft: 5,
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

  const BusinessCard = ({ item }: { item: MapItem }) => {
    const id = getId(item);
    const saved = favorites[id];

    return (
      <View
        onTouchStart={dismissKeyboard}
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 88,
          zIndex: 20,
          elevation: 20,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 20,
            padding: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
        <Pressable onPress={() => openProfile(item)}>
          <View style={{ flexDirection: "row" }}>
            <Image
              source={{ uri: getImage(item) }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                backgroundColor: "#eee",
              }}
              resizeMode="cover"
            />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 17,
                    fontWeight: "800",
                    color: theme.colors.charcoal,
                  }}
                >
                  {getTitle(item)}
                </Text>

                <Pressable onPress={() => toggleFavorite(item)}>
                  <Ionicons
                    name={saved ? "heart" : "heart-outline"}
                    size={22}
                    color={saved ? theme.colors.danger : theme.colors.charcoal}
                  />
                </Pressable>
              </View>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 3,
                  color: theme.colors.muted,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {getCategory(item)}
              </Text>

              <Text
                style={{
                  marginTop: 4,
                  color: "#C49A3A",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                ⭐ {item.rating || "4.8"} · {item.reviews || 24} reviews
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 4,
                  color: theme.colors.muted,
                  fontSize: 12,
                }}
              >
                {getAddress(item)}
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <Pressable
            onPress={() => openDirections(item)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 12,
              backgroundColor: theme.colors.turquoise,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Ionicons name="navigate" size={16} color="#fff" />
            <Text style={{ marginLeft: 5, color: "#fff", fontWeight: "700", fontSize: 13 }}>
              Directions
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openCall(item)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 12,
              backgroundColor: theme.colors.deepTeal,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={{ marginLeft: 5, color: "#fff", fontWeight: "700", fontSize: 13 }}>
              Call
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openProfile(item)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 12,
              backgroundColor: "rgba(13,148,136,0.1)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Ionicons name="person" size={17} color={theme.colors.turquoise} />
            <Text
              style={{
                marginLeft: 5,
                color: theme.colors.turquoise,
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              View Profile
            </Text>
          </Pressable>
        </View>
        </View>
      </View>
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
    <View style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={SAN_DIEGO_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={(e) => handleMapBackgroundPress(e.nativeEvent?.action)}
      >
        {filteredItems.map((item, index) => (
          <MarkerBubble key={`${getId(item)}-${index}`} item={item} index={index} />
        ))}
      </MapView>

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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ marginTop: MAP_CHIP_ROW_TOP }}
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
              Filter map
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.muted,
                marginBottom: 14,
              }}
            >
              Choose a category to filter markers on the map.
            </Text>

            {categoryFilters.map((item) => {
              const active = selectedCategory === item.key;

              return (
                <Pressable
                  key={`filter-${item.key}`}
                  onPress={() => applyCategoryFilter(item.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    marginBottom: 6,
                    backgroundColor: active
                      ? "rgba(13,148,136,0.12)"
                      : "transparent",
                    borderWidth: 1,
                    borderColor: active
                      ? "rgba(13,148,136,0.28)"
                      : theme.colors.border,
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={active ? theme.colors.turquoise : theme.colors.muted}
                  />
                  <Text
                    style={{
                      marginLeft: 10,
                      flex: 1,
                      fontSize: 15,
                      fontWeight: active ? "800" : "600",
                      color: theme.colors.charcoal,
                    }}
                  >
                    {item.label}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.turquoise}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {selectedItem ? (
        <BusinessCard item={selectedItem} />
      ) : (
        <EventsBottomSheet />
      )}
    </View>
  );
}