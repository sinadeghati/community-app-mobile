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
  ScrollView,
  Modal,
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
  const [ selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  useFocusEffect(
  React.useCallback(() => {
    const reloadFavorite = async () => {
      const saved = await AsyncStorage.getItem(favoriteKey);
      setIsFavorite(saved === "true");
    };

    reloadFavorite();
  }, [favoriteKey])
);

  useFocusEffect(
    React.useCallback(() => {
    
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        setIsLoggedIn(false);
        setCurrentUserId(null);

        const token = await authStorage.getTokens();
        if (token?.access && authStorage.isJwtNotExpired(token.access)) {
  setIsLoggedIn(true);
  const payload = JSON.parse(atob(token.access.split(".")[1]));
  setCurrentUserId(String(payload.user_id || payload.id || payload.userId || ""));
} else {
  await authStorage.clearTokens();
  setIsLoggedIn(false);
  setCurrentUserId(null);
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
  }, [id])
);

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

 const logoImageUrl = useMemo(() => {
  const firstListing = listings[0] as any;

  return (
    firstListing?.logo_image ||
    firstListing?.image_url ||
    firstListing?.image ||
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
    <>
    <ScrollView
  style={[
    styles.container,
    {
      paddingTop: 70,
    },
  ]}
>
 

  
      
<View
  style={{
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 0,
    marginBottom: 24,
    overflow: "hidden",
    position: "relative",
  }}
>
  <View style={styles.topRow}>
  <TouchableOpacity
    style={styles.backBtn}
    onPress={() => {
      console.log("BACK BUTTON PRESSED");
      router.back();
    }}
  >
    <Text style={styles.backText}>‹</Text>
  </TouchableOpacity>
</View>
 {heroImageUrl ? (
  <>
  <Image
    source={{ uri: heroImageUrl }}
    style={{
      width: "100%",
      height: 280,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
    }}
    resizeMode="cover"
  />

  <View
  style={{
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 285,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "rgba(0,0,0,0.3)",
    
  }}


/>    
   
  <View
  style={{
    position: "absolute",
    left: 24,
    top: 200,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#222",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  }}
>
  <Image
    source={{ uri: logoImageUrl }}
    style={{
      width: "100%",
      height: "100%",
    }}
    resizeMode="contain"
    />
  
</View>
</>
  
) : (
  <View
    style={{
      height: 220,
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
    marginTop: 8,
    paddingHorizontal: 4,
  }}
>
 <View style={{ flex:1}}>
   <View 
     style={{ 
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
     }}>
  <Text
    style={{
      fontSize: 29,
      fontWeight: "900",
      color: "#111",
      flexShrink: 1,
      marginTop: 20,
      letterSpacing: -0.3,
    }}
  >
    {headerTitle}
  </Text>
  <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 20,
    marginLeft: 14,
  }}
>
  <Text
    style={{
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
      marginRight: 4,
    }}
  >
    VERIFIED
  </Text>

  <Ionicons
    name="checkmark-circle"
    size={14}
    color="#fff"
  />
</View>
</View>

  <Text
    style={{
      color: "#777",
      fontSize: 15,
      marginTop: 6,
      marginLeft: 2,
      fontWeight: "500",
      lineHeight: 20,
    }}
  >
    Auto Repair & Mechanic
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
  style={{
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: "#fff",
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 4,
}}
>
  <Ionicons
    name={isFavorite ? "heart" : "heart-outline"}
    size={26}
    color={isFavorite ? "#ff3040" : "#666"}
  />
</Pressable>
</View>

  {/* <Text 
    style={{
      marginTop: 0,
      fontSize: 16,
      color: "#666",
    }}
  >
    {listings.length} listings
  </Text> */}
  <Text
  style={{
    marginTop: 6,
    fontSize: 14,
    color: "#d4af37",
    fontWeight: "700",
  }}
>
  ⭐ 4.8 • {" "}
   <Text
     style={{
       color: "#2563eb",
       fontWeight: "700",
     }}
     >
      24 reviews
     </Text>
</Text>

<View
  style={{
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  }}
>
  

  <View style={{ backgroundColor: "#f8fafc", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
    <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "700" }}>📍 Escondido, CA</Text>
  </View>
</View>
 
</View>
<View
 style={{
  flexDirection: "row",
  backgroundColor: "#fff",
  borderRadius: 24,

  paddingVertical: 10,
  marginTop: -20,
  marginBottom: 22,
  marginHorizontal: 18,

  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
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
  height: 76,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 18,
  borderWidth: 0,
  marginHorizontal: 4,
  backgroundColor: "#fafafa",
  paddingVertical: 12,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
}}
>
  <Ionicons
  name={
    item === "Call"
      ? "call-outline"
      : item === "Message"
      ? "chatbubble-outline"
      : item === "Share"
      ? "share-social-outline"
      : item === "Map"
      ? "location-outline"
      : "heart-outline"
  }
  size={24}
  color="#2563eb"
  style={{ marginBottom: 6 }}
/>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: "#111",
        }}
      >
        {item}
      </Text>
    </Pressable>
  ))}
</View>

{businessDescription ? (
  <View
    style={{
      backgroundColor: "#fff",
      marginHorizontal: 18,
      marginTop: 18,
      paddingVertical: 22,
      paddingHorizontal: 24,
      borderRadius: 28,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    }}
  >
   <View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  }}
>
  <Text
    style={{
      fontSize: 20,
      fontWeight: "700",
      color: "#111",
    }}
  >
    About
  </Text>

  <Text
    style={{
      fontSize: 14,
      fontWeight: "600",
      color: "#2563eb",
    }}
  >
    See more ›
  </Text>
</View>

    <Text
      style={{
        fontSize: 15,
        lineHeight: 24,
        color: "#555",
      }}
    >
      {businessDescription}
    </Text>
  </View>
) : null}

