import React, { useEffect, useState } from "react";
import {
    Alert,
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
import {
    getActiveUserId,
    loadUserProfile,
    mergeProfileWithApi,
    saveUserProfile,
} from "../../lib/userSessionStorage";
import { fetchAccountProfile, ProfileApiError } from "../../lib/profileApi";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";

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

    useFocusEffect(
        React.useCallback(() => {
            loadSavedProfile();
        }, [])
    );

    const loadSavedProfile = async () => {
        try {
            const userId = await getActiveUserId();
            if (!userId) return;

            const savedRecord = await loadUserProfile(userId);
            if (!savedRecord) return;

            const saved = savedRecord as UserProfile;

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

    const saveProfile = async () => {
        try {
            setSaving(true);

            const userId = await getActiveUserId();
            if (!userId) {
                Alert.alert("Login required", "Please log in to save your profile.");
                return;
            }

            const oldRecord = await loadUserProfile(userId);
            const oldProfile: UserProfile = (oldRecord || {}) as UserProfile;

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

            await saveUserProfile(userId, updatedProfile as Record<string, unknown>);

            const apiData = await fetchAccountProfile();
            const merged = mergeProfileWithApi(
                updatedProfile as Record<string, unknown>,
                apiData
            );
            await saveUserProfile(userId, merged);

            Alert.alert("Saved", "Your profile has been updated.", [
                {
                    text: "OK",
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.log("EDIT PROFILE SAVE ERROR:", error);
            if (error instanceof ProfileApiError) {
                Alert.alert(
                    "Could not verify profile",
                    `${error.message}\n\nYour edits are saved on this device. Fix sign-in and try again.`,
                    [{ text: "Keep editing" }]
                );
                return;
            }
            Alert.alert("Error", "Could not save your profile.", [
                { text: "Keep editing" },
            ]);
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
                            Update your name, bio, location, and contact details.
                            Change your photo from the Profile screen.
                        </Text>

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