// app/(tabs)/_layout.tsx
import React, { useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import authStorage from "../utils/authStorage";

export default function TabLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const tokens = await authStorage.getTokens();
        console.log("TABS GUARD tokens:", tokens);

        const access = tokens?.access;

        if (!access) {
          console.log("TABS GUARD -> NO ACCESS, but wait (no redirect yet");
          
          return;
        }

        console.log("TABS GUARD -> OK, stay in tabs");
      } catch (e) {
        console.log("TABS GUARD ERROR:", e);
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // تا وقتی چک نکردیم، Tabs رو رندر نکن که رفت و برگشت ایجاد نشه
  if (checking) return null;

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="create" options={{ title: "Post" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="mylistings" options={{ title: "My Listings" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
