import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BusinessGalleryGrid } from "../../components/business/BusinessGalleryGrid";
import {
  addBusinessGalleryPhoto,
  getBusinessGalleryUris,
  loadBusinessProfileRecord,
} from "../../lib/businessGallery";
import { theme } from "../../lib/theme";

export default function GalleryScreen() {
  const params = useLocalSearchParams();
  const businessId = String(params?.id || "");
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Record<string, unknown> | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerCheckReady, setOwnerCheckReady] = useState(false);
  const [addingPhoto, setAddingPhoto] = useState(false);

  const loadGallery = useCallback(async () => {
    if (!businessId) {
      setBusiness(null);
      setLoading(false);
      setOwnerCheckReady(true);
      return;
    }

    setLoading(true);
    const record = await loadBusinessProfileRecord(businessId);
    setBusiness(record);

    try {
      const { requireAuthenticatedUser, verifyBusinessOwnerAccess } =
        await import("../../lib/userSessionStorage");
      const userId = await requireAuthenticatedUser();
      if (!userId || !record) {
        setIsOwner(false);
      } else {
        const access = await verifyBusinessOwnerAccess(record, businessId);
        setIsOwner(access.ok);
      }
    } catch {
      setIsOwner(false);
    } finally {
      setOwnerCheckReady(true);
      setLoading(false);
    }
  }, [businessId]);

  useFocusEffect(
    useCallback(() => {
      void loadGallery();
    }, [loadGallery])
  );

  useEffect(() => {
    setBusiness(null);
    setSelectedImage(null);
    setIsOwner(false);
    setOwnerCheckReady(false);
    void loadGallery();
  }, [businessId, loadGallery]);

  const images = useMemo(
    () => getBusinessGalleryUris(business),
    [business]
  );

  const handleAddPhoto = async () => {
    if (!isOwner || !businessId || addingPhoto) return;

    if (images.length >= 24) {
      Alert.alert("Limit reached", "Maximum 24 gallery photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    try {
      setAddingPhoto(true);
      const saved = await addBusinessGalleryPhoto(businessId, result.assets[0].uri);
      if (!saved.ok) {
        Alert.alert("Could not add photo", saved.message);
        return;
      }
      setBusiness(saved.record);
    } catch (error) {
      console.log("GALLERY_ADD_PHOTO_ERROR:", error);
      Alert.alert("Could not add photo", "Please try again.");
    } finally {
      setAddingPhoto(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.colors.ivory }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
            paddingTop: 4,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: theme.colors.card,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.charcoal} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: theme.colors.charcoal,
              }}
            >
              Gallery
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 14,
                color: theme.colors.muted,
                fontWeight: "600",
              }}
            >
              Storefront photos
            </Text>
          </View>

          {isOwner && ownerCheckReady ? (
            <Pressable
              onPress={() => void handleAddPhoto()}
              disabled={addingPhoto}
              hitSlop={8}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: theme.radius.pill,
                backgroundColor: "rgba(13,148,136,0.08)",
                borderWidth: 1,
                borderColor: "rgba(13,148,136,0.16)",
                opacity: addingPhoto ? 0.65 : 1,
              }}
            >
              <Text
                style={{
                  color: theme.colors.turquoise,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {addingPhoto ? "Adding..." : "+ Add photo"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={{ paddingTop: 24, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.turquoise} />
          </View>
        ) : images.length > 0 ? (
          <View style={{ paddingTop: 4 }}>
            <BusinessGalleryGrid
              uris={images}
              tileHeight={168}
              onPressPhoto={setSelectedImage}
            />
          </View>
        ) : (
          <View
            style={{
              marginTop: 24,
              alignItems: "center",
              paddingHorizontal: 12,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "rgba(13,148,136,0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="images-outline"
                size={24}
                color={theme.colors.turquoise}
              />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: theme.colors.charcoal,
              }}
            >
              No gallery photos yet
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                lineHeight: 20,
                color: theme.colors.muted,
                textAlign: "center",
              }}
            >
              {isOwner
                ? "Tap Add photo to upload your first storefront image."
                : "Photos added to this business will appear here."}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "#000",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => setSelectedImage(null)}
            style={{
              position: "absolute",
              top: Math.max(insets.top + 12, 52),
              right: 24,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.16)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>

          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: "80%" }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
