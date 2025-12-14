
// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* صفحه لاگین (اولین صفحه) */}
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
        }}
      />

      {/* صفحه ثبت‌نام */}
      <Stack.Screen
        name="register"
        options={{
          title: "Register",
        }}
      />

      {/* هر مودالی که خود Expo گذاشته بود */}
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          title: "Modal",
        }}
      />

      {/* استک تب‌ها */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
