// app/(tabs)/mylistings.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import authStorage from "../utils/authStorage";

// مثل همون login، همین IP رو نگه دار
const BASE_URL = "http://10.9.50.123:8000";

// اگر endpoint شما فرق داشت، فقط همین یک خط رو عوض می‌کنیم
const MY_LISTINGS_URL = `${BASE_URL}/api/my-listing/`;

export default function MyListingsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const tokens = await authStorage.getTokens();
        const access = tokens?.access;

        console.log("MYLISTINGS tokens:", tokens);

        if (!access) {
          console.log("MYLISTINGS -> NO ACCESS -> redirect /login");
          router.replace("/login");
          return;
        }

        console.log("MYLISTINGS fetching:", MY_LISTINGS_URL);

        const res = await fetch(MY_LISTINGS_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        const data = await res.json();
        console.log("MYLISTINGS status:", res.status);
        console.log("MYLISTINGS data:", data);

        if (!res.ok) {
          Alert.alert("Error", data?.detail || "Could not load your listings.");
          setItems([]);
          return;
        }

        // ساپورت هم array مستقیم، هم pagination (results)
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setItems(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.log("MYLISTINGS exception:", e);
        Alert.alert("Error", "Network error loading your listings.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading your listings...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    const img = item?.image_url || item?.image || null;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/listing/${item.id}`)}
        style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          {img ? (
            <Image
              source={{ uri: img }}
              style={{ width: 70, height: 70, borderRadius: 10, backgroundColor: "#f2f2f2" }}
            />
          ) : (
            <View style={{ width: 70, height: 70, borderRadius: 10, backgroundColor: "#f2f2f2" }} />
          )}

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{item?.title || "Untitled"}</Text>
            <Text style={{ marginTop: 4 }}>
              {item?.city || ""}{item?.state ? `, ${item.state}` : ""}
            </Text>
            <Text style={{ marginTop: 4, fontWeight: "600" }}>${item?.price ?? "-"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 12 }}>My Listings</Text>

      {items.length === 0 ? (
        <Text>No listings yet.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
