// app/login.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import authStorage from "./utils/authStorage";

// ⚠️ این دو تا آدرس رو با IP خودت یکی کن
const LOGIN_URL = "http://192.168.1.4:8000/api/auth/login/";
const REFRESH_URL = "http://192.168.1.4:8000/api/auth/refresh/";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // ---------- مرحله ۳: چک کردن لاگین خودکار ----------
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const tokens = await authStorage.getTokens();

        // اگه رفریش‌توکن داریم، سعی کن سشن رو دوباره فعال کنی
        if (tokens?.refresh) {
          const response = await fetch(REFRESH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: tokens.refresh }),
          });

          if (response.ok) {
            const data = await response.json();

            // اکسس توکن جدید رو ذخیره کن
            await authStorage.saveTokens({
              access: data.access,
              refresh: tokens.refresh,
            });

            Alert.alert("Welcome back!", "You are already logged in.", [
              {
                text: "OK",
                onPress: () => router.replace("/(tabs)"), // مستقیم ببر داخل اپ
              },
            ]);

            return; // دیگه لازم نیست فرم لاگین نشون بدیم
          } else {
            // اگه رفریش خراب بود، سشن رو پاک کن
            await authStorage.removeTokens();
          }
        }
      } catch (err) {
        console.log("Error checking session:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, []);

  // ---------- لاگین معمولی ----------
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Missing information", "Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login error", data.detail || "Invalid username or password.");
        return;
      }

      // فرض می‌گیریم API این دو تا رو برمی‌گردونه
      // { access: "...", refresh: "..." }
      await authStorage.saveTokens({
        access: data.access,
        refresh: data.refresh,
      });

      Alert.alert("Success!", "You have successfully logged in.", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (err: any) {
      console.log("Login failed:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- اگر در حال چک کردن سشن قبلی هستیم ----------
  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Checking session...</Text>
      </View>
    );
  }

  // ---------- UI ----------
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkWrapper}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------- استایل‌ها ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  linkWrapper: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#007bff",
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
