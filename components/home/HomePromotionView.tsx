import React from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { HomeActivePromotion } from "./homeLandingTypes";
import { homeLandingStyles } from "./homeLandingStyles";

type HomePromotionViewProps = {
  promotion: HomeActivePromotion;
};

export function HomePromotionView({ promotion }: HomePromotionViewProps) {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Image
        source={{ uri: promotion.imageUri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "rgba(6,20,24,0.35)" },
        ]}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "55%",
          backgroundColor: "rgba(4,16,20,0.62)",
        }}
      />

      <View style={homeLandingStyles.promotionOverlay} pointerEvents="box-none">
        {promotion.badge ? (
          <View style={homeLandingStyles.promotionBadge}>
            <Text style={homeLandingStyles.promotionBadgeText}>
              {promotion.badge}
            </Text>
          </View>
        ) : null}

        <Text style={homeLandingStyles.promotionTitle}>{promotion.title}</Text>
        {promotion.subtitle ? (
          <Text style={homeLandingStyles.promotionSubtitle}>
            {promotion.subtitle}
          </Text>
        ) : null}

        {promotion.ctas?.length ? (
          <View style={homeLandingStyles.promotionCtaRow}>
            {promotion.ctas.map((cta, index) => {
              const primary = index === 0;
              return (
                <Pressable
                  key={`${promotion.id}-${cta.label}`}
                  onPress={() => {
                    if (cta.route) router.push(cta.route as never);
                  }}
                  style={({ pressed }) => [
                    primary
                      ? homeLandingStyles.promotionCtaPrimary
                      : homeLandingStyles.promotionCtaSecondary,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text
                    style={
                      primary
                        ? homeLandingStyles.promotionCtaTextPrimary
                        : homeLandingStyles.promotionCtaTextSecondary
                    }
                  >
                    {cta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}
