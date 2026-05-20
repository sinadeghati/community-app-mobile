import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect} from "react";
import {
  SafeAreaView,
  Text,
  Pressable,
  View,
  TextInput,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { API } from "@/lib/api";

export default function EditBusinessProfileScreen() {
    const { id } = useLocalSearchParams();
    useEffect(() => {
  const loadProfile = async () => {
    if (!id) return;

    try {
      const data = await API.getListing(String(id));

      setBusinessName(data?.title || "");
      setBusinessBio(data?.description || "");
      setPhone(data?.contact_info || "");
      setCity(data?.city || "");
    } catch (e) {
      Alert.alert("Error", "Could not load business profile.");
    }
  };

  loadProfile();
}, [id]);
    const [businessName, setBusinessName] = useState("Threading by Sherry");
    const [businessBio, setBusinessBio] = useState(
  "زیبایی ابروی خود را به ما بسپارید..."
);
const [phone, setPhone] = useState("");



const [city, setCity] = useState("San Diego");
  return (
    
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
    Keyboard.dismiss();
    try {
      if (!id) {
  Alert.alert("Error", "Missing business ID.");
  return;
}

await API.updateMyListing(Number(id), {
  title: businessName,
  description: businessBio,
  contact_info: phone,
  city: city,
});

Alert.alert("Success", "Profile updated.", [
  {
    text: "OK",
    onPress: () => router.back(),
  },
]);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not update profile.");
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
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}