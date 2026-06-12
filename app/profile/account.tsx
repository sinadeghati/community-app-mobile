import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { showComingSoon } from "./comingSoon";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT = "#E7F6F4";

export default function AccountScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 22,
          paddingBottom: 100,
        }}
      >
        {/* Back */}
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

        {/* Header */}
        <Text
          style={{
            fontSize: 34,
            fontWeight: "800",
            color: TEXT,
            letterSpacing: -0.8,
            marginBottom: 8,
          }}
        >
          Account
        </Text>

        <Text
          style={{
            fontSize: 15.5,
            lineHeight: 24,
            color: MUTED,
            marginBottom: 24,
          }}
        >
          Manage your profile, security, password,
          and account settings.
        </Text>

        {/* Profile Info */}
        <View style={cardStyle}>
          <AccountRow
            icon="person-outline"
            title="Profile Information"
            subtitle="Update your name, username, bio, and profile photo"
            onPress={() =>
              router.push("/profile/edit-v2")
            }
          />

          <Divider />

          <AccountRow
            icon="mail-outline"
            title="Email Address"
            subtitle="Email management and verification"
            onPress={() =>
              showComingSoon(
                "Email management",
                "You'll be able to update and verify your email address from this screen in a future release."
              )
            }
          />

          <Divider />

          <AccountRow
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update and secure your password"
            onPress={() => router.push("/profile/change-password")}
          />
        </View>

        {/* Security */}
        <View style={cardStyle}>
          <AccountRow
            icon="shield-checkmark-outline"
            title="Login & Security"
            subtitle="Device sessions and account protection"
            onPress={() =>
              showComingSoon(
                "Login & Security",
                "Session management, two-factor authentication, and device controls are planned for a future release."
              )
            }
          />

          <Divider />

          <AccountRow
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently remove your account"
            onPress={() =>
              showComingSoon(
                "Delete Account",
                "Permanent account deletion will require confirmation and verification. This feature is not yet available in the MVP."
              )
            }
          />
        </View>

        {/* Note */}
        <View style={cardStyle}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: TEXT,
              marginBottom: 8,
            }}
          >
            Security Note
          </Text>

          <Text
            style={{
              fontSize: 14.5,
              lineHeight: 22,
              color: MUTED,
            }}
          >
            IranianApp should protect user identity,
            passwords, and personal information with
            secure authentication and privacy controls.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountRow({
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
        <Ionicons
          name={icon}
          size={21}
          color={TURQUOISE}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: TEXT,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            color: MUTED,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={22}
          color="#9CA3AF"
        />
      ) : null}
    </Pressable>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: BORDER,
        marginLeft: 56,
      }}
    />
  );
}

const cardStyle = {
  backgroundColor: CARD,
  borderRadius: 26,
  padding: 18,
  borderWidth: 1,
  borderColor: BORDER,
  marginBottom: 18,
};