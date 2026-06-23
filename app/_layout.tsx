import React from "react";
import { Stack } from "expo-router";
import { KorookStartupGate } from "../components/brand/KorookStartupGate";
import { LanguageProvider } from "../lib/i18n/LanguageProvider";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <KorookStartupGate>
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="login" options={{ title: "Login" }} />
          <Stack.Screen name="register" options={{ title: "Register" }} />
          <Stack.Screen name="verify-email" options={{ title: "Verify Email" }} />
          <Stack.Screen name="forgot-password" options={{ title: "Forgot Password" }} />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
          <Stack.Screen name="legal" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </KorookStartupGate>
    </LanguageProvider>
  );
}
