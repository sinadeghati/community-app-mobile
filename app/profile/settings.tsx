import React, { useEffect, useState } from "react";
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
    loadUserSettings,
    saveUserSettings,
} from "./settingsStorage";
import { useTranslation } from "../../lib/i18n";
import type { AppLocale } from "../../lib/i18n";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT = "#E7F6F4";

export default function SettingsScreen() {
    const { t, locale, setLocale, isRTL } = useTranslation();
    const [notifications, setNotifications] = useState(true);
    const [locationVisibility, setLocationVisibility] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            const saved = await loadUserSettings();
            setNotifications(saved.notifications ?? true);
            setLocationVisibility(saved.locationVisibility ?? true);
        };

        loadSettings();
    }, []);

    const persist = async (partial: Parameters<typeof saveUserSettings>[0]) => {
        await saveUserSettings(partial);
    };

    const selectLanguage = async (next: AppLocale) => {
        await setLocale(next);
    };

    const chevronName = "chevron-forward" as const;

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
                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color={TURQUOISE}
                    />
                </Pressable>

                <Text
                    style={{
                        fontSize: 34,
                        fontWeight: "800",
                        color: TEXT,
                        letterSpacing: -0.8,
                        marginBottom: 10,
                        textAlign: isRTL ? "right" : "left",
                    }}
                >
                    {t("settings.title")}
                </Text>

                <Text
                    style={{
                        fontSize: 15.5,
                        lineHeight: 24,
                        color: MUTED,
                        marginBottom: 24,
                        textAlign: isRTL ? "right" : "left",
                    }}
                >
                    {t("settings.subtitle")}
                </Text>

                <View style={cardStyle}>
                    <SettingRow
                        icon="notifications-outline"
                        title={t("settings.notifications")}
                        subtitle={t("settings.notificationsSubtitle")}
                        isRTL={isRTL}
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
                        title={t("settings.locationVisibility")}
                        subtitle={
                            locationVisibility
                                ? t("settings.locationVisible")
                                : t("settings.locationHidden")
                        }
                        isRTL={isRTL}
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

                <Text style={[sectionLabelStyle, { textAlign: isRTL ? "right" : "left" }]}>
                    {t("settings.language")}
                </Text>

                <View style={cardStyle}>
                    <LanguageRow
                        label={t("settings.english")}
                        subtitle={t("settings.englishSubtitle")}
                        selected={locale === "en"}
                        isRTL={isRTL}
                        onPress={() => void selectLanguage("en")}
                    />
                    <Divider />
                    <LanguageRow
                        label={t("settings.persian")}
                        subtitle={t("settings.persianSubtitle")}
                        selected={locale === "fa"}
                        isRTL={isRTL}
                        onPress={() => void selectLanguage("fa")}
                    />
                </View>

                <Text style={[sectionLabelStyle, { textAlign: isRTL ? "right" : "left" }]}>
                    {t("settings.privacy")}
                </Text>

                <View style={cardStyle}>
                    <SettingRow
                        icon="shield-checkmark-outline"
                        title={t("settings.privacySafety")}
                        subtitle={t("settings.privacySafetySubtitle")}
                        isRTL={isRTL}
                        onPress={() => router.push("/profile/privacy")}
                        right={<Chevron name={chevronName} />}
                    />
                </View>

                <Text style={[sectionLabelStyle, { textAlign: isRTL ? "right" : "left" }]}>
                    {t("settings.business")}
                </Text>

                <View style={cardStyle}>
                    <SettingRow
                        icon="business-outline"
                        title={t("settings.businessTools")}
                        subtitle={t("settings.businessToolsSubtitle")}
                        isRTL={isRTL}
                        onPress={() =>
                            showComingSoon(
                                t("settings.businessTools"),
                                "Verification, featured placement, ads, and performance insights are on the roadmap for business owners."
                            )
                        }
                        right={<Chevron name={chevronName} />}
                    />

                    <Divider />

                    <SettingRow
                        icon="card-outline"
                        title={t("settings.billing")}
                        subtitle={t("settings.billingSubtitle")}
                        isRTL={isRTL}
                        onPress={() =>
                            showComingSoon(
                                t("settings.billing"),
                                "Premium subscriptions and business promotion tools will be available in a future release."
                            )
                        }
                        right={<Chevron name={chevronName} />}
                    />
                </View>

                <Text style={[sectionLabelStyle, { textAlign: isRTL ? "right" : "left" }]}>
                    {t("settings.account")}
                </Text>

                <View style={cardStyle}>
                    <SettingRow
                        icon="person-circle-outline"
                        title={t("settings.account")}
                        subtitle={t("settings.accountSubtitle")}
                        isRTL={isRTL}
                        onPress={() => router.push("/profile/account")}
                        right={<Chevron name={chevronName} />}
                    />

                    <Divider />

                    <SettingRow
                        icon="information-circle-outline"
                        title={t("settings.about")}
                        subtitle={t("settings.aboutSubtitle")}
                        isRTL={isRTL}
                        onPress={() => router.push("/profile/about")}
                        right={<Chevron name={chevronName} />}
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
    isRTL,
    onPress,
}: {
    label: string;
    subtitle: string;
    selected: boolean;
    isRTL: boolean;
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
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: TEXT,
                        textAlign: isRTL ? "right" : "left",
                    }}
                >
                    {label}
                </Text>
                <Text
                    style={{
                        fontSize: 13.5,
                        lineHeight: 19,
                        color: MUTED,
                        marginTop: 3,
                        textAlign: isRTL ? "right" : "left",
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
    isRTL,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    right?: React.ReactNode;
    isRTL: boolean;
    onPress?: () => void;
}) {
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
                    marginEnd: 13,
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
                        textAlign: isRTL ? "right" : "left",
                    }}
                >
                    {title}
                </Text>

                <Text
                    style={{
                        fontSize: 13.5,
                        lineHeight: 19,
                        color: MUTED,
                        textAlign: isRTL ? "right" : "left",
                    }}
                >
                    {subtitle}
                </Text>
            </View>

            {right}
        </Pressable>
    );
}

function Chevron({ name }: { name: keyof typeof Ionicons.glyphMap }) {
    return <Ionicons name={name} size={21} color="#9CA3AF" />;
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
    marginStart: 4,
    marginEnd: 4,
};
