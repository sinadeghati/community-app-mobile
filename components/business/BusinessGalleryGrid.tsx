import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";

const GRID_GAP = 10;

type BusinessGalleryGridProps = {
  uris: string[];
  onPressPhoto?: (uri: string) => void;
  tileHeight?: number;
};

export function BusinessGalleryGrid({
  uris,
  onPressPhoto,
  tileHeight = 132,
}: BusinessGalleryGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const tileWidth =
    containerWidth > 0 ? (containerWidth - GRID_GAP) / 2 : undefined;

  return (
    <View
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0 && width !== containerWidth) {
          setContainerWidth(width);
        }
      }}
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: GRID_GAP,
      }}
    >
      {uris.map((uri, index) => {
        const content = (
          <Image
            source={{ uri }}
            style={{
              width: tileWidth ?? "100%",
              height: tileHeight,
              borderRadius: 14,
              backgroundColor: "#E8EAED",
            }}
            resizeMode="cover"
          />
        );

        if (!onPressPhoto || !tileWidth) {
          return (
            <View key={`${uri}-${index}`} style={{ width: tileWidth ?? "48%" }}>
              {content}
            </View>
          );
        }

        return (
          <Pressable
            key={`${uri}-${index}`}
            onPress={() => onPressPhoto(uri)}
            style={{ width: tileWidth }}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}
