import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert,TouchableOpacity } from "react-native";
import authStorage from "../utils/authStorage";
import { useRouter } from "expo-router";


const PROFILE_URL = "http://10.9.50.123:8000/api/accounts/profile/";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authStorage.clearTokens();
          router.replace("/login");
        },
      },
    ]
  );
};


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const tokens = await authStorage.getTokens();
        const access = tokens?.access;
        console.log("TOKENS:", tokens);
        console.log("ACCESS:", access);

        if (!access) {
          Alert.alert("Not logged in", "No access token found.");
          return;
        }


        const res = await fetch(PROFILE_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });

        const data = await res.json();
        console.log("PROFILE DATA:", data);

        if (!res.ok) {
          Alert.alert("Error", data?.detail || "Failed to load profile");
          return;
        }

        setProfile(data);
      } catch (e: any) {
        console.log("PROFILE ERROR:", e);
        Alert.alert("Error", "Network error loading profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Profile</Text>
      <Text style={{ marginTop: 12 }}>Username: {profile?.username}</Text>
      <Text>Email: {profile?.email}</Text>
      <TouchableOpacity
  onPress={handleLogout}
  style={{
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  }}
>
  <Text style={{ textAlign: "center", fontWeight: "600" }}>
    Logout
  </Text>
</TouchableOpacity>

    </View>
  );
}
