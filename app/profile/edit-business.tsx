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
  createEmptyMenuItem,
  sanitizeMenuItemsForSave,
  normalizeMenuItems,
  type BusinessMenuItem,
} from "@/lib/businessMenuItems";
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

export default function EditBusinessProfileScreen() {
  const params = useLocalSearchParams();
  const businessId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessBio, setBusinessBio] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [category, setCategory] = useState("");
  const [menuItems, setMenuItems] = useState<BusinessMenuItem[]>([]);
  const [businessUpdates, setBusinessUpdates] = useState<BusinessUpdate[]>([]);
  const [hoursEnabled, setHoursEnabled] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    createDefaultBusinessHours()
  );

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);

  const businessStorageKey = `profile_v2_${businessId}`;

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
    address: item?.address || item?.street_address || "",
    website: item?.website || "",
    email: item?.email || "",
    instagram: item?.instagram || "",
    category: item?.category || "",
    menu_items: sanitizeMenuItemsForSave(
      normalizeMenuItems(item?.menu_items ?? item?.menuItems)
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
    is_owner: item?.is_owner ?? true,
    owner_is_current_user: item?.owner_is_current_user ?? true,
    can_edit: item?.can_edit ?? true,
  });

  const applyBusinessToForm = (item: any) => {
    const data = normalizeBusiness(item);

    setBusinessName(data.business_name);
    setBusinessBio(data.about);
    setPhone(data.phone);
    setCity(data.city);
    setAddress(data.address);
    setWebsite(data.website);
    setEmail(data.email);
    setInstagram(data.instagram);
    setCategory(data.category);
    setMenuItems(normalizeMenuItems(item?.menu_items ?? item?.menuItems));
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
  };

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        if (!businessId) {
          Alert.alert("Missing business", "Business ID was not found.");
          return;
        }

        const savedRaw = await AsyncStorage.getItem(businessStorageKey);
        if (savedRaw) {
          applyBusinessToForm(JSON.parse(savedRaw));
          return;
        }

        const { getActiveUserId, loadUserBusinesses } = await import(
          "../../lib/userSessionStorage"
        );
        const ownerId = await getActiveUserId();
        const localList = ownerId ? await loadUserBusinesses(ownerId) : [];
        const localBusiness = Array.isArray(localList)
          ? localList.find((b: any) => String(b?.id) === businessId)
          : null;

        if (localBusiness) {
          applyBusinessToForm(localBusiness);
          return;
        }

        if ((API as any)?.getListing) {
          const apiData = await (API as any).getListing(businessId);
          applyBusinessToForm(apiData);
          return;
        }

        Alert.alert("Not found", "Could not find this business.");
      } catch (error) {
        console.log("EDIT BUSINESS LOAD ERROR:", error);
        Alert.alert("Error", "Could not load this business.");
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId]);

  const updateMenuItem = (
    id: string,
    patch: Partial<BusinessMenuItem>
  ) => {
    setMenuItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const addMenuItem = () => {
    setMenuItems((current) => [...current, createEmptyMenuItem()]);
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

  const removeMenuItem = (id: string) => {
    Alert.alert("Remove item", "Delete this service or menu item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setMenuItems((current) => current.filter((item) => item.id !== id));
        },
      },
    ]);
  };

  const pickMenuItemImage = async (id: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled) {
      updateMenuItem(id, { image: result.assets[0].uri });
    }
  };

  const updateDayHours = (key: WeekdayKey, patch: Partial<BusinessDayHours>) => {
    setBusinessHours((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
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

  const saveBusiness = async () => {
    if (!businessId) return;

    try {
      setSaving(true);

      const itemsToSave = sanitizeMenuItemsForSave(menuItems);
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

      const invalidMenuDraft = menuItems.some(
        (item) => !item.title.trim() && (item.description || item.price || item.image)
      );

      if (invalidMenuDraft) {
        Alert.alert(
          "Title required",
          "Each service or menu item needs a title before saving."
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

      const updatedBusiness = normalizeBusiness({
        id: businessId,
        business_name: businessName,
        name: businessName,
        title: businessName,
        description: businessBio,
        about: businessBio,
        phone,
        contact_info: phone,
        city,
        address,
        website,
        email,
        instagram,
        category,
        menu_items: itemsToSave,
        business_updates: updatesToSave,
        business_hours: hoursEnabled
          ? sanitizeBusinessHoursForSave(businessHours)
          : null,
        hours_configured: hoursEnabled,
        cover_image: coverImage,
        logo: logoImage,
        avatar: logoImage,
        profile_image: logoImage,
        is_owner: true,
        owner_is_current_user: true,
        can_edit: true,
      });

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

      Alert.alert("Saved", "Business profile updated.");
      router.replace(`/profile/v2?id=${businessId}` as any);
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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
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
          <Text style={label}>Cover Photo</Text>
          <Pressable onPress={() => pickImage("cover")}>
            <Image
              source={{ uri: coverImage || DEFAULT_COVER }}
              style={{ width: "100%", height: 150, borderRadius: 18, backgroundColor: BORDER }}
            />
            <View style={cameraCover}>
              <Ionicons name="camera" size={18} color={TEXT} />
            </View>
          </Pressable>

          <Text style={[label, { marginTop: 22 }]}>Business Logo</Text>
          <Pressable onPress={() => pickImage("logo")} style={{ alignSelf: "flex-start" }}>
            <Image
              source={{ uri: logoImage || DEFAULT_LOGO }}
              style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: BORDER }}
            />
            <View style={cameraLogo}>
              <Ionicons name="camera" size={16} color={TEXT} />
            </View>
          </Pressable>

          <Section title="Business Information" />
          <Field label="Business Name" value={businessName} setValue={setBusinessName} />
          <Field label="Business Bio" value={businessBio} setValue={setBusinessBio} multiline />
          <Field label="Phone Number" value={phone} setValue={setPhone} keyboardType="phone-pad" />
          <Field label="City" value={city} setValue={setCity} />
          <Field label="Address" value={address} setValue={setAddress} />
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

          <Section title="Business Updates" />
          <Text style={{ fontSize: 14, color: MUTED, marginBottom: 14, lineHeight: 20 }}>
            Share specials, offers, events, and announcements with your community.
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

              <Text style={label}>Image (optional)</Text>
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

          <Section title="Services / Menu Items" />
          <Text style={{ fontSize: 14, color: MUTED, marginBottom: 14, lineHeight: 20 }}>
            Add services, menu items, or offerings customers can browse on your profile.
          </Text>

          {menuItems.map((item, index) => (
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
                  Item {index + 1}
                </Text>
                <Pressable onPress={() => removeMenuItem(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </Pressable>
              </View>

              <Field
                label="Title *"
                value={item.title}
                setValue={(text) => updateMenuItem(item.id, { title: text })}
              />
              <Field
                label="Description"
                value={item.description || ""}
                setValue={(text) => updateMenuItem(item.id, { description: text })}
                multiline
              />
              <Field
                label="Price"
                value={item.price || ""}
                setValue={(text) => updateMenuItem(item.id, { price: text })}
                placeholder="e.g. $25 or Starting at $49"
              />

              <Text style={label}>Photo (optional)</Text>
              <Pressable
                onPress={() => pickMenuItemImage(item.id)}
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
                <Pressable onPress={() => updateMenuItem(item.id, { image: "" })}>
                  <Text style={{ color: MUTED, fontSize: 13, fontWeight: "700" }}>
                    Remove photo
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          <Pressable
            onPress={addMenuItem}
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
              Add service / menu item
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              saveBusiness();
            }}
            disabled={saving}
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
}: {
  label: string;
  value: string;
  setValue: (text: string) => void;
  multiline?: boolean;
  keyboardType?: any;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder || label}
        keyboardType={keyboardType}
        multiline={multiline}
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
    </View>
  );
}

const label = {
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