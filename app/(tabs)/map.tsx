import MapView, { Marker } from "react-native-maps";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";

export default function MapScreen() {
 const [selectedPlace, setSelectedPlace] = useState<any>(null);
 const router = useRouter();
 const listings = [
  {
    id: 1,
    name: "Luxury Home Developments",
    latitude: 32.7157,
    longitude: -117.1611,
    rating: 4.9,
    category: "Construction",
    city: "San Diego",
  },
  {
    id: 2,
    name: "Persian Cafe",
    latitude: 32.705,
    longitude: -117.185,
    rating: 4.7,
    category: "Cafe",
    city: "San Diego",
  },
];

 


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
       
{listings.map((item: any) => (
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
        {item.name.split(" ")[0]}
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
      {selectedPlace.name}
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