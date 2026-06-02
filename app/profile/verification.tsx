import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const BG = "#F6F5F2";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#6B7280";
const BORDER = "#ECE7DF";
const TURQUOISE = "#11998E";
const SOFT_TURQUOISE = "#E7F6F4";

export default function VerificationScreen() {
  const [status, setStatus] = useState<"not_verified" | "pending">(
    "not_verified"
  );

  const applyForVerification = () => {
    setStatus("pending");
    Alert.alert(
      "Request submitted",
      "Your verification request is now pending review."
    );
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
            marginBottom: 10,
          }}
        >
          Verification
        </Text>

        <Text
          style={{
            fontSize: 15.5,
            lineHeight: 24,
            color: MUTED,
            marginBottom: 24,
          }}
        >
          Build trust, show customers your profile is real, and unlock future
          business visibility tools.
        </Text>

        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 26,
            padding: 24,
            borderWidth: 1,
            borderColor: BORDER,
            marginBottom: 18,
          }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: SOFT_TURQUOISE,
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 18,
            }}
          >
            <Ionicons
              name={
                status === "pending"
                  ? "time-outline"
                  : "shield-checkmark-outline"
              }
              size={34}
              color={TURQUOISE}
            />
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: TEXT,
              textAlign: "center",
              letterSpacing: -0.4,
              marginBottom: 10,
            }}
          >
            {status === "pending" ? "Pending Review" : "Not Verified"}
          </Text>

          <Text
            style={{
              fontSize: 15.5,
              lineHeight: 24,
              color: MUTED,
              textAlign: "center",
              marginBottom: 22,
            }}
          >
            {status === "pending"
              ? "Your request has been received. Verification will help customers trust your account or business."
              : "Apply to receive a trusted badge for your profile or business after review."}
          </Text>

          <Pressable
            onPress={applyForVerification}
            disabled={status === "pending"}
            style={{
              height: 54,
              borderRadius: 18,
              backgroundColor:
                status === "pending" ? "#D8D8D8" : TURQUOISE,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Ionicons
              name={status === "pending" ? "checkmark-circle" : "shield-outline"}
              size={21}
              color="#FFFFFF"
            />

            <Text
              style={{
                marginLeft: 8,
                color: "#FFFFFF",
                fontSize: 16.5,
                fontWeight: "800",
              }}
            >
              {status === "pending"
                ? "Request Submitted"
                : "Apply for Verification"}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 26,
            padding: 22,
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: TEXT,
              letterSpacing: -0.3,
              marginBottom: 16,
            }}
          >
            Why get verified?
          </Text>

          <Benefit
            icon="checkmark-circle-outline"
            title="Trusted badge"
            text="Show users your profile or business has been reviewed."
          />

          <Benefit
            icon="map-outline"
            title="Better visibility"
            text="Verified businesses can later rank better on Map and Explore."
          />

          <Benefit
            icon="briefcase-outline"
            title="Business tools"
            text="Future premium tools, featured placement, and paid promotion can connect here."
          />

          <Benefit
            icon="card-outline"
            title="Monetization ready"
            text="Later this can connect to subscriptions, verification fees, and premium plans."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        marginBottom: 18,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: SOFT_TURQUOISE,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          marginTop: 2,
        }}
      >
        <Ionicons name={icon} size={19} color={TURQUOISE} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: TEXT,
            marginBottom: 3,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            fontSize: 14.5,
            lineHeight: 21,
            color: MUTED,
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}