import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";

type FavoriteBusiness = {
  id: string;
  name?: string;
  category?: string;
  image?: string;
  address?: string;
  city?: string;
  state?: string;
  rating?: string;
  reviews?: number;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=900";

export default function FavoritesScreen() {
  const [items, setItems] = useState<FavoriteBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);

      const keys = await AsyncStorage.getAllKeys();
      const dataKeys = keys.filter((key) =>
        key.startsWith("favorite-business-data-")
      );

      const result = await AsyncStorage.multiGet(dataKeys);

      const parsed = result
        .map(([_, value]) => {
          if (!value) return null;
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      setItems(parsed);
    } catch (e) {
      console.log("Favorites load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    await AsyncStorage.setItem(`favorite-business-${id}`, "false");
    await AsyncStorage.removeItem(`favorite-business-data-${id}`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return items;

    return items.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const category = String(item.category || "").toLowerCase();
      const address = String(item.address || "").toLowerCase();

      return (
        name.includes(q) ||
        category.includes(q) ||
        address.includes(q)
      );
    });
  }, [items, search]);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f5f6f8",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f6f8" }}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <View style={{ paddingTop: 18, paddingBottom: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 34,
                    fontWeight: "900",
                    color: "#111",
                  }}
                >
                  My Favorites
                </Text>

                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 15,
                    color: "#666",
                  }}
                >
                  Businesses you’ve saved for later
                </Text>
              </View>

              <Pressable
                onPress={async () => {
                  for (const item of items) {
                    await removeFavorite(item.id);
                  }
                }}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#eee",
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </Pressable>
            </View>

            <View
              style={{
                marginTop: 22,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 54,
                  backgroundColor: "#fff",
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "#eee",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                }}
              >
                <Ionicons name="search-outline" size={21} color="#777" />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search your favorites..."
                  placeholderTextColor="#999"
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 15,
                    color: "#111",
                  }}
                />

                {search.length > 0 ? (
                  <Pressable onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={21} color="#999" />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                style={{
                  height: 54,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#eee",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="options-outline" size={20} color="#111" />
                <Text style={{ marginLeft: 8, fontWeight: "800", color: "#111" }}>
                  Filters
                </Text>
              </Pressable>
            </View>

            <View
              style={{
                marginTop: 22,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="bookmark" size={28} color="#2563eb" />

              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
                  {items.length} businesses saved
                </Text>

                <Text style={{ marginTop: 3, color: "#666" }}>
                  Access your favorite spots anytime
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/profile/v2",
                params: { id: String(item.id) },
              })
            }
            style={{
              flexDirection: "row",
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 14,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: "#eee",
              alignItems: "center",
            }}
          >
            <Image
              source={{ uri: item.image || FALLBACK_IMAGE }}
              style={{
                width: 92,
                height: 92,
                borderRadius: 18,
                backgroundColor: "#eee",
              }}
              resizeMode="cover"
            />

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 19,
                  fontWeight: "900",
                  color: "#111",
                }}
              >
                {item.name || "Saved Business"}
              </Text>

              <Text
                style={{
                  marginTop: 5,
                  color: "#c79b2c",
                  fontWeight: "800",
                }}
              >
                ⭐ {item.rating || "4.8"} · {item.reviews || 24} reviews
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 5,
                  color: "#666",
                }}
              >
                📍 {item.address || "Address not available"}
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 5,
                  color: "#666",
                }}
              >
                {item.category || "Local Business"}
              </Text>

              <Text
                style={{
                  marginTop: 5,
                  color: "#16a34a",
                  fontWeight: "700",
                }}
              >
                ● Open now
              </Text>
            </View>

            <Pressable onPress={() => removeFavorite(item.id)}>
              <Ionicons name="heart" size={27} color="#ef4444" />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 90,
              paddingHorizontal: 30,
            }}
          >
            <Text style={{ fontSize: 52 }}>❤️</Text>

            <Text
              style={{
                marginTop: 14,
                fontSize: 22,
                fontWeight: "900",
                color: "#111",
              }}
            >
              No favorites yet
            </Text>

            <Text
              style={{
                marginTop: 8,
                fontSize: 15,
                color: "#666",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Businesses you save will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}