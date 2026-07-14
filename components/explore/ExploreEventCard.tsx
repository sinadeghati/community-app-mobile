import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  formatEventDateTime,
  formatEventLocation,
  getEventCover,
  getEventTitle,
} from "../../lib/mapEventDetails";
import { parseEventDate, type EventMapItem } from "../../lib/mapEvents";
import { theme } from "../../lib/theme";
import { explorePremium } from "./explorePremiumTokens";

type ExploreEventCardProps = {
  item: EventMapItem;
  onPress: (item: EventMapItem) => void;
};

const getDateBadge = (item: EventMapItem) => {
  const date = parseEventDate(item);
  if (!date) return null;

  return {
    month: date
      .toLocaleString(undefined, { month: "short" })
      .toUpperCase(),
    day: String(date.getDate()),
  };
};

const getTimeLine = (item: EventMapItem) => {
  const formatted = formatEventDateTime(item);
  if (!formatted || formatted === "Date coming soon") return formatted;
  const parts = formatted.split("·");
  return parts.length > 1 ? parts[parts.length - 1].trim() : formatted;
};

export const ExploreEventCard = React.memo(function ExploreEventCard({
  item,
  onPress,
}: ExploreEventCardProps) {
  const badge = getDateBadge(item);
  const location = formatEventLocation(item);
  const timeLine = getTimeLine(item);

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        {
          borderRadius: explorePremium.cardRadiusLg,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "rgba(226,232,240,0.9)",
          ...explorePremium.shadow.card,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={{ position: "relative", height: 196 }}>
        <Image
          source={{ uri: getEventCover(item) }}
          style={{ width: "100%", height: "100%", backgroundColor: "#EEF2F6" }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />

        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(8, 28, 35, 0.18)",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "72%",
            backgroundColor: "rgba(8, 28, 35, 0.55)",
          }}
        />

        {badge ? (
          <View
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              minWidth: 54,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.96)",
              alignItems: "center",
              paddingHorizontal: 10,
              paddingVertical: 8,
              ...explorePremium.shadow.cardSoft,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: theme.colors.turquoise,
                letterSpacing: 0.6,
              }}
            >
              {badge.month}
            </Text>
            <Text
              style={{
                marginTop: 1,
                fontSize: 20,
                fontWeight: "800",
                color: theme.colors.charcoal,
                lineHeight: 22,
              }}
            >
              {badge.day}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.94)",
            alignItems: "center",
            justifyContent: "center",
            ...explorePremium.shadow.cardSoft,
          }}
        >
          <Ionicons
            name="bookmark-outline"
            size={20}
            color={theme.colors.eventPurple}
          />
        </View>

        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: "800",
              letterSpacing: -0.3,
              lineHeight: 26,
            }}
          >
            {getEventTitle(item)}
          </Text>

          {location ? (
            <View
              style={{
                marginTop: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color="rgba(255,255,255,0.92)"
              />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  color: "rgba(255,255,255,0.92)",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {location}
              </Text>
            </View>
          ) : null}

          {timeLine ? (
            <View
              style={{
                marginTop: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color="rgba(255,255,255,0.88)"
              />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  color: "rgba(255,255,255,0.88)",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {timeLine}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
