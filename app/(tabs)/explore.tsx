import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadDiscoverableListings,
  matchesListingCategory,
  matchesListingSearch,
} from "../../lib/discoverableListings";
import { theme } from "../../lib/theme";

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

const EVENT_IMAGE =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200";

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

const goProfile = (item: Listing) => {
  router.push({
    pathname: "/profile/v2",
    params: { id: getId(item) },
  });
};

export default function ExploreScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const loadFavorites = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const favoriteKeys = keys.filter(
        (key) =>
          key.startsWith("favorite-business-") && !key.includes("data")
      );

      if (favoriteKeys.length === 0) {
        setFavorites({});
        return;
      }

      const result = await AsyncStorage.multiGet(favoriteKeys);
      const favMap: Record<string, boolean> = {};

      result.forEach(([key, value]) => {
        const id = key.replace("favorite-business-", "");
        favMap[id] = value === "true";
      });

      setFavorites(favMap);
    } catch (e) {
      console.log("Explore favorites load error:", e);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await loadDiscoverableListings();
      setListings(data);
      await loadFavorites();
    } catch (e) {
      console.log("Explore V2.5 load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (item: Listing) => {
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

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();

    return listings.filter((item) => {
      const matchesSearch = matchesListingSearch(item, q);
      const matchesCategory = matchesListingCategory(
        item,
        selectedCategory,
        search
      );

      return matchesSearch && matchesCategory;
    });
  }, [listings, search, selectedCategory]);

  const featured = useMemo(() => {
    const list = filteredListings.filter(isFeatured);
    return list.length ? list.slice(0, 6) : filteredListings.slice(0, 6);
  }, [filteredListings]);

  const popular = useMemo(() => filteredListings.slice(0, 8), [filteredListings]);

  const SectionHeader = ({ title, action }: { title: string; action?: string }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: 28,
        marginBottom: 14,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 24,
          fontWeight: "900",
          color: theme.colors.charcoal,
        }}
      >
        {title}
      </Text>

      {action ? (
        <Text
          style={{
            color: theme.colors.turquoise,
            fontWeight: "800",
            fontSize: 14,
          }}
        >
          {action}
        </Text>
      ) : null}
    </View>
  );  const CategoryPill = ({ item }: { item: any }) => {
    const active = selectedCategory === item.key;

    return (
      <Pressable
        onPress={() => setSelectedCategory(item.key)}
        style={{
          width: 96,
          height: 92,
          borderRadius: 26,
          backgroundColor: active ? "rgba(13,148,136,0.14)" : theme.colors.card,
          borderWidth: 1,
          borderColor: active ? "rgba(13,148,136,0.32)" : theme.colors.border,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          ...theme.shadow.soft,
        }}
      >
        <Ionicons
          name={item.icon as any}
          size={28}
          color={active ? theme.colors.turquoise : theme.colors.charcoal}
        />
        <Text
          numberOfLines={1}
          style={{
            marginTop: 9,
            fontSize: 13,
            fontWeight: "900",
            color: theme.colors.charcoal,
          }}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  const BusinessCard = ({ item, large = false }: { item: Listing; large?: boolean }) => {
    const id = getId(item);
    const saved = favorites[id];

    return (
      <Pressable
        onPress={() => goProfile(item)}
        style={{
          width: large ? 182 : 165,
          backgroundColor: theme.colors.card,
          borderRadius: 26,
          marginRight: 14,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadow.soft,
        }}
      >
        <Image
          source={{ uri: getImage(item) }}
          style={{
            width: "100%",
            height: large ? 128 : 112,
            backgroundColor: "#eee",
          }}
          resizeMode="cover"
        />

        <Pressable
          onPress={() => toggleFavorite(item)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "rgba(255,255,255,0.92)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={22}
            color={saved ? theme.colors.danger : theme.colors.charcoal}
          />
        </Pressable>

        <View style={{ padding: 13 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: large ? 18 : 16,
                fontWeight: "900",
                color: theme.colors.charcoal,
              }}
            >
              {getTitle(item)}
            </Text>

            {item.is_verified ? (
              <Ionicons name="checkmark-circle" size={17} color={theme.colors.turquoise} />
            ) : null}
          </View>

          <Text
            numberOfLines={1}
            style={{
              marginTop: 4,
              color: theme.colors.muted,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {getCategory(item)}
          </Text>

          <Text
            style={{
              marginTop: 8,
              color: "#C49A3A",
              fontSize: 13,
              fontWeight: "900",
            }}
          >
            ⭐ {item.rating || "4.8"} · {item.reviews || 24} reviews
          </Text>
        </View>
      </Pressable>
    );
  };

  const PopularRow = ({ item }: { item: Listing }) => {
    const id = getId(item);
    const saved = favorites[id];

    return (
      <Pressable
        onPress={() => goProfile(item)}
        style={{
          marginHorizontal: 20,
          marginBottom: 13,
          backgroundColor: theme.colors.card,
          borderRadius: 24,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadow.soft,
        }}
      >
        <Image
          source={{ uri: getImage(item) }}
          style={{
            width: 76,
            height: 76,
            borderRadius: 18,
            backgroundColor: "#eee",
          }}
          resizeMode="cover"
        />

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: theme.colors.charcoal,
            }}
          >
            {getTitle(item)}
          </Text>

          <Text
            numberOfLines={1}
            style={{
              marginTop: 3,
              color: theme.colors.muted,
              fontWeight: "600",
            }}
          >
            {getCategory(item)}
          </Text>

          <Text
            style={{
              marginTop: 6,
              color: "#C49A3A",
              fontWeight: "900",
            }}
          >
            ⭐ {item.rating || "4.8"} · {item.reviews || 24} reviews
          </Text>
        </View>

        <Pressable onPress={() => toggleFavorite(item)}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={27}
            color={saved ? theme.colors.turquoise : theme.colors.charcoal}
          />
        </Pressable>
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
  }  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <FlatList
        data={popular}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 34,
                      fontWeight: "900",
                      color: theme.colors.charcoal,
                    }}
                  >
                    Explore
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      color: theme.colors.muted,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Discover the heart of your community
                  </Text>
                </View>

                <Pressable
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: theme.colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    ...theme.shadow.soft,
                  }}
                >
                  <Ionicons
                    name="options-outline"
                    size={23}
                    color={theme.colors.turquoise}
                  />
                </Pressable>
              </View>

              <View
                style={{
                  marginTop: 18,
                  height: 56,
                  borderRadius: 22,
                  backgroundColor: theme.colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 15,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  ...theme.shadow.soft,
                }}
              >
                <Ionicons
                  name="search-outline"
                  size={21}
                  color={theme.colors.turquoise}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search businesses, services, events..."
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
                    <Ionicons name="close-circle" size={21} color="#999" />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
              <ImageBackground
                source={{ uri: HERO_IMAGE }}
                imageStyle={{ borderRadius: 32 }}
                style={{
                  height: 210,
                  borderRadius: 32,
                  overflow: "hidden",
                  ...theme.shadow.medium,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(6,31,36,0.52)",
                    padding: 22,
                    justifyContent: "flex-end",
                  }}
                >
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "rgba(13,148,136,0.92)",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "900",
                        letterSpacing: 0.4,
                      }}
                    >
                      PERSIAN COMMUNITY
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 28,
                      lineHeight: 33,
                      fontWeight: "900",
                      width: "85%",
                    }}
                  >
                    Discover the heart of your community
                  </Text>

                  <Text
                    style={{
                      marginTop: 8,
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 14.5,
                      lineHeight: 21,
                      width: "88%",
                    }}
                  >
                    Local businesses, events, services, and Persian culture near you.
                  </Text>

                  <Pressable
                    onPress={() => router.push("/(tabs)/map")}
                    style={{
                      marginTop: 15,
                      alignSelf: "flex-start",
                      backgroundColor: theme.colors.turquoise,
                      borderRadius: 16,
                      paddingHorizontal: 18,
                      paddingVertical: 11,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>
                      Open Map
                    </Text>
                  </Pressable>
                </View>
              </ImageBackground>
            </View>

            <SectionHeader title="Popular Categories" action="See all" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
              {categories.map((item) => (
                <CategoryPill key={item.key} item={item} />
              ))}
            </ScrollView>

            <SectionHeader title="Featured Businesses" action="See all" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
              {featured.map((item) => (
                <BusinessCard key={`featured-${item.id}`} item={item} large />
              ))}
            </ScrollView>

            <SectionHeader title="Upcoming Events" action="View all" />
            <View
              style={{
                marginHorizontal: 20,
                borderRadius: 30,
                overflow: "hidden",
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
                ...theme.shadow.medium,
              }}
            >
              <ImageBackground
                source={{ uri: EVENT_IMAGE }}
                style={{ height: 150 }}
                resizeMode="cover"
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(15,43,51,0.42)",
                    padding: 18,
                    justifyContent: "flex-end",
                  }}
                >
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: theme.colors.eventPurple,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
                      TONIGHT
                    </Text>
                  </View>

                  <Text
                    style={{
                      marginTop: 8,
                      color: "#fff",
                      fontSize: 22,
                      fontWeight: "900",
                    }}
                  >
                    Persian Events Near You
                  </Text>
                </View>
              </ImageBackground>

              <View style={{ padding: 16 }}>
                <Text style={{ color: theme.colors.muted, lineHeight: 22 }}>
                  Concerts, Nowruz, Yalda, networking nights, and community events.
                </Text>

                <Pressable
                  onPress={() => router.push("/(tabs)/map")}
                  style={{
                    marginTop: 14,
                    height: 46,
                    borderRadius: 16,
                    backgroundColor: "rgba(13,148,136,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.turquoise,
                      fontWeight: "900",
                    }}
                  >
                    Explore Events on Map
                  </Text>
                </Pressable>
              </View>
            </View>

            <SectionHeader title="Popular This Week" />
          </>
        }
        renderItem={({ item }) => <PopularRow item={item} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 70, paddingHorizontal: 30 }}>
            <Ionicons name="search-outline" size={42} color={theme.colors.turquoise} />
            <Text
              style={{
                marginTop: 14,
                fontSize: 20,
                fontWeight: "900",
                color: theme.colors.charcoal,
              }}
            >
              No businesses found
            </Text>
            <Text
              style={{
                marginTop: 6,
                color: theme.colors.muted,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Try another keyword, category, or city.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}