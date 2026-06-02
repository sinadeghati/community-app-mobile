import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT = "#E7F6F4";

const DEFAULT_AVATAR =
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900";

type UserProfile = {
    name?: string;
    username?: string;
    email?: string;
    bio?: string;
    city?: string;
    phone?: string;
    instagram?: string;
    profileImage?: string | null;
    profile_image?: string | null;
};

export default function EditProfileV2() {
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [city, setCity] = useState("");
    const [phone, setPhone] = useState("");
    const [instagram, setInstagram] = useState("");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSavedProfile();
    }, []);

    const loadSavedProfile = async () => {
        try {
            const raw = await AsyncStorage.getItem("user_profile_v2");

            if (!raw) return;

            const saved: UserProfile = JSON.parse(raw);

            setDisplayName(saved.name || saved.username || "");
            setUsername(saved.username || "");
            setEmail(saved.email || "");
            setBio(saved.bio || "");
            setCity(saved.city || "");
            setPhone(saved.phone || "");
            setInstagram(saved.instagram || "");
            setProfileImage(saved.profileImage || saved.profile_image || null);
        } catch (error) {
            console.log("EDIT PROFILE LOAD ERROR:", error);
        }
    };

    const pickProfileImage = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    "Permission needed",
                    "Please allow photo access to change your profile photo."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.85,
            });

            if (!result.canceled && result.assets?.[0]?.uri) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log("PICK PROFILE IMAGE ERROR:", error);
            Alert.alert("Error", "Could not open your photo library.");
        }
    };

    const saveProfile = async () => {
        try {
            setSaving(true);

            const oldRaw = await AsyncStorage.getItem("user_profile_v2");
            const oldProfile: UserProfile = oldRaw ? JSON.parse(oldRaw) : {};

            const updatedProfile: UserProfile = {
                ...oldProfile,

                name: displayName,
                username: username || oldProfile.username || displayName,
                email: email || oldProfile.email || "",

                bio,
                city,
                phone,
                instagram,

                profileImage,
                profile_image: profileImage,
            };

            await AsyncStorage.setItem(
                "user_profile_v2",
                JSON.stringify(updatedProfile)
            );

            const verifySave = await AsyncStorage.getItem("user_profile_v2");
            console.log("VERIFY SAVED USER PROFILE:", verifySave);

            Alert.alert("Saved", "Your profile has been updated.", [
                {
                    text: "OK",
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.log("EDIT PROFILE SAVE ERROR:", error);
            Alert.alert("Error", "Could not save your profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            paddingHorizontal: 22,
                            paddingTop: 18,
                            paddingBottom: 90,
                        }}
                    >
                        <Pressable
                            onPress={() => router.back()}
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: 21,
                                backgroundColor: CARD,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 1,
                                borderColor: BORDER,
                                marginBottom: 24,
                            }}
                        >
                            <Ionicons name="arrow-back" size={22} color={TURQUOISE} />
                        </Pressable>

                        <Text
                            style={{
                                fontSize: 34,
                                fontWeight: "800",
                                color: TEXT,
                                letterSpacing: -0.8,
                                marginBottom: 8,
                            }}
                        >
                            Edit Profile
                        </Text>

                        <Text
                            style={{
                                fontSize: 15.5,
                                lineHeight: 24,
                                color: MUTED,
                                marginBottom: 24,
                            }}
                        >
                            Update your personal profile, photo, and contact details.
                        </Text>

                        <View
                            style={{
                                backgroundColor: CARD,
                                borderRadius: 26,
                                padding: 22,
                                borderWidth: 1,
                                borderColor: BORDER,
                                marginBottom: 18,
                                alignItems: "center",
                            }}
                        >
                            <Pressable onPress={pickProfileImage}>
                                <Image
                                    source={{ uri: profileImage || DEFAULT_AVATAR }}
                                    style={{
                                        width: 108,
                                        height: 108,
                                        borderRadius: 54,
                                        backgroundColor: BORDER,
                                    }}
                                />

                                <View
                                    style={{
                                        position: "absolute",
                                        right: 0,
                                        bottom: 2,
                                        width: 34,
                                        height: 34,
                                        borderRadius: 17,
                                        backgroundColor: TURQUOISE,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 3,
                                        borderColor: CARD,
                                    }}
                                >
                                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                                </View>
                            </Pressable>

                            <Pressable
                                onPress={pickProfileImage}
                                style={{
                                    marginTop: 16,
                                    height: 40,
                                    paddingHorizontal: 22,
                                    borderRadius: 20,
                                    backgroundColor: SOFT,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color: TURQUOISE,
                                        fontSize: 14.5,
                                        fontWeight: "800",
                                    }}
                                >
                                    Change Photo
                                </Text>
                            </Pressable>
                        </View>

                        <View
                            style={{
                                backgroundColor: CARD,
                                borderRadius: 26,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: BORDER,
                            }}
                        >
                            <Field
                                label="Display Name"
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Your name"
                            />

                            <Field
                                label="Username"
                                value={username}
                                onChangeText={setUsername}
                                placeholder="username"
                                autoCapitalize="none"
                            />

                            <Field
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="email@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Field
                                label="Bio"
                                value={bio}
                                onChangeText={setBio}
                                multiline
                                placeholder="Tell the community a little about yourself"
                            />

                            <Field
                                label="City"
                                value={city}
                                onChangeText={setCity}
                                placeholder="San Diego"
                            />

                            <Field
                                label="Phone Number"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+1 (619) 000-0000"
                                keyboardType="phone-pad"
                            />

                            <Field
                                label="Instagram"
                                value={instagram}
                                onChangeText={setInstagram}
                                placeholder="@username"
                                autoCapitalize="none"
                            />

                            <Pressable
                                onPress={saveProfile}
                                disabled={saving}
                                style={{
                                    height: 56,
                                    borderRadius: 18,
                                    backgroundColor: saving ? "#BDBDBD" : TURQUOISE,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: 8,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontSize: 17,
                                        fontWeight: "800",
                                    }}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function Field({
    label,
    value,
    onChangeText,
    multiline,
    placeholder,
    keyboardType,
    autoCapitalize,
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    placeholder?: string;
    keyboardType?: any;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text
                style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: TEXT,
                    marginBottom: 8,
                }}
            >
                {label}
            </Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder || label}
                placeholderTextColor="#9CA3AF"
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                textAlignVertical={multiline ? "top" : "center"}
                style={{
                    minHeight: multiline ? 108 : 54,
                    borderRadius: 17,
                    borderWidth: 1,
                    borderColor: BORDER,
                    backgroundColor: "#FAFAFA",
                    paddingHorizontal: 15,
                    paddingTop: multiline ? 14 : 0,
                    paddingBottom: multiline ? 14 : 0,
                    fontSize: 15.5,
                    color: TEXT,
                }}
            />
        </View>
    );
}