import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  SafeAreaView,
  Modal,
} from "react-native";

export default function GalleryScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#111" />
          </Pressable>

          <Text style={{ fontSize: 28, fontWeight: "800", color: "#111" }}>
            Gallery
          </Text>
        </View>

        <Text style={{ fontSize: 15, color: "#666", marginBottom: 24 }}>
          Photos, videos, offers and highlights
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {images.map((img, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedImage(img)}
              style={{
                width: "48%",
                marginBottom: 14,
                borderRadius: 20,
                overflow: "hidden",
                backgroundColor: "#fff",
              }}
            >
              <Image source={{ uri: img }} style={{ width: "100%", height: 180 }} resizeMode="cover" />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
          <Pressable
            onPress={() => setSelectedImage(null)}
            style={{ position: "absolute", top: 60, right: 24, zIndex: 10 }}
          >
            <Text style={{ color: "#fff", fontSize: 32 }}>×</Text>
          </Pressable>

          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
