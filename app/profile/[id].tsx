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
  Linking,
  Alert,
  TouchableOpacity,
  Platform,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API } from "../../lib/api";
import authStorage from "../utils/authStorage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
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
  description?: string;
};

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] =useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const favoriteKey = `favorite-business-${id}`;
  
  useFocusEffect(
  React.useCallback(() => {
    const reloadFavorite = async () => {
      const saved = await AsyncStorage.getItem(favoriteKey);
      setIsFavorite(saved === "true");
    };

    reloadFavorite();
  }, [favoriteKey])
);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await authStorage.getTokens();
        if (token?.access) {
          setIsLoggedIn(true);
          setCurrentUserId("");
        }

        const data = await API.getListings();

        // فیلتر امن: هر مدلی که user_id / owner_id / user.id داشته باشیم
        const profileId = String(id ?? "");
        const filtered = (Array.isArray(data) ? data : []).filter((x: any) => {
          const v =
            x?.user_id ?? x?.owner_id ?? x?.user?.id ?? x?.created_by?.id;
          return String(v ?? "") === profileId;
        });

        setListings(filtered);
        const savedFavorite = await AsyncStorage.getItem(favoriteKey);

        if (savedFavorite === "true") {
         setIsFavorite(true);
       }
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

 const headerTitle = useMemo(() => {
  if (listings.length > 0) {
    return listings[0]?.title || "Business Profile";
  }

  return `Profile #${id ?? ""}`;
}, [id, listings]);

const businessDescription = useMemo(() => {
  if (listings.length > 0) {
    return listings[0]?.description || "";
  }

  return "";
}, [listings]);

const businessWebsite = useMemo(() => {
  if (listings.length > 0) {
    return (listings[0] as any)?.website || "";
  }

  return "";
}, [listings]);

const businessInstagram = useMemo(() => {
  if (listings.length > 0) {
    return (listings[0] as any)?.instagram || "";
  }

  return "";
}, [listings]);

const businessContact = useMemo(() => {
  if (listings.length > 0) {
    return (listings[0] as any)?.contact_info || "";
  }

  return "";
}, [listings]);

const heroImageUrl = useMemo(() => {
  const firstListing = listings[0] as any;

  const firstImage =
    firstListing?.images &&
    firstListing.images.length > 0
      ? firstListing.images[0]
      : null;

  return (
    firstListing?.image_url ||
    firstListing?.image ||
    firstImage?.image_url ||
    firstImage?.image ||
    ""
  );
}, [listings]);

{businessDescription ? (
  <Text
    style={{
      marginTop: 14,
      color: "#ddd",
      fontSize: 15,
      lineHeight: 22,
    }}
    numberOfLines={4}
  >
    {businessDescription}
  </Text>
) : null}

