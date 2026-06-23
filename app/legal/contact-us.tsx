import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { LegalDocumentScreen } from "../../components/legal/LegalDocumentScreen";
import { korookBrand } from "../../lib/korookBrand";
import { theme } from "../../lib/theme";

export default function ContactUsScreen() {
  const email = korookBrand.links.supportEmail;

  return (
    <LegalDocumentScreen
      title="Contact Us"
      subtitle="We're here to help the Korook community"
      sections={[
        {
          title: "Support",
          body:
            "For account help, listing issues, event questions, or privacy requests, email our team. We typically respond within 2 business days.",
        },
        {
          title: "Business & partnerships",
          body:
            "Interested in featuring your business or partnering with Korook? Reach out with your business name and city.",
        },
      ]}
      footer={
        <View style={{ gap: 12, marginTop: 8 }}>
          <Pressable
            onPress={() => void Linking.openURL(`mailto:${email}`)}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.md,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              Email {email}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL(korookBrand.links.website)}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.md,
              paddingVertical: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ color: theme.colors.navy, fontWeight: "800", fontSize: 16 }}>
              Visit korook.com
            </Text>
          </Pressable>
        </View>
      }
    />
  );
}
