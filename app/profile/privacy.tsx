import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { showComingSoon } from "./comingSoon";
import { loadUserSettings, saveUserSettings } from "./settingsStorage";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT = "#E7F6F4";

export default function PrivacySafetyScreen() {
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [locationVisibility, setLocationVisibility] = useState(true);

  useEffect(() => {
    const load = async () => {
      const saved = await loadUserSettings();
      setProfileVisibility(saved.profileVisibility ?? true);
      setLocationVisibility(saved.locationVisibility ?? true);
    };
    load();
  }, []);

  const persist = async (
    partial: Partial<{
      profileVisibility: boolean;
      locationVisibility: boolean;
    }>
  ) => {
    await saveUserSettings(partial);
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
            marginBottom: 8,
          }}
        >
          Privacy & Safety
        </Text>

        <Text
          style={{
            fontSize: 15.5,
            lineHeight: 24,
            color: MUTED,
            marginBottom: 24,
          }}
        >
          Control what others see and manage safety options. Preferences are saved on
          this device.
        </Text>

        <Text style={sectionLabelStyle}>Visibility</Text>

        <View style={cardStyle}>
          <PrivacyToggleRow
            icon="eye-outline"
            title="Profile Visibility"
            subtitle={
              profileVisibility
                ? "Your profile can be viewed by the community"
                : "Profile details hidden from public view (local preference)"
            }
            value={profileVisibility}
            onValueChange={(value) => {
              setProfileVisibility(value);
              persist({ profileVisibility: value });
            }}
          />

          <Divider />

          <PrivacyToggleRow
            icon="location-outline"
            title="Location Visibility"
            subtitle={
              locationVisibility
                ? "Show city on profile — never your exact address"
                : "Hide city from your public profile"
            }
            value={locationVisibility}
            onValueChange={(value) => {
              setLocationVisibility(value);
              persist({ locationVisibility: value });
            }}
          />
        </View>

        <Text style={sectionLabelStyle}>Safety & moderation</Text>

        <View style={cardStyle}>
          <PrivacyRow
            icon="ban-outline"
            title="Blocked Users"
            subtitle="View and manage blocked accounts"
            onPress={() =>
              showComingSoon(
                "Blocked Users",
                "You'll be able to review and manage blocked accounts from this screen soon."
              )
            }
          />

          <Divider />

          <PrivacyRow
            icon="flag-outline"
            title="Reports"
            subtitle="Review reports and safety actions"
            onPress={() =>
              showComingSoon(
                "Reports",
                "Report history and moderation tools will be added in a future update."
              )
            }
          />
        </View>

        <View style={cardStyle}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: TEXT, marginBottom: 8 }}>
            Safety note
          </Text>

          <Text style={{ fontSize: 14.5, lineHeight: 22, color: MUTED }}>
            IranianApp is designed to keep precise location private. Other members should
            see only your city or general area when location visibility is on—never a
            street address unless you choose to share it elsewhere.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View
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
          marginRight: 14,
        }}
      >
        <Ionicons name={icon} size={21} color={TURQUOISE} />
      </View>

      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: TEXT }}>{title}</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: MUTED, marginTop: 3 }}>
          {subtitle}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: "#BFE8E3", false: "#DDD" }}
        thumbColor={value ? TURQUOISE : "#FFF"}
      />
    </View>
  );
}

function PrivacyRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
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
          marginRight: 14,
        }}
      >
        <Ionicons name={icon} size={21} color={TURQUOISE} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: TEXT }}>{title}</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: MUTED, marginTop: 3 }}>
          {subtitle}
        </Text>
      </View>

      {onPress ? <Ionicons name="chevron-forward" size={22} color="#9CA3AF" /> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: BORDER, marginLeft: 56 }} />;
}

const cardStyle = {
  backgroundColor: CARD,
  borderRadius: 26,
  padding: 18,
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
