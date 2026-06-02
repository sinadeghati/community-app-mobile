// app/(tabs)/index.tsx
import { useRouter, useLocalSearchParams, useFocusEffect, } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import authStorage from "../utils/authStorage";
import AppButton from "@/components/ui/AppButton";
import { Redirect } from "expo-router";

// 🔴 فقط این آدرس را وقتی IP عوض شد تغییر بده

const API_LOGIN = "https://community-app-backend-production.up.railway.app/api/accounts/login/"

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
  React.useCallback(() => {
    const loadTokens = async () => {
      try {
        const tokens = await authStorage.getTokens();

        if (tokens?.access && authStorage.isJwtNotExpired(tokens.access)) {
  console.log("User already logged in (valid token found)");
  setIsLoggedIn(true);
} else {
  await authStorage.clearTokens();
  setIsLoggedIn(false);
}
      } catch (error) {
        console.log("LOAD TOKENS ERROR:", error);
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };

    loadTokens();
  }, [])
);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    // بستن کیبورد موقع لاگین
    Keyboard.dismiss();
    setLoading(true);

    try {
      console.log("SENDING LOGIN TO:", API_LOGIN);
      console.log("LOGIN BODY:", { username, password });

      const response = await fetch(API_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("LOGIN RAW RESPONSE:", data, "STATUS:", response.status);

      if (response.ok) {
        await authStorage.storeTokens(data);
        const check = await authStorage.getTokens();
        console.log("AFTER LOGIN stored tokens:", check);
        const goToMyListings = params?.redirectTo === "/(tabs)/mylistings";
        if (goToMyListings) {
          router.replace("/(tabs)/mylistings");
        } else {
          router.replace("/(tabs)/explore");
        }
        return;
      } else {
        console.log("LOGIN ERROR RESPONSE BODY:", data);
        Alert.alert(
          "Error",
          data?.detail ||
            data?.non_field_errors?.[0] ||
            "Invalid username or password."
        );
      }
    } catch (error) {
      console.log("LOGIN FETCH ERROR:", error);
      Alert.alert(
        "Error",
        "There was a problem connecting to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Checking login status...</Text>
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/explore" />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.card}>
              <Text style={styles.title}>Login</Text>

              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                autoCapitalize="none"
                onChangeText={setUsername}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
              />

              <AppButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                />

              <Text
  style={{
    marginTop: 12,
    textAlign: "center",
    color: "#007AFF",
    fontSize: 14,
  }}
  onPress={() => router.push("/register")}
>
  Create account
</Text>


              <Text style={styles.infoText}>
                You don’t need to log in to browse listings. Just use the{" "}
                <Text style={{ fontWeight: "700" }}>Explore</Text> tab below. 🙂
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  infoText: {
    marginTop: 16,
    fontSize: 13,
    textAlign: "center",
    color: "#666",
  },
});
