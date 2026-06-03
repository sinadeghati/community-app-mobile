import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

const colors = {
  bg: "#F7F5F0",
  card: "#FFFFFF",
  text: "#111111",
  muted: "#6B7280",
  border: "#E5E0D8",
  teal: "#0D9488",
  tealSoft: "rgba(13,148,136,0.10)",
  gold: "#E6C27A",
  danger: "#DC2626",
  success: "#16A34A",
  warning: "#F59E0B",
};

type ListingStatus = "active" | "pending" | "draft" | "archived";

type ListingItem = {
  id: string;
  title: string;
  category: string;
  city: string;
  image: string;
  status: ListingStatus;
  views: number;
  favorites: number;
  messages: number;
  updatedAt: string;
};

const sampleListings: ListingItem[] = [
  {
    id: "1",
    title: "Fair Auto",
    category: "Auto Repair",
    city: "San Diego, CA",
    image:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200&auto=format&fit=crop",
    status: "active",
    views: 342,
    favorites: 18,
    messages: 7,
    updatedAt: "Updated today",
  },
  {
    id: "2",
    title: "Tahchin Corner",
    category: "Persian Food",
    city: "San Diego, CA",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    status: "pending",
    views: 128,
    favorites: 12,
    messages: 3,
    updatedAt: "Submitted yesterday",
  },
  {
    id: "3",
    title: "Luxury Home Developments",
    category: "Real Estate",
    city: "San Diego, CA",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
    status: "draft",
    views: 0,
    favorites: 0,
    messages: 0,
    updatedAt: "Draft saved",
  },
];

