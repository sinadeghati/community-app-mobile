import React, { useEffect, useMemo, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../lib/api";
import { theme } from "../../lib/theme";


type Business = {
  id?: number | string;
  title?: string;
  name?: string;
  business_name?: string;
  category?: string;
  business_category?: string;
  description?: string;
  about?: string;
  city?: string;
  state?: string;
  address?: string;
  street_address?: string;
  phone?: string;
  contact_info?: string;
  instagram?: string;
  website?: string;
  image?: string;
  image_url?: string;
  cover_image?: string;
  logo?: string;
  avatar?: string;
  profile_image?: string;
  images?: any[];
  rating?: number | string;
  reviews?: number | string;
  is_verified?: boolean;
  verified?: boolean;
  is_featured?: boolean;
  featured?: boolean;
  is_sponsored?: boolean;
  is_owner?: boolean;
  owner_is_current_user?: boolean;
  can_edit?: boolean;
  mine?: boolean;
};

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1600&auto=format&fit=crop";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=900&auto=format&fit=crop";

const getId = (item?: Business | null) => String(item?.id || "");

const getTitle = (item?: Business | null) =>
  item?.business_name || item?.name || item?.title || "Local Business";

const getCategory = (item?: Business | null) =>
  item?.business_category || item?.category || "Local Business";

const getCover = (item?: Business | null) =>
  item?.cover_image || item?.image_url || item?.image || DEFAULT_COVER;

const getAvatar = (item?: Business | null) =>
  item?.logo || item?.avatar || item?.profile_image || DEFAULT_AVATAR;

const getAddress = (item?: Business | null) =>
  item?.address ||
  item?.street_address ||
  [item?.city, item?.state].filter(Boolean).join(", ") ||
  "San Diego, CA";

const getPhone = (item?: Business | null) =>
  item?.phone || item?.contact_info || "";

const getAbout = (item?: Business | null) =>
  item?.about ||
  item?.description ||
  "A trusted local business serving the Persian community with professional service, local knowledge, and reliable support.";

const canEdit = (item?: Business | null) =>
  Boolean(item?.is_owner || item?.owner_is_current_user || item?.can_edit || item?.mine);

const isVerified = (item?: Business | null) =>
  Boolean(item?.is_verified || item?.verified);

const isFeatured = (item?: Business | null) =>
  Boolean(item?.is_featured || item?.featured || item?.is_sponsored);

export default function BusinessProfileV2() {
  const params = useLocalSearchParams();
  const profileId = String(params?.id || "");
  const [showFullAbout, setShowFullAbout] = useState(false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Photos" | "Services" | "Reviews"
  >("Overview");

  useEffect(() => {
    loadBusiness();
  }, [profileId]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const localRaw = await AsyncStorage.getItem(`profile_v2_${profileId}`);

      if (localRaw) {
        const localBusiness = JSON.parse(localRaw);
        setBusiness(localBusiness);
        setLoading(false);
        return;
      }

      let data: Business | null = null;



      if (!data) {
        const response = await API.getListings();
        const list = Array.isArray(response) ? response : response?.results || [];

        data =
          list.find((item: Business) => String(item?.id) === profileId) ||
          list[0] ||
          null;
      }

      setBusiness(data);

      if (data) {
        const saved = await AsyncStorage.getItem(`favorite-business-${getId(data)}`);
        setFavorite(saved === "true");
      }
    } catch (error) {
      console.log("Business profile load error:", error);
      Alert.alert("Error", "Could not load this business profile.");
    } finally {
      setLoading(false);
    }
  };

  const rating = business?.rating || "4.8";
  const reviews = business?.reviews || "24";
  const owner = canEdit(business);

  const photos = useMemo(() => {
    const result: string[] = [];

    const cover = getCover(business);
    const avatar = getAvatar(business);

    if (cover) result.push(cover);
    if (avatar && avatar !== cover) result.push(avatar);

    if (Array.isArray(business?.images)) {
      business.images.forEach((img: any) => {
        const uri = img?.image_url || img?.image || img?.url;
        if (uri && !result.includes(uri)) result.push(uri);
      });
    }

    return result.slice(0, 8);
  }, [business]); const toggleFavorite = async () => {
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
          title: getTitle(business),
          category: getCategory(business),
          image: getCover(business),
          address: getAddress(business),
          rating,
          reviews,
        })
      );
    } else {
      await AsyncStorage.removeItem(`favorite-business-${id}`);
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
    const query = encodeURIComponent(getAddress(business));
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const openInstagram = () => {
    const instagram = business?.instagram;

    if (!instagram) {
      Alert.alert("Instagram", "Instagram is not available yet.");
      return;
    }

    const cleanHandle = instagram.replace("@", "");
    const url = instagram.startsWith("http")
      ? instagram
      : `https://instagram.com/${cleanHandle}`;

    Linking.openURL(url);
  };

  const openMessage = async () => {
    const phone =
      business?.phone ||
      business?.contact_info ||
      "";

    if (!phone) {
      Alert.alert(
        "No phone number",
        "This business does not have a phone number yet."
      );
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, "");

    const smsUrl = `sms:${cleanPhone}`;

    try {
      await Linking.openURL(smsUrl);
    } catch (error) {
      Alert.alert(
        "Could not open messages",
        "Please try again later."
      );
    }
  };

  const openEdit = () => {
    if (!owner) {
      Alert.alert("Owner only", "Only the business owner can edit this profile.");
      return;
    }

    router.push({
      pathname: "/profile/edit-business",
      params: { id: getId(business) },
    });
  };

  const openGallery = () => {
    router.push({
      pathname: "/profile/gallery",
      params: { id: getId(business) },
    });
  };

  const shareBusiness = async () => {
    if (!business) return;

    await Share.share({
      message: `${getTitle(business)}\n${getCategory(business)}\n${getAddress(business)}`,
    });
  };

  const ActionButton = ({
    icon,
    label,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 92,
        borderRadius: 24,
        backgroundColor: theme.colors.card,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.soft,
      }}
    >
      <Ionicons name={icon} size={26} color={theme.colors.turquoise} />

      <Text
        style={{
          marginTop: 8,
          fontSize: 13,
          fontWeight: "900",
          color: theme.colors.charcoal,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const VerifiedBadge = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: "rgba(13,148,136,0.12)",
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: "rgba(13,148,136,0.25)",
      }}
    >
      <Ionicons name="checkmark-circle" size={17} color={theme.colors.turquoise} />

      <Text
        style={{
          marginLeft: 6,
          fontSize: 13,
          fontWeight: "900",
          color: theme.colors.turquoise,
        }}
      >
        Verified
      </Text>
    </View>
  );

  const Section = ({
    title,
    action,
    onActionPress,
    children,
  }: {
    title: string;
    action?: string;
    onActionPress?: () => void;
    children: React.ReactNode;
  }) => (
    <View
      style={{
        marginHorizontal: 18,
        marginTop: 18,
        backgroundColor: theme.colors.card,
        borderRadius: 30,
        padding: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.soft,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <Text
          style={{
            flex: 1,
            fontSize: 24,
            fontWeight: "900",
            color: theme.colors.charcoal,
          }}
        >
          {title}
        </Text>

        {action ? (
          <Pressable onPress={onActionPress}>
            <Text
              style={{
                color: theme.colors.turquoise,
                fontSize: 15,
                fontWeight: "900",
              }}
            >
              {action}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {children}
    </View>
  ); const HighlightBox = ({
    icon,
    value,
    label,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    label: string;
  }) => (
    <View
      style={{
        flex: 1,
        minHeight: 94,
        borderRadius: 22,
        backgroundColor: "rgba(13,148,136,0.10)",
        borderWidth: 1,
        borderColor: "rgba(13,148,136,0.18)",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
      }}
    >
      <Ionicons name={icon} size={22} color={theme.colors.turquoise} />

      <Text
        numberOfLines={1}
        style={{
          marginTop: 8,
          fontSize: 17,
          fontWeight: "900",
          color: theme.colors.charcoal,
        }}
      >
        {value}
      </Text>

      <Text
        numberOfLines={2}
        style={{
          marginTop: 4,
          fontSize: 12,
          lineHeight: 16,
          textAlign: "center",
          fontWeight: "700",
          color: theme.colors.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );

  const tabs: Array<"Overview" | "Photos" | "Services" | "Reviews"> = [
    "Overview",
    "Photos",
    "Services",
    "Reviews",
  ];

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

  if (!business) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.ivory,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "900",
            color: theme.colors.charcoal,
          }}
        >
          Business not found
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 18,
            backgroundColor: theme.colors.turquoise,
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.ivory }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 44 }}
      >
        <View style={{ height: 390 }}>
          <ImageBackground
            source={{ uri: getCover(business) }}
            resizeMode="cover"
            style={{
              height: 280,
              width: "100%",
              backgroundColor: theme.colors.deepTeal,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(6,31,36,0.36)",
              }}
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
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "rgba(255,255,255,0.94)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.charcoal}
                />
              </Pressable>

              <View style={{ flex: 1 }} />

              <Pressable
                onPress={shareBusiness}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "rgba(255,255,255,0.94)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Ionicons
                  name="share-outline"
                  size={23}
                  color={theme.colors.charcoal}
                />
              </Pressable>

              <Pressable
                onPress={toggleFavorite}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "rgba(255,255,255,0.94)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={favorite ? "heart" : "heart-outline"}
                  size={25}
                  color={favorite ? theme.colors.danger : theme.colors.charcoal}
                />
              </Pressable>
            </View>

            {owner ? (
              <Pressable
                onPress={openEdit}
                style={{
                  position: "absolute",
                  right: 18,
                  bottom: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.96)",
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                }}
              >
                <Ionicons
                  name="camera-outline"
                  size={17}
                  color={theme.colors.turquoise}
                />

                <Text
                  style={{
                    marginLeft: 6,
                    fontWeight: "900",
                    color: theme.colors.turquoise,
                    fontSize: 13,
                  }}
                >
                  Edit Cover
                </Text>
              </Pressable>
            ) : null}
          </ImageBackground>          <View
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              top: 220,
              backgroundColor: theme.colors.card,
              borderRadius: 34,
              padding: 18,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...theme.shadow.medium,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View>
                <Image
                  source={{ uri: getAvatar(business) }}
                  resizeMode="cover"
                  style={{
                    width: 94,
                    height: 94,
                    borderRadius: 30,
                    backgroundColor: "#eee",
                    borderWidth: 4,
                    borderColor: "#fff",
                  }}
                />

                {owner ? (
                  <Pressable
                    onPress={openEdit}
                    style={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: theme.colors.turquoise,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 3,
                      borderColor: "#fff",
                    }}
                  >
                    <Ionicons name="camera" size={15} color="#fff" />
                  </Pressable>
                ) : null}
              </View>

              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 25,
                    fontWeight: "900",
                    color: theme.colors.charcoal,
                  }}
                >
                  {getTitle(business)}
                </Text>

                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 5,
                    color: theme.colors.muted,
                    fontWeight: "800",
                    fontSize: 16,
                  }}
                >
                  {getCategory(business)}
                </Text>

                <View style={{ marginTop: 10 }}>
                  {isVerified(business) ? <VerifiedBadge /> : null}
                </View>
              </View>
            </View>

            <View
              style={{
                marginTop: 14,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.charcoal,
                  fontWeight: "900",
                  fontSize: 16,
                }}
              >
                {`⭐ ${rating} • ${reviews} reviews`}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: 5,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.success,
                    fontWeight: "900",
                    fontSize: 16,
                  }}
                >
                  {"• Open"}
                </Text>

                {owner && (
                  <Text
                    onPress={openEdit}
                    style={{
                      marginLeft: 8,
                      color: "#11998E",
                      fontWeight: "900",
                      fontSize: 15,
                    }}
                  >
                    • Edit
                  </Text>
                )}
              </View>
            </View>

            {isFeatured(business) ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: 10,
                  backgroundColor: "rgba(230,194,122,0.24)",
                  borderRadius: 999,
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: "rgba(230,194,122,0.5)",
                }}
              >
                <Text
                  style={{
                    color: "#9A6B10",
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  Featured
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 18,
            marginTop: 22,
          }}
        >
          <ActionButton icon="call" label="Call" onPress={openCall} />
          <ActionButton
            icon="chatbubble-ellipses-outline"
            label="Message"
            onPress={openMessage}
          />
          <ActionButton icon="navigate" label="Directions" onPress={openDirections} />
          <ActionButton icon="logo-instagram" label="Instagram" onPress={openInstagram} />

        </View>        <View
          style={{
            flexDirection: "row",
            marginTop: 24,
            marginHorizontal: 18,
            backgroundColor: theme.colors.card,
            borderRadius: 24,
            padding: 6,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadow.soft,
          }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab;

            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? "rgba(13,148,136,0.14)" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontWeight: "900",
                    color: active ? theme.colors.turquoise : theme.colors.muted,
                    fontSize: 13,
                  }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "Overview" ? (
          <>
            <Section title="About">
              <Text
                numberOfLines={showFullAbout ? undefined : 2}
                style={{
                  fontSize: 15.5,
                  lineHeight: 24,
                  color: theme.colors.charcoal,
                  fontWeight: "500",
                }}
              >
                {getAbout(business)}
              </Text>

              <Pressable
                onPress={() => setShowFullAbout(!showFullAbout)}
              >
                <Text
                  style={{
                    marginTop: 8,
                    color: theme.colors.turquoise,
                    fontWeight: "900",
                  }}
                >
                  {showFullAbout ? "See less" : "See more"}
                </Text>
              </Pressable>

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.border,
                  marginVertical: 16,
                }}
              />

              <Text
                style={{
                  fontSize: 15,
                  color: theme.colors.charcoal,
                  marginBottom: 8,
                }}
              >
                {`📍 ${getAddress(business)}`}
              </Text>

              {getPhone(business) ? (
                <Text style={{ fontSize: 15, color: theme.colors.charcoal }}>
                  {`📞 ${getPhone(business)}`}
                </Text>
              ) : null}
            </Section>

            <Section title="Highlights">
              <View style={{ flexDirection: "row", gap: 10 }}>
                <HighlightBox value="Active" label="Business" icon="flash" />
                <HighlightBox value={String(rating)} label="Rating" icon="star" />
                <HighlightBox value="Local" label="Community" icon="people" />
                <HighlightBox
                  value={isVerified(business) ? "Verified" : "Public"}
                  label="Profile"
                  icon="shield-checkmark"
                />
              </View>
            </Section>

            <Section title="Photos" action="See all" onActionPress={openGallery}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((uri, index) => (
                  <Pressable key={`${uri}-${index}`} onPress={openGallery}>
                    <Image
                      source={{ uri }}
                      style={{
                        width: 150,
                        height: 112,
                        borderRadius: 20,
                        marginRight: 12,
                        backgroundColor: "#eee",
                      }}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </Section>
          </>
        ) : null}        {activeTab === "Photos" ? (
          <Section title="Photos & Gallery" action="Open gallery" onActionPress={openGallery}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {photos.map((uri, index) => (
                <Pressable
                  key={`${uri}-${index}`}
                  onPress={openGallery}
                  style={{
                    width: "48%",
                    height: 136,
                    borderRadius: 20,
                    overflow: "hidden",
                    backgroundColor: "#eee",
                  }}
                >
                  <Image
                    source={{ uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        {activeTab === "Services" ? (
          <Section title="Services">
            {["Professional Service", "Customer Support", "Local Community", "Fast Response"].map(
              (service) => (
                <View
                  key={service}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: "rgba(13,148,136,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="checkmark" size={20} color={theme.colors.turquoise} />
                  </View>

                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 16,
                      fontWeight: "800",
                      color: theme.colors.charcoal,
                    }}
                  >
                    {service}
                  </Text>
                </View>
              )
            )}
          </Section>
        ) : null}

        {activeTab === "Reviews" ? (
          <>
            <Section title="Reviews" action="Write review">
              <Text
                style={{
                  fontSize: 18,
                  color: theme.colors.charcoal,
                  fontWeight: "900",
                }}
              >
                {`⭐ ${rating} average rating`}
              </Text>

              <Text
                style={{
                  marginTop: 8,
                  color: theme.colors.muted,
                  lineHeight: 22,
                }}
              >
                Real reviews and ratings will be connected after the backend review system is added.
              </Text>
            </Section>

            <Section title="Customer Highlights">
              <View style={{ flexDirection: "row", gap: 10 }}>
                <HighlightBox value={String(reviews)} label="Reviews" icon="chatbubbles" />
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