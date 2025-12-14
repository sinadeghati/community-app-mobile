// app/(tabs)/explore.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import {API} from "../../lib/api";
import { useLocalSearchParams } from "expo-router";
import { router} from "expo-router"


type Listing = any;

export default function ExploreScreen() {
  const  {refresh} = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API.getListings();
      setListings(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (e: any) {
      setError(e?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refresh]);

  const renderItem = ({ item }: { item: any }) => {
  const imageUrl =
    item?.image_url ||
    item?.image ||
    item?.thumbnail ||
    item?.images?.[0]?.image_url ||
    item?.images?.[0]?.image ||
    null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/listing/${item.id}`)}
      activeOpacity={0.8}
      style={{
        backgroundColor: "white",
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#eee",
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 60, height: 60, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 8,
            backgroundColor: "#eee",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>No image</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", fontSize: 18 }}>{item?.title}</Text>
        <Text style={{ color: "#666" }}>
          {item?.city}, {item?.state}
        </Text>
        <Text style={{ fontWeight: "800", fontSize: 22, marginTop: 6 }}>
          ${Number(item?.price || 0).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};




  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12 }}>Explore Listings</Text>

      {error ? (
        <TouchableOpacity onPress={load} style={{ padding: 12, borderWidth: 1, borderColor: "#f2c", borderRadius: 10 }}>
          <Text style={{ color: "#c00" }}>Error: {error}</Text>
          <Text style={{ marginTop: 6 }}>Tap to retry</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={listings}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}
