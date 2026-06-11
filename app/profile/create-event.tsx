import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { EventAddressFields } from "../../components/events/EventAddressFields";
import { EventDateTimeFields } from "../../components/events/EventDateTimeFields";
import type { ParsedAddress } from "../../lib/addressAutocomplete";
import { saveCommunityEvent } from "../../lib/communityEvents";
import { EVENT_FALLBACK_COVER } from "../../lib/mapEventDetails";
import { getActiveUserId, loadUserProfile } from "../../lib/userSessionStorage";

export default function CreateEventScreen() {
  const params = useLocalSearchParams();
  const businessId = String(params?.businessId || "").trim() || undefined;
  const categoryParam = String(params?.category || "").trim() || undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [flyerImage, setFlyerImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const eventDateRef = useRef<{
    eventDateIso: string | null;
    dateText: string;
    timeText: string;
  }>({
    eventDateIso: null,
    dateText: "",
    timeText: "",
  });

  const handleStreetAddressChange = (text: string) => {
    setStreetAddress(text);
    setLatitude(null);
    setLongitude(null);
  };

  const handleAddressSelected = (parsed: ParsedAddress) => {
    setStreetAddress(parsed.streetAddress);
    setCity(parsed.city);
    setState(parsed.state || "CA");
    setZipCode(parsed.zipCode);
    setLatitude(parsed.latitude ?? null);
    setLongitude(parsed.longitude ?? null);
  };

  const pickFlyerImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to upload an event flyer.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setFlyerImage(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (saving) return;

    const ownerId = await getActiveUserId();
    if (!ownerId) {
      Alert.alert("Login required", "Please log in to create events.");
      return;
    }

    if (!eventDateRef.current.eventDateIso) {
      Alert.alert("Date required", "Please choose a date and time for your event.");
      return;
    }

    setSaving(true);
    try {
      const profile = await loadUserProfile(ownerId);
      const organizer = String(
        profile?.business_name ||
          profile?.name ||
          profile?.username ||
          ""
      ).trim();

      const result = await saveCommunityEvent(
        {
          title,
          description,
          streetAddress,
          city,
          state,
          zipCode,
          country,
          latitude,
          longitude,
          date: eventDateRef.current.dateText,
          time: eventDateRef.current.timeText,
          eventDateIso: eventDateRef.current.eventDateIso,
          businessId,
          category: categoryParam,
          image: flyerImage || undefined,
          cover_image: flyerImage || undefined,
        },
        {
          ownerId,
          organizer: organizer || undefined,
        }
      );

      if (!result.ok) {
        Alert.alert("Could not create event", result.message);
        return;
      }

      Alert.alert(
        result.apiSynced ? "Event created" : "Event saved",
        result.apiSynced
          ? "Your event has been created successfully."
          : "Your event was saved on this device and will appear in Explore."
      );

      router.replace({
        pathname: "/event/[id]",
        params: { id: result.event.id },
      } as any);
    } catch (error) {
      console.log("Create event error:", error);
      Alert.alert(
        "Could not create event",
        "Something went wrong while saving your event. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#F6F5F2",
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 120,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => router.back()}
              style={{ marginBottom: 20 }}
            >
              <Text
                style={{
                  color: "#14B8A6",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                ← Back
              </Text>
            </Pressable>

            <Text
              style={{
                fontSize: 38,
                fontWeight: "900",
                color: "#111",
                marginBottom: 10,
              }}
            >
              Create Event
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#777",
                marginBottom: 28,
                lineHeight: 24,
              }}
            >
              Create community events, business gatherings,
              concerts, meetups, or promotions.
            </Text>

            <View
              style={{
                backgroundColor: "#FFF",
                borderRadius: 28,
                padding: 20,
                borderWidth: 1,
                borderColor: "#ECE7DF",
              }}
            >
              <Text style={labelStyle}>Event Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Persian Night San Diego"
                placeholderTextColor="#999"
                style={inputStyle}
              />

              <Text style={labelStyle}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell people about your event..."
                placeholderTextColor="#999"
                multiline
                style={[inputStyle, { height: 120 }]}
              />

              <EventAddressFields
                streetAddress={streetAddress}
                city={city}
                state={state}
                zipCode={zipCode}
                country={country}
                onStreetAddressChange={handleStreetAddressChange}
                onCityChange={setCity}
                onStateChange={setState}
                onZipCodeChange={setZipCode}
                onCountryChange={setCountry}
                onAddressSelected={handleAddressSelected}
              />

              <EventDateTimeFields
                minimumDate={new Date()}
                onChange={(value) => {
                  eventDateRef.current = value;
                }}
              />

              <Text style={labelStyle}>Event Flyer (optional)</Text>
              <Pressable
                onPress={() => void pickFlyerImage()}
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  backgroundColor: "#F8F8F8",
                }}
              >
                <Image
                  source={{ uri: flyerImage || EVENT_FALLBACK_COVER }}
                  style={{ width: "100%", height: 160 }}
                  resizeMode="cover"
                />
                <View style={{ padding: 12, alignItems: "center" }}>
                  <Text style={{ color: "#14B8A6", fontWeight: "800" }}>
                    {flyerImage ? "Change Flyer" : "Upload Flyer"}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => void handleCreate()}
                disabled={saving}
                style={{
                  backgroundColor: "#14B8A6",
                  paddingVertical: 18,
                  borderRadius: 18,
                  alignItems: "center",
                  marginTop: 12,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text
                    style={{
                      color: "#FFF",
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    Create Event
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const labelStyle = {
  fontSize: 15,
  fontWeight: "700" as const,
  color: "#222",
  marginBottom: 10,
  marginTop: 14,
};

const inputStyle = {
  backgroundColor: "#F8F8F8",
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: "#E5E5E5",
};
