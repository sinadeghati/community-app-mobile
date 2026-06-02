import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../lib/api";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200";

const FALLBACK_LOGO =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600";

const getId = (item: any) =>
  String(item?.user?.id || item?.user_id || item?.owner_id || item?.id || "");

const getTitle = (item: any) =>
  item?.business_name || item?.name || item?.title || "Business";

const getCategory = (item: any) =>
  item?.business_category || item?.category || "Local Business";

const getCover = (item: any) =>
  item?.cover_image ||
  item?.image_url ||
  item?.image ||
  item?.images?.[0]?.image_url ||
  item?.images?.[0]?.image ||
  FALLBACK_COVER;

const getLogo = (item: any) =>
  item?.logo ||
  item?.avatar ||
  item?.profile_image ||
  item?.images?.[1]?.image_url ||
  getCover(item) ||
  FALLBACK_LOGO;

const getAddress = (item: any) =>
  item?.address ||
  item?.street_address ||
  [item?.city, item?.state].filter(Boolean).join(", ") ||
  "Address not available";

const getPhone = (item: any) => item?.phone || item?.contact_info || "";

const isOwner = (business: any) => {
  // Temporary frontend owner check.
  // Later this should come from backend: business.is_owner === true
  return Boolean(
    business?.is_owner ||
      business?.owner_is_current_user ||
      business?.can_edit ||
      business?.mine
  );
};

const isVerified = (business: any) =>
  Boolean(business?.is_verified || business?.verified || true);

const isFeatured = (business: any) =>
  Boolean(business?.is_featured || business?.featured || business?.is_sponsored);

