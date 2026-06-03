import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Pressable,
    Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { showComingSoon } from "./comingSoon";
import {
    AppLanguage,
    loadUserSettings,
    saveUserSettings,
} from "./settingsStorage";

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
    const [language, setLanguage] = useState<AppLanguage>("en");

    useEffect(() => {
        const loadSettings = async () => {
            const saved = await loadUserSettings();
            setNotifications(saved.notifications ?? true);
            setLocationVisibility(saved.locationVisibility ?? true);
            setLanguage(saved.language === "fa-preview" ? "fa-preview" : "en");
        };

        loadSettings();
    }, []);

    const persist = async (partial: Parameters<typeof saveUserSettings>[0]) => {
        await saveUserSettings(partial);
    };

    const selectLanguage = async (next: AppLanguage) => {
        if (next === "fa-preview") {
            showComingSoon(
                "Persian language",
                "Persian (Farsi) is in preview. Your preference will be saved, and the app will continue in English until this feature launches."
            );
            setLanguage("fa-preview");
            await persist({ language: "fa-preview" });
            return;
        }

        setLanguage("en");
        await persist({ language: "en" });
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
                                    persist({ notifications: value });
                                }}
                                trackColor={{ true: "#BFE8E3", false: "#DDD" }}
                                thumbColor={notifications ? TURQUOISE : "#FFF"}
                            />
                        }
                    />

                    <Divider />

                    <SettingRow
                        icon="location-outline"
                        title="Location Visibility"
                        subtitle={
                            locationVisibility
                                ? "Your city may appear on your profile"
                                : "City hidden from your public profile"
                        }
                        right={
                            <Switch
                                value={locationVisibility}
                                onValueChange={(value) => {
                                    setLocationVisibility(value);
                                    persist({ locationVisibility: value });
                                }}
                                trackColor={{ true: "#BFE8E3", false: "#DDD" }}
                                thumbColor={locationVisibility ? TURQUOISE : "#FFF"}
                            />
                        }
                    />
                </View>

                <Text style={sectionLabelStyle}>Language</Text>

                <View style={cardStyle}>
                    <LanguageRow
                        label="English"
                        subtitle="Active · app UI in English"
                        selected={language === "en"}
                        onPress={() => selectLanguage("en")}
                    />
                    <Divider />
                    <LanguageRow
                        label="Persian (Farsi)"
                        subtitle="Preview · Coming soon"
                        selected={language === "fa-preview"}
                        comingSoon
                        onPress={() => selectLanguage("fa-preview")}
                    />
                </View>

                <Text style={sectionLabelStyle}>Privacy</Text>

                <View style={cardStyle}>
                    <SettingRow
                        icon="shield-checkmark-outline"
                        title="Privacy & Safety"
                        subtitle="Visibility, blocked users, and reports"
                        onPress={() => router.push("/profile/privacy")}
                        right={<Chevron />}
                    />
                </View>

                <Text style={sectionLabelStyle}>Business</Text>

                <View style={cardStyle}>
                    <SettingRow
                        icon="business-outline"
                        title="Business Tools"
                        subtitle="Verification, visibility, and insights"
                        onPress={() =>
                            showComingSoon(
                                "Business Tools",
                                "Verification, featured placement, ads, and performance insights are on the roadmap for business owners."
                            )
                        }
                        right={<Chevron />}
                    />

                    <Divider />

                    <SettingRow
                        icon="card-outline"
                        title="Billing & Plans"
                        subtitle="Subscriptions and promotions"
                        onPress={() =>
                            showComingSoon(
                                "Billing & Plans",
                                "Premium subscriptions and business promotion tools will be available in a future release."
                            )
                        }
                        right={<Chevron />}
                    />
                </View>

                <Text style={sectionLabelStyle}>Account</Text>

                <View style={cardStyle}>
                    <SettingRow
                        icon="person-circle-outline"
                        title="Account"
                        subtitle="Profile, security, and login settings"
                        onPress={() => router.push("/profile/account")}
                        right={<Chevron />}
                    />

                    <Divider />

                    <SettingRow
                        icon="information-circle-outline"
                        title="About IranianApp"
                        subtitle="Version, mission, and support"
                        onPress={() => router.push("/profile/about")}
                        right={<Chevron />}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function LanguageRow({
    label,
    subtitle,
    selected,
    comingSoon,
    onPress,
}: {
    label: string;
    subtitle: string;
    selected: boolean;
    comingSoon?: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
            }}
        >
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: TEXT }}>
                        {label}
                    </Text>
                    {comingSoon ? (
                        <View
                            style={{
                                backgroundColor: SOFT,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 999,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontWeight: "800",
                                    color: TURQUOISE,
                                }}
                            >
                                COMING SOON
                            </Text>
                        </View>
                    ) : null}
                </View>
                <Text
                    style={{
                        fontSize: 13.5,
                        lineHeight: 19,
                        color: MUTED,
                        marginTop: 3,
                    }}
                >
                    {subtitle}
                </Text>
            </View>

            {selected ? (
                <Ionicons name="checkmark-circle" size={24} color={TURQUOISE} />
            ) : (
                <View
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: BORDER,
                    }}
                />
            )}
        </Pressable>
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
            disabled={!onPress && !right}
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

const sectionLabelStyle = {
    fontSize: 13,
    fontWeight: "800" as const,
    color: MUTED,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
    marginBottom: 10,
    marginLeft: 4,
};
