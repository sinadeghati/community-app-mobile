// app/profile.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getTokens, clearTokens } from './utils/authStorage';

export default function ProfileScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [hasToken, setHasToken] = useState<boolean>(false);

  // وقتی صفحه باز می‌شود، چک می‌کنیم توکن هست یا نه
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const { accessToken } = await getTokens();
        setHasToken(!!accessToken);
      } catch (error) {
        console.log('Error checking tokens', error);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // دکمه‌ی Logout
  const handleLogout = async () => {
    try {
      await clearTokens(); // پاک کردن access + refresh از SecureStore
      Alert.alert('Logged out', 'You have been logged out.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/login'),
        },
      ]);
    } catch (error) {
      console.log('Error during logout', error);
      Alert.alert('Error', 'There was a problem logging out. Please try again.');
    }
  };

  // وقتی هنوز داریم توکن رو از SecureStore می‌خونیم
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.infoText}>Loading profile...</Text>
      </View>
    );
  }

  // اگر هیچ توکنی پیدا نشد → یعنی لاگین نیست
  if (!hasToken) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Not logged in</Text>
        <Text style={styles.infoText}>Please log in to see your profile.</Text>

        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)/login')}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // اگر توکن هست → کاربر لاگین است
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* فعلاً ساده: بعداً اینجا اسم/ایمیل واقعی از سرور می‌کشیم */}
      <Text style={styles.infoText}>You are logged in.</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 24,
    color: '#555',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
