// app/(tabs)/explore.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity,ScrollView, StyleSheet } from "react-native";
import {API} from "../../lib/api";
import { useLocalSearchParams } from "expo-router";
import { router} from "expo-router"
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import HeroBanner from "../../components/HeroBanner";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import authStorage from "../utils/authStorage";





type Listing = any;

export default function ExploreScreen() {
  const  {refresh} = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
      authStorage.getTokens().then((tokens) => {
        setToken(tokens?.access ?? null);
      });
    }, []);
    const isLoggedIn = !!token;
  


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

    const ListHeader = () => (
  <>
    <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12 }}>
      Explore Listings
    </Text>

    {!isLoggedIn && (
      <Text style={{ marginBottom: 10, color: "#666", fontSize: 14 }}>
        Log in to post and manage your listing
      </Text>
    )}

    <View style={{ marginBottom: 12 }}>
      <HeroBanner />
    </View>

    {error ? (
      <TouchableOpacity
        onPress={load}
        style={{ padding: 12, borderWidth: 1, marginBottom: 12 }}
      >
        <Text style={{ color: "#c00" }}>Error: {String(error)}</Text>
        <Text style={{ marginTop: 6 }}>Tap to retry</Text>
      </TouchableOpacity>
    ) : null}

    <FlatList
      data={CATEGORIES}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.key}
      contentContainerStyle={{ paddingVertical: 8 }}
      renderItem={({ item }) => {
        const active = selectedCategory === item.key;
        return (
          <TouchableOpacity
            onPress={() => setSelectedCategory(item.key)}
            style={{
              marginRight: 10,
              paddingHorizontal: 14,
              height: 38,
              borderRadius: 18,
              justifyContent: "center",
              borderWidth: 1,
              opacity: active ? 1 : 0.8,
            }}
          >
            <Text>{item.label}</Text>
          </TouchableOpacity>
        );
      }}
    />
  </>
);


  

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
      <SafeAreaView style={{ flex: 1,paddingTop: insets.top, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!loading && filteredListings.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top}}>
        <View style={{ paddingHorizontal: 16 }}>

         <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12}}>
            Explore Listing
          </Text>

          <Text style={{ color: "#666", fontSize:16}}>
            No listing yet. But the first to post somthing 
          </Text>
          </View>
          </SafeAreaView>
    );
  }
        
         

  return (
    
    <SafeAreaView style={{ flex: 1, paddingTop: insets.top, backgroundColor: "#fff", justifyContent: "flex-start", alignItems: "stretch" }}>
      
      

      {error ? (
        <TouchableOpacity onPress={load} style={{ padding: 12, borderWidth: 1, borderColor: "#f2c", borderRadius: 10 }}>
          <Text style={{ color: "#c00" }}>Error: {error}</Text>
          <Text style={{ marginTop: 6 }}>Tap to retry</Text>
        </TouchableOpacity>
      ) : null}

      


      <FlatList
  
  data={filteredListings}
  keyExtractor={(item, idx) => String(item?.id ?? idx)}
  renderItem={renderItem}
  ListHeaderComponent={() => (
  <View style={{ paddingHorizontal: 16 }}>
    <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12 }}>
      Explore Listings
    </Text>

    {!isLoggedIn && (
      <Text style={{ marginBottom: 10, color: "#666", fontSize: 14 }}>
        Log in to post and manage your listing
      </Text>
    )}

    <View style={{ marginBottom: 12 }}>
      <HeroBanner />
    </View>

    {error ? (
      <TouchableOpacity
        onPress={load}
        style={{ padding: 12, borderWidth: 1, marginBottom: 12 }}
      >
        <Text style={{ color: "#c00" }}>Error</Text>
        <Text style={{ marginTop: 6 }}>Tap to retry</Text>
      </TouchableOpacity>
    ) : null}

    <FlatList
      data={CATEGORIES}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.key}
      contentContainerStyle={{ paddingVertical: 8 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => setSelectedCategory(item.key)}
          style={{
            marginRight: 10,
            paddingHorizontal: 14,
            height: 38,
            borderRadius: 18,
            justifyContent: "center",
            borderWidth: 1,
          }}
        >
          <Text>{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  </View>
)}
  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30}}
    
  ListEmptyComponent={
    !loading && !error ? (
     <View style={{ padding: 24, alignItems: "center" }}>
       <Text style={{ fontSize: 18, fontWeight: "700" }}>
        No listing yet
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: "#666",
            textAlign: "center",
          }}
          >
            Be the first to post. Tap the + button below.
          </Text>
          </View>
    ) : null
  }
/>

    </SafeAreaView>
  );
}
