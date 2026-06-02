import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { router } from "expo-router";

export default function CreateEventScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleCreate = () => {
    if (!title || !location) {
      Alert.alert(
        "Missing info",
        "Please add event title and location."
      );
      return;
    }

    Alert.alert(
      "Event Created",
      "Your event has been created successfully."
    );

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#F6F5F2",
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 120,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={() => router.back()}
              style={{ marginBottom: 20 }}
            >
              <Text
                style={{
                  color: "#14B8A6",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                ← Back
              </Text>
            </Pressable>

            <Text
              style={{
                fontSize: 38,
                fontWeight: "900",
                color: "#111",
                marginBottom: 10,
              }}
            >
              Create Event
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#777",
                marginBottom: 28,
                lineHeight: 24,
              }}
            >
              Create community events, business gatherings,
              concerts, meetups, or promotions.
            </Text>

            <View
              style={{
                backgroundColor: "#FFF",
                borderRadius: 28,
                padding: 20,
                borderWidth: 1,
                borderColor: "#ECE7DF",
              }}
            >
              <Text style={labelStyle}>Event Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Persian Night San Diego"
                placeholderTextColor="#999"
                style={inputStyle}
              />

              <Text style={labelStyle}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell people about your event..."
                placeholderTextColor="#999"
                multiline
                style={[inputStyle, { height: 120 }]}
              />

              <Text style={labelStyle}>Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="San Diego, CA"
                placeholderTextColor="#999"
                style={inputStyle}
              />

              <Text style={labelStyle}>Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="June 15, 2026"
                placeholderTextColor="#999"
                style={inputStyle}
              />

              <Text style={labelStyle}>Time</Text>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="7:00 PM"
                placeholderTextColor="#999"
                style={inputStyle}
              />

              <Pressable
                onPress={handleCreate}
                style={{
                  backgroundColor: "#14B8A6",
                  paddingVertical: 18,
                  borderRadius: 18,
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  Create Event
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const labelStyle = {
  fontSize: 15,
  fontWeight: "700",
  color: "#222",
  marginBottom: 10,
  marginTop: 14,
};

const inputStyle = {
  backgroundColor: "#F8F8F8",
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: "#E5E5E5",
};