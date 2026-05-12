// app/(tabs)/explore.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity,ScrollView, StyleSheet,Pressable, TextInput, RefreshControl } from "react-native";
import {API} from "../../lib/api";
import { useLocalSearchParams } from "expo-router";
import { router} from "expo-router"
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import HeroBanner from "../../components/HeroBanner";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import authStorage from "../utils/authStorage";
import { ImageBackground } from "react-native";






type Listing = any;

export default function ExploreScreen() {
  const  {refresh} = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] =useState("");
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
  { key: "services", label: "Services", icon: "🛠️" },
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
const onRefresh = async () => {
  setRefreshing(true);

  await load();
  setRefreshing(false);
};

  useFocusEffect(
  useCallback(() => {
    load();
  }, [refresh])
);

const filteredListings = listings.filter((item: any) => {
  const c = (
    item?.category ||
    item?.listing_type ||
    item?.type ||
    item?.service_type ||
    ""
  )
    .toString()
    .toLowerCase();

  const selected = selectedCategory.toLowerCase();

  const matchesCategory =
    selected === "all" ? true : c === selected;

  const q = searchText.trim().toLowerCase();

  const haystack = [
    item?.title,
    item?.city,
    item?.state,
    item?.description,
    item?.contact_info,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchesSearch = q ? haystack.includes(q) : true;

  return matchesCategory && matchesSearch;
});

const ListHeader = () => (
  <>
    <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12 }}>
      Explore Listings
    </Text>

    <TextInput
  value={searchText}
  onChangeText={setSearchText}
  placeholder="Search businesses, services, food..."
  style={{
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    height: 54,
  }}
/>

    {!isLoggedIn && (
      <Text style={{ marginBottom: 10, color: "#666", fontSize: 14 }}>
        Log in to post and manage your listing
      </Text>
    )}

    <View style={{ marginBottom: 12 }}>
      <ImageBackground
  source={require("../../assets/images/hero1.jpeg")}
  style={{
    height: 210,
    borderRadius: 20,
    overflow: "hidden",
  }}
  resizeMode="cover"
/>
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
      contentContainerStyle={{ paddingVertical: 8, paddingRight: 24, }}
      renderItem={({ item }) => {
        const active = selectedCategory === item.key;
        return (
          <TouchableOpacity
            onPress={() => setSelectedCategory(item.key)}
            style={{
              marginRight: 12,
              paddingHorizontal: 14,
              height: 38,
              borderRadius: 18,
              justifyContent: "center",
              borderWidth: 1,
              opacity: active ? 1 : 0.8,
              backgroundColor: active ? "#007AFF" : "#fff",
              borderColor: active ? "#007AFF" :"#ccc",
            }}
          >
            <Text
              style={{
                color: active ? "#fff" : "#222",
                fontWeight: active ? "700" : "500",
              }}
              >
              {item.label}</Text>
          </TouchableOpacity>
        );
      }}
    />
 
  </>
  

);



  const renderItem = ({ item }: { item: any }) => {
  const imageUrl =
    item?.image_url ||
    item?.image ||
    item?.thumbnail ||
    (item?.images && item.images.length > 0
     ? item.images[item.images.length - 1].image_url
     : null);

    


  

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
          {item?.city}, {item?.state} •{" "}
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
  {item?.posted_days_ago === 0
    ? "Today"
    : `Posted ${item?.posted_days_ago} day${item?.posted_days_ago > 1 ? "s" : ""} ago`}
</Text>

        
        </Text>
        <Text style={{ fontWeight: "500", fontSize: 16, marginTop: 4, color:"#666" }}>
          {Number(item?.price) > 0
           ? `$${Number(item.price).toFixed(2)}`
           : "Contact for price"}
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

         <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12 }}>
  Explore Listing
</Text>

{selectedCategory !== "all" && (
  <Pressable onPress={() => setSelectedCategory("all")}>
    <Text style={{ marginBottom: 12, color: "blue" }}>
      ← Show All
    </Text>
  </Pressable>
)}

<Text style={{ color: "#666", fontSize: 16 }}>
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

      {selectedCategory !== "all" && (
  <Pressable onPress={() => { setSelectedCategory("all");
    setSearchText("");
  }}
  >
    <Text style={{ marginVertical: 10, marginLeft: 16 }}>
      ← Show All
    </Text>
  </Pressable>
)}


      <FlatList
  
  data={filteredListings}
  keyExtractor={(item, idx) => String(item?.id ?? idx)}
  renderItem={renderItem}
  ListHeaderComponent={ListHeader ()}
  
  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30}}

  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      />
  }
    
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
