import React from "react";
import { SafeAreaView, ScrollView, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Constants from "expo-constants";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT = "#E7F6F4";

const appVersion =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

export default function AboutScreen() {
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

        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: SOFT,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Ionicons name="planet-outline" size={36} color={TURQUOISE} />
        </View>

        <Text
          style={{
            fontSize: 34,
            fontWeight: "800",
            color: TEXT,
            letterSpacing: -0.8,
            marginBottom: 6,
          }}
        >
          About IranianApp
        </Text>

        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: TURQUOISE,
            marginBottom: 16,
          }}
        >
          Version {appVersion}
        </Text>

        <Text
          style={{
            fontSize: 15.5,
            lineHeight: 24,
            color: MUTED,
            marginBottom: 24,
          }}
        >
          IranianApp connects the Persian community with local businesses, events,
          services, and places—built for discovery, trust, and culture.
        </Text>

        <View style={cardStyle}>
          <AboutBlock
            title="Our mission"
            body="Help Iranians and Persian speakers find trusted businesses, cultural events, and community resources in one modern app."
          />
        </View>

        <View style={cardStyle}>
          <AboutBlock
            title="What you can do today"
            body="Explore listings, save favorites, manage your profile, and discover Persian-owned businesses and events near you."
          />
          <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 14 }} />
          <AboutBlock
            title="Support"
            body="Questions or feedback? Contact us at support@iranianapp.com (MVP placeholder)."
          />
        </View>

        <View style={cardStyle}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: TEXT, marginBottom: 8 }}>
            Legal
          </Text>
          <Text style={{ fontSize: 14.5, lineHeight: 22, color: MUTED }}>
            Terms of Service and Privacy Policy pages will be published before public
            launch. Your data preferences can be managed under Settings → Privacy & Safety.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutBlock({ title, body }: { title: string; body: string }) {
  return (
    <View>
      <Text style={{ fontSize: 17, fontWeight: "800", color: TEXT, marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14.5, lineHeight: 22, color: MUTED }}>{body}</Text>
    </View>
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
