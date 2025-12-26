import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

// آدرس سرور Django — آدرس لپ‌تاپ خودت
const REGISTER_URL = 'http://10.9.50.156:8000/api/accounts/register/';

export default function RegisterScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
  if (!username || !email || !password || !confirmPassword) {
    Alert.alert("Missing information", "Please fill in all fields.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Password mismatch", "Passwords do not match.");
    return;
  }

  setLoading(true);

  try {
    const payload = {
      username,
      email,
      password,
      password2: confirmPassword, // خیلی مهم
    };

    console.log("REGISTER URL:", REGISTER_URL);
    console.log("REGISTER PAYLOAD:", payload);

    const res = await fetch(REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    console.log("REGISTER STATUS:", res.status);
    console.log("REGISTER RAW:", raw);

    let data: any = {};
    try {
      data = JSON.parse(raw);
    } catch {
      Alert.alert("Error", "Server did not return JSON");
      return;
    }

    if (!res.ok) {
      Alert.alert("Error", JSON.stringify(data));
      return;
    }

    Alert.alert("Success", "Account created!");
    router.back();
  } catch (e) {
    console.log("REGISTER ERROR:", e);
    Alert.alert("Error", "Network request failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign up</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 32,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  link: {
    marginTop: 18,
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 15,
  },
});