<View
  style={{
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 18,
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  }}
>
  <View style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}>
    <View style={{ flex: 1 }}>
      <View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  }}
>
  <Text
    style={{
      fontSize: 20,
      fontWeight: "800",
      color: "#111",
    }}
  >
    Photos & Highlights
  </Text>

  <Text
    style={{
      fontSize: 14,
      fontWeight: "600",
      color: "#2563eb",
    }}
  >
    See all ›
  </Text>
</View>
      <Text style={{ marginTop: 3, color: "#666", fontSize: 13 }}>
        3 photos
      </Text>
    </View>

    <View style={{ flexDirection: "row", gap: 6, marginTop: 14, }}>
      {[heroImageUrl, heroImageUrl, heroImageUrl].map((img, index) => (
        <Pressable key={index} onPress={() => setSelectedPhoto(img)}>
          <Image
            source={{ uri: img }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
            }}
            resizeMode="cover"
          />
        </Pressable>
      ))}
    </View>
  </View>
</View>
<View
  style={{
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 18,
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 28,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  }}
>

  <View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  }}
>
  <Text
    style={{
      fontSize: 20,
      fontWeight: "800",
      color: "#111",
    }}
  >
    Reviews
  </Text>

  <Text
    style={{
      fontSize: 14,
      fontWeight: "600",
      color: "#2563eb",
    }}
  >
    See all ›
  </Text>
</View>

  <Text
    style={{
      fontSize: 18,
      fontWeight: "700",
      color: "#d4af37",
    }}
  >
    ⭐ 4.8 • 24 reviews
  </Text>

  <Text
    style={{
      marginTop: 10,
      fontSize: 15,
      color: "#666",
      lineHeight: 26,
    }}
  >
    Customers love the service, honesty, and professional work.
  </Text>
</View>



 {isLoggedIn === true && 
   currentUserId !== null &&
   currentUserId !== "" &&
   currentUserId !== "null" &&
   currentUserId !== "undefined" &&
 listings.some(
  (x: any) =>
    String(x.user_id ?? x.owner_id ?? x.user?.id) ===
    String(currentUserId)
 ) && (
  <Pressable
    onPress={() => router.push(`/profile/edit?id=${listings[0]?.id}`)}
    style={{
      backgroundColor: "#2563eb",
      paddingVertical: 9,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 4,
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontWeight: "800",
        fontSize: 14,
      }}
    >
      Edit Profile
    </Text>
  </Pressable>
)}



      <Text
  style={[
    styles.h2,
    {
      marginTop: 30,
      marginHorizontal: 18,
      marginBottom: 14,
      fontSize: 20,
      fontWeight: "800",
    },
  ]}
>
  Recent Listings
</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
                
          data={listings}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          keyExtractor={(x) => String(x.id)}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No listings for this profile yet.</Text>
          }
        />
      )}

      
    
    </ScrollView>

    {selectedPhoto && (
  <Modal visible={true} transparent animationType="fade">
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.92)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Pressable
        onPress={() => setSelectedPhoto(null)}
        style={{
          position: "absolute",
          top: 60,
          right: 24,
          zIndex: 10,
        }}
      >
       <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>×</Text>
      </Pressable>
      <Text
       style={{
        color:"#fff",
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 1,
        opacity: 0.9,
       }}
       >
        1 / 3
       </Text>

      <Image
        source={{ uri: selectedPhoto }}
        style={{
          width: "100%",
          height: "70%",
          borderRadius: 18,
        }}
        resizeMode="contain"
      />
    </View>
  </Modal>
)} 
</>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  topRow: { position: "absolute", top: 16, left: 16, zIndex: 20, },
  backBtn: {
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: "#fff",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 4,
},
  backText: { fontSize: 26, fontWeight: 700, color: "#111" },
  h1: { fontSize: 18, fontWeight: "700"},
  h2: { fontSize: 16, fontWeight: "700", marginBottom: 10 },

  error: { color: "red", marginTop: 10 },
  empty: { color: "#666", marginTop: 10 },

  card: {
    
    marginTop: 8,
    marginHorizontal: 18,
    marginBottom: 24,
    
    alignSelf: "stretch",
    maxWidth: "100%",

    borderColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#fff",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,


  },
  image: { width: "100%", 
           height: 210,
           borderTopLeftRadius: 18,
           borderTopRightRadius: 18,

  },
  noImage: {
    width: "100%",
    height: 170,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: { color: "#888" },
 
  title: {
  fontWeight: "800",
  fontSize: 24,
  marginTop: 16,
  marginHorizontal: 18,
  color: "#111",
},

sub: {
  color: "#666",
  marginTop: 6,
  fontSize: 16,
  marginHorizontal: 18,
  marginBottom: 18,
  lineHeight: 22,
},
});
