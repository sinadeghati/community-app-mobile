import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function MessagesScreen() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F7F4EE",
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 120,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            marginBottom: 18,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#11998E"
          />

          <Text
            style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: "700",
              color: "#11998E",
            }}
          >
            Back
          </Text>
        </Pressable>

        <Text
          style={{
            fontSize: 38,
            fontWeight: "900",
            color: "#111",
            marginBottom: 8,
          }}
        >
          Messages
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#777",
            marginBottom: 28,
            lineHeight: 24,
          }}
        >
          Community conversations and business chats.
        </Text>

        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 28,
            padding: 28,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ECE7DF",
          }}
        >
          <View
            style={{
              width: 82,
              height: 82,
              borderRadius: 41,
              backgroundColor: "#E8F7F5",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={40}
              color="#11998E"
            />
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: "#111",
              marginBottom: 10,
            }}
          >
            No messages yet
          </Text>

          <Text
            style={{
              fontSize: 15.5,
              color: "#777",
              textAlign: "center",
              lineHeight: 24,
              maxWidth: 290,
            }}
          >
            Messages from businesses, customers, and future
            community chats will appear here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}