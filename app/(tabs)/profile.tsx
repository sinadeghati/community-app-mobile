import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert,TouchableOpacity } from "react-native";
import authStorage from "../utils/authStorage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_URL = "https://community-app-backend-production.up.railway.app/api/accounts/profile/"

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
          await AsyncStorage.removeItem("authTokens_v2");
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("userId");

          setProfile(null);
          setLoading(false);

          router.replace("/(tabs)/profile");
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

  

 return (
  <SafeAreaView style={{ flex: 1}} edges={["top", "bottom"]}>
    <View style={{flex: 1, padding: 20}}>
    {loading ? (
      <ActivityIndicator size="large" />
    ) : profile ? (
      <>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Profile</Text>
        <Text style={{ marginTop: 12 }}>
          Username: {profile?.username}
        </Text>
        <Text>Email: {profile?.email ?? "-"}</Text>

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
      </>
    ) : (
      <>
        <Text style={{ fontSize: 18, fontWeight: "600"}}>
          You're not logged in
        </Text>

        <Text style={{ marginTop: 8, color: "#666"}}>
          log in to post and manage your listing.
        </Text>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#ccc",
          }}
          >
            <Text style={{ textAlign: "center", fontWeight: "600"}}>
              Login
            </Text>
            </TouchableOpacity>
            </>
    )}
  </View>
  </SafeAreaView>
);

}
