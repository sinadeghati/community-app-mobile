import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { API } from "@/lib/api";
import {
  BUSINESS_OFFERING_AVAILABILITY,
  BUSINESS_OFFERING_CATEGORIES,
  createEmptyBusinessOffering,
  normalizeBusinessOfferings,
  parseOfferingDiscountPercent,
  sanitizeBusinessOfferingsForSave,
  type BusinessOffering,
  type BusinessOfferingAvailability,
  type BusinessOfferingCategory,
} from "@/lib/businessOfferings";
import {
  createDefaultBusinessHours,
  formatTime12,
  normalizeBusinessHours,
  parseTimeInput,
  sanitizeBusinessHoursForSave,
  WEEKDAYS,
  type BusinessDayHours,
  type BusinessHours,
  type WeekdayKey,
} from "@/lib/businessHours";
import {
  BUSINESS_UPDATE_TYPES,
  createEmptyBusinessUpdate,
  formatExpirationDateInput,
  normalizeBusinessUpdates,
  parseExpirationDateInput,
  sanitizeBusinessUpdatesForSave,
  type BusinessUpdate,
  type BusinessUpdateType,
} from "@/lib/businessUpdates";
import {
  getBusinessGalleryUris,
  sanitizeBusinessGalleryForSave,
} from "@/lib/businessGallery";
import { StreetAddressAutocomplete } from "@/components/business/StreetAddressAutocomplete";
import type { ParsedAddress } from "@/lib/addressAutocomplete";
import {
  logBusinessCreateAddress,
  logBusinessSavedCoordinates,
  resolveBusinessCoordinatesForSave,
} from "@/lib/businessLocation";
import { requestDiscoverListingsRefresh } from "@/lib/discoverListingsRefresh";

const TURQUOISE = "#11998E";
const BG = "#F5F4F0";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#E2DED8";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1600";
const DEFAULT_LOGO =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=900";

const isValidZipCode = (zipCode: string) => /^\d{5}$/.test(zipCode.trim());

