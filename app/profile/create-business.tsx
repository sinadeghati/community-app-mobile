import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    Alert,
    Modal,
    Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    getActiveUserId,
    loadUserProfile,
    upsertUserBusiness,
} from "../../lib/userSessionStorage";
import * as ImagePicker from "expo-image-picker";

const CATEGORIES = [
    "Food",
    "Beauty",
    "Auto",
    "Home Services",
    "Real Estate",
    "Events",
    "Professional Services",
    "Health & Wellness",
    "Education",
    "Retail",
    "Other",
];

export default function CreateBusiness() {
    const [businessName, setBusinessName] = useState("");
    const [category, setCategory] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("CA");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [instagram, setInstagram] = useState("");
    const [website, setWebsite] = useState("");
    const [description, setDescription] = useState("");
    const [showCategories, setShowCategories] = useState(false);
    const [logoImage, setLogoImage] = useState<string | null>(null);

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

    const handleCreate = async () => {
        console.log("CREATE BUTTON PRESSED");
        if (!businessName || !category || !city || !phone) {
            Alert.alert(
                "Missing info",
                "Please fill out business name, category, city, and phone."
            );
            return;
        }

        const businessId = Date.now().toString();

        const ownerId = await getActiveUserId();
        const ownerProfile = ownerId ? await loadUserProfile(ownerId) : null;
        const ownerUsername = String(ownerProfile?.username || "").trim();
        const ownerEmail = String(ownerProfile?.email || "").trim();

        const businessData = {
            id: businessId,
            business_name: businessName,
            name: businessName,
            category,
            business_category: category,
            city,
            state,
            phone,
            contact_info: phone,
            address,
            instagram,
            website,
            description,
            about: description,
            logo: logoImage,
            avatar: logoImage,
            profile_image: logoImage,
            is_owner: true,
            owner_is_current_user: true,
            can_edit: true,
            owner_id: ownerId ?? undefined,
            user_id: ownerId ?? undefined,
            owner_username: ownerUsername || undefined,
            ownerUsername: ownerUsername || undefined,
            owner_email: ownerEmail || undefined,
            ownerEmail: ownerEmail || undefined,
            created_by: ownerId ?? ownerEmail ?? ownerUsername ?? undefined,
            createdBy: ownerId ?? ownerEmail ?? ownerUsername ?? undefined,
        };

        const profileStorageKey = `profile_v2_${businessId}`;

        console.log("BUSINESS_STORAGE_WRITE", {
            writer: "create-business.tsx",
            targetKey: profileStorageKey,
            userId: ownerId,
            ownerUsername,
            ownerEmail,
            businessId,
            name: businessName,
        });

        await AsyncStorage.setItem(profileStorageKey, JSON.stringify(businessData));

        if (ownerId) {
            await upsertUserBusiness(ownerId, businessData, ownerUsername);
        }

        console.log("BUSINESS DATA:", businessData);
        console.log("LOCAL BUSINESSES SAVED:", businessData);

        Alert.alert("Business created", "Your business profile has been created.", [
            {
                text: "View Profile",
                onPress: () => router.replace(`/profile/v2?id=${businessId}`),
            },
        ]);
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "#F7F4EE" }}
            contentContainerStyle={{ padding: 24, paddingTop: 68, paddingBottom: 44 }}
            keyboardShouldPersistTaps="handled"
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

                <Input
                    icon="location-outline"
                    label="City *"
                    value={city}
                    onChangeText={setCity}
                    placeholder="San Diego"
                />

                <Input
                    icon="map-outline"
                    label="State *"
                    value={state}
                    onChangeText={setState}
                    placeholder="CA"
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
                    icon="pin-outline"
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Street address, optional"
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

                <Pressable
                    style={{
                        marginTop: 8,
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
                    onPress={handleCreate}
                    style={{
                        marginTop: 24,
                        height: 60,
                        borderRadius: 20,
                        backgroundColor: "#11998E",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>
                        Create Business Profile
                    </Text>
                </Pressable>
            </View>

            <CategoryModal
                visible={showCategories}
                onClose={() => setShowCategories(false)}
                onSelect={(item) => {
                    setCategory(item);
                    setShowCategories(false);
                }}
            />
        </ScrollView>
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

                    {CATEGORIES.map((item) => (
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