import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { KorookHeroLogo } from "../brand/KorookHeroLogo";
import { theme } from "../../lib/theme";

type Section = {
  title: string;
  body: string;
};

type LegalDocumentScreenProps = {
  title: string;
  subtitle: string;
  sections: Section[];
  footer?: React.ReactNode;
};

export function LegalDocumentScreen({
  title,
  subtitle,
  sections,
  footer,
}: LegalDocumentScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 12,
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.colors.card,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 }}>
          <KorookHeroLogo size={48} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "900",
                color: theme.colors.navy,
                letterSpacing: -0.5,
              }}
            >
              {title}
            </Text>
            <Text style={{ marginTop: 4, color: theme.colors.muted, fontWeight: "600" }}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 24,
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.lg,
            padding: 18,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadow.soft,
          }}
        >
          {sections.map((section, index) => (
            <View
              key={section.title}
              style={{
                marginTop: index === 0 ? 0 : 20,
                paddingTop: index === 0 ? 0 : 20,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: theme.colors.navy,
                  marginBottom: 8,
                }}
              >
                {section.title}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 23,
                  color: theme.colors.muted,
                  fontWeight: "500",
                }}
              >
                {section.body}
              </Text>
            </View>
          ))}
        </View>

        {footer}
      </ScrollView>
    </SafeAreaView>
  );
}
