// app/profile/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API } from "../../lib/api";

type ListingImage = {
  image_url?: string;
  image?: string;
};

type Listing = {
  id: number;
  title?: string;
  price?: string;
  city?: string;
  state?: string;
  images?: ListingImage[];
  user_id?: number | string;
  owner_id?: number | string;
  user?: { id?: number | string };
};

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await API.getListings();

        // فیلتر امن: هر مدلی که user_id / owner_id / user.id داشته باشیم
        const profileId = String(id ?? "");
        const filtered = (Array.isArray(data) ? data : []).filter((x: any) => {
          const v =
            x?.user_id ?? x?.owner_id ?? x?.user?.id ?? x?.created_by?.id;
          return String(v ?? "") === profileId;
        });

        setListings(filtered);
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const headerTitle = useMemo(() => {
    return `Profile #${id ?? ""}`;
  }, [id]);

  const renderItem = ({ item }: { item: Listing }) => {
    const first = item?.images?.[0];
    const imgUrl = (first?.image_url || first?.image || "") as string;

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/listing/${item.id}`)}
      >
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No image</Text>
          </View>
        )}
        <Text numberOfLines={1} style={styles.title}>
          {item.title || "Untitled"}
        </Text>
        <Text style={styles.sub}>
          {(item.city || "") + (item.state ? `, ${item.state}` : "")}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.h1}>{headerTitle}</Text>
      </View>

      <Text style={styles.h2}>Listings</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(x) => String(x.id)}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No listings for this profile yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 10 },
  backText: { color: "#007AFF", fontSize: 16 },
  h1: { fontSize: 18, fontWeight: "700" },
  h2: { fontSize: 16, fontWeight: "700", marginBottom: 10 },

  error: { color: "red", marginTop: 10 },
  empty: { color: "#666", marginTop: 10 },

  card: {
    flex: 1,
    margin: 6,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 8,
  },
  image: { width: "100%", height: 120, borderRadius: 8, marginBottom: 8 },
  noImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: { color: "#888" },
  title: { fontWeight: "700" },
  sub: { color: "#666", marginTop: 2, fontSize: 12 },
});
