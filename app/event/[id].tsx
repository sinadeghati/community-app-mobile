import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  getCommunityEventById,
  deleteCommunityEvent,
  isCommunityEventOwner,
} from "../../lib/communityEvents";
import { loadDiscoverableListings } from "../../lib/discoverableListings";
import { isMapEvent } from "../../lib/mapEvents";
import { getActiveUserId } from "../../lib/userSessionStorage";
import {
  formatEventDateTime,
  formatEventLocation,
  getEventCategory,
  getEventCover,
  getEventDescription,
  getEventOrganizer,
  openEventDirections,
  getEventTicketUrl,
  getEventTitle,
  isEventSaved,
  loadMapEventSnapshot,
  saveMapEventSnapshot,
  toggleEventSaved,
  type EventMapItem,
} from "../../lib/mapEventDetails";
import { ensureLoggedInForSave } from "../../lib/savedActions";
import { theme } from "../../lib/theme";

export default function EventDetailsScreen() {
  const params = useLocalSearchParams();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<EventMapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const interestedPendingRef = useRef(false);

  const loadEvent = React.useCallback(async () => {
    try {
      setLoading(true);

      const communityEvent = await getCommunityEventById(eventId);
      if (communityEvent) {
        setEvent(communityEvent);
        setSaved(await isEventSaved(eventId));
        const userId = await getActiveUserId();
        setIsOwner(await isCommunityEventOwner(communityEvent, userId));
        await saveMapEventSnapshot(communityEvent);
        return;
      }

      const snapshot = await loadMapEventSnapshot(eventId);
      if (snapshot) {
        setEvent(snapshot);
        setSaved(await isEventSaved(eventId));
        setIsOwner(false);
        return;
      }

      const listings = await loadDiscoverableListings();
      const found =
        listings.find(
          (item) => String(item?.id) === eventId && isMapEvent(item)
        ) ?? null;

      setEvent(found as EventMapItem | null);
      if (found) {
        setSaved(await isEventSaved(eventId));
        const userId = await getActiveUserId();
        setIsOwner(await isCommunityEventOwner(found as EventMapItem, userId));
      } else {
        setIsOwner(false);
      }
    } catch (error) {
      console.log("Event details load error:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const refreshInterestedState = React.useCallback(async () => {
    if (!eventId) return;
    setSaved(await isEventSaved(eventId));
  }, [eventId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadEvent();
      void refreshInterestedState();
    }, [loadEvent, refreshInterestedState])
  );

  const ticketUrl = getEventTicketUrl(event);
  const organizer = getEventOrganizer(event);
  const openDirections = async () => {
    if (!event) return;

    const opened = await openEventDirections(event);
    if (!opened) {
      Alert.alert(
        "Location unavailable",
        "Directions are not available for this event yet."
      );
    }
  };

  const shareEvent = async () => {
    if (!event) return;

    await Share.share({
      message: [
        getEventTitle(event),
        formatEventDateTime(event),
        organizer ? `Hosted by ${organizer}` : null,
        formatEventLocation(event),
      ]
        .filter(Boolean)
        .join("\n"),
    });
  };

  const onToggleSaved = async () => {
    if (!eventId || interestedPendingRef.current) return;

    let previous = false;
    setSaved((current) => {
      previous = current;
      return !current;
    });
    interestedPendingRef.current = true;

    try {
      const allowed = await ensureLoggedInForSave(
        previous ? "manage interested events" : "save events you're interested in"
      );
      if (!allowed) {
        setSaved(previous);
        return;
      }

      if (!previous && event) {
        await saveMapEventSnapshot(event);
      }

      const next = await toggleEventSaved(eventId);
      setSaved(next);
    } catch (error) {
      console.log("Event interested toggle error:", error);
      setSaved(previous);
    } finally {
      interestedPendingRef.current = false;
    }
  };

  const onTickets = () => {
    if (!ticketUrl) return;
    Linking.openURL(ticketUrl);
  };

  const onEditEvent = () => {
    router.push({
      pathname: "/profile/edit-event",
      params: { id: eventId },
    } as any);
  };

  const onDeleteEvent = () => {
    Alert.alert(
      "Delete event",
      "Delete this event permanently?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const ownerId = await getActiveUserId();
              const result = await deleteCommunityEvent(eventId, ownerId || undefined);
              if (!result.ok) {
                Alert.alert("Could not delete event", result.message);
                return;
              }
              router.replace("/profile/events");
            })();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.ivory,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.turquoise} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
        <View style={{ padding: 22 }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.turquoise} />
          </Pressable>
          <Text
            style={{
              marginTop: 24,
              fontSize: 20,
              fontWeight: "800",
              color: theme.colors.charcoal,
            }}
          >
            Event not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: getEventCover(event) }}
          style={{ minHeight: 260 }}
          resizeMode="cover"
        >
          <View
            style={{
              flex: 1,
              minHeight: 260,
              padding: 16,
              justifyContent: "space-between",
              backgroundColor: "rgba(6,59,62,0.55)",
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: "rgba(255,255,255,0.94)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.turquoise} />
            </Pressable>

            <View>
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(124,58,237,0.25)",
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: "rgba(124,58,237,0.45)",
                }}
              >
                <Text
                  style={{
                    color: "#EDE9FE",
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.4,
                  }}
                >
                  {getEventCategory(event).toUpperCase()}
                </Text>
              </View>

              <Text
                style={{
                  marginTop: 12,
                  fontSize: 28,
                  fontWeight: "900",
                  color: "#FFFFFF",
                  lineHeight: 34,
                }}
              >
                {getEventTitle(event)}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View style={{ padding: theme.spacing.md, paddingBottom: 32 }}>
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...theme.shadow.soft,
            }}
          >
            <DetailRow
              icon="calendar-outline"
              label="Date & time"
              value={formatEventDateTime(event)}
            />
            <DetailRow
              icon="location-outline"
              label="Location"
              value={formatEventLocation(event)}
              isLast={!organizer}
            />
            {organizer ? (
              <DetailRow
                icon="business-outline"
                label="Organizer / Host"
                value={organizer}
                isLast
              />
            ) : null}
          </View>

          <View
            style={{
              marginTop: theme.spacing.md,
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...theme.shadow.soft,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: theme.colors.charcoal,
                marginBottom: 8,
              }}
            >
              About this event
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 23,
                color: theme.colors.charcoal,
              }}
            >
              {getEventDescription(event)}
            </Text>
          </View>

          <View
            style={{
              marginTop: theme.spacing.md,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <ActionChip icon="share-outline" label="Share" onPress={shareEvent} />
            <ActionChip
              icon="navigate-outline"
              label="Directions"
              onPress={openDirections}
            />
            <ActionChip
              icon={saved ? "heart" : "heart-outline"}
              label={saved ? "Interested ✓" : "Interested"}
              onPress={onToggleSaved}
              accent
            />
            {isOwner ? (
              <>
                <ActionChip
                  icon="create-outline"
                  label="Edit"
                  onPress={onEditEvent}
                  accent
                />
                <ActionChip
                  icon="trash-outline"
                  label="Delete"
                  onPress={onDeleteEvent}
                />
              </>
            ) : null}
            {ticketUrl ? (
              <ActionChip
                icon="open-outline"
                label="Tickets"
                onPress={onTickets}
                accent
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  minWidth: "46%",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.softCard,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: theme.colors.muted,
                  }}
                >
                  Tickets coming soon
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: "rgba(124,58,237,0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={18} color={theme.colors.eventPurple} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: theme.colors.muted,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontSize: 15,
            fontWeight: "600",
            color: theme.colors.charcoal,
            lineHeight: 21,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexGrow: 1,
        flexBasis: "46%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: theme.radius.sm,
        backgroundColor: accent ? theme.colors.turquoise : theme.colors.card,
        borderWidth: 1,
        borderColor: accent ? theme.colors.turquoise : theme.colors.border,
      }}
    >
      <Ionicons
        name={icon}
        size={17}
        color={accent ? "#FFFFFF" : theme.colors.turquoise}
      />
      <Text
        style={{
          marginLeft: 6,
          fontSize: 14,
          fontWeight: "800",
          color: accent ? "#FFFFFF" : theme.colors.charcoal,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