export default function EditBusinessProfileScreen() {
  const params = useLocalSearchParams();
  const businessId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [canDeleteBusiness, setCanDeleteBusiness] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessBio, setBusinessBio] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zipCode, setZipCode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [category, setCategory] = useState("");
  const [offerings, setOfferings] = useState<BusinessOffering[]>([]);
  const [businessUpdates, setBusinessUpdates] = useState<BusinessUpdate[]>([]);
  const [hoursEnabled, setHoursEnabled] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    createDefaultBusinessHours()
  );

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const businessStorageKey = `profile_v2_${businessId}`;

  const resolveCanDeleteBusiness = async (item: Record<string, unknown>) => {
    const { verifyBusinessOwnerAccess } = await import(
      "../../lib/userSessionStorage"
    );
    const access = await verifyBusinessOwnerAccess(item, businessId);
    return access.ok;
  };

  const normalizeBusiness = (item: any) => ({
    id: String(item?.id || businessId),
    business_name: item?.business_name || item?.name || item?.title || "",
    name: item?.business_name || item?.name || item?.title || "",
    title: item?.business_name || item?.name || item?.title || "",
    description: item?.description || item?.about || item?.businessBio || "",
    about: item?.about || item?.description || item?.businessBio || "",
    phone: item?.phone || item?.contact_info || "",
    contact_info: item?.phone || item?.contact_info || "",
    city: item?.city || "",
    state: item?.state || "CA",
    zip:
      item?.zip ||
      item?.zip_code ||
      item?.zipCode ||
      item?.postal_code ||
      "",
    street_address: item?.street_address || item?.streetAddress || "",
    address: item?.address || item?.street_address || "",
    latitude: item?.latitude ?? item?.lat ?? null,
    longitude: item?.longitude ?? item?.lng ?? null,
    lat: item?.lat ?? item?.latitude ?? null,
    lng: item?.lng ?? item?.longitude ?? null,
    coordinates_exact: item?.coordinates_exact === true,
    website: item?.website || "",
    email: item?.email || "",
    instagram: item?.instagram || "",
    category: item?.category || "",
    menu_items: sanitizeBusinessOfferingsForSave(
      normalizeBusinessOfferings(
        item?.business_offerings ??
          item?.businessOfferings ??
          item?.menu_items ??
          item?.menuItems
      )
    ),
    business_offerings: sanitizeBusinessOfferingsForSave(
      normalizeBusinessOfferings(
        item?.business_offerings ??
          item?.businessOfferings ??
          item?.menu_items ??
          item?.menuItems
      )
    ),
    business_updates: sanitizeBusinessUpdatesForSave(
      normalizeBusinessUpdates(item?.business_updates ?? item?.businessUpdates)
    ),
    business_hours: item?.hours_configured
      ? sanitizeBusinessHoursForSave(
          normalizeBusinessHours(item?.business_hours ?? item?.businessHours) ||
            createDefaultBusinessHours()
        )
      : null,
    hours_configured: Boolean(item?.hours_configured),
    cover_image: item?.cover_image || item?.coverImage || null,
    logo: item?.logo || item?.avatar || item?.profile_image || item?.logoImage || null,
    avatar: item?.avatar || item?.logo || item?.profile_image || item?.logoImage || null,
    profile_image: item?.profile_image || item?.avatar || item?.logo || item?.logoImage || null,
    images: sanitizeBusinessGalleryForSave(
      getBusinessGalleryUris(item as Record<string, unknown>)
    ),
    is_owner: item?.is_owner ?? false,
    owner_is_current_user: item?.owner_is_current_user ?? false,
    can_edit: item?.can_edit ?? false,
  });

  const applyBusinessToForm = (item: any) => {
    const data = normalizeBusiness(item);

    setBusinessName(data.business_name);
    setBusinessBio(data.about);
    setPhone(data.phone);
    setStreetAddress(
      String(data.street_address || data.address || "").trim()
    );
    setCity(data.city);
    setState(String(data.state || "CA").trim().toUpperCase());
    setZipCode(String(data.zip || "").replace(/\D/g, "").slice(0, 5));
    const coordinatesExact = item?.coordinates_exact === true;
    const lat = Number(item?.latitude ?? item?.lat);
    const lng = Number(item?.longitude ?? item?.lng);
    if (coordinatesExact && Number.isFinite(lat) && Number.isFinite(lng)) {
      setLatitude(lat);
      setLongitude(lng);
    } else {
      setLatitude(null);
      setLongitude(null);
    }
    setWebsite(data.website);
    setEmail(data.email);
    setInstagram(data.instagram);
    setCategory(data.category);
    setOfferings(
      normalizeBusinessOfferings(
        data.business_offerings ?? data.menu_items
      )
    );
    setBusinessUpdates(
      normalizeBusinessUpdates(item?.business_updates ?? item?.businessUpdates)
    );
    setHoursEnabled(Boolean(item?.hours_configured));
    setBusinessHours(
      normalizeBusinessHours(item?.business_hours ?? item?.businessHours) ||
        createDefaultBusinessHours()
    );
    setCoverImage(data.cover_image || DEFAULT_COVER);
    setLogoImage(data.logo || DEFAULT_LOGO);
    setGalleryImages(getBusinessGalleryUris(item as Record<string, unknown>));
  };

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        if (!businessId) {
          Alert.alert("Missing business", "Business ID was not found.");
          router.replace("/(tabs)");
          return;
        }

        const {
          loadMyBusinessesForProfile,
          loadUserProfile,
          requireAuthenticatedUser,
          verifyBusinessOwnerAccess,
        } = await import("../../lib/userSessionStorage");

        const userId = await requireAuthenticatedUser();
        if (!userId) {
          router.replace("/(tabs)");
          return;
        }

        const profile = await loadUserProfile(userId);
        const identity = {
          username: String(profile?.username || "").trim() || undefined,
          email: String(profile?.email || "").trim() || undefined,
        };

        const myBusinesses = await loadMyBusinessesForProfile(userId, identity);
        let loaded =
          myBusinesses.find((item) => String(item.id || "") === businessId) ??
          null;

        if (!loaded) {
          const savedRaw = await AsyncStorage.getItem(businessStorageKey);
          if (savedRaw) {
            loaded = JSON.parse(savedRaw) as Record<string, unknown>;
          } else if ((API as any)?.getListing) {
            loaded = (await (API as any).getListing(businessId)) as Record<
              string,
              unknown
            >;
          }
        }

        if (!loaded) {
          Alert.alert("Not found", "Could not find this business.");
          router.back();
          return;
        }

        const access = await verifyBusinessOwnerAccess(loaded, businessId);
        if (!access.ok) {
          if (access.reason === "guest") {
            router.replace("/(tabs)");
          } else {
            Alert.alert(
              "Access denied",
              "Only the business owner can edit this profile."
            );
            router.back();
          }
          return;
        }

        applyBusinessToForm(loaded);
        setCanDeleteBusiness(await resolveCanDeleteBusiness(loaded));
      } catch (error) {
        console.log("EDIT BUSINESS LOAD ERROR:", error);
        Alert.alert("Error", "Could not load this business.");
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId]);

  const updateOffering = (id: string, patch: Partial<BusinessOffering>) => {
    setOfferings((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const addOffering = () => {
    setOfferings((current) => [...current, createEmptyBusinessOffering()]);
  };

  const updateBusinessUpdate = (
    id: string,
    patch: Partial<BusinessUpdate>
  ) => {
    setBusinessUpdates((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const addBusinessUpdate = () => {
    setBusinessUpdates((current) => [...current, createEmptyBusinessUpdate()]);
  };

  const removeBusinessUpdate = (id: string) => {
    Alert.alert("Remove update", "Delete this business update?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setBusinessUpdates((current) =>
            current.filter((item) => item.id !== id)
          );
        },
      },
    ]);
  };

  const pickUpdateImage = async (id: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled) {
      updateBusinessUpdate(id, { image: result.assets[0].uri });
    }
  };

  const removeOffering = (id: string) => {
    Alert.alert("Remove offering", "Delete this business offering?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setOfferings((current) => current.filter((item) => item.id !== id));
        },
      },
    ]);
  };

  const pickOfferingImage = async (id: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled) {
      updateOffering(id, { image: result.assets[0].uri });
    }
  };

  const updateDayHours = (key: WeekdayKey, patch: Partial<BusinessDayHours>) => {
    setBusinessHours((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  };

  const pickGalleryImage = async () => {
    if (galleryImages.length >= 24) {
      Alert.alert("Limit reached", "Maximum 24 gallery photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setGalleryImages((current) => [...current, result.assets[0].uri]);
    }
  };

  const removeGalleryImage = (uri: string) => {
    setGalleryImages((current) => current.filter((item) => item !== uri));
  };

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

  const pickImage = async (type: "cover" | "logo") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: type === "cover" ? [16, 9] : [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === "cover") setCoverImage(uri);
      if (type === "logo") setLogoImage(uri);
    }
  };

  const performDeleteBusiness = async () => {
    try {
      setDeleting(true);
      const { deleteUserBusiness, getActiveUserId, loadUserProfile } = await import(
        "../../lib/userSessionStorage"
      );
      const ownerId = await getActiveUserId();
      if (!ownerId) {
        Alert.alert("Login required", "You must be logged in to delete a business.");
        return;
      }

      const ownerProfile = await loadUserProfile(ownerId);
      const result = await deleteUserBusiness(ownerId, businessId, {
        username: String(ownerProfile?.username || "").trim() || undefined,
        email: String(ownerProfile?.email || "").trim() || undefined,
      });

      if (!result.ok) {
        if (result.reason === "not_owner") {
          Alert.alert("Not allowed", "You can only delete businesses you own.");
        } else if (result.reason === "not_found") {
          Alert.alert("Not found", "Could not find this business to delete.");
        } else {
          Alert.alert("Error", "Could not delete this business.");
        }
        return;
      }

      Alert.alert("Business deleted", "Your business has been removed.", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/profile"),
        },
      ]);
    } catch (error) {
      console.log("DELETE BUSINESS ERROR:", error);
      Alert.alert("Error", "Could not delete this business.");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteBusiness = () => {
    Alert.alert(
      "Delete Business?",
      "This will remove this business from your profile, Map, Explore, and public listings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("This action cannot be undone.", undefined, [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes, delete permanently",
                style: "destructive",
                onPress: () => {
                  void performDeleteBusiness();
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const saveBusiness = async () => {
    if (!businessId) return;

    if (!city.trim() || !state.trim()) {
      Alert.alert(
        "Missing location",
        "Please enter your business city and state."
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

    try {
      setSaving(true);

      const offeringsToSave = sanitizeBusinessOfferingsForSave(offerings);
      const updatesToSave = sanitizeBusinessUpdatesForSave(
        businessUpdates.map((item) => {
          const exp = item.expiresAt?.trim();
          if (!exp) return { ...item, expiresAt: undefined };

          const iso =
            parseExpirationDateInput(formatExpirationDateInput(exp) || exp) ||
            parseExpirationDateInput(exp);

          return { ...item, expiresAt: iso };
        })
      );

      const invalidOfferingDraft = offerings.some(
        (item) =>
          !item.title.trim() &&
          (item.description ||
            item.price ||
            item.image ||
            item.discountPercent ||
            item.featured)
      );

      if (invalidOfferingDraft) {
        Alert.alert(
          "Title required",
          "Each business offering needs a title before saving."
        );
        setSaving(false);
        return;
      }

      const invalidUpdateDraft = businessUpdates.some(
        (item) =>
          !item.title.trim() &&
          (item.description || item.image || item.expiresAt)
      );

      if (invalidUpdateDraft) {
        Alert.alert(
          "Title required",
          "Each business update needs a title before saving."
        );
        setSaving(false);
        return;
      }

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
        setSaving(false);
        return;
      }

      const updatedBusiness = normalizeBusiness({
        id: businessId,
        business_name: businessName,
        name: businessName,
        title: businessName,
        description: businessBio,
        about: businessBio,
        phone,
        contact_info: phone,
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
        website,
        email,
        instagram,
        category,
        menu_items: offeringsToSave,
        business_offerings: offeringsToSave,
        business_updates: updatesToSave,
        business_hours: hoursEnabled
          ? sanitizeBusinessHoursForSave(businessHours)
          : null,
        hours_configured: hoursEnabled,
        cover_image: coverImage,
        logo: logoImage,
        avatar: logoImage,
        profile_image: logoImage,
        images: sanitizeBusinessGalleryForSave(galleryImages),
        is_owner: true,
        owner_is_current_user: true,
        can_edit: true,
      });

      logBusinessSavedCoordinates(updatedBusiness as Record<string, unknown>);

      await AsyncStorage.setItem(
        businessStorageKey,
        JSON.stringify(updatedBusiness)
      );

      const { getActiveUserId, loadUserProfile, upsertUserBusiness } =
        await import("../../lib/userSessionStorage");
      const ownerId = await getActiveUserId();
      if (ownerId) {
        const ownerProfile = await loadUserProfile(ownerId);
        const ownerUsername = String(ownerProfile?.username || "").trim();
        await upsertUserBusiness(
          ownerId,
          {
            ...updatedBusiness,
            owner_id: (updatedBusiness as Record<string, unknown>).owner_id ?? ownerId,
            user_id: (updatedBusiness as Record<string, unknown>).user_id ?? ownerId,
            owner_username:
              (updatedBusiness as Record<string, unknown>).owner_username ??
              ownerUsername,
            ownerUsername:
              (updatedBusiness as Record<string, unknown>).ownerUsername ??
              ownerUsername,
          },
          ownerUsername
        );
      }

      requestDiscoverListingsRefresh();

      Alert.alert("Saved", "Business profile updated.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.log("EDIT BUSINESS SAVE ERROR:", error);
      Alert.alert("Error", "Could not save this business.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED, fontSize: 16 }}>Loading business...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
            <Text style={{ color: TURQUOISE, fontSize: 18 }}>← Back</Text>
          </Pressable>

          <Text style={{ fontSize: 32, fontWeight: "900", color: TEXT }}>
            Edit Business Profile
          </Text>
          <Text style={{ marginTop: 6, fontSize: 16, color: MUTED }}>
            Update your business information
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={labelStyle}>Cover Photo</Text>
          <Pressable onPress={() => pickImage("cover")}>
            <Image
              source={{ uri: coverImage || DEFAULT_COVER }}
              style={{ width: "100%", height: 150, borderRadius: 18, backgroundColor: BORDER }}
            />
            <View style={cameraCover}>
              <Ionicons name="camera" size={18} color={TEXT} />
            </View>
          </Pressable>

          <Text style={[labelStyle, { marginTop: 22 }]}>Business Logo</Text>
          <Pressable onPress={() => pickImage("logo")} style={{ alignSelf: "flex-start" }}>
            <Image
              source={{ uri: logoImage || DEFAULT_LOGO }}
              style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: BORDER }}
            />
            <View style={cameraLogo}>
              <Ionicons name="camera" size={16} color={TEXT} />
            </View>
          </Pressable>

          <Text style={[labelStyle, { marginTop: 22 }]}>Business Gallery</Text>
          <Text style={{ marginBottom: 10, fontSize: 13, color: MUTED, lineHeight: 18 }}>
            Permanent photos for your profile gallery. Update banners stay on each
            update only.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <Pressable
              onPress={pickGalleryImage}
              style={{
                width: 100,
                height: 100,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: BORDER,
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
                backgroundColor: BG,
              }}
            >
              <Ionicons name="add" size={28} color={TURQUOISE} />
            </Pressable>

            {galleryImages.map((uri) => (
              <View key={uri} style={{ marginRight: 12 }}>
                <Image
                  source={{ uri }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 16,
                    backgroundColor: BORDER,
                  }}
                />
                <Pressable
                  onPress={() => removeGalleryImage(uri)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <Section title="Business Information" />
          <Field label="Business Name" value={businessName} setValue={setBusinessName} />
          <Field label="Business Bio" value={businessBio} setValue={setBusinessBio} multiline />
          <Field label="Phone Number" value={phone} setValue={setPhone} keyboardType="phone-pad" />
          <StreetAddressAutocomplete
            variant="edit"
            label="Street Address"
            value={streetAddress}
            onChangeText={handleStreetAddressChange}
            onAddressSelected={handleAddressSelected}
            placeholder="Start typing your street address"
          />
          <Field
            label="City *"
            value={city}
            setValue={(value) => {
              setCity(value);
              clearCoordinates();
            }}
            placeholder="San Diego"
          />
          <Field
            label="State *"
            value={state}
            setValue={(value) => {
              setState(value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2));
              clearCoordinates();
            }}
            placeholder="CA"
            autoCapitalize="characters"
          />
          <Field
            label="ZIP Code *"
            value={zipCode}
            setValue={(value) => {
              setZipCode(value.replace(/\D/g, "").slice(0, 5));
              clearCoordinates();
            }}
            placeholder="92101"
            keyboardType="number-pad"
            helperText="ZIP code helps us place your business accurately on the map."
          />
          <Field label="Website" value={website} setValue={setWebsite} />
          <Field label="Email" value={email} setValue={setEmail} keyboardType="email-address" />
          <Field label="Instagram" value={instagram} setValue={setInstagram} />
          <Field label="Category" value={category} setValue={setCategory} />

          <Section title="Business Hours" />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: BORDER,
              backgroundColor: CARD,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: TEXT }}>
                Set business hours
              </Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: MUTED, lineHeight: 18 }}>
                Show open/closed status on your profile.
              </Text>
            </View>
            <Switch
              value={hoursEnabled}
              onValueChange={setHoursEnabled}
              trackColor={{ false: "#D1D5DB", true: "rgba(17,153,142,0.45)" }}
              thumbColor={hoursEnabled ? TURQUOISE : "#f4f4f5"}
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
                      borderColor: BORDER,
                      backgroundColor: CARD,
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
                      <Text style={{ fontSize: 15, fontWeight: "800", color: TEXT }}>
                        {label}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ marginRight: 8, fontSize: 13, color: MUTED }}>
                          Closed
                        </Text>
                        <Switch
                          value={day.closed}
                          onValueChange={(closed) => updateDayHours(key, { closed })}
                          trackColor={{
                            false: "#D1D5DB",
                            true: "rgba(17,153,142,0.45)",
                          }}
                          thumbColor={day.closed ? TURQUOISE : "#f4f4f5"}
                        />
                      </View>
                    </View>

                    {!day.closed ? (
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={fieldLabelStyle}>Open</Text>
                          <TextInput
                            value={formatTime12(day.open)}
                            onChangeText={(text) => {
                              const parsed = parseTimeInput(text);
                              if (parsed) updateDayHours(key, { open: parsed });
                            }}
                            placeholder="9:00 AM"
                            style={timeInputStyle}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={fieldLabelStyle}>Close</Text>
                          <TextInput
                            value={formatTime12(day.close)}
                            onChangeText={(text) => {
                              const parsed = parseTimeInput(text);
                              if (parsed) updateDayHours(key, { close: parsed });
                            }}
                            placeholder="6:00 PM"
                            style={timeInputStyle}
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })
            : null}

          <Section title="Announcements & Promotions" />
          <Text style={{ fontSize: 14, color: MUTED, marginBottom: 14, lineHeight: 20 }}>
            Post specials, offers, events, and announcements customers will see on
            your profile.
          </Text>

          {businessUpdates.map((update, index) => (
            <View
              key={update.id}
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: BORDER,
                backgroundColor: CARD,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "800", color: TEXT }}>
                  Update {index + 1}
                </Text>
                <Pressable onPress={() => removeBusinessUpdate(update.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </Pressable>
              </View>

              <Text style={fieldLabelStyle}>Type</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {BUSINESS_UPDATE_TYPES.map((entry) => {
                  const active = update.type === entry.key;

                  return (
                    <Pressable
                      key={entry.key}
                      onPress={() =>
                        updateBusinessUpdate(update.id, {
                          type: entry.key as BusinessUpdateType,
                        })
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? TURQUOISE : BORDER,
                        backgroundColor: active
                          ? "rgba(17,153,142,0.12)"
                          : CARD,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: active ? TURQUOISE : MUTED,
                        }}
                      >
                        {entry.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Field
                label="Title *"
                value={update.title}
                setValue={(text) => updateBusinessUpdate(update.id, { title: text })}
              />
              <Field
                label="Description"
                value={update.description || ""}
                setValue={(text) =>
                  updateBusinessUpdate(update.id, { description: text })
                }
                multiline
              />
              <Field
                label="Expiration date"
                value={formatExpirationDateInput(update.expiresAt)}
                setValue={(text) => {
                  const trimmed = text.trim();
                  updateBusinessUpdate(update.id, {
                    expiresAt: trimmed
                      ? parseExpirationDateInput(trimmed) || trimmed
                      : undefined,
                  });
                }}
                placeholder="YYYY-MM-DD (optional)"
              />

              <Text style={labelStyle}>Image (optional)</Text>
              <Pressable
                onPress={() => pickUpdateImage(update.id)}
                style={{ marginBottom: 4 }}
              >
                {update.image ? (
                  <Image
                    source={{ uri: update.image }}
                    style={{
                      width: "100%",
                      height: 120,
                      borderRadius: 14,
                      backgroundColor: BORDER,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      height: 88,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderStyle: "dashed",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: BG,
                    }}
                  >
                    <Ionicons name="image-outline" size={22} color={MUTED} />
                    <Text style={{ marginTop: 6, color: MUTED, fontSize: 13 }}>
                      Add image
                    </Text>
                  </View>
                )}
              </Pressable>

              {update.image ? (
                <Pressable
                  onPress={() => updateBusinessUpdate(update.id, { image: "" })}
                >
                  <Text style={{ color: MUTED, fontSize: 13, fontWeight: "700" }}>
                    Remove image
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          <Pressable
            onPress={addBusinessUpdate}
            style={{
              height: 52,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: TURQUOISE,
              backgroundColor: "rgba(17,153,142,0.08)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              marginBottom: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={TURQUOISE} />
            <Text
              style={{
                marginLeft: 8,
                color: TURQUOISE,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Add update
            </Text>
          </Pressable>

          <Section title="Business Offerings" />
          <Text style={{ fontSize: 14, color: MUTED, marginBottom: 14, lineHeight: 20 }}>
            Add services or products for any business type — food, legal, medical,
            real estate, beauty, auto, and more.
          </Text>

          {offerings.map((item, index) => (
            <View
              key={item.id}
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: BORDER,
                backgroundColor: CARD,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "800", color: TEXT }}>
                  Offering {index + 1}
                </Text>
                <Pressable onPress={() => removeOffering(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </Pressable>
              </View>

              <Text style={fieldLabelStyle}>Category</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {BUSINESS_OFFERING_CATEGORIES.map((entry) => {
                  const active = item.category === entry.key;

                  return (
                    <Pressable
                      key={entry.key}
                      onPress={() =>
                        updateOffering(item.id, {
                          category: entry.key as BusinessOfferingCategory,
                        })
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? TURQUOISE : BORDER,
                        backgroundColor: active
                          ? "rgba(17,153,142,0.12)"
                          : CARD,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: active ? TURQUOISE : MUTED,
                        }}
                      >
                        {entry.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Field
                label="Title *"
                value={item.title}
                setValue={(text) => updateOffering(item.id, { title: text })}
              />
              <Field
                label="Description"
                value={item.description || ""}
                setValue={(text) => updateOffering(item.id, { description: text })}
                multiline
              />
              <Field
                label="Price"
                value={item.price || ""}
                setValue={(text) => updateOffering(item.id, { price: text })}
                placeholder="e.g. $25 or Starting at $49"
              />
              <Field
                label="Discount %"
                value={
                  item.discountPercent != null ? String(item.discountPercent) : ""
                }
                setValue={(text) => {
                  const trimmed = text.replace(/[^\d]/g, "").trim();
                  updateOffering(item.id, {
                    discountPercent: trimmed
                      ? parseOfferingDiscountPercent(trimmed)
                      : undefined,
                  });
                }}
                keyboardType="numeric"
                placeholder="Optional"
              />

              <Text style={fieldLabelStyle}>Availability</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {BUSINESS_OFFERING_AVAILABILITY.map((entry) => {
                  const active = item.availability === entry.key;

                  return (
                    <Pressable
                      key={entry.key}
                      onPress={() =>
                        updateOffering(item.id, {
                          availability: entry.key as BusinessOfferingAvailability,
                        })
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? TURQUOISE : BORDER,
                        backgroundColor: active
                          ? "rgba(17,153,142,0.12)"
                          : CARD,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: active ? TURQUOISE : MUTED,
                        }}
                      >
                        {entry.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: BORDER,
                  backgroundColor: CARD,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: TEXT }}>
                    Featured
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 13, color: MUTED }}>
                    Highlight this offering on your profile.
                  </Text>
                </View>
                <Switch
                  value={Boolean(item.featured)}
                  onValueChange={(value) =>
                    updateOffering(item.id, { featured: value })
                  }
                  trackColor={{ false: "#D1D5DB", true: "rgba(17,153,142,0.45)" }}
                  thumbColor={item.featured ? TURQUOISE : "#f4f4f5"}
                />
              </View>

              <Text style={labelStyle}>Photo (optional)</Text>
              <Pressable
                onPress={() => pickOfferingImage(item.id)}
                style={{ marginBottom: 4 }}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{
                      width: "100%",
                      height: 120,
                      borderRadius: 14,
                      backgroundColor: BORDER,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      height: 88,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderStyle: "dashed",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: BG,
                    }}
                  >
                    <Ionicons name="image-outline" size={22} color={MUTED} />
                    <Text style={{ marginTop: 6, color: MUTED, fontSize: 13 }}>
                      Add photo
                    </Text>
                  </View>
                )}
              </Pressable>

              {item.image ? (
                <Pressable onPress={() => updateOffering(item.id, { image: "" })}>
                  <Text style={{ color: MUTED, fontSize: 13, fontWeight: "700" }}>
                    Remove photo
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          <Pressable
            onPress={addOffering}
            style={{
              height: 52,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: TURQUOISE,
              backgroundColor: "rgba(17,153,142,0.08)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              marginBottom: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={TURQUOISE} />
            <Text
              style={{
                marginLeft: 8,
                color: TURQUOISE,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Add offering
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              saveBusiness();
            }}
            disabled={saving || deleting}
            style={{
              marginTop: 26,
              height: 62,
              borderRadius: 20,
              backgroundColor: saving ? "#777" : TURQUOISE,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>

          {canDeleteBusiness ? (
            <Pressable
              onPress={confirmDeleteBusiness}
              disabled={saving || deleting}
              style={{
                marginTop: 16,
                marginBottom: 28,
                height: 52,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: "#EF4444",
                backgroundColor: "rgba(239,68,68,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "800" }}>
                {deleting ? "Deleting..." : "Delete Business"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title }: { title: string }) {
  return (
    <Text style={{ marginTop: 28, marginBottom: 12, fontSize: 20, fontWeight: "900", color: TEXT }}>
      {title}
    </Text>
  );
}

function Field({
  label,
  value,
  setValue,
  multiline,
  keyboardType,
  placeholder,
  helperText,
  autoCapitalize,
}: {
  label: string;
  value: string;
  setValue: (text: string) => void;
  multiline?: boolean;
  keyboardType?: any;
  placeholder?: string;
  helperText?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder || label}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          minHeight: multiline ? 110 : 54,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: BORDER,
          backgroundColor: CARD,
          paddingHorizontal: 16,
          paddingTop: multiline ? 14 : 0,
          fontSize: 16,
          color: TEXT,
        }}
      />
      {helperText ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            color: MUTED,
            lineHeight: 18,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const labelStyle = {
  marginBottom: 8,
  fontSize: 15,
  fontWeight: "800" as const,
  color: TEXT,
};

const fieldLabelStyle = {
  marginBottom: 6,
  fontSize: 13,
  fontWeight: "700" as const,
  color: MUTED,
};

const timeInputStyle = {
  height: 48,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: BORDER,
  backgroundColor: CARD,
  paddingHorizontal: 12,
  fontSize: 15,
  color: TEXT,
};

const cameraCover = {
  position: "absolute" as const,
  right: 12,
  bottom: 12,
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: "white",
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

const cameraLogo = {
  position: "absolute" as const,
  right: -2,
  bottom: 2,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "white",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  borderWidth: 1,
  borderColor: BORDER,
};