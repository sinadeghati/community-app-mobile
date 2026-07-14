import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import type { BusinessReviewSummary } from "../../lib/businessReviews";
import { explorePremium } from "./explorePremiumTokens";

export type ExploreBusinessListing = {
  id: number | string;
  title?: string;
  name?: string;
  business_name?: string;
  category?: string;
  business_category?: string;
  city?: string;
  state?: string;
  address?: string;
  image?: string;
  image_url?: string;
  cover_image?: string;
  is_verified?: boolean;
};

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

type ExploreBusinessCardProps = {
  item: ExploreBusinessListing;
  large?: boolean;
  saved: boolean;
  reviewSummary?: BusinessReviewSummary;
  onPress: (item: ExploreBusinessListing) => void;
  onToggleFavorite: (item: ExploreBusinessListing) => void;
};

export const ExploreBusinessCard = React.memo(function ExploreBusinessCard({
  item,
  large = false,
  saved,
  reviewSummary,
  onPress,
  onToggleFavorite,
}: ExploreBusinessCardProps) {
  const cardWidth = large
    ? explorePremium.featuredCardWidth
    : explorePremium.featuredCardWidth - 44;
  const imageHeight = large
    ? explorePremium.featuredImageHeight
    : explorePremium.featuredImageHeight - 36;
  const location = getLocation(item);
  const hasRating = Boolean(reviewSummary && reviewSummary.count > 0);

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        {
          width: cardWidth,
          backgroundColor: "#FFFFFF",
          borderRadius: explorePremium.cardRadius,
          marginRight: explorePremium.cardGap,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(226,232,240,0.9)",
          ...explorePremium.shadow.card,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={{ position: "relative" }}>
        <Image
          recyclingKey={`explore-card-${getId(item)}`}
          source={{ uri: getImage(item) }}
          style={{
            width: cardWidth,
            height: imageHeight,
            backgroundColor: "#EEF2F6",
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />

        <Pressable
          onPress={() => onToggleFavorite(item)}
          style={({ pressed }) => ({
            position: "absolute",
            top: 12,
            right: 12,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: pressed
              ? "rgba(255,255,255,0.98)"
              : "rgba(255,255,255,0.94)",
            alignItems: "center",
            justifyContent: "center",
            ...explorePremium.shadow.cardSoft,
          })}
        >
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={20}
            color={saved ? theme.colors.danger : theme.colors.charcoal}
          />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 14, paddingTop: 13, paddingBottom: 15 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: large ? 17 : 16,
              fontWeight: "800",
              color: theme.colors.charcoal,
              letterSpacing: -0.3,
            }}
          >
            {getTitle(item)}
          </Text>
          {item.is_verified ? (
            <Ionicons
              name="checkmark-circle"
              size={17}
              color={theme.colors.turquoise}
            />
          ) : null}
        </View>

        <Text
          numberOfLines={1}
          style={{
            marginTop: 5,
            color: theme.colors.turquoise,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.2,
            textTransform: "uppercase",
          }}
        >
          {getCategory(item)}
        </Text>

        {hasRating ? (
          <View
            style={{
              marginTop: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: theme.colors.charcoal,
              }}
            >
              {reviewSummary!.averageRating.toFixed(1)}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.muted,
              }}
            >
              ({reviewSummary!.count})
            </Text>
          </View>
        ) : null}

        {location ? (
          <View
            style={{
              marginTop: hasRating ? 8 : 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons
              name="location-outline"
              size={14}
              color={theme.colors.muted}
            />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.muted,
              }}
            >
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