export default function BusinessProfileV2() {
  const params = useLocalSearchParams();
  const profileId = String(params?.id || "");

  const [business, setBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    loadBusiness();
  }, [profileId]);

  const loadBusiness = async () => {
    try {
      setLoading(true);

      let data: any = null;

      if (profileId) {
        try {
          if (API.getListingDetail) {
            data = await API.getListingDetail(profileId);
          }
        } catch (e) {
          console.log("getListingDetail failed:", e);
        }
      }

      if (!data) {
        const response = await API.getListings();
        const list = Array.isArray(response) ? response : response?.results || [];
        data =
          list.find((item: any) => String(getId(item)) === profileId) ||
          list.find((item: any) => String(item?.id) === profileId) ||
          list[0];
      }

      setBusiness(data);

      if (data) {
        const fav = await AsyncStorage.getItem(`favorite-business-${getId(data)}`);
        setFavorite(fav === "true");
      }
    } catch (e) {
      console.log("Business Profile V2 load error:", e);
      Alert.alert("Error", "Could not load business profile.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!business) return;

    const id = getId(business);
    const next = !favorite;

    setFavorite(next);

    if (next) {
      await AsyncStorage.setItem(`favorite-business-${id}`, "true");
      await AsyncStorage.setItem(
        `favorite-business-data-${id}`,
        JSON.stringify({
          id,
          name: getTitle(business),
          category: getCategory(business),
          image: getCover(business),
          address: getAddress(business),
          rating: "4.8",
          reviews: 24,
        })
      );
    } else {
      await AsyncStorage.setItem(`favorite-business-${id}`, "false");
      await AsyncStorage.removeItem(`favorite-business-data-${id}`);
    }
  };

  const openCall = () => {
    const phone = getPhone(business);
    if (!phone) {
      Alert.alert("No phone number", "This business has no phone number yet.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const openDirections = () => {
    const q = encodeURIComponent(getAddress(business) || getTitle(business));
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const openInstagram = () => {
    const instagram = business?.instagram;

    if (!instagram) {
      Alert.alert("Instagram", "Instagram is not available yet.");
      return;
    }

    const url = instagram.startsWith("http")
      ? instagram
      : `https://instagram.com/${instagram}`;

    Linking.openURL(url);
  };

  const shareBusiness = async () => {
    await Share.share({
      message: `${getTitle(business)}\n${getCategory(business)}\n${getAddress(
        business
      )}`,
    });
  };

  const goEdit = () => {
    if (!business) return;

    router.push({
      pathname: "/profile/edit",
      params: { id: getId(business) },
    });
  };

  const photos = useMemo(() => {
    const arr = [];

    if (getCover(business)) arr.push(getCover(business));

    if (Array.isArray(business?.images)) {
      business.images.forEach((img: any) => {
        const uri = img?.image_url || img?.image;
        if (uri && !arr.includes(uri)) arr.push(uri);
      });
    }

    return arr.slice(0, 6);
  }, [business]);

  const services = [
    "Engine Repair",
    "Oil Change",
    "Diagnostics",
    "Brakes",
    "Maintenance",
  ];

  const tabs = ["Overview", "Photos", "Services", "Reviews"];

  const ActionButton = ({ icon, label, onPress }: any) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#eee",
      }}
    >
      <Ionicons name={icon} size={26} color="#111" />
      <Text
        style={{
          marginTop: 7,
          fontSize: 13,
          color: "#222",
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const Section = ({ title, action, children }: any) => (
    <View
      style={{
        backgroundColor: "#fff",
        marginHorizontal: 18,
        marginTop: 18,
        borderRadius: 26,
        padding: 18,
        borderWidth: 1,
        borderColor: "#eee",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <Text style={{ flex: 1, fontSize: 23, fontWeight: "900", color: "#111" }}>
          {title}
        </Text>
        {action ? (
          <Text style={{ color: "#2563eb", fontSize: 15, fontWeight: "800" }}>
            {action}
          </Text>
        ) : null}
      </View>

      {children}
    </View>
  );

  const HighlightBox = ({ value, label, icon }: any) => (
    <View
      style={{
        flex: 1,
        minHeight: 92,
        backgroundColor: "#f8fafc",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
      }}
    >
      <Ionicons name={icon} size={22} color="#2563eb" />
      <Text
        numberOfLines={1}
        style={{
          marginTop: 8,
          fontSize: 18,
          fontWeight: "900",
          color: "#111",
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          marginTop: 4,
          fontSize: 12,
          color: "#666",
          textAlign: "center",
          lineHeight: 16,
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f5f6f8",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f5f6f8",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "900" }}>Could not load profile</Text>
        <Text style={{ marginTop: 8, color: "#666", textAlign: "center" }}>
          Please go back and try again.
        </Text>
      </SafeAreaView>
    );
  }
    return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f6f8" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ height: 330 }}>
          <Image
            source={{ uri: getCover(business) }}
            style={{ width: "100%", height: 250 }}
            resizeMode="cover"
          />

          <View
            style={{
              position: "absolute",
              top: 14,
              left: 18,
              right: 18,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.92)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#111" />
            </Pressable>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={shareBusiness}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.92)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="share-outline" size={23} color="#111" />
            </Pressable>

            <Pressable
              onPress={toggleFavorite}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.92)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={25}
                color={favorite ? "#ef4444" : "#111"}
              />
            </Pressable>
          </View>

          <View
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              top: 205,
              backgroundColor: "#fff",
              borderRadius: 30,
              padding: 18,
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Image
                source={{ uri: getLogo(business) }}
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 43,
                  borderWidth: 4,
                  borderColor: "#fff",
                  backgroundColor: "#eee",
                }}
                resizeMode="cover"
              />

              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: 24,
                      fontWeight: "900",
                      color: "#111",
                    }}
                  >
                    {getTitle(business)}
                  </Text>

                  {isVerified(business) ? (
                    <Ionicons name="checkmark-circle" size={22} color="#2563eb" />
                  ) : null}
                </View>

                <Text style={{ marginTop: 5, color: "#666", fontSize: 14 }}>
                  {getCategory(business)}
                </Text>

                <Text style={{ marginTop: 8, color: "#444", fontSize: 14 }}>
                  ⭐ <Text style={{ fontWeight: "900" }}>4.8</Text> (24 reviews) ·{" "}
                  <Text style={{ color: "#16a34a", fontWeight: "900" }}>Open</Text>
                </Text>

                {isFeatured(business) ? (
                  <View
                    style={{
                      alignSelf: "flex-start",
                      marginTop: 9,
                      backgroundColor: "#fff7ed",
                      borderWidth: 1,
                      borderColor: "#f59e0b",
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ color: "#92400e", fontWeight: "900", fontSize: 12 }}>
                      ✨ Featured Business
                    </Text>
                  </View>
                ) : null}

                {isOwner(business) ? (
                  <Pressable
                    onPress={goEdit}
                    style={{
                      alignSelf: "flex-start",
                      marginTop: 10,
                      backgroundColor: "#f1f5f9",
                      paddingHorizontal: 13,
                      paddingVertical: 7,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: "#111", fontSize: 13 }}>
                      Edit Profile
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 18, marginTop: 18 }}>
          <ActionButton icon="call" label="Call" onPress={openCall} />
          <ActionButton icon="chatbubble" label="Message" onPress={() => Alert.alert("Message", "Messaging coming soon.")} />
          <ActionButton icon="navigate" label="Directions" onPress={openDirections} />
          <ActionButton icon="logo-instagram" label="Instagram" onPress={openInstagram} />
        </View>

        <View
          style={{
            flexDirection: "row",
            marginTop: 22,
            paddingHorizontal: 18,
            borderBottomWidth: 1,
            borderBottomColor: "#ddd",
          }}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{ flex: 1, paddingBottom: 12 }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 15,
                  fontWeight: activeTab === tab ? "900" : "700",
                  color: activeTab === tab ? "#111" : "#666",
                }}
              >
                {tab}
              </Text>

              {activeTab === tab ? (
                <View
                  style={{
                    height: 3,
                    backgroundColor: "#111",
                    borderRadius: 999,
                    marginTop: 10,
                  }}
                />
              ) : null}
            </Pressable>
          ))}
        </View>

        {activeTab === "Overview" ? (
          <>
            <Section title="About" action="See more ›">
              <Text style={{ fontSize: 15.5, lineHeight: 24, color: "#333" }}>
                {business?.about ||
                  business?.description ||
                  "A trusted local business serving the Persian community with reliable service and professional care."}
              </Text>

              <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 16 }} />

              {getPhone(business) ? (
                <Text style={{ fontSize: 15, color: "#111", marginBottom: 8 }}>
                  📞 {getPhone(business)}
                </Text>
              ) : null}

              <Text style={{ fontSize: 15, color: "#111" }}>📍 {getAddress(business)}</Text>
            </Section>

            <Section title="Highlights">
              <View style={{ flexDirection: "row", gap: 10 }}>
                <HighlightBox value="Active" label="Business" icon="flash" />
                <HighlightBox value="4.8" label="Rating" icon="star" />
                <HighlightBox value="Local" label="Community" icon="people" />
                <HighlightBox value="Verified" label="Profile" icon="shield-checkmark" />
              </View>
            </Section>

            <Section title="Photos" action="See all ›">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((uri, index) => (
                  <Image
                    key={`${uri}-${index}`}
                    source={{ uri }}
                    style={{
                      width: 150,
                      height: 110,
                      borderRadius: 18,
                      marginRight: 12,
                      backgroundColor: "#eee",
                    }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </Section>
          </>
        ) : null}

        {activeTab === "Photos" ? (
          <Section title="Photos & Highlights">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {photos.map((uri, index) => (
                <Image
                  key={`${uri}-${index}`}
                  source={{ uri }}
                  style={{
                    width: "48%",
                    height: 135,
                    borderRadius: 18,
                    backgroundColor: "#eee",
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </Section>
        ) : null}

        {activeTab === "Services" ? (
          <Section title="Services">
            {services.map((service) => (
              <View
                key={service}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: "700", color: "#111" }}>
                  {service}
                </Text>
              </View>
            ))}
          </Section>
        ) : null}

        {activeTab === "Reviews" ? (
          <>
            <Section title="Reviews" action="See all ›">
              <Text style={{ fontSize: 18, color: "#111" }}>
                ⭐ <Text style={{ fontWeight: "900" }}>4.8</Text> average rating from local customers.
              </Text>
            </Section>

            <Section title="Customer Highlights">
              <View style={{ flexDirection: "row", gap: 10 }}>
                <HighlightBox value="24" label="Reviews" icon="chatbubbles" />
                <HighlightBox value="98%" label="Positive" icon="thumbs-up" />
                <HighlightBox value="Local" label="Trusted" icon="location" />
              </View>
            </Section>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}