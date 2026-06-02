import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../lib/api";
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
  { key: "All", label: "All", icon: "apps-outline", color: theme.colors.turquoise },
  { key: "Restaurant", label: "Food", icon: "restaurant-outline", color: "#E67E22" },
  { key: "Cafe", label: "Cafe", icon: "cafe-outline", color: theme.colors.turquoise },
  { key: "Auto Repair", label: "Auto", icon: "car-outline", color: "#2563EB" },
  { key: "Beauty", label: "Beauty", icon: "sparkles-outline", color: "#C026D3" },
  { key: "Events", label: "Events", icon: "musical-notes-outline", color: theme.colors.eventPurple },
  { key: "Services", label: "Services", icon: "briefcase-outline", color: theme.colors.deepTeal },
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

const getCoordinate = (item: MapItem, index: number) => {
  const lat = getLat(item);
  const lng = getLng(item);

  if (lat && lng) {
    return { latitude: lat, longitude: lng };
  }

  return fallbackCoordinate(index);
};

const getMarkerStyle = (item: MapItem) => {
  const category = getCategory(item).toLowerCase();

  if (category.includes("event")) {
    return {
      color: theme.colors.eventPurple,
      icon: "musical-notes-outline",
    };
  }

  if (category.includes("restaurant") || category.includes("food")) {
    return {
      color: "#E67E22",
      icon: "restaurant-outline",
    };
  }

  if (category.includes("cafe")) {
    return {
      color: theme.colors.turquoise,
      icon: "cafe-outline",
    };
  }

  if (category.includes("auto")) {
    return {
      color: "#2563EB",
      icon: "car-outline",
    };
  }

  if (category.includes("beauty")) {
    return {
      color: "#C026D3",
      icon: "sparkles-outline",
    };
  }

  return {
    color: theme.colors.turquoise,
    icon: "briefcase-outline",
  };
};

