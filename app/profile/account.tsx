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
import { confirmDeleteAccount } from "../../lib/accountActions";
import { showComingSoon } from "./comingSoon";
import { useTranslation } from "../../lib/i18n";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT = "#E7F6F4";

export default function AccountScreen() {
  const { t, isRTL } = useTranslation();
  const textAlign = isRTL ? "right" : "left";

  const handleDeleteAccount = () =>
    confirmDeleteAccount({
      title: t("account.deleteAccount"),
      message: t("account.deleteAccountConfirm"),
      cancelLabel: t("common.cancel"),
      confirmLabel: t("account.deleteAccount"),
      finalConfirmMessage: t("account.deleteAccountFinalConfirm"),
      successTitle: t("account.deleteAccountSuccessTitle"),
      successMessage: t("account.deleteAccountSuccessMessage"),
      unavailableTitle: t("account.deleteAccountUnavailableTitle"),
      unavailableMessage: t("account.deleteAccountUnavailableMessage"),
      errorTitle: t("account.deleteAccountErrorTitle"),
    });

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
            textAlign,
          }}
        >
          {t("account.title")}
        </Text>

        <Text
          style={{
            fontSize: 15.5,
            lineHeight: 24,
            color: MUTED,
            marginBottom: 24,
            textAlign,
          }}
        >
          {t("account.subtitle")}
        </Text>

        <View style={cardStyle}>
          <AccountRow
            icon="person-outline"
            title={t("account.profileInfo")}
            subtitle={t("account.profileInfoSubtitle")}
            textAlign={textAlign}
            onPress={() => router.push("/profile/edit-v2")}
          />

          <Divider />

          <AccountRow
            icon="mail-outline"
            title={t("account.emailAddress")}
            subtitle={t("account.emailSubtitle")}
            textAlign={textAlign}
            onPress={() =>
              showComingSoon(
                t("account.emailComingSoonTitle"),
                t("account.emailComingSoonBody")
              )
            }
          />

          <Divider />

          <AccountRow
            icon="lock-closed-outline"
            title={t("account.changePassword")}
            subtitle={t("account.changePasswordSubtitle")}
            textAlign={textAlign}
            onPress={() => router.push("/profile/change-password")}
          />
        </View>

        <View style={cardStyle}>
          <AccountRow
            icon="shield-checkmark-outline"
            title={t("account.loginSecurity")}
            subtitle={t("account.loginSecuritySubtitle")}
            textAlign={textAlign}
            onPress={() =>
              showComingSoon(
                t("account.loginSecurityComingSoonTitle"),
                t("account.loginSecurityComingSoonBody")
              )
            }
          />

          <Divider />

          <AccountRow
            icon="trash-outline"
            title={t("account.deleteAccount")}
            subtitle={t("account.deleteAccountSubtitle")}
            textAlign={textAlign}
            onPress={handleDeleteAccount}
          />
        </View>

        <View style={cardStyle}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: TEXT,
              marginBottom: 8,
              textAlign,
            }}
          >
            {t("account.securityNote")}
          </Text>

          <Text
            style={{
              fontSize: 14.5,
              lineHeight: 22,
              color: MUTED,
              textAlign,
            }}
          >
            {t("account.securityNoteBody")}
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
  textAlign,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  textAlign: "left" | "right";
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
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: TEXT,
            textAlign,
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
            textAlign,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {onPress ? (
        <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
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
