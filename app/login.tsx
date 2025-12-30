// app/login.tsx
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { router } from "expo-router";
import authStorage from "./utils/authStorage";
import {API}  from "../lib/api";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    try {
      setLoading(true);
      console.log("LOGIN.TSX VERSION: 2025-12-29 A");

      console.log("SENDING LOGIN TO BACKEND...", { username, password });

      const response = await API.login(username, password);

      console.log("LOGIN RESPONSE DATA:", response.data);

      

     const tokens = response?.data ?? response;

     if (!tokens?.access) {
       console.log("LOGIN ERROR: token missing access", tokens);
       Alert.alert("ERROR", "Login response did not include tokens.");
       return;
     }
     await authStorage.setTokens(tokens);

      Alert.alert("Success", "Logged in successfully!");
      router.replace("/(tabs)/explore"); // بعد از لاگین برو توی تب‌ها

    } catch (error: any) {
      console.log("LOGIN ERROR OBJECT:", error);
      console.log(
        "LOGIN ERROR RESPONSE DATA:",
        error?.response?.data || "NO RESPONSE DATA"
      );

      if (error?.response?.status === 400) {
        Alert.alert("Error", "Username or password is incorrect.");
      } else {
        Alert.alert("Error", "There was a problem connecting to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      <Text
  style={{
    marginTop: 16,
    textAlign: "center",
    color: "#007AFF",
  }}
  onPress={() => router.push("/register")}
>
  Create account
</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#1C67F6",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});
