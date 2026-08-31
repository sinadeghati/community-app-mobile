import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const focusedFieldRef = useRef<View | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const scrollFocusedFieldIntoView = useCallback(
    (fieldNode: View | null, inset = keyboardInset) => {
      if (Platform.OS !== "android" || !fieldNode || !scrollRef.current) {
        return;
      }

      fieldNode.measureInWindow((_x, y, _width, height) => {
        const windowHeight = Dimensions.get("window").height;
        const visibleBottom = windowHeight - inset - 24;
        const fieldBottom = y + height;

        if (fieldBottom > visibleBottom) {
          scrollRef.current?.scrollTo({
            y: scrollOffsetRef.current + (fieldBottom - visibleBottom),
            animated: true,
          });
        }
      });
    },
    [keyboardInset]
  );

  const scrollInputIntoView = useCallback(
    (fieldNode: View | null) => {
      focusedFieldRef.current = fieldNode;
      scrollFocusedFieldIntoView(fieldNode);
    },
    [scrollFocusedFieldIntoView]
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextInset = event.endCoordinates?.height ?? 0;
      setKeyboardInset(nextInset);
      if (Platform.OS === "android" && focusedFieldRef.current) {
        requestAnimationFrame(() => {
          scrollFocusedFieldIntoView(focusedFieldRef.current, nextInset);
        });
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
      focusedFieldRef.current = null;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollFocusedFieldIntoView]);
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
          endDateIso: eventDateRef.current.endDateIso ?? undefined,
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
        <View
          style={{
            flex: 1,
            backgroundColor: "#F6F5F2",
          }}
        >
          <ScrollView
            ref={scrollRef}
            automaticallyAdjustKeyboardInsets
            onScroll={(event) => {
              scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: insets.top + 18,
              paddingBottom:
                Math.max(insets.bottom, 24) +
                120 +
                (Platform.OS === "android" ? keyboardInset : 0),
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: "#FFF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#ECE7DF",
                marginBottom: 20,
              }}
            >
              <Ionicons name="arrow-back" size={22} color="#14B8A6" />
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
              <FormField
                label={t("event.title")}
                value={title}
                onChangeText={setTitle}
                placeholder={t("event.titlePlaceholder")}
                onFocused={scrollInputIntoView}
              />

              <FormField
                label={t("event.organizer")}
                value={organizerName}
                onChangeText={setOrganizerName}
                placeholder={t("event.organizerPlaceholder")}
                autoCapitalize="words"
                onFocused={scrollInputIntoView}
              />

              <FormField
                label={t("event.description")}
                value={description}
                onChangeText={setDescription}
                placeholder={t("event.descriptionPlaceholder")}
                multiline
                onFocused={scrollInputIntoView}
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

              <EventTicketUrlField
                value={ticketUrl}
                onChangeText={setTicketUrl}
                onFocused={scrollInputIntoView}
              />

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
        </View>
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

function FormField({
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
  autoCapitalize,
  onFocused,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  onFocused?: (fieldNode: View | null) => void;
}) {
  const fieldRef = useRef<View>(null);

  return (
    <View ref={fieldRef}>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => onFocused?.(fieldRef.current)}
        placeholder={placeholder || label}
        placeholderTextColor="#999"
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[inputStyle, multiline ? { height: 120 } : null]}
      />
    </View>
  );
}
