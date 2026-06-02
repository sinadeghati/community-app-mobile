import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { API } from "@/lib/api";

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
  const [services, setServices] = useState("");

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
    services: item?.services || "",
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
    setServices(data.services);
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

        const localRaw = await AsyncStorage.getItem("my_local_businesses");
        const localList = localRaw ? JSON.parse(localRaw) : [];
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
        services,
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

      const localRaw = await AsyncStorage.getItem("my_local_businesses");
      const localList = localRaw ? JSON.parse(localRaw) : [];

      const nextList = Array.isArray(localList)
        ? localList.some((b: any) => String(b?.id) === businessId)
          ? localList.map((b: any) =>
              String(b?.id) === businessId ? { ...b, ...updatedBusiness } : b
            )
          : [...localList, updatedBusiness]
        : [updatedBusiness];

      await AsyncStorage.setItem("my_local_businesses", JSON.stringify(nextList));

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
          <Field label="Business Services" value={services} setValue={setServices} multiline />

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
}: {
  label: string;
  value: string;
  setValue: (text: string) => void;
  multiline?: boolean;
  keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={label}
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