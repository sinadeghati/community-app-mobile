import MapView, { Marker } from "react-native-maps";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { API } from "../../lib/api";


export default function MapScreen() {
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
  .filter((item: any) => item.latitude != null && item.longitude != null )
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
        backgroundColor: "#fff",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#007AFF",
        alignItems: "center",
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: 12 }}>
        ⭐ {item.rating}
      </Text>

      <Text style={{ fontSize: 10 }}>
        {(item.name || item.title || "Business").split(" ")[0]}
      </Text>
    </View>
  </Marker>
))}


      </MapView>
      {selectedPlace && (
  <TouchableOpacity
     onPress={() =>router.push("/profile/1")}
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
    <Text style={{ fontSize: 18, fontWeight: "bold" }}>
      {selectedPlace.name || selectedPlace.title || "Business"}
    </Text>

    <Text style={{ marginTop: 4, color: "#666" }}>
      ⭐ {selectedPlace.rating}
    </Text>

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