export default function MapScreenV25() {
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});  useEffect(() => {
    loadMapItems();
  }, []);

  const loadMapItems = async () => {
    try {
      setLoading(true);

      const response = await API.getListings();
      const data = Array.isArray(response) ? response : response?.results || [];

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
      const title = getTitle(item).toLowerCase();
      const category = getCategory(item).toLowerCase();
      const city = String(item.city || "").toLowerCase();
      const description = String(item.description || "").toLowerCase();

      const matchesSearch =
        !q ||
        title.includes(q) ||
        category.includes(q) ||
        city.includes(q) ||
        description.includes(q);

      const matchesCategory =
        selectedCategory === "All" ||
        category.includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  const nearbyItems = useMemo(() => {
    if (!selectedItem) return filteredItems.slice(0, 4);

    return filteredItems
      .filter((item) => getId(item) !== getId(selectedItem))
      .slice(0, 4);
  }, [filteredItems, selectedItem]);

  const toggleFavorite = async (item: MapItem) => {
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
    router.push({
      pathname: "/profile/v2",
      params: { id: getId(item) },
    });
  };

  const openCall = (item: MapItem) => {
    const phone = getPhone(item);

    if (!phone) return;

    Linking.openURL(`tel:${phone}`);
  };

  const openDirections = (item: MapItem, index = 0) => {
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
    const marker = getMarkerStyle(item);
    const active = selectedItem && getId(selectedItem) === getId(item);

    return (
      <Marker
        coordinate={getCoordinate(item, index)}
        onPress={() => setSelectedItem(item)}
        tracksViewChanges={false}
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {active ? (
            <View
              style={{
                position: "absolute",
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "rgba(13,148,136,0.18)",
              }}
            />
          ) : null}

          <View
            style={{
              width: active ? 48 : 42,
              height: active ? 48 : 42,
              borderRadius: active ? 24 : 21,
              backgroundColor: marker.color,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.18,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Ionicons name={marker.icon as any} size={active ? 25 : 21} color="#fff" />
          </View>

          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 7,
              borderRightWidth: 7,
              borderTopWidth: 10,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderTopColor: marker.color,
              marginTop: -3,
            }}
          />
        </View>
      </Marker>
    );
  };

  const FilterPill = ({ item }: { item: any }) => {
    const active = selectedCategory === item.key;

    return (
      <Pressable
        onPress={() => {
          setSelectedCategory(item.key);
          setSelectedItem(null);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 46,
          paddingHorizontal: 15,
          borderRadius: 999,
          backgroundColor: active ? theme.colors.turquoise : "rgba(255,255,255,0.94)",
          marginRight: 10,
          borderWidth: 1,
          borderColor: active ? "rgba(13,148,136,0.35)" : theme.colors.border,
          ...theme.shadow.soft,
        }}
      >
        <Ionicons
          name={item.icon as any}
          size={19}
          color={active ? "#fff" : item.color}
        />

        <Text
          style={{
            marginLeft: 7,
            fontWeight: "900",
            color: active ? "#fff" : theme.colors.charcoal,
          }}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };  const BusinessCard = ({ item }: { item: MapItem }) => {
    const id = getId(item);
    const saved = favorites[id];

    return (
      <View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 88,
          backgroundColor: theme.colors.card,
          borderRadius: 30,
          padding: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadow.medium,
        }}
      >
        <View style={{ flexDirection: "row" }}>
          <Image
            source={{ uri: getImage(item) }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 22,
              backgroundColor: "#eee",
            }}
            resizeMode="cover"
          />

          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 20,
                  fontWeight: "900",
                  color: theme.colors.charcoal,
                }}
              >
                {getTitle(item)}
              </Text>

              <Pressable onPress={() => toggleFavorite(item)}>
                <Ionicons
                  name={saved ? "heart" : "heart-outline"}
                  size={27}
                  color={saved ? theme.colors.danger : theme.colors.charcoal}
                />
              </Pressable>
            </View>

            <Text
              numberOfLines={1}
              style={{
                marginTop: 5,
                color: theme.colors.muted,
                fontWeight: "700",
              }}
            >
              {getCategory(item)}
            </Text>

            <Text
              style={{
                marginTop: 7,
                color: "#C49A3A",
                fontWeight: "900",
              }}
            >
              ⭐ {item.rating || "4.8"} · {item.reviews || 24} reviews
            </Text>

            <Text
              numberOfLines={1}
              style={{
                marginTop: 7,
                color: theme.colors.muted,
                fontSize: 13,
              }}
            >
              📍 {getAddress(item)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 9, marginTop: 14 }}>
          <Pressable
            onPress={() => openDirections(item)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 17,
              backgroundColor: theme.colors.turquoise,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={{ marginLeft: 6, color: "#fff", fontWeight: "900" }}>
              Directions
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openCall(item)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 17,
              backgroundColor: theme.colors.deepTeal,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={{ marginLeft: 6, color: "#fff", fontWeight: "900" }}>
              Call
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openProfile(item)}
            style={{
              width: 46,
              height: 44,
              borderRadius: 17,
              backgroundColor: "rgba(13,148,136,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={20} color={theme.colors.turquoise} />
          </Pressable>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Text
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: "900",
                color: theme.colors.charcoal,
              }}
            >
              More nearby businesses
            </Text>

            <Text style={{ color: theme.colors.turquoise, fontWeight: "900" }}>
              See all
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearbyItems.map((nearby) => (
              <Pressable
                key={`nearby-${getId(nearby)}`}
                onPress={() => setSelectedItem(nearby)}
                style={{
                  width: 132,
                  marginRight: 10,
                }}
              >
                <Image
                  source={{ uri: getImage(nearby) }}
                  style={{
                    width: 132,
                    height: 78,
                    borderRadius: 18,
                    backgroundColor: "#eee",
                  }}
                  resizeMode="cover"
                />

                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 6,
                    fontWeight: "900",
                    color: theme.colors.charcoal,
                  }}
                >
                  {getTitle(nearby)}
                </Text>

                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 2,
                    color: theme.colors.muted,
                    fontSize: 12,
                  }}
                >
                  {getCategory(nearby)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
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
        style={{ flex: 1 }}
        initialRegion={SAN_DIEGO_REGION}
        onPress={() => setSelectedItem(null)}
      >
        {filteredItems.map((item, index) => (
          <MarkerBubble key={`${getId(item)}-${index}`} item={item} index={index} />
        ))}
      </MapView>

      <SafeAreaView
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        <View style={{ paddingHorizontal: 18, paddingTop: 10 }}>
          <View
            style={{
              height: 58,
              borderRadius: 24,
              backgroundColor: "rgba(255,255,255,0.96)",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 15,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...theme.shadow.soft,
            }}
          >
            <Ionicons name="search-outline" size={22} color={theme.colors.turquoise} />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search map, events, businesses..."
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 15,
                color: theme.colors.charcoal,
              }}
            />

            {search.length > 0 ? (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={22} color="#999" />
              </Pressable>
            ) : (
              <Ionicons name="options-outline" size={23} color={theme.colors.turquoise} />
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 12,
              paddingRight: 10,
            }}
          >
            {categoryFilters.map((item) => (
              <FilterPill key={item.key} item={item} />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      <View
        style={{
          position: "absolute",
          right: 18,
          top: 172,
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => {
            setSelectedCategory("All");
            setSelectedItem(null);
          }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "rgba(255,255,255,0.96)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadow.soft,
          }}
        >
          <Ionicons name="locate-outline" size={25} color={theme.colors.turquoise} />
        </Pressable>

        <Pressable
          onPress={() => {
            setSelectedCategory("Events");
            setSelectedItem(null);
          }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.colors.eventPurple,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 3,
            borderColor: "#fff",
            ...theme.shadow.soft,
          }}
        >
          <Ionicons name="musical-notes" size={23} color="#fff" />
        </Pressable>
      </View>

      {selectedItem ? (
        <BusinessCard item={selectedItem} />
      ) : (
        <Pressable
          onPress={() => setSelectedCategory("Events")}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 88,
            backgroundColor: theme.colors.card,
            borderRadius: 26,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            flexDirection: "row",
            alignItems: "center",
            ...theme.shadow.medium,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(13,148,136,0.14)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 13,
            }}
          >
            <Ionicons name="musical-notes-outline" size={24} color={theme.colors.turquoise} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: theme.colors.charcoal,
              }}
            >
              Tonight & upcoming events
            </Text>

            <Text
              style={{
                marginTop: 4,
                color: theme.colors.muted,
                lineHeight: 20,
              }}
            >
              Discover concerts, Nowruz, Yalda, and community events.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color={theme.colors.turquoise} />
        </Pressable>
      )}
    </View>
  );
}