import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../lib/api";
import { loadFavoriteBusinesses } from "../../lib/businessFavorites";
import { openSmsToPhone, pickPhone } from "../../lib/openSms";
import { theme } from "../../lib/theme";
import {
  getActiveUserId,
  loadMyBusinessesForProfile,
  loadUserProfile,
} from "../../lib/userSessionStorage";

type MessageContact = {
  id: string;
  name: string;
  phone: string;
  source: "business" | "favorite" | "profile";
};

const titleFrom = (record: Record<string, unknown>) =>
  String(
    record.business_name ||
      record.name ||
      record.title ||
      record.username ||
      "Contact"
  );

export default function MessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<MessageContact[]>([]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getActiveUserId();
      if (!userId) {
        setContacts([]);
        return;
      }

      const profile = (await loadUserProfile(userId)) as Record<
        string,
        unknown
      > | null;
      const identity = {
        username: profile?.username ? String(profile.username) : undefined,
        email: profile?.email ? String(profile.email) : undefined,
      };

      const byId = new Map<string, MessageContact>();

      const addContact = (
        id: string,
        name: string,
        phone: string,
        source: MessageContact["source"]
      ) => {
        if (!phone) {
          return;
        }
        const key = `${phone}:${id}`;
        if (!byId.has(key)) {
          byId.set(key, { id, name, phone, source });
        }
      };

      const myBusinesses = await loadMyBusinessesForProfile(userId, identity);
      myBusinesses.forEach((biz) => {
        const record = biz as Record<string, unknown>;
        addContact(
          String(record.id || titleFrom(record)),
          titleFrom(record),
          pickPhone(record),
          "business"
        );
      });

      const favorites = await loadFavoriteBusinesses();
      const listings = await API.getListings().catch(() => [] as unknown[]);
      const listingById = new Map<string, Record<string, unknown>>();

      (Array.isArray(listings) ? listings : []).forEach((entry) => {
        const record = entry as Record<string, unknown>;
        const id = String(record.id || "");
        if (id) {
          listingById.set(id, record);
        }
      });

      favorites.forEach((favorite) => {
        const id = String(favorite.id || "");
        const listing = listingById.get(id);
        const phone =
          pickPhone(listing) ||
          pickPhone(favorite as unknown as Record<string, unknown>);
        addContact(
          id || titleFrom(favorite as unknown as Record<string, unknown>),
          titleFrom(favorite as unknown as Record<string, unknown>),
          phone,
          "favorite"
        );
      });

      const dataKeys = await AsyncStorage.getAllKeys();
      const favoriteDataKeys = dataKeys.filter((key) =>
        key.startsWith("favorite-business-data-")
      );
      const rawFavoriteRows = await AsyncStorage.multiGet(favoriteDataKeys);
      rawFavoriteRows.forEach(([key, value]) => {
        if (!value) {
          return;
        }
        try {
          const record = JSON.parse(value) as Record<string, unknown>;
          const id = key.replace("favorite-business-data-", "");
          const listing = listingById.get(id);
          addContact(
            id,
            titleFrom(record),
            pickPhone(listing) || pickPhone(record),
            "favorite"
          );
        } catch {
          // ignore malformed favorite payload
        }
      });

      const profilePhone = pickPhone(profile);
      if (profilePhone) {
        addContact(
          userId,
          titleFrom(profile || { username: "My profile" }),
          profilePhone,
          "profile"
        );
      }

      setContacts(
        Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadContacts();
    }, [loadContacts])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginBottom: 18,
            flexDirection: "row",
            alignItems: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.turquoise} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: "700",
              color: theme.colors.turquoise,
            }}
          >
            Back
          </Text>
        </Pressable>

        <Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: theme.colors.charcoal,
            marginBottom: 8,
            letterSpacing: -0.5,
          }}
        >
          Messages
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.muted,
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          Text businesses and contacts. Opens your phone messaging app — not
          in-app chat.
        </Text>

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.colors.turquoise} />
          </View>
        ) : contacts.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...theme.shadow.soft,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "rgba(13,148,136,0.10)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={34}
                color={theme.colors.turquoise}
              />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: theme.colors.charcoal,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No textable contacts yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.muted,
                textAlign: "center",
                lineHeight: 21,
                maxWidth: 300,
              }}
            >
              Add phone numbers to your businesses or save favorites with
              contact info to message them from here.
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
              ...theme.shadow.soft,
            }}
          >
            {contacts.map((contact, index) => (
              <Pressable
                key={`${contact.id}-${contact.phone}`}
                onPress={() => openSmsToPhone(contact.phone)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: index === contacts.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.border,
                  opacity: pressed ? 0.78 : 1,
                })}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: "rgba(13,148,136,0.10)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color={theme.colors.turquoise}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: theme.colors.charcoal,
                    }}
                  >
                    {contact.name}
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 13,
                      color: theme.colors.muted,
                    }}
                  >
                    {contact.phone}
                  </Text>
                </View>

                <Ionicons
                  name="open-outline"
                  size={18}
                  color={theme.colors.muted}
                />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
