import MapView, { Marker } from "react-native-maps";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useState, useEffect } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { API } from "../../lib/api";


export default function MapScreen() {
 const [selectedCategory, setSelectedCategory] =useState("All"); 
 const [selectedPlace, setSelectedPlace] = useState<any>(null);
 const router = useRouter();
 const [ listings, setListings] = useState<any[]>([]);
 useEffect(() => {
  const loadListings = async () => {
    try {
      const data = await API.getListings();
      
      setListings(Array.isArray(data) ? data : data?.results ?? []);
    } catch (e) {
      console.log("MAP LISTINGS ERROR:", e);
    }
  };

  loadListings();
}, []);
   
 return (
    <View style={styles.container}>
      <View
  style={{
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
  }}
>
  <View
    style={{
      backgroundColor: "#fff",
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,

      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    }}
  >
    <Text
      style={{
        color: "#888",
        fontSize: 15,
      }}
    >
      Search businesses, food, services...
    </Text>
  </View>
</View>
 <View
  style={{
    position: "absolute",
    top: 118,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    gap: 8,
  }}
>
  {["All", "Food", "Services", "Beauty", "Events"].map((cat) => (
    <TouchableOpacity
      key={cat}
      style={{
        backgroundColor: selectedCategory === cat ? "#2563eb" : "#fff",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Text
        style={{
          color: selectedCategory === cat ? "#fff" : "#111",
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {cat}
      </Text>
    </TouchableOpacity>
  ))}
</View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 32.7157,
          longitude: -117.1611,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
       
{listings
  .filter((item: any) => {
  const hasLocation = item.latitude != null && item.longitude != null;

  if (!hasLocation) return false;
  if (selectedCategory === "All") return true;

  return String(item.category || "").toLowerCase() === selectedCategory.toLowerCase();
})
  .map((item: any) => (
  <Marker
    key={item.id}
    coordinate={{
      latitude: item.latitude,
      longitude: item.longitude,
    }}
    onPress={() => setSelectedPlace(item)}
  >
    <View
      style={{
        backgroundColor: selectedPlace?.id === item.id ? "#eff6ff" : "#fff",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: selectedPlace?.id === item.id ? "#2563eb" : "#111",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width:0, height: 4},
        elevation: 6,
        minWidth: 64,
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: 12 }}>
        ⭐ {item.rating}
      </Text>

      <Text style={{ fontSize: 11, fontWeight: "700", marginTop:2,}}>
        {(item.name || item.title || "Business").split(" ")[0]}
      </Text>
    </View>
  </Marker>
))}


      </MapView>
      {selectedPlace && (
  <TouchableOpacity
     onPress={() =>router.push(`/profile/${selectedPlace.user_id ?? selectedPlace.owner_id ?? selectedPlace.user?.id ?? selectedPlace.id}`)}
    style={{
      position: "absolute",
      bottom: 30,
      left: 20,
      right: 20,
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    }}
  >
    <Image
  source={{
    uri:
      selectedPlace.image_url ||
      selectedPlace.image ||
      selectedPlace.images?.[0]?.image_url ||
      selectedPlace.images?.[0]?.image,
  }}
  style={{
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  }}
  resizeMode="cover"
/>
    <Text style={{ fontSize: 18, fontWeight: "bold" }}>
      {selectedPlace.name || selectedPlace.title || "Business"}
    </Text>

    <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  }}
>
  <Text
    style={{
      color: "#f59e0b",
      fontWeight: "700",
      fontSize: 14,
    }}
  >
    ⭐ {selectedPlace.rating || "4.8"}
  </Text>

  <View
    style={{
      backgroundColor: "#eff6ff",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 10,
    }}
  >
    <Text
      style={{
        color: "#2563eb",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "capitalize",
      }}
    >
      {selectedPlace.category || "Business"}
    </Text>
  </View>
</View>

    <Text style={{ marginTop: 4 }}>
      {selectedPlace.category}
    </Text>

    <Text style={{ marginTop: 4, color: "#888" }}>
      {selectedPlace.city}
    </Text>
  </TouchableOpacity>
)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});