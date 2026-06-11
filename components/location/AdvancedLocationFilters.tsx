import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  searchPlaceSuggestions,
  type PlaceSearchSuggestion,
} from "../../lib/addressAutocomplete";
import type { AppLocationState } from "../../lib/appLocation";
import { theme } from "../../lib/theme";

type MapTypeFilter = "all" | "businesses" | "events";

const MAP_TYPE_FILTERS: { key: MapTypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "businesses", label: "Businesses" },
  { key: "events", label: "Events" },
];

type AdvancedLocationFiltersProps = {
  locationState: AppLocationState;
  locating?: boolean;
  mapTypeFilter?: MapTypeFilter;
  openNowOnly?: boolean;
  showTypeFilters?: boolean;
  showOpenNow?: boolean;
  showSearchThisArea?: boolean;
  viewportDirty?: boolean;
  onCurrentLocation: () => void;
  onPlaceSelected: (place: PlaceSearchSuggestion) => void;
  onSearchThisArea?: () => void;
  onMapTypeFilterChange?: (typeFilter: MapTypeFilter) => void;
  onOpenNowChange?: (value: boolean) => void;
};

export function AdvancedLocationFilters({
  locationState,
  locating = false,
  mapTypeFilter = "all",
  openNowOnly = false,
  showTypeFilters = false,
  showOpenNow = false,
  showSearchThisArea = false,
  viewportDirty = false,
  onCurrentLocation,
  onPlaceSelected,
  onSearchThisArea,
  onMapTypeFilterChange,
  onOpenNowChange,
}: AdvancedLocationFiltersProps) {
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState<
    PlaceSearchSuggestion[]
  >([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const searchRequestId = useRef(0);

  useEffect(() => {
    const trimmed = placeQuery.trim();
    if (trimmed.length < 2) {
      setPlaceSuggestions([]);
      setSearchingPlaces(false);
      return;
    }

    const requestId = ++searchRequestId.current;
    setSearchingPlaces(true);

    const timer = setTimeout(() => {
      void searchPlaceSuggestions(trimmed)
        .then((results) => {
          if (searchRequestId.current !== requestId) return;
          setPlaceSuggestions(results);
        })
        .finally(() => {
          if (searchRequestId.current === requestId) {
            setSearchingPlaces(false);
          }
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [placeQuery]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: theme.colors.muted,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        Current Location
      </Text>

      <Pressable
        onPress={onCurrentLocation}
        disabled={locating}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 14,
          marginBottom: 14,
          backgroundColor:
            locationState.source === "current"
              ? "rgba(13,148,136,0.12)"
              : "rgba(13,148,136,0.08)",
          borderWidth: 1,
          borderColor:
            locationState.source === "current"
              ? "rgba(13,148,136,0.28)"
              : "rgba(13,148,136,0.22)",
          opacity: locating ? 0.65 : 1,
        }}
      >
        <Ionicons
          name="navigate-outline"
          size={18}
          color={theme.colors.turquoise}
        />
        <Text
          style={{
            marginLeft: 10,
            flex: 1,
            fontSize: 15,
            fontWeight: "800",
            color: theme.colors.charcoal,
          }}
        >
          Current Location
        </Text>
        {locating ? (
          <ActivityIndicator size="small" color={theme.colors.turquoise} />
        ) : locationState.source === "current" ? (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.turquoise}
          />
        ) : null}
      </Pressable>

      <Text
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: theme.colors.muted,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        Search City / Region
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 8,
          backgroundColor: "rgba(255,255,255,0.96)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.colors.turquoise}
          />
          <TextInput
            value={placeQuery}
            onChangeText={setPlaceQuery}
            placeholder="San Diego, Los Angeles, Toronto, Dallas..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 15,
              color: theme.colors.charcoal,
              paddingVertical: 0,
            }}
          />
          {searchingPlaces ? (
            <ActivityIndicator size="small" color={theme.colors.turquoise} />
          ) : null}
        </View>
      </View>

      {placeSuggestions.map((place) => {
        const active =
          locationState.source === "search" &&
          locationState.regionLabel === place.label;

        return (
          <Pressable
            key={place.id}
            onPress={() => {
              setPlaceQuery("");
              setPlaceSuggestions([]);
              onPlaceSelected(place);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 14,
              marginBottom: 6,
              backgroundColor: active
                ? "rgba(13,148,136,0.12)"
                : "transparent",
              borderWidth: 1,
              borderColor: active
                ? "rgba(13,148,136,0.28)"
                : theme.colors.border,
            }}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={active ? theme.colors.turquoise : theme.colors.muted}
            />
            <Text
              style={{
                marginLeft: 10,
                flex: 1,
                fontSize: 14,
                fontWeight: active ? "800" : "600",
                color: theme.colors.charcoal,
              }}
            >
              {place.label}
            </Text>
          </Pressable>
        );
      })}

      {showSearchThisArea ? (
        <>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "800",
              color: theme.colors.muted,
              marginTop: 10,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Search This Area
          </Text>

          <Pressable
            onPress={onSearchThisArea}
            disabled={!viewportDirty}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 14,
              marginBottom: 14,
              backgroundColor: viewportDirty
                ? "rgba(13,148,136,0.12)"
                : "rgba(243,244,246,0.9)",
              borderWidth: 1,
              borderColor: viewportDirty
                ? "rgba(13,148,136,0.28)"
                : theme.colors.border,
              opacity: viewportDirty ? 1 : 0.7,
            }}
          >
            <Ionicons
              name="scan-outline"
              size={18}
              color={viewportDirty ? theme.colors.turquoise : theme.colors.muted}
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: theme.colors.charcoal,
                }}
              >
                Search This Area
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontSize: 12,
                  color: theme.colors.muted,
                }}
              >
                {viewportDirty
                  ? "Refresh results for the visible map area"
                  : "Move the map to enable area search"}
              </Text>
            </View>
          </Pressable>
        </>
      ) : null}

      {showTypeFilters ? (
        <>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "800",
              color: theme.colors.muted,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Type
          </Text>

          {MAP_TYPE_FILTERS.map((item) => {
            const active = mapTypeFilter === item.key;

            return (
              <Pressable
                key={`type-${item.key}`}
                onPress={() => onMapTypeFilterChange?.(item.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  marginBottom: 6,
                  backgroundColor: active
                    ? "rgba(13,148,136,0.12)"
                    : "transparent",
                  borderWidth: 1,
                  borderColor: active
                    ? "rgba(13,148,136,0.28)"
                    : theme.colors.border,
                }}
              >
                <Ionicons
                  name={
                    item.key === "events"
                      ? "calendar-outline"
                      : item.key === "businesses"
                        ? "storefront-outline"
                        : "apps-outline"
                  }
                  size={18}
                  color={active ? theme.colors.turquoise : theme.colors.muted}
                />
                <Text
                  style={{
                    marginLeft: 10,
                    flex: 1,
                    fontSize: 15,
                    fontWeight: active ? "800" : "600",
                    color: theme.colors.charcoal,
                  }}
                >
                  {item.label}
                </Text>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.turquoise}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </>
      ) : null}

      {showOpenNow ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 14,
            marginTop: showTypeFilters ? 10 : 0,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: openNowOnly
              ? "rgba(13,148,136,0.08)"
              : "transparent",
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: theme.colors.charcoal,
              }}
            >
              Open Now
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 12,
                color: theme.colors.muted,
              }}
            >
              Show only businesses open right now
            </Text>
          </View>
          <Switch
            value={openNowOnly}
            onValueChange={(value) => onOpenNowChange?.(value)}
            trackColor={{
              false: "#D1D5DB",
              true: "rgba(13,148,136,0.45)",
            }}
            thumbColor={openNowOnly ? theme.colors.turquoise : "#F9FAFB"}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
