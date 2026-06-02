import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Pressable,
    Switch,
    Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT = "#E7F6F4";

export default function SettingsScreen() {
    const [notifications, setNotifications] = useState(true);
    const [locationVisibility, setLocationVisibility] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const raw = await AsyncStorage.getItem("user_settings_v1");

                if (!raw) return;

                const saved = JSON.parse(raw);

                setNotifications(saved.notifications ?? true);
                setLocationVisibility(saved.locationVisibility ?? true);
            } catch (error) {
                console.log("SETTINGS LOAD ERROR:", error);
            }
        };

        loadSettings();
    }, []);

    const saveSetting = async (key: string, value: boolean) => {
        try {
            const raw = await AsyncStorage.getItem("user_settings_v1");
            const current = raw ? JSON.parse(raw) : {};

            const updated = {
                ...current,
                [key]: value,
            };

            await AsyncStorage.setItem(
                "user_settings_v1",
                JSON.stringify(updated)
            );
        } catch (error) {
            console.log("SETTINGS SAVE ERROR:", error);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingTop: 22,
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
                        marginBottom: 10,
                    }}
                >
                    Settings
                </Text>

                <Text
                    style={{
                        fontSize: 15.5,
                        lineHeight: 24,
                        color: MUTED,
                        marginBottom: 24,
                    }}
                >
                    Manage your app preferences, privacy, notifications, and account
                    options.
                </Text>

                <View style={cardStyle}>
                    <SettingRow
                        icon="notifications-outline"
                        title="Notifications"
                        subtitle="Business updates, messages, and events"
                        right={
                            <Switch
                                value={notifications}
                                onValueChange={(value) => {
                                    setNotifications(value);
                                    saveSetting("notifications", value);
                                }}
                            />
                        }
                    />

                    <Divider />

                    <SettingRow
                        icon="location-outline"
                        title="Location Visibility"
                        subtitle="Control how your city or area appears"
                        right={
                            <Switch
                                value={locationVisibility}

                                onValueChange={(value) => {
                                    setLocationVisibility(value);
                                    saveSetting("locationVisibility", value);
                                }}

                                trackColor={{ true: "#BFE8E3", false: "#DDD" }}
                                thumbColor={locationVisibility ? TURQUOISE : "#FFF"}
                            />
                        }
                    />

                    <Divider />

                    <SettingRow
                        icon="language-outline"
                        title="Language"
                        subtitle="English now, Persian support later"

                        onPress={() =>
                            Alert.alert(
                                "Language",
                                "English is active now. Persian support will be added in the next version."
                            )
                        }
                        right={<Chevron />}
                    />

                    <Divider />

                    <SettingRow
                        icon="shield-checkmark-outline"
                        title="Privacy & Safety"
                        subtitle="Blocked users, reports, and visibility"

                        onPress={() => router.push("/profile/privacy")}


                        right={<Chevron />}
                    />
                </View>

                <View style={cardStyle}>
                    <SettingRow
                        icon="business-outline"
                        title="Business Tools"
                        subtitle="Verification, visibility, ads, and performance"
                        onPress={() =>
                            Alert.alert(
                                "Business Tools",
                                "Business tools will include verification, profile visibility, featured placement, ads, and performance insights."
                            )
                        }
                        right={<Chevron />}
                    />

                    <Divider />

                    <SettingRow
                        icon="card-outline"
                        title="Billing & Plans"
                        subtitle="Future subscriptions and promotions"
                        onPress={() =>
                            Alert.alert(
                                "Billing & Plans",
                                "Premium subscriptions, featured ads, and business promotion tools will be available in future updates."
                            )
                        }
                        right={<Chevron />}
                    />
                </View>

                <View style={cardStyle}>
                    <SettingRow
                        icon="person-circle-outline"
                        title="Account"
                        subtitle="Profile, security, and login settings"
                        onPress={() =>
                            router.push("/profile/account")}
                        right={<Chevron />}
                    />

                    <Divider />

                    <SettingRow
                        icon="information-circle-outline"
                        title="About IranianApp"
                        subtitle="Version, support, and legal information"
                        onPress={() =>
                            Alert.alert(
                                "About IranianApp",
                                "IranianApp is a Persian community platform focused on businesses, events, services, and local discovery."
                            )
                        }
                        right={<Chevron />}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function SettingRow({
    icon,
    title,
    subtitle,
    right,
    onPress,
}: any) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
            }}
        >
            <View
                style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: SOFT,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 13,
                }}
            >
                <Ionicons name={icon} size={21} color={TURQUOISE} />
            </View>

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: TEXT,
                        marginBottom: 3,
                    }}
                >
                    {title}
                </Text>

                <Text
                    style={{
                        fontSize: 13.5,
                        lineHeight: 19,
                        color: MUTED,
                    }}
                >
                    {subtitle}
                </Text>
            </View>

            {right}
        </Pressable>
    );
}

function Chevron() {
    return <Ionicons name="chevron-forward" size={21} color="#9CA3AF" />;
}

function Divider() {
    return (
        <View
            style={{
                height: 1,
                backgroundColor: BORDER,
                marginLeft: 55,
            }}
        />
    );
}

const cardStyle = {
    backgroundColor: CARD,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 18,
};