export default function MyListingsScreen() {
  const [activeFilter, setActiveFilter] = useState<"all" | ListingStatus>("all");
  const [listings, setListings] = useState<ListingItem[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const loadListings = async () => {
        try {
          const rawProfile = await AsyncStorage.getItem("user_profile_v2");

          if (!rawProfile) {
            setListings([]);
            return;
          }

          const profile = JSON.parse(rawProfile);

          const storageKey = `my_listings_${profile.username || profile.email || "default"}`;

          const rawListings = await AsyncStorage.getItem(storageKey);

          if (rawListings) {
            setListings(JSON.parse(rawListings));
          } else {
            setListings([]);
          }
        } catch (error) {
          console.log("Failed to load listings", error);
        }
      };

      loadListings();
    }, [])
  );

  const filteredListings = useMemo(() => {
    if (activeFilter === "all") {
      return listings;
    }

    return listings.filter((item) => item.status === activeFilter);
  }, [activeFilter, listings]);

  const stats = useMemo(() => {
    return {
      active: listings.filter((item) => item.status === "active").length,
      pending: listings.filter((item) => item.status === "pending").length,
      drafts: listings.filter((item) => item.status === "draft").length,
      views: listings.reduce((sum, item) => sum + item.views, 0),
      favorites: listings.reduce((sum, item) => sum + item.favorites, 0),
    };
  }, [listings]);

  const statusColor = (status: ListingStatus) => {
    if (status === "active") return colors.success;
    if (status === "pending") return colors.warning;
    if (status === "draft") return colors.muted;
    return colors.danger;
  };

  const statusLabel = (status: ListingStatus) => {
    if (status === "active") return "Active";
    if (status === "pending") return "Pending";
    if (status === "draft") return "Draft";
    return "Archived";
  };

  const goAddListing = () => {
    router.push({
      pathname: "/create",
      params: { returnTo: "mylistings" },
    });
  };

  const goEditListing = (id: string) => {
    router.push({
      pathname: "/create",
      params: { editId: id, returnTo: "mylistings" },
    });
  };

  const goListingDetails = (id: string) => {
    router.push({
      pathname: "/listing/[id]",
      params: { id },
    });
  };

  const confirmDelete = (item: ListingItem) => {
    Alert.alert(
      "Delete listing",
      `Are you sure you want to delete ${item.title}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const rawProfile = await AsyncStorage.getItem("user_profile_v2");
              const profile = rawProfile ? JSON.parse(rawProfile) : {};

              const storageKey = `my_listings_${profile.username || profile.email || "default"}`;

              const existing = await AsyncStorage.getItem(storageKey);

              const parsedListings = existing ? JSON.parse(existing) : [];

              const updatedListings = parsedListings.filter(
                (listing: ListingItem) => listing.id !== item.id
              );

              await AsyncStorage.setItem(
                storageKey,
                JSON.stringify(updatedListings)
              );

              setListings(updatedListings);

              Alert.alert("Deleted", "Listing removed successfully.");
            } catch (error) {
              Alert.alert("Error", "Could not delete listing.");
            }
          }
        },
      ]
    );
  };

  const StatCard = ({
    icon,
    value,
    label,
    subtitle,
    color,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    label: string;
    subtitle: string;
    color: string;
  }) => (
    <View
      style={{
        flex: 1,
        minHeight: 118,
        backgroundColor: colors.card,
        borderRadius: 22,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: `${color}18`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>

      <Text
        style={{
          marginTop: 14,
          fontSize: 25,
          fontWeight: "900",
          color,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          marginTop: 3,
          fontSize: 13,
          fontWeight: "900",
          color: colors.text,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          marginTop: 3,
          fontSize: 12,
          color: colors.muted,
          fontWeight: "600",
        }}
      >
        {subtitle}
      </Text>
    </View>
  ); const FilterButton = ({
    value,
    label,
  }: {
    value: "all" | ListingStatus;
    label: string;
  }) => {
    const active = activeFilter === value;

    return (
      <Pressable
        onPress={() => setActiveFilter(value)}
        style={{
          flex: 1,
          height: 44,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? colors.teal : "transparent",
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "900",
            color: active ? "#FFFFFF" : colors.muted,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const SmallMetric = ({
    icon,
    value,
    label,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    value: number;
    label: string;
  }) => (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
      <Ionicons name={icon} size={18} color={colors.muted} />

      <View style={{ marginLeft: 6 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: "900",
          }}
        >
          {String(value)}
        </Text>

        <Text
          style={{
            color: colors.muted,
            fontSize: 11,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );

  const ListingCard = ({ item }: { item: ListingItem }) => (
    <Pressable
      onPress={() => goListingDetails(item.id)}
      style={{
        backgroundColor: colors.card,
        borderRadius: 26,
        padding: 12,
        marginTop: 14,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        <Image
          source={{ uri: item.image }}
          style={{
            width: 106,
            height: 106,
            borderRadius: 20,
            backgroundColor: "#E5E7EB",
          }}
          resizeMode="cover"
        />

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: colors.text,
                }}
              >
                {item.title}
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 4,
                  color: colors.muted,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {item.category}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: `${statusColor(item.status)}18`,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "900",
                  color: statusColor(item.status),
                }}
              >
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={{
              marginTop: 8,
              color: colors.muted,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {item.city}
          </Text>

          <Text
            numberOfLines={1}
            style={{
              marginTop: 4,
              color: colors.muted,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {item.updatedAt}
          </Text>

          <View
            style={{
              flexDirection: "row",
              marginTop: 12,
            }}
          >
            <SmallMetric icon="eye-outline" value={item.views} label="Views" />
            <SmallMetric icon="heart-outline" value={item.favorites} label="Saves" />
            <SmallMetric icon="chatbubble-outline" value={item.messages} label="Msgs" />
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          marginTop: 14,
        }}
      >
        <Pressable
          onPress={() => goEditListing(item.id)}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 16,
            backgroundColor: colors.tealSoft,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            marginRight: 8,
          }}
        >
          <Ionicons name="create-outline" size={18} color={colors.teal} />
          <Text
            style={{
              marginLeft: 6,
              color: colors.teal,
              fontWeight: "900",
            }}
          >
            Edit
          </Text>
        </Pressable>

        <Pressable
          onPress={() => Alert.alert("Promote", "Promotion tools will be connected later.")}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 16,
            backgroundColor: "rgba(230,194,122,0.22)",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            marginRight: 8,
          }}
        >
          <Ionicons name="trending-up-outline" size={18} color="#9A6B10" />
          <Text
            style={{
              marginLeft: 6,
              color: "#9A6B10",
              fontWeight: "900",
            }}
          >
            Promote
          </Text>
        </Pressable>

        <Pressable
          onPress={() => confirmDelete(item)}
          style={{
            width: 48,
            height: 44,
            borderRadius: 16,
            backgroundColor: "rgba(220,38,38,0.10)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="trash-outline" size={19} color={colors.danger} />
        </Pressable>
      </View>
    </Pressable>
  ); return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <View
          style={{
            backgroundColor: colors.teal,
            paddingHorizontal: 20,
            paddingTop: 22,
            paddingBottom: 70,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 32,
                  fontWeight: "900",
                }}
              >
                My Listings
              </Text>

              <Text
                style={{
                  marginTop: 6,
                  color: "rgba(255,255,255,0.84)",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Manage, edit, promote, and track your business posts.
              </Text>
            </View>

            <Pressable
              onPress={goAddListing}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View
          style={{
            marginHorizontal: 18,
            marginTop: -48,
            backgroundColor: colors.card,
            borderRadius: 30,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: colors.text,
              marginBottom: 14,
            }}
          >
            Dashboard
          </Text>

          <View style={{ flexDirection: "row" }}>
            <StatCard
              icon="checkmark-circle-outline"
              value={String(stats.active)}
              label="Active"
              subtitle="Live listings"
              color={colors.success}
            />

            <View style={{ width: 10 }} />

            <StatCard
              icon="eye-outline"
              value={String(stats.views)}
              label="Views"
              subtitle="Total reach"
              color={colors.teal}
            />
          </View>

          <View style={{ height: 10 }} />

          <View style={{ flexDirection: "row" }}>
            <StatCard
              icon="heart-outline"
              value={String(stats.favorites)}
              label="Saves"
              subtitle="User interest"
              color={colors.gold}
            />

            <View style={{ width: 10 }} />

            <StatCard
              icon="time-outline"
              value={String(stats.pending)}
              label="Pending"
              subtitle="Needs review"
              color={colors.warning}
            />
          </View>
        </View>
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 18,
            backgroundColor: colors.card,
            borderRadius: 28,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 3,
          }}
        >
          <Pressable
            onPress={goAddListing}
            style={{
              height: 58,
              borderRadius: 20,
              backgroundColor: colors.teal,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />

            <Text
              style={{
                marginLeft: 8,
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "900",
              }}
            >
              Add New Listing
            </Text>
          </Pressable>

          <Text
            style={{
              marginTop: 12,
              color: colors.muted,
              textAlign: "center",
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            Create a new business post, event, service, or promotion.
          </Text>
        </View>

        <View
          style={{
            marginHorizontal: 18,
            marginTop: 18,
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 6,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <FilterButton value="all" label="All" />
            <FilterButton value="active" label="Active" />
            <FilterButton value="pending" label="Pending" />
            <FilterButton value="draft" label="Drafts" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 18, marginTop: 8 }}>
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))
          ) : (
            <View
              style={{
                marginTop: 22,
                backgroundColor: colors.card,
                borderRadius: 28,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="file-tray-outline" size={42} color={colors.teal} />

              <Text
                style={{
                  marginTop: 14,
                  fontSize: 20,
                  fontWeight: "900",
                  color: colors.text,
                }}
              >
                No listings found
              </Text>

              <Text
                style={{
                  marginTop: 7,
                  color: colors.muted,
                  textAlign: "center",
                  lineHeight: 22,
                }}
              >
                Try another filter or create your first listing.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}