import React, { useEffect, useRef, useState } from "react";
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
import { EventTicketUrlField } from "../../components/events/EventTicketUrlField";
import type { ParsedAddress } from "../../lib/addressAutocomplete";
import { saveCommunityEvent } from "../../lib/communityEvents";
import { resolveDefaultEventOrganizer } from "../../lib/eventOrganizer";
import { EVENT_FALLBACK_COVER } from "../../lib/mapEventDetails";
import { getActiveUserId } from "../../lib/userSessionStorage";
import { useTranslation } from "../../lib/i18n";

export default function CreateEventScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const businessId = String(params?.businessId || "").trim() || undefined;
  const categoryParam = String(params?.category || "").trim() || undefined;

  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [description, setDescription] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [flyerImage, setFlyerImage] = useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const ownerId = await getActiveUserId();
      if (!ownerId || cancelled) return;

      const defaultOrganizer = await resolveDefaultEventOrganizer({
        ownerId,
        businessId,
      });

      if (!cancelled && defaultOrganizer) {
        setOrganizerName(defaultOrganizer);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const eventDateRef = useRef<{
    eventDateIso: string | null;
    dateText: string;
    timeText: string;
    endDateIso: string | null;
    endDateText: string;
    endTimeText: string;
  }>({
    eventDateIso: null,
    dateText: "",
    timeText: "",
    endDateIso: null,
    endDateText: "",
    endTimeText: "",
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
      Alert.alert(t("event.loginRequired"), t("event.loginToCreate"));
      return;
    }

    if (!eventDateRef.current.eventDateIso) {
      Alert.alert(t("event.dateRequired"), t("event.dateRequiredBody"));
      return;
    }

    setSaving(true);
    try {
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
          endDate: eventDateRef.current.endDateText,
          endTime: eventDateRef.current.endTimeText,
          endDateIso: eventDateRef.current.endDateIso,
          ticketUrl: ticketUrl.trim() || undefined,
          businessId,
          category: categoryParam,
          image: flyerImage || undefined,
          cover_image: flyerImage || undefined,
        },
        {
          ownerId,
          organizer: organizerName.trim() || undefined,
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
                {t("common.back")}
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
              {t("event.createTitle")}
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#777",
                marginBottom: 28,
                lineHeight: 24,
              }}
            >
              {t("event.createSubtitle")}
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
              <Text style={labelStyle}>{t("event.title")}</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("event.titlePlaceholder")}
                placeholderTextColor="#999"
                style={inputStyle}
              />

              <Text style={labelStyle}>{t("event.organizer")}</Text>
              <TextInput
                value={organizerName}
                onChangeText={setOrganizerName}
                placeholder={t("event.organizerPlaceholder")}
                placeholderTextColor="#999"
                style={inputStyle}
                autoCapitalize="words"
              />

              <Text style={labelStyle}>{t("event.description")}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t("event.descriptionPlaceholder")}
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

              <EventTicketUrlField value={ticketUrl} onChangeText={setTicketUrl} />

              <Text style={labelStyle}>{t("event.flyer")}</Text>
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
                    {flyerImage ? t("event.changeFlyer") : t("event.uploadFlyer")}
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
                    {t("event.createButton")}
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
