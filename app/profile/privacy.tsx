import React from "react";
import { SafeAreaView, ScrollView, Text, View, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT = "#E7F6F4";

export default function PrivacySafetyScreen() {
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
          Manage visibility, blocked users, reports, and safety controls.
        </Text>

        <View style={cardStyle}>
          <PrivacyRow
            icon="eye-outline"
            title="Profile Visibility"
            subtitle="Control what others can see on your profile"
          />

          <Divider />

          <PrivacyRow
            icon="location-outline"
            title="Location Visibility"
            subtitle="Show city only, never your exact address"
          />

          <Divider />

          <PrivacyRow
            icon="ban-outline"
            title="Blocked Users"
            subtitle="View and manage blocked accounts"
            onPress={() =>
              Alert.alert("Blocked Users", "Blocked users list will be connected later.")
            }
          />

          <Divider />

          <PrivacyRow
            icon="flag-outline"
            title="Reports"
            subtitle="Review reports and safety actions"
            onPress={() =>
              Alert.alert("Reports", "Report management will be connected later.")
            }
          />
        </View>

        <View style={cardStyle}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: TEXT, marginBottom: 8 }}>
            Safety note
          </Text>

          <Text style={{ fontSize: 14.5, lineHeight: 22, color: MUTED }}>
            IranianApp should keep personal location private. Public users should see only city
            or general area unless the user chooses otherwise.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
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
        <Text style={{ fontSize: 16, fontWeight: "800", color: TEXT }}>
          {title}
        </Text>
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