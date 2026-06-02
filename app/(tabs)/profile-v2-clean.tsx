import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "../../lib/theme";
import authStorage from "../utils/authStorage";

const USER_AVATAR =
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900";

export default function ProfileV2Clean() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkLogin = async () => {
            const tokens = await authStorage.getTokens();
            setIsLoggedIn(!!tokens?.access);
        };

        checkLogin();
    }, []);

    const go = (path: string) => {
        router.push(path as any);
    };

    const MenuItem = ({
        icon,
        title,
        subtitle,
        onPress,
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        subtitle: string;
        onPress: () => void;
    }) => (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}
        >
            <View
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    backgroundColor: "rgba(13,148,136,0.10)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 13,
                }}
            >
                <Ionicons name={icon} size={21} color={theme.colors.turquoise} />
            </View>

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: theme.colors.charcoal,
                    }}
                >
                    {title}
                </Text>
                <Text
                    style={{
                        marginTop: 3,
                        fontSize: 13,
                        color: theme.colors.muted,
                        fontWeight: "600",
                    }}
                >
                    {subtitle}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={21} color={theme.colors.muted} />
        </Pressable>
    ); const StatBox = ({
        value,
        label,
    }: {
        value: string;
        label: string;
    }) => (
        <View
            style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 13,
            }}
        >
            <Text
                style={{
                    fontSize: 20,
                    fontWeight: "900",
                    color: theme.colors.charcoal,
                }}
            >
                {value}
            </Text>

            <Text
                style={{
                    marginTop: 3,
                    fontSize: 12,
                    color: theme.colors.muted,
                    fontWeight: "700",
                }}
            >
                {label}
            </Text>
        </View>
    );

    if (!isLoggedIn) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
                <View
                    style={{
                        flex: 1,
                        padding: 22,
                        justifyContent: "center",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: theme.colors.card,
                            borderRadius: 32,
                            padding: 24,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            ...theme.shadow.medium,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 30,
                                fontWeight: "900",
                                color: theme.colors.charcoal,
                            }}
                        >
                            Welcome to IranianApp
                        </Text>

                        <Text
                            style={{
                                marginTop: 10,
                                fontSize: 15,
                                lineHeight: 23,
                                color: theme.colors.muted,
                            }}
                        >
                            Sign in to manage your listings, favorites, events, and community profile.
                        </Text>

                        <Pressable
                            onPress={() => go("/tabs")}
                            style={{
                                marginTop: 22,
                                height: 54,
                                borderRadius: 18,
                                backgroundColor: theme.colors.turquoise,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
                                Sign In
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => go("/register")}
                            style={{
                                marginTop: 12,
                                height: 54,
                                borderRadius: 18,
                                backgroundColor: "rgba(13,148,136,0.10)",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.colors.turquoise,
                                    fontSize: 16,
                                    fontWeight: "900",
                                }}
                            >
                                Create Account
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    } return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View
                    style={{
                        backgroundColor: theme.colors.turquoise,
                        paddingHorizontal: 22,
                        paddingTop: 24,
                        paddingBottom: 72,
                        borderBottomLeftRadius: 34,
                        borderBottomRightRadius: 34,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    color: "#fff",
                                    fontSize: 28,
                                    fontWeight: "900",
                                }}
                            >
                                Your Profile
                            </Text>

                            <Text
                                style={{
                                    marginTop: 5,
                                    color: "rgba(255,255,255,0.82)",
                                    fontSize: 15,
                                    fontWeight: "600",
                                }}
                            >
                                Your space. Your community.
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => Alert.alert("Settings", "Settings will be connected next.")}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: "rgba(255,255,255,0.18)",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="settings-outline" size={22} color="#fff" />
                        </Pressable>
                    </View>
                </View>

                <View
                    style={{
                        marginHorizontal: 18,
                        marginTop: -48,
                        backgroundColor: theme.colors.card,
                        borderRadius: 30,
                        padding: 18,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        ...theme.shadow.medium,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Image
                            source={{ uri: USER_AVATAR }}
                            style={{
                                width: 92,
                                height: 92,
                                borderRadius: 30,
                                backgroundColor: "#eee",
                                borderWidth: 4,
                                borderColor: "#fff",
                            }}
                        />

                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text
                                style={{
                                    fontSize: 25,
                                    fontWeight: "900",
                                    color: theme.colors.charcoal,
                                }}
                            >
                                Sina Deghati
                            </Text>

                            <Text
                                style={{
                                    marginTop: 4,
                                    color: theme.colors.muted,
                                    fontWeight: "700",
                                }}
                            >
                                San Diego, CA
                            </Text>

                            <View
                                style={{
                                    alignSelf: "flex-start",
                                    marginTop: 10,
                                    backgroundColor: "rgba(13,148,136,0.12)",
                                    borderRadius: 999,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                }}
                            >
                                <Text
                                    style={{
                                        color: theme.colors.turquoise,
                                        fontWeight: "900",
                                        fontSize: 12,
                                    }}
                                >
                                    Community Member
                                </Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={() => Alert.alert("Edit Profile", "Edit profile will be connected next.")}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: "rgba(13,148,136,0.10)",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="pencil" size={18} color={theme.colors.turquoise} />
                        </Pressable>
                    </View>
                </View>        <View
                    style={{
                        flexDirection: "row",
                        marginTop: 18,
                        marginHorizontal: 18,
                        backgroundColor: theme.colors.card,
                        borderRadius: 26,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        ...theme.shadow.soft,
                    }}
                >
                    <StatBox value="12" label="Listings" />
                    <StatBox value="48" label="Favorites" />
                    <StatBox value="5" label="Events" />
                </View>

                <View
                    style={{
                        marginHorizontal: 18,
                        marginTop: 18,
                        backgroundColor: theme.colors.card,
                        borderRadius: 30,
                        padding: 18,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        ...theme.shadow.soft,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 23,
                            fontWeight: "900",
                            color: theme.colors.charcoal,
                            marginBottom: 12,
                        }}
                    >
                        Quick Access
                    </Text>

                    {isLoggedIn ? (
                        <MenuItem
                            icon="grid-outline"
                            title="My Listings"
                            subtitle="Manage your business listings"
                            onPress={() => go("/my-listings")}
                        />
                    ) : null}

                    <MenuItem
                        icon="heart-outline"
                        title="Favorites"
                        subtitle="Saved businesses and places"
                        onPress={() => go("/favorites")}
                    />

                    <MenuItem
                        icon="images-outline"
                        title="Gallery"
                        subtitle="Your uploaded photos and highlights"
                        onPress={() => go("/profile/gallery")}
                    />

                    <MenuItem
                        icon="chatbubble-ellipses-outline"
                        title="Messages"
                        subtitle="Community conversations and chats"
                        onPress={() =>
                            Alert.alert("Messages", "Messaging will be connected later.")
                        }
                    />

                    <MenuItem
                        icon="calendar-outline"
                        title="Events"
                        subtitle="Community events and gatherings"
                        onPress={() =>
                            Alert.alert("Events", "Events page will be connected later.")
                        }
                    />
                </View>

                <View
                    style={{
                        marginHorizontal: 18,
                        marginTop: 18,
                        backgroundColor: theme.colors.card,
                        borderRadius: 30,
                        padding: 18,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        ...theme.shadow.soft,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 23,
                            fontWeight: "900",
                            color: theme.colors.charcoal,
                            marginBottom: 12,
                        }}
                    >
                        Account
                    </Text>

                    <MenuItem
                        icon="person-outline"
                        title="Edit Profile"
                        subtitle="Update your account information"
                        onPress={() =>
                            Alert.alert("Edit Profile", "Edit profile page coming next.")
                        }
                    />

                    <MenuItem
                        icon="shield-checkmark-outline"
                        title="Verification"
                        subtitle="Get verified as a trusted member"
                        onPress={() =>
                            Alert.alert("Verification", "Verification system coming later.")
                        }
                    />

                    <MenuItem
                        icon="settings-outline"
                        title="Settings"
                        subtitle="Notifications, privacy and preferences"
                        onPress={() =>
                            Alert.alert("Settings", "Settings page coming next.")
                        }
                    />

                    <MenuItem
                        icon="log-out-outline"
                        title="Logout"
                        subtitle="Sign out from your account"
                        onPress={() =>
                            Alert.alert("Logout", "Logout action will be connected next.")
                        }
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}