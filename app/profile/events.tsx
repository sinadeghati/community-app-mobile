import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  Text,
  Pressable,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  deleteCommunityEvent,
  listCommunityEventsForOwner,
  type CommunityEvent,
} from "../../lib/communityEvents";
import { formatEventDateTime } from "../../lib/mapEventDetails";
import { getActiveUserId } from "../../lib/userSessionStorage";

export default function EventsScreen() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CommunityEvent[]>([]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const ownerId = await getActiveUserId();
      if (!ownerId) {
        setEvents([]);
        return;
      }
      setEvents(await listCommunityEventsForOwner(ownerId));
    } catch (error) {
      console.log("Events list load error:", error);
      Alert.alert("Error", "Could not load your events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEvents();
    }, [loadEvents])
  );

  const handleDelete = (event: CommunityEvent) => {
    Alert.alert(
      "Delete event",
      `Delete "${event.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const ownerId = await getActiveUserId();
              const result = await deleteCommunityEvent(event.id, ownerId || undefined);
              if (!result.ok) {
                Alert.alert("Could not delete event", result.message);
                return;
              }
              await loadEvents();
            })();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F5F2" }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 22,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#ECE7DF",
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#11998E" />
        </Pressable>

        <Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: "#111111",
            marginBottom: 8,
          }}
        >
          Events
        </Text>

        <Text
          style={{
            fontSize: 15.5,
            lineHeight: 23,
            color: "#6B7280",
            marginBottom: 24,
          }}
        >
          Manage your business events, community gatherings, and promotions.
        </Text>

        <Pressable
          onPress={() => router.push("/profile/create-event")}
          style={{
            height: 54,
            borderRadius: 18,
            backgroundColor: "#11998E",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16.5,
              fontWeight: "800",
            }}
          >
            Create Event
          </Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator size="large" color="#11998E" />
        ) : events.length === 0 ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 26,
              padding: 26,
              borderWidth: 1,
              borderColor: "#ECE7DF",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 74,
                height: 74,
                borderRadius: 37,
                backgroundColor: "#E6F5F3",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <Ionicons name="calendar-outline" size={34} color="#11998E" />
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: "900",
                color: "#111111",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No events yet
            </Text>

            <Text
              style={{
                fontSize: 15,
                lineHeight: 23,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              Events you create will appear here and in Explore.
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <View
              key={event.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: "#ECE7DF",
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: "#111111",
                  marginBottom: 6,
                }}
              >
                {event.title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginBottom: 4,
                }}
              >
                {formatEventDateTime(event)}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  marginBottom: 14,
                }}
              >
                {event.location || event.address || `${event.city}, ${event.state}`}
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/event/[id]",
                      params: { id: event.id },
                    } as any)
                  }
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: "#E6F5F3",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#11998E", fontWeight: "800" }}>View</Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/profile/edit-event",
                      params: { id: event.id },
                    } as any)
                  }
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#111111", fontWeight: "800" }}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDelete(event)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: "#FEF2F2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
