import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    Alert,
    Modal,
    Image,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    getActiveUserId,
    loadUserProfile,
    upsertUserBusiness,
} from "../../lib/userSessionStorage";
import authStorage from "../utils/authStorage";
import * as ImagePicker from "expo-image-picker";
import { StreetAddressAutocomplete } from "../../components/business/StreetAddressAutocomplete";
import type { ParsedAddress } from "../../lib/addressAutocomplete";
import {
    logBusinessCreateAddress,
    logBusinessSavedCoordinates,
    resolveBusinessCoordinatesForSave,
} from "../../lib/businessLocation";
import { requestDiscoverListingsRefresh } from "../../lib/discoverListingsRefresh";
import { CREATE_BUSINESS_CATEGORIES } from "../../lib/discoverySearch";
import {
    createDefaultBusinessHours,
    formatTime12,
    parseTimeInput,
    sanitizeBusinessHoursForSave,
    WEEKDAYS,
    type BusinessDayHours,
    type BusinessHours,
    type WeekdayKey,
} from "../../lib/businessHours";

const DEFAULT_COVER =
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1600";

const promptCreateBusinessLogin = (reason: "guest" | "expired") => {
    const title = reason === "expired" ? "Session expired" : "Login required";
    const message =
        reason === "expired"
            ? "Please log in again to create a business."
            : "Please log in to create a business.";

    Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Log in", onPress: () => router.replace("/(tabs)") },
    ]);
};

const resolveCreateBusinessSession = async (): Promise<string | null> => {
    const tokens = await authStorage.getTokens();
    if (!tokens?.access) {
        return null;
    }

    return getActiveUserId();
};

const isValidZipCode = (zipCode: string) => /^\d{5}$/.test(zipCode.trim());

