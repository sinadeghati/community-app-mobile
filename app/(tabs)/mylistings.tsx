// app/(tabs)/mylistings.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, Image, TouchableOpacity,StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import authStorage from "../utils/authStorage";
import { Pressable } from "react-native";


// مثل همون login، همین IP رو نگه دار
const BASE_URL = "http://10.9.50.123:8000";

// اگر endpoint شما فرق داشت، فقط همین یک خط رو عوض می‌کنیم
const MY_LISTINGS_URL = `${BASE_URL}/api/my-listing/`;

export default function MyListingsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isEmpty = !loading && (!items || items.length === 0);

    const renderItem = ({ item }: { item: any }) => {
    const img = item?.image_url || item?.image || null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/listing/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardRow}>
          {img ? (
            <Image source={{ uri: img }} style={styles.cardImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No Image</Text>
            </View>
          )}

          <View style={styles.cardBody}>
            <Text style={styles.title} numberOfLines={1}>
              {item?.title || "Untitled"}
            </Text>

            <Text style={styles.location} numberOfLines={1}>
              {(item?.city || "") + (item?.state ? `, ${item.state}` : "")}
            </Text>

            <View style={styles.metaRow}>
              {item?.price ? (
                <Text style={styles.price}>${item.price}</Text>
              ) : (
                <Text style={styles.price}> </Text>
              )}

              {typeof item?.posted_days_ago === "number" ? (
                <Text style={styles.age}>Posted {item.posted_days_ago}d ago</Text>
              ) : (
                <Text style={styles.age}> </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


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
    contentContainerStyle={{ paddingBottom: 24 }}
  />
)}

    </View>
  );
}

//stale sheet Air&B
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  header: { fontSize: 22, fontWeight: "800", marginBottom: 12 },

  card: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  cardRow: { flexDirection: "row", gap: 12 },

  cardImage: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
  },

  imagePlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  imagePlaceholderText: { color: "#666", fontSize: 12 },

  cardBody: { flex: 1 },

  title: { fontSize: 16, fontWeight: "700" },

  location: { marginTop: 4, color: "#666", fontSize: 13 },

  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  price: { fontWeight: "700", fontSize: 14 },

  age: { color: "#666", fontSize: 12 },
});

