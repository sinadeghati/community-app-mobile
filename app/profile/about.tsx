import React from "react";
import { SafeAreaView, ScrollView, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Constants from "expo-constants";
import { KorookHeroLogo } from "../../components/brand/KorookHeroLogo";
import { korookBrand } from "../../lib/korookBrand";
import { theme } from "../../lib/theme";

const appVersion =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

export default function AboutScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
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
            backgroundColor: theme.colors.card,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 24,
          }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
        </Pressable>

        <KorookHeroLogo size={72} />

        <Text
          style={{
            fontSize: 34,
            fontWeight: "800",
            color: theme.colors.navy,
            letterSpacing: -0.8,
            marginTop: 18,
            marginBottom: 6,
          }}
        >
          About Korook
        </Text>

        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: theme.colors.primary,
            marginBottom: 8,
          }}
        >
          Version {appVersion}
        </Text>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1.4,
            color: theme.colors.muted,
            marginBottom: 16,
          }}
        >
          {korookBrand.tagline}
        </Text>

        <Text
          style={{
            fontSize: 15.5,
            lineHeight: 24,
            color: theme.colors.muted,
            marginBottom: 24,
          }}
        >
          {korookBrand.mission}
        </Text>

        <View style={cardStyle}>
          <AboutBlock
            title="Our mission"
            body="Help Iranians and Persian speakers find trusted businesses, cultural events, and community resources in one modern discovery platform."
          />
        </View>

        <View style={cardStyle}>
          <AboutBlock
            title="What you can do today"
            body="Explore listings, save favorites, manage your profile, and discover Persian-owned businesses and events near you."
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 14 }} />
          <AboutBlock
            title="Support"
            body={`Questions or feedback? Email ${korookBrand.links.supportEmail}`}
          />
          <Pressable
            onPress={() => router.push("/legal/contact-us")}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: theme.colors.primary, fontWeight: "800" }}>
              Contact Us →
            </Text>
          </Pressable>
        </View>

        <View style={cardStyle}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: theme.colors.navy, marginBottom: 8 }}>
            Legal
          </Text>
          <Pressable onPress={() => router.push("/legal/privacy-policy")} style={{ paddingVertical: 8 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: "800" }}>Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/legal/terms-of-service")} style={{ paddingVertical: 8 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: "800" }}>Terms of Service</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutBlock({ title, body }: { title: string; body: string }) {
  return (
    <View>
      <Text style={{ fontSize: 16, fontWeight: "800", color: theme.colors.navy, marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14.5, lineHeight: 22, color: theme.colors.muted }}>{body}</Text>
    </View>
  );
}

const cardStyle = {
  backgroundColor: theme.colors.card,
  borderRadius: 26,
  padding: 18,
  borderWidth: 1,
  borderColor: theme.colors.border,
  marginBottom: 18,
};