export default function CreateBusiness() {
    useEffect(() => {
        let cancelled = false;

        const guard = async () => {
            const tokens = await authStorage.getTokens();
            if (!tokens?.access) {
                if (!cancelled) {
                    promptCreateBusinessLogin("guest");
                }
                return;
            }

            const userId = await getActiveUserId();
            if (!cancelled && !userId) {
                promptCreateBusinessLogin("expired");
            }
        };

        void guard();

        return () => {
            cancelled = true;
        };
    }, []);

    const [businessName, setBusinessName] = useState("");
    const [category, setCategory] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("CA");
    const [zipCode, setZipCode] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [phone, setPhone] = useState("");
    const [instagram, setInstagram] = useState("");
    const [website, setWebsite] = useState("");
    const [description, setDescription] = useState("");
    const [showCategories, setShowCategories] = useState(false);
    const [logoImage, setLogoImage] = useState<string | null>(null);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [hoursEnabled, setHoursEnabled] = useState(false);
    const [businessHours, setBusinessHours] = useState<BusinessHours>(
        createDefaultBusinessHours()
    );
    const [saving, setSaving] = useState(false);

    const clearCoordinates = () => {
        setLatitude(null);
        setLongitude(null);
    };

    const handleStreetAddressChange = (text: string) => {
        setStreetAddress(text);
        clearCoordinates();
    };

    const handleAddressSelected = (parsed: ParsedAddress) => {
        setStreetAddress(parsed.streetAddress);
        setCity(parsed.city);
        setState(parsed.state || "CA");
        setZipCode(parsed.zipCode);
        setLatitude(parsed.latitude ?? null);
        setLongitude(parsed.longitude ?? null);
    };

    const pickLogo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });

        if (!result.canceled) {
            setLogoImage(result.assets[0].uri);
        }
    };

    const pickCover = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.85,
        });

        if (!result.canceled) {
            setCoverImage(result.assets[0].uri);
        }
    };

    const updateDayHours = (key: WeekdayKey, patch: Partial<BusinessDayHours>) => {
        setBusinessHours((current) => ({
            ...current,
            [key]: { ...current[key], ...patch },
        }));
    };

    const handleCreate = async () => {
        if (saving) return;

        if (!businessName || !category || !city.trim() || !state.trim() || !phone) {
            Alert.alert(
                "Missing info",
                "Please fill out business name, category, city, state, and phone."
            );
            return;
        }

        if (!isValidZipCode(zipCode)) {
            Alert.alert(
                "ZIP code required",
                "Enter a 5-digit ZIP code so we can place your business accurately on the map."
            );
            return;
        }

        const tokens = await authStorage.getTokens();
        if (!tokens?.access) {
            promptCreateBusinessLogin("guest");
            return;
        }

        const ownerId = await resolveCreateBusinessSession();
        if (!ownerId) {
            promptCreateBusinessLogin("expired");
            return;
        }

        const businessId = Date.now().toString();

        try {
            setSaving(true);

            logBusinessCreateAddress({
                streetAddress,
                city,
                state,
                zipCode,
                latitude,
                longitude,
            });

            const resolved = await resolveBusinessCoordinatesForSave({
                streetAddress,
                city,
                state,
                zipCode,
                latitude,
                longitude,
            });

            if (!resolved.ok) {
                Alert.alert("Address not found", resolved.message);
                return;
            }

            const ownerProfile = await loadUserProfile(ownerId);
            const ownerUsername = String(ownerProfile?.username || "").trim();
            const ownerEmail = String(ownerProfile?.email || "").trim();

            const businessData = {
                id: businessId,
                business_name: businessName,
                name: businessName,
                category,
                business_category: category,
                street_address: streetAddress.trim(),
                address: resolved.address,
                city: city.trim(),
                state: state.trim().toUpperCase(),
                zip: zipCode.trim(),
                zip_code: zipCode.trim(),
                postal_code: zipCode.trim(),
                coordinates_exact: true,
                latitude: resolved.latitude,
                longitude: resolved.longitude,
                lat: resolved.latitude,
                lng: resolved.longitude,
                phone,
                contact_info: phone,
                instagram,
                website,
                description,
                about: description,
                logo: logoImage,
                avatar: logoImage,
                profile_image: logoImage,
                cover_image: coverImage || DEFAULT_COVER,
                image: coverImage || DEFAULT_COVER,
                business_hours: hoursEnabled
                    ? sanitizeBusinessHoursForSave(businessHours)
                    : null,
                hours_configured: hoursEnabled,
                is_owner: true,
                owner_is_current_user: true,
                can_edit: true,
                owner_id: ownerId,
                user_id: ownerId,
                owner_username: ownerUsername || undefined,
                ownerUsername: ownerUsername || undefined,
                owner_email: ownerEmail || undefined,
                ownerEmail: ownerEmail || undefined,
                created_by: ownerId ?? ownerEmail ?? ownerUsername ?? undefined,
                createdBy: ownerId ?? ownerEmail ?? ownerUsername ?? undefined,
            };

            const profileStorageKey = `profile_v2_${businessId}`;

            await AsyncStorage.setItem(
                profileStorageKey,
                JSON.stringify(businessData)
            );
            logBusinessSavedCoordinates(businessData);
            await upsertUserBusiness(ownerId, businessData, ownerUsername);
            requestDiscoverListingsRefresh();

            router.replace({
              pathname: "/profile/v2",
              params: { id: businessId, fromCreate: "1" },
            });
        } catch (error) {
            console.log("CREATE BUSINESS ERROR:", error);
            Alert.alert(
                "Could not create business",
                "Something went wrong while saving your business. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#F7F4EE" }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingTop: 68, paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <Pressable onPress={() => router.back()} style={{ marginBottom: 28 }}>
                <Ionicons name="chevron-back" size={32} color="#0F5F5A" />
            </Pressable>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 26 }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 34, fontWeight: "900", color: "#111", lineHeight: 40 }}>
                        Create Business Profile
                    </Text>
                    <Text style={{ fontSize: 16, color: "#6B7280", marginTop: 12, lineHeight: 24 }}>
                        Build your business presence and connect with your community.
                    </Text>
                </View>

                <View
                    style={{
                        width: 92,
                        height: 92,
                        borderRadius: 46,
                        backgroundColor: "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.08,
                        shadowRadius: 16,
                        elevation: 4,
                    }}
                >
                    <Ionicons name="storefront-outline" size={44} color="#11998E" />
                    <View
                        style={{
                            position: "absolute",
                            right: 4,
                            bottom: 6,
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: "#11998E",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name="add" size={22} color="#fff" />
                    </View>
                </View>
            </View>

            <View
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 28,
                    padding: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 18,
                    elevation: 3,
                }}
            >
                <Input
                    icon="storefront-outline"
                    label="Business Name *"
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Enter your business name"
                />

                <CategoryInput
                    value={category}
                    onPress={() => setShowCategories(true)}
                />

                <StreetAddressAutocomplete
                    variant="create"
                    label="Street Address"
                    value={streetAddress}
                    onChangeText={handleStreetAddressChange}
                    onAddressSelected={handleAddressSelected}
                    placeholder="Start typing your street address"
                />

                <Input
                    icon="location-outline"
                    label="City *"
                    value={city}
                    onChangeText={(value: string) => {
                        setCity(value);
                        clearCoordinates();
                    }}
                    placeholder="San Diego"
                />

                <Input
                    icon="map-outline"
                    label="State *"
                    value={state}
                    onChangeText={(value: string) => {
                        setState(value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2));
                        clearCoordinates();
                    }}
                    placeholder="CA"
                    autoCapitalize="characters"
                />

                <Input
                    icon="mail-outline"
                    label="ZIP Code *"
                    value={zipCode}
                    onChangeText={(value: string) => {
                        setZipCode(value.replace(/\D/g, "").slice(0, 5));
                        clearCoordinates();
                    }}
                    placeholder="92101"
                    keyboardType="number-pad"
                    helperText="ZIP code helps us place your business accurately on the map."
                />

                <Input
                    icon="call-outline"
                    label="Phone Number *"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="(858) 555-1234"
                    keyboardType="phone-pad"
                />

                <Input
                    icon="logo-instagram"
                    label="Instagram"
                    value={instagram}
                    onChangeText={setInstagram}
                    placeholder="@yourbusiness"
                />

                <Input
                    icon="globe-outline"
                    label="Website"
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://yourwebsite.com"
                />

                <Input
                    icon="document-text-outline"
                    label="Business Description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Tell people about your business..."
                    multiline
                />

                <Text style={{ fontSize: 15, fontWeight: "900", marginBottom: 8, color: "#111" }}>
                    Cover Image
                </Text>
                <Pressable onPress={pickCover} style={{ marginBottom: 18 }}>
                    <View>
                        <Image
                            source={{ uri: coverImage || DEFAULT_COVER }}
                            style={{
                                width: "100%",
                                height: 150,
                                borderRadius: 18,
                                backgroundColor: "#E7F6F4",
                            }}
                            resizeMode="cover"
                        />
                        <View
                            style={{
                                position: "absolute",
                                right: 12,
                                bottom: 12,
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: "#fff",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="camera" size={18} color="#111" />
                        </View>
                    </View>
                </Pressable>
                <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 18, lineHeight: 18 }}>
                    Optional. Shown at the top of your business profile.
                </Text>

                <Text style={{ fontSize: 15, fontWeight: "900", marginBottom: 8, color: "#111" }}>
                    Business Hours
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                        padding: 14,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        backgroundColor: "#fff",
                    }}
                >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: "800", color: "#111" }}>
                            Set business hours
                        </Text>
                        <Text style={{ marginTop: 4, fontSize: 13, color: "#6B7280", lineHeight: 18 }}>
                            Show open/closed status on your profile.
                        </Text>
                    </View>
                    <Switch
                        value={hoursEnabled}
                        onValueChange={setHoursEnabled}
                        trackColor={{ false: "#D1D5DB", true: "rgba(17,153,142,0.45)" }}
                        thumbColor={hoursEnabled ? "#11998E" : "#f4f4f5"}
                    />
                </View>

                {hoursEnabled
                    ? WEEKDAYS.map(({ key, label }) => {
                          const day = businessHours[key];

                          return (
                              <View
                                  key={key}
                                  style={{
                                      marginBottom: 12,
                                      padding: 14,
                                      borderRadius: 16,
                                      borderWidth: 1,
                                      borderColor: "#E5E7EB",
                                      backgroundColor: "#fff",
                                  }}
                              >
                                  <View
                                      style={{
                                          flexDirection: "row",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          marginBottom: day.closed ? 0 : 10,
                                      }}
                                  >
                                      <Text style={{ fontSize: 15, fontWeight: "800", color: "#111" }}>
                                          {label}
                                      </Text>
                                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                                          <Text style={{ marginRight: 8, fontSize: 13, color: "#6B7280" }}>
                                              Closed
                                          </Text>
                                          <Switch
                                              value={day.closed}
                                              onValueChange={(closed) =>
                                                  updateDayHours(key, { closed })
                                              }
                                              trackColor={{
                                                  false: "#D1D5DB",
                                                  true: "rgba(17,153,142,0.45)",
                                              }}
                                              thumbColor={day.closed ? "#11998E" : "#f4f4f5"}
                                          />
                                      </View>
                                  </View>

                                  {!day.closed ? (
                                      <View style={{ flexDirection: "row", gap: 10 }}>
                                          <View style={{ flex: 1 }}>
                                              <Text
                                                  style={{
                                                      marginBottom: 6,
                                                      fontSize: 13,
                                                      fontWeight: "700",
                                                      color: "#6B7280",
                                                  }}
                                              >
                                                  Open
                                              </Text>
                                              <TextInput
                                                  value={formatTime12(day.open)}
                                                  onChangeText={(text) => {
                                                      const parsed = parseTimeInput(text);
                                                      if (parsed) updateDayHours(key, { open: parsed });
                                                  }}
                                                  placeholder="9:00 AM"
                                                  style={{
                                                      height: 48,
                                                      borderRadius: 12,
                                                      borderWidth: 1,
                                                      borderColor: "#E5E7EB",
                                                      backgroundColor: "#fff",
                                                      paddingHorizontal: 12,
                                                      fontSize: 15,
                                                      color: "#111",
                                                  }}
                                              />
                                          </View>
                                          <View style={{ flex: 1 }}>
                                              <Text
                                                  style={{
                                                      marginBottom: 6,
                                                      fontSize: 13,
                                                      fontWeight: "700",
                                                      color: "#6B7280",
                                                  }}
                                              >
                                                  Close
                                              </Text>
                                              <TextInput
                                                  value={formatTime12(day.close)}
                                                  onChangeText={(text) => {
                                                      const parsed = parseTimeInput(text);
                                                      if (parsed) updateDayHours(key, { close: parsed });
                                                  }}
                                                  placeholder="6:00 PM"
                                                  style={{
                                                      height: 48,
                                                      borderRadius: 12,
                                                      borderWidth: 1,
                                                      borderColor: "#E5E7EB",
                                                      backgroundColor: "#fff",
                                                      paddingHorizontal: 12,
                                                      fontSize: 15,
                                                      color: "#111",
                                                  }}
                                              />
                                          </View>
                                      </View>
                                  ) : null}
                              </View>
                          );
                      })
                    : null}

                <Text style={{ fontSize: 15, fontWeight: "900", marginBottom: 8, marginTop: 8, color: "#111" }}>
                    Business Logo
                </Text>
                <Pressable
                    style={{
                        marginTop: 0,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: "#A7D8D4",
                        borderRadius: 22,
                        padding: 22,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#F8FEFD",
                    }}
                    onPress={pickLogo}
                >
                    {logoImage ? (
                        <Image
                            source={{ uri: logoImage }}
                            style={{
                                width: 88,
                                height: 88,
                                borderRadius: 44,
                                marginBottom: 10,
                                backgroundColor: "#E7F6F4",
                            }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View
                            style={{
                                width: 58,
                                height: 58,
                                borderRadius: 29,
                                backgroundColor: "#E7F6F4",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 10,
                            }}
                        >
                            <Ionicons name="camera-outline" size={30} color="#11998E" />
                        </View>
                    )}
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#11998E" }}>
                        {logoImage ? "Change Logo" : "Upload Logo"}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                        PNG or JPG, optional
                    </Text>
                </Pressable>

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 24,
                        padding: 16,
                        borderRadius: 18,
                        backgroundColor: "#F2FBFA",
                    }}
                >
                    <View
                        style={{
                            width: 46,
                            height: 46,
                            borderRadius: 16,
                            backgroundColor: "#E0F3F0",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                    >
                        <Ionicons name="shield-checkmark-outline" size={25} color="#11998E" />
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: "#111" }}>
                            Verification & Review
                        </Text>
                        <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 3, lineHeight: 18 }}>
                            Your business profile can be reviewed before going live.
                        </Text>
                    </View>
                </View>

                <Pressable
                    onPress={() => void handleCreate()}
                    disabled={saving}
                    style={{
                        marginTop: 24,
                        height: 60,
                        borderRadius: 20,
                        backgroundColor: "#11998E",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: saving ? 0.7 : 1,
                    }}
                >
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>
                        {saving ? "Verifying address..." : "Create Business Profile"}
                    </Text>
                </Pressable>
            </View>

        </ScrollView>

            <CategoryModal
                visible={showCategories}
                onClose={() => setShowCategories(false)}
                onSelect={(item) => {
                    setCategory(item);
                    setShowCategories(false);
                }}
            />
        </KeyboardAvoidingView>
    );
}

