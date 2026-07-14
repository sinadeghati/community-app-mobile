import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  formatEventDateTime,
  formatEventHostLine,
  getEventCover,
  getEventTitle,
} from "../../lib/mapEventDetails";
import { formatMapPreviewReviewText } from "../../lib/businessReviews";
import type { BusinessReviewSummary } from "../../lib/businessReviews";
import type { EventMapItem } from "../../lib/mapEvents";
import { theme } from "../../lib/theme";
import { explorePremium } from "./explorePremiumTokens";
import type { ExploreBusinessListing } from "./ExploreBusinessCard";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200";

const getId = (item: ExploreBusinessListing) => String(item?.id || "");

const getTitle = (item: ExploreBusinessListing) =>
  item?.business_name || item?.name || item?.title || "Local Business";

const getCategory = (item: ExploreBusinessListing) =>
  item?.business_category || item?.category || "Local Business";

const getImage = (item: ExploreBusinessListing) =>
  item?.cover_image || item?.image_url || item?.image || FALLBACK_IMAGE;

const getLocation = (item: ExploreBusinessListing) =>
  item?.address || [item?.city, item?.state].filter(Boolean).join(", ");

type ExplorePopularRowProps = {
  item: ExploreBusinessListing;
  type: "business" | "event";
  saved: boolean;
  reviewSummary?: BusinessReviewSummary;
  onPress: (item: ExploreBusinessListing) => void;
  onToggleFavorite: (item: ExploreBusinessListing) => void;
  onOpenEvent: (item: ExploreBusinessListing) => void;
};

export const ExplorePopularRow = React.memo(function ExplorePopularRow({
  item,
  type,
  saved,
  reviewSummary,
  onPress,
  onToggleFavorite,
  onOpenEvent,
}: ExplorePopularRowProps) {
  const isEvent = type === "event";
  const eventItem = item as EventMapItem;
  const hostLine = isEvent ? formatEventHostLine(eventItem) : null;
  const reviewLine = formatMapPreviewReviewText(reviewSummary);
  const imageSize = explorePremium.listImageSize;

  return (
    <Pressable
      onPress={() => (isEvent ? onOpenEvent(item) : onPress(item))}
      style={({ pressed }) => [
        {
          marginHorizontal: explorePremium.horizontalPad,
          marginBottom: 14,
          backgroundColor: "#FFFFFF",
          borderRadius: explorePremium.cardRadius,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(226,232,240,0.9)",
          ...explorePremium.shadow.cardSoft,
          transform: [{ scale: pressed ? 0.992 : 1 }],
        },
      ]}
    >
      <Image
        recyclingKey={`explore-popular-${type}-${getId(item)}`}
        source={{
          uri: isEvent ? getEventCover(eventItem) : getImage(item),
        }}
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: 16,
          backgroundColor: "#EEF2F6",
        }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />

      <View style={{ flex: 1, marginLeft: 14, paddingVertical: 2 }}>
        <Text
          numberOfLines={isEvent ? 2 : 1}
          style={{
            fontSize: 17,
            fontWeight: "800",
            color: theme.colors.charcoal,
            letterSpacing: -0.2,
          }}
        >
          {isEvent ? getEventTitle(eventItem) : getTitle(item)}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            marginTop: 4,
            color: isEvent ? theme.colors.eventPurple : theme.colors.turquoise,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: isEvent ? 0 : 0.3,
            textTransform: isEvent ? "none" : "uppercase",
          }}
        >
          {isEvent ? formatEventDateTime(eventItem) : getCategory(item)}
        </Text>

        {!isEvent && getLocation(item) ? (
          <Text
            numberOfLines={1}
            style={{
              marginTop: 5,
              fontSize: 12,
              fontWeight: "600",
              color: theme.colors.muted,
            }}
          >
            {getLocation(item)}
          </Text>
        ) : null}

        {hostLine ? (
          <Text
            numberOfLines={1}
            style={{
              marginTop: 4,
              fontSize: 12,
              fontWeight: "600",
              color: theme.colors.muted,
            }}
          >
            {hostLine}
          </Text>
        ) : null}

        {!isEvent && reviewLine ? (
          <Text
            style={{
              marginTop: 5,
              fontSize: 12,
              fontWeight: "700",
              color: theme.colors.charcoal,
            }}
          >
            {reviewLine}
          </Text>
        ) : null}
      </View>

      {!isEvent ? (
        <Pressable
          onPress={() => onToggleFavorite(item)}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? "rgba(248,250,252,1)" : "rgba(248,250,252,0.8)",
          })}
        >
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={22}
            color={saved ? theme.colors.danger : theme.colors.charcoal}
          />
        </Pressable>
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(124,58,237,0.08)",
          }}
        >
          <Ionicons
            name="bookmark-outline"
            size={20}
            color={theme.colors.eventPurple}
          />
        </View>
      )}
    </Pressable>
  );
});
