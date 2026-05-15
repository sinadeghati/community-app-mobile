import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function FavoritesScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const keys = await AsyncStorage.getAllKeys();

    const favoriteKeys = keys.filter((k) =>
      k.startsWith("favorite-business-data-")
    );

    const result = await AsyncStorage.multiGet(favoriteKeys);

    const parsed = result
      .map(([, value]) => {
        if (!value) return null;
        return JSON.parse(value);
      })
      .filter(Boolean);

    setItems(parsed);
  };

  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60, }}>
        <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  }}
>
  <Pressable onPress={() => router.back()}>
    <Text
      style={{
        fontSize: 18,
        fontWeight: "700",
      }}
    >
      ← Back
    </Text>
  </Pressable>
</View>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          marginBottom: 20,
        }}
      >
        Favorites
      </Text>

      {items.length === 0 ? (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 120,
    }}
  >
    <Text
      style={{
        fontSize: 50,
        marginBottom: 12,
      }}
    >
      ❤️
    </Text>

    <Text
      style={{
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 8,
      }}
    >
      No favorites yet
    </Text>

    <Text
      style={{
        fontSize: 16,
        color: "#777",
        textAlign: "center",
        paddingHorizontal: 30,
      }}
    >
      Businesses you save will appear here
    </Text>
  </View>
) : (

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push(`/profile/${item.id}`)
            }
            style={{
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: item.image }}
              style={{
                width: "100%",
                height: 180,
              }}
            />

           <View
              style={{
              padding: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              }}
             ></View>
                <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                {item.title}
              </Text>

              <Text
                style={{
                  color: "#666",
                  marginTop: 4,
                }}
              >
                {item.city}, {item.state}
              </Text>
            </View>
             <Pressable
  onPress={async () => {
    await AsyncStorage.removeItem(
      `favorite-business-data-${item.id}`
    );

    await AsyncStorage.removeItem(
        `favorite-business-${item.id}`
    );

    setItems((prev) =>
      prev.filter((x) => x.id !== item.id)
    );
  }}
>
  <Text
    style={{
      fontSize: 26,
    }}
  >
    ❤️
  </Text>
</Pressable>
          </Pressable>
        )}
      />
    )}
    </View>
  );
}