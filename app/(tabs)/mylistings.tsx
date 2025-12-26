// app/(tabs)/mylistings.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, Image, TouchableOpacity,StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import authStorage from "../utils/authStorage";
import { Pressable } from "react-native";
import {API} from "../../lib/api"
import { useFocusEffect } from "@react-navigation/native";



// مثل همون login، همین IP رو نگه دار
const BASE_URL = "http://10.9.50.156:8000";

// اگر endpoint شما فرق داشت، فقط همین یک خط رو عوض می‌کنیم
const MY_LISTINGS_URL = `${BASE_URL}/api/my-listing/`;
const LISTINGS_URL = '${BASE_URL}/api/listings/';

export default function MyListingsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isEmpty = !loading && (!items || items.length === 0);


//1.ADD DeleteListing

 const deleteListing = async (id: number) => {
  console.log("DELETE CLICKED ID =", id);

  try {
    const res = await API.deleteListing(id);
    console.log("DELETE RES =", res);

    setItems(prev => prev.filter(item => item.id !== id));
    console.log("DELETE SUCCESS");
  } catch (err: any) {
    console.log("DELETE ERROR STATUS =", err?.response?.status);
    console.log("DELETE ERROR DATA =", err?.response?.data);
    console.log("DELETE ERROR URL =", err?.config?.url);
    Alert.alert("Error", "Delete failed");
  }
};



  // 2.confirmDelete
  const confirmDelete = (id: number) => {
  Alert.alert(
    "Delete listing",
    "Are you sure you want to delete this listing?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteListing(id) },
    ]
  );
};

  


//3.renderItem

    const renderItem = ({ item }: { item: any }) => {
    const img = item?.image_url || item?.image || null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/listing/edit/${item.id}`)}
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

            <View style={styles.actionsRow}>
  <TouchableOpacity
    style={styles.editBtn}
    onPress={() => router.push(`/listing/edit?id=${item.id}`)}
  >
    <Text style={styles.editBtnText}>Edit</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.deleteBtn}
    onPress={() => confirmDelete(item.id)}
  >
    <Text style={styles.deleteBtnText}>Delete</Text>
  </TouchableOpacity>
</View>

          </View>
        </View>
      </TouchableOpacity>
    );
  };


  
    
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

        console.log("MYLISTINGS fetching via API.getMyListings()");

        const data = await API.getMyListings();

        console.log("MYLISTINGS data:", data);

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

    useFocusEffect(
  React.useCallback(() => {
    setLoading(true);
    load();
  }, [])
);


  
  

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

//stale sheet Aib&b
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
actionsRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 10,
},

editBtn: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 10,
  backgroundColor: "#f1f5f9",
},

editBtnText: {
  fontWeight: "700",
},

deleteBtn: {
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 10,
  backgroundColor: "#fee2e2",
},

deleteBtnText: {
  fontWeight: "700",
},



});

