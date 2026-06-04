import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  loadDiscoverableListings,
  matchesListingCategory,
  matchesListingSearch,
} from "../../lib/discoverableListings";
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
  const [reviewSummaries, setReviewSummaries] = useState<
    Record<string, BusinessReviewSummary>
  >({});

  const syncReviewSummaries = useCallback(async (items: Listing[]) => {
    const ids = [...new Set(items.map(getId).filter(Boolean))];
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

  const loadFavorites = async () => {
    try {
      setFavorites(await loadFavoriteBusinessMap());
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
      if (listings.length > 0) {
        syncReviewSummaries(listings);
      }
    }, [listings, syncReviewSummaries])
  );

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await loadDiscoverableListings();
      setListings(data);
      await syncReviewSummaries(data);
      await loadFavorites();
    } catch (e) {
      console.log("Explore V2.5 load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (item: Listing) => {
    const id = getId(item);
    const currently = Boolean(favorites[id]);
    const allowed = await ensureLoggedInForSave(
      currently ? "manage your favorites" : "save businesses"
    );
    if (!allowed) return;

    const next = await toggleBusinessFavorite(item, currently);
    setFavorites((prev) => ({ ...prev, [id]: next }));
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

  const getReviewLine = (item: Listing) =>
    formatMapPreviewReviewText(reviewSummaries[getId(item)]);

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

  const BusinessCard = ({ item, large = false }: { item: Listing; large?: boolean }) => {
    const id = getId(item);
    const saved = favorites[id];
    const reviewLine = getReviewLine(item);

    return (
      <Pressable
        onPress={() => goProfile(item)}
        style={{
          width: large ? 168 : 154,
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
          source={{ uri: getImage(item) }}
          style={{
            width: "100%",
            height: large ? 116 : 100,
            backgroundColor: "#eee",
          }}
          resizeMode="cover"
        />

        <Pressable
          onPress={() => toggleFavorite(item)}
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

        <View style={{ padding: 11 }}>
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
              <Ionicons name="checkmark-circle" size={15} color={theme.colors.turquoise} />
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

          {reviewLine ? (
            <Text
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.charcoal,
              }}
            >
              {reviewLine}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const PopularRow = ({ item }: { item: Listing }) => {
    const id = getId(item);
    const saved = favorites[id];
    const reviewLine = getReviewLine(item);

    return (
      <Pressable
        onPress={() => goProfile(item)}
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
          source={{ uri: getImage(item) }}
          style={{
            width: 60,
            height: 60,
            borderRadius: theme.radius.sm,
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
            {getTitle(item)}
          </Text>

          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              color: theme.colors.muted,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {getCategory(item)}
          </Text>

          {reviewLine ? (
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

        <Pressable onPress={() => toggleFavorite(item)} hitSlop={8}>
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={22}
            color={saved ? theme.colors.danger : theme.colors.charcoal}
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
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <FlatList
        data={popular}
        keyExtractor={(item) => String(item.id)}
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
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
                </View>

                <Pressable
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    ...exploreCardShadow,
                  }}
                >
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={theme.colors.turquoise}
                  />
                </Pressable>
              </View>

              <View
                style={{
                  marginTop: theme.spacing.md,
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

            <SectionHeader title="Featured Businesses" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: theme.spacing.md,
                paddingRight: 8,
              }}
            >
              {featured.map((item) => (
                <BusinessCard key={`featured-${item.id}`} item={item} large />
              ))}
            </ScrollView>

            <SectionHeader title="Upcoming Events" />
            <View
              style={{
                marginHorizontal: theme.spacing.md,
                borderRadius: theme.radius.md,
                overflow: "hidden",
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
                ...exploreCardShadow,
              }}
            >
              <ImageBackground
                source={{ uri: EVENT_IMAGE }}
                style={{ height: 128 }}
                resizeMode="cover"
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(15,43,51,0.42)",
                    padding: 14,
                    justifyContent: "flex-end",
                  }}
                >
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: theme.colors.eventPurple,
                      borderRadius: theme.radius.pill,
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>
                      TONIGHT
                    </Text>
                  </View>

                  <Text
                    style={{
                      marginTop: 6,
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    Persian Events Near You
                  </Text>
                </View>
              </ImageBackground>

              <View style={{ padding: 14 }}>
                <Text
                  style={{
                    color: theme.colors.muted,
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                >
                  Concerts, Nowruz, Yalda, networking nights, and community events.
                </Text>

                <Pressable
                  onPress={() => router.push("/(tabs)/map")}
                  style={{
                    marginTop: 12,
                    height: 42,
                    borderRadius: theme.radius.sm,
                    backgroundColor: "rgba(13,148,136,0.10)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.turquoise,
                      fontWeight: "800",
                      fontSize: 13,
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
          <View
            style={{
              alignItems: "center",
              paddingTop: 56,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <Ionicons name="search-outline" size={36} color={theme.colors.turquoise} />
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
              Try another keyword, category, or city.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}