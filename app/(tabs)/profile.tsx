// app/(tabs)/profile.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import authStorage from "../utils/authStorage";
import { API } from "../../lib/api";

type ProfileData = {
  username?: string;
  email?: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const tokens = await authStorage.getTokens();
        console.log("PROFILE TOKENS:", tokens);

        if (!tokens?.access) {
          setError("No login token found.");
          setLoading(false);
          return;
        }

        const response = await API.getProfile(tokens.access);
        console.log("PROFILE RAW RESPONSE:", response.data);

        // اگر بک‌اند توی فیلدهای دیگه برمی‌گردونه، اینجا تنظیمش کن
        setProfile({
          username: response.data.username,
          email: response.data.email,
        });
      } catch (err: any) {
        console.log("PROFILE ERROR:", err?.response?.data || err.message);
        setError("Could not load profile from server.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleGoToLogin = async () => {
    await authStorage.clearTokens();
    router.push("/login");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Could not load profile.</Text>
        <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{profile.username || "-"}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile.email || "-"}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={async () => {
          try {
            await authStorage.clearTokens();
            Alert.alert("Logged out", "You have been logged out.");
            router.push("/login");
          } catch (err) {
            Alert.alert("Error", "Could not log out.");
          }
        }}
      >
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 12,
    textAlign: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    alignSelf: "center",
    marginTop: 16,
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  logoutButton: {
    backgroundColor: "#ff4d4d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
