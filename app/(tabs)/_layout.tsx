// app/(tabs)/_layout.tsx

import { Tabs, useRouter, useFocusEffect, Redirect } from "expo-router";
import { theme } from "../../lib/theme";
import React, {useCallback, useState} from "react";
import  authStorage  from "../utils/authStorage"; // اگر مسیرت فرق داره، همون مسیر واقعی authStorage رو بده
import { Background } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isAuthed, setIsAuthed] = useState(false);
  useFocusEffect(
    useCallback(()=> {
      let alive = true;
      (async () =>{
        const tokens = await authStorage.getTokens();
        const access = tokens?.access;

        const ok = !!access && authStorage.isJwtNotExpired(access);
        if (alive) setIsAuthed(ok);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );
 

const guardTab = (target: string) => async (e: any) => {
  e.preventDefault();

  try {
    const tokens = await authStorage.getTokens();
    const access = tokens?.access;
    const ok = !!access && authStorage.isJwtNotExpired(access);

    if (ok) {
      router.push(target);
    } else {
      router.replace("/(tabs)");
    }
  } catch {
    router.replace("/(tabs)");
  }
};

  return (
    <Tabs
    screenOptions={{
      headerShown: false,

      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.muted,

      tabBarStyle: {
        backgroundColor: theme.colors.card,
        borderTopColor: theme.colors.border,
        height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        paddingTop: 10,
      },
    }}
      >
<Tabs.Screen
  name="map"
  options={{
    title: "Map",
    tabBarIcon: ({ color, size }) => (
      <Ionicons
        name="map-outline"
        size={size}
        color={color}
      />
    ),
  }}
/>

      <Tabs.Screen
        name="index"
        options={{ title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
         }}
      />

     

      <Tabs.Screen
        name="explore"
        options={{ title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
         }}
      />

      <Tabs.Screen
        name="mylistings"
        options ={{
          href: null,
        }}
        />

      <Tabs.Screen
  name="create"
  options={{
    href: null,
  }}
/>

<Tabs.Screen
  name="profile-v2-clean"
  options={{
    href: null,
  }}
/>

<Tabs.Screen
  name="explore-v2"
  options={{
    href: null,
  }}
/>

<Tabs.Screen
  name="favorites"
  options={{
    title: "Favorites",
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="heart-outline" size={size} color={color} />
    ),
  }}
/>


      <Tabs.Screen
        name="profile"
        options={{ title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
         }}
        

         
      />
    </Tabs>
  );
}
