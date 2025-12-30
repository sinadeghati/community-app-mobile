// app/(tabs)/explore.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity,ScrollView, StyleSheet } from "react-native";
import {API} from "../../lib/api";
import { useLocalSearchParams } from "expo-router";
import { router} from "expo-router"
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";



type Listing = any;

export default function ExploreScreen() {
  const  {refresh} = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("all");


  const CATEGORIES = [
  { key: "all", label: "All", icon: "🧭" },
  { key: "rent", label: "Rent", icon: "🏠" },
  { key: "job", label: "Jobs", icon: "💼" },
  { key: "service", label: "Services", icon: "🛠️" },
  { key: "food", label: "Food", icon: "🍲" },
  { key: "beauty", label: "Beauty", icon: "💅" },
  { key: "auto", label: "Auto", icon: "🚗" },
];


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

  useFocusEffect(
  useCallback(() => {
    load();
  }, [refresh])
);

const filteredListings =
  selectedCategory === "all"
    ? listings
    : listings.filter((item: any) => {
        const c =
          (item?.category ||
            item?.listing_type ||
            item?.type ||
            item?.service_type ||
            "") + "";
        return c.toLowerCase() === selectedCategory.toLowerCase();
      });



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
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
  {item?.posted_days_ago === 0
    ? "Today"
    : `Posted ${item?.posted_days_ago} day${item?.posted_days_ago > 1 ? "s" : ""} ago`}
</Text>

        
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
  data={CATEGORIES}
  horizontal
  showsHorizontalScrollIndicator={false}
  keyExtractor={(item) => item.key}
  style={{ marginBottom: 12 }}
  renderItem={({ item }) => {
    const active = selectedCategory === item.key;
    return (
      <TouchableOpacity
        onPress={() => setSelectedCategory(item.key)}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 14,
          marginRight: 8,
          borderRadius: 20,
          backgroundColor: active ? "#000" : "#f2f2f2",
        }}
      >
        <Text style={{ color: active ? "#fff" : "#000", fontWeight: "600" }}>
          {item.icon} {item.label}
        </Text>
      </TouchableOpacity>
    );
  }}
/>


      <FlatList
  data={filteredListings}
  keyExtractor={(item, idx) => String(item?.id ?? idx)}
  renderItem={renderItem}
  contentContainerStyle={{ paddingBottom: 30 }}
  ListEmptyComponent={
    !loading && !error ? (
      <Text style={{ marginTop: 20, color: "#888" }}>
        No listings yet.
      </Text>
    ) : null
  }
/>

    </View>
  );
}
