import { router } from "expo-router";
import { useState} from "react";
import {
  SafeAreaView,
  Text,
  Pressable,
  View,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { API } from "@/lib/api";

export default function EditBusinessProfileScreen() {
    const [businessName, setBusinessName] = useState("Threading by Sherry");
    const [businessBio, setBusinessBio] = useState(
  "زیبایی ابروی خود را به ما بسپارید..."
);
const [phone, setPhone] = useState("");



const [city, setCity] = useState("San Diego");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, color: "#007AFF" }}>← Back</Text>
      </Pressable>

      <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12 }}>
        Edit Business Profile
      </Text>

     <ScrollView showsVerticalScrollIndicator={false}>
  <View
    style={{
      gap: 16,
    }}
  >
    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        Business Name
      </Text>

      <TextInput
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="Enter business name"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 16,
        }}
      />
    </View>

    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        Business Bio
      </Text>

      <TextInput
  value={businessBio}
  onChangeText={setBusinessBio}
  placeholder="Tell people about your business..."
        multiline
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 16,
          minHeight: 120,
          textAlignVertical: "top",
        }}
      />
    </View>

    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        Phone Number
      </Text>

      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="(858) 555-1234"
        keyboardType="phone-pad"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 16,
        }}
      />
    </View>

    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        City
      </Text>

      <TextInput
        placeholder="San Diego"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 16,
        }}
      />
    </View>
<Pressable
  onPress={async () => {
    try {
      Alert.alert("Success", "Profile update coming next step");
    } catch (error) {
      console.log(error);
    }
  }}


      style={{
        backgroundColor: "#111",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 12,
        marginBottom: 40,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 16,
          fontWeight: "800",
        }}
      >
        Save Changes
      </Text>
    </Pressable>
  </View>
</ScrollView>
    </SafeAreaView>
  );
}