<View
  style={{
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  }}
>
  <Pressable
    style={{
      flex: 1,
      backgroundColor: "#2563eb",
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",

      shadowColor: "#2563eb",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
      Call
    </Text>
  </Pressable>

  <Pressable
    onPress={() => {
  if (businessContact) {
    Linking.openURL(`sms:${businessContact}`);
  } else {
    Alert.alert("No phone number");
  }
}}
    style={{
      flex: 1,
      backgroundColor: "#222",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#444",
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
      Message
    </Text>
  </Pressable>
</View>

{businessContact ? (
  <Text
    style={{
      marginTop: 14,
      fontSize: 15,
      color: "#fff",
      fontWeight: "600",
    }}
  >
    Contact: {businessContact}
  </Text>
) : null}

 

  const renderItem = ({ item }: { item: Listing }) => {
    const first =
  item?.images && item.images.length > 0
    ? item.images[item.images.length - 1]
    : null;
    const imgUrl = (first?.image_url || first?.image || "") as string;

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.replace(`/listing/${item.id}`)}
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
    <View
  style={[
    styles.container,
    {
      paddingTop: 70,
    },
  ]}
>

  
      
      <View
  style={{
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  }}
>
  <View style={styles.topRow}>
  <TouchableOpacity
    style={styles.backBtn}
    onPress={() => router.back()}
  >
    <Text style={styles.backText}>← Back</Text>
  </TouchableOpacity>
</View>
 {heroImageUrl ? (
  <Image
    source={{ uri: heroImageUrl }}
    style={{
      width: "100%",
      height: 140,
      borderRadius: 14,
      marginBottom: 16,
    }}
    resizeMode="cover"
  />
) : (
  <View
    style={{
      height: 140,
      borderRadius: 14,
      backgroundColor: "#222",
      marginBottom: 16,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text style={{ color: "#888" }}>
      Business Cover Image
    </Text>
  </View>
)}
  <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  }}
>
  <Text
    style={{
      fontSize: 28,
      fontWeight: "800",
      color: "#fff",
      flexShrink:1,
    }}
  >
    {headerTitle}
  </Text>

  <View
    style={{
      marginLeft: 10,
      backgroundColor: "#2563eb",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
      }}
    >
      VERIFIED
    </Text>
  </View>
  <Pressable
 onPress={async () => {
  const newValue = !isFavorite;

  setIsFavorite(newValue);

  await AsyncStorage.setItem(
    favoriteKey,
    newValue ? "true" : "false"
  );

  if (newValue) {
    await AsyncStorage.setItem(
      `favorite-business-data-${id}`,
      JSON.stringify({
        id,
        title: headerTitle,
        image: heroImageUrl,
        city: listings[0]?.city || "",
        state: listings[0]?.state || "",
      })
    );
  } else {
    await AsyncStorage.removeItem(
      `favorite-business-data-${id}`
    );
  }
}}
  style={{ marginLeft: 10 }}
>
  <Ionicons
    name={isFavorite ? "heart" : "heart-outline"}
    size={26}
    color={isFavorite ? "#ff3040" : "#fff"}
  />
</Pressable>
</View>

  <Text
    style={{
      marginTop: 6,
      fontSize: 16,
      color: "#ccc",
    }}
  >
    {listings.length} listings
  </Text>
  <Text
  style={{
    marginTop: 6,
    fontSize: 14,
    color: "#d4af37",
    fontWeight: "700",
  }}
>
  ⭐ 4.8 • 24 reviews
</Text>
  {businessDescription ? (
  <Text
    style={{
      marginTop: 12,
      fontSize: 15,
      lineHeight: 22,
      color: "#ddd",
    }}
  >
    {businessDescription}
  </Text>
) : null}
</View>
<View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 24,
    gap: 10,
  }}
>
  {["Call", "Message", "Share", "Map","Favorites"].map((item) => (
    <Pressable
  key={item}
  onPress={() => {
    if (item === "Favorites") {
      router.push("/favorites");
      return;
    }
    if (item === "Call") {
      if (businessContact) {
        const cleanPhone = businessContact.replace(/[^\d+]/g, "");
Linking.openURL(`tel:${cleanPhone}`).catch((err) => {
  console.log("Call open error:", err);
});
      } else {
        Alert.alert("No phone number");
      }
    }

    if (item === "Message") {
      if (businessContact) {
        const cleanPhone = businessContact.replace(/[^\d+]/g, "");
Linking.openURL(`sms:${cleanPhone}`).catch((err) => {
  console.log("SMS open error:", err);
});
      } else {
        Alert.alert("No phone number");
      }
    }

    if (item === "Share") {
      Share.share({
        message:
           "Check out this business on IranianApp: Threading by Sherry",
      });
      return;
    }

   if (item === "Map") {
  const address = listings[0]?.city
    ? `${listings[0]?.city}, ${listings[0]?.state || ""}`
    : headerTitle;

  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?q=${encodeURIComponent(address)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  Linking.openURL(url).catch((err) => {
    console.log("Map open error:", err);
    Alert.alert("Map error", "Unable to open maps.");
  });
}
  }}
  style={{
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    
  }}
>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: "#111",
        }}
      >
        {item}
      </Text>
    </Pressable>
  ))}
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

      {false && (
      <Pressable
  onPress={() => router.push("/profile/edit")}
  style={{
    marginTop: 14,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  }}
>
  <Text style={{ color: "#111", fontWeight: "800", fontSize: 15 }}>
    Edit Business Profile
  </Text>
</Pressable>
  )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 10 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "700", },
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

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,


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