function Input({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    keyboardType = "default",
    helperText,
    autoCapitalize,
}: any) {
    return (
        <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 15, fontWeight: "900", marginBottom: 8, color: "#111" }}>
                {label}
            </Text>

            <View
                style={{
                    minHeight: multiline ? 112 : 56,
                    borderRadius: 17,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    alignItems: multiline ? "flex-start" : "center",
                    paddingHorizontal: 14,
                    paddingTop: multiline ? 14 : 0,
                }}
            >
                <Ionicons
                    name={icon}
                    size={22}
                    color="#11998E"
                    style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }}
                />

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    multiline={multiline}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    placeholderTextColor="#B8BBC2"
                    style={{
                        flex: 1,
                        minHeight: multiline ? 90 : 54,
                        fontSize: 16,
                        color: "#111",
                        textAlignVertical: multiline ? "top" : "center",
                    }}
                />
            </View>

            {helperText ? (
                <Text
                    style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginTop: 6,
                        lineHeight: 18,
                    }}
                >
                    {helperText}
                </Text>
            ) : null}
        </View>
    );
}

function CategoryInput({ value, onPress }: any) {
    return (
        <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 15, fontWeight: "900", marginBottom: 8, color: "#111" }}>
                Category *
            </Text>

            <Pressable
                onPress={onPress}
                style={{
                    height: 56,
                    borderRadius: 17,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                }}
            >
                <Ionicons name="grid-outline" size={22} color="#11998E" style={{ marginRight: 12 }} />

                <Text style={{ flex: 1, fontSize: 16, color: value ? "#111" : "#B8BBC2" }}>
                    {value || "Select a category"}
                </Text>

                <Ionicons name="chevron-down" size={22} color="#6B7280" />
            </Pressable>
        </View>
    );
}

function CategoryModal({ visible, onClose, onSelect }: any) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    justifyContent: "flex-end",
                }}
            >
                <View
                    style={{
                        backgroundColor: "#fff",
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        padding: 22,
                        paddingBottom: 36,
                    }}
                >
                    <View
                        style={{
                            width: 44,
                            height: 5,
                            borderRadius: 3,
                            backgroundColor: "#D1D5DB",
                            alignSelf: "center",
                            marginBottom: 18,
                        }}
                    />

                    <Text style={{ fontSize: 22, fontWeight: "900", color: "#111", marginBottom: 16 }}>
                        Select Category
                    </Text>

                    {CREATE_BUSINESS_CATEGORIES.map((item) => (
                        <Pressable
                            key={item}
                            onPress={() => onSelect(item)}
                            style={{
                                paddingVertical: 15,
                                borderBottomWidth: 1,
                                borderBottomColor: "#F1F1F1",
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: "#111" }}>
                                {item}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </Pressable>
                    ))}

                    <Pressable
                        onPress={onClose}
                        style={{
                            marginTop: 18,
                            height: 50,
                            borderRadius: 16,
                            backgroundColor: "#F3F4F6",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: "800", color: "#111" }}>
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}