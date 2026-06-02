import React from "react";
import { SafeAreaView, Text, Pressable, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function EventsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F5F2" }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 22,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#ECE7DF",
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#11998E" />
        </Pressable>

        <Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: "#111111",
            marginBottom: 8,
          }}
        >
          Events
        </Text>

        <Text
          style={{
            fontSize: 15.5,
            lineHeight: 23,
            color: "#6B7280",
            marginBottom: 24,
          }}
        >
          Manage your business events, community gatherings, and promotions.
        </Text>

        <Pressable
          onPress={() => router.push("/profile/create-event")}
          style={{
            height: 54,
            borderRadius: 18,
            backgroundColor: "#11998E",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16.5,
              fontWeight: "800",
            }}
          >
            Create Event
          </Text>
        </Pressable>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 26,
            padding: 26,
            borderWidth: 1,
            borderColor: "#ECE7DF",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 74,
              height: 74,
              borderRadius: 37,
              backgroundColor: "#E6F5F3",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <Ionicons name="calendar-outline" size={34} color="#11998E" />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#111111",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            No events yet
          </Text>

          <Text
            style={{
              fontSize: 15,
              lineHeight: 23,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            Events you create for your businesses will appear here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}