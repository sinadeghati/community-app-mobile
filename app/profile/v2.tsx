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
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../lib/api";
import { getBusinessMenuItems, type BusinessMenuItem } from "../../lib/businessMenuItems";
import {
  formatBusinessUpdateExpiration,
  getBusinessUpdateTypeLabel,
  getVisibleBusinessUpdates,
  type BusinessUpdate,
  type BusinessUpdateType,
} from "../../lib/businessUpdates";
import {
  getBusinessHoursDisplay,
  getBusinessHoursFromRecord,
  getWeeklyHoursRows,
} from "../../lib/businessHours";
import {
  createReviewId,
  formatReviewRelativeTime,
  getCurrentReviewer,
  loadBusinessReviews,
  saveBusinessReview,
  saveOwnerReply,
  summarizeBusinessReviews,
  type BusinessReview,
  type CurrentReviewer,
} from "../../lib/businessReviews";
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
  menu_items?: BusinessMenuItem[];
  menuItems?: BusinessMenuItem[];
  business_updates?: BusinessUpdate[];
  businessUpdates?: BusinessUpdate[];
  business_hours?: unknown;
  businessHours?: unknown;
  hours_configured?: boolean;
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

const getInstagram = (item?: Business | null) => String(item?.instagram || "").trim();

const UPDATE_TYPE_ICONS: Record<
  BusinessUpdateType,
  keyof typeof Ionicons.glyphMap
> = {
  special: "pricetag-outline",
  offer: "gift-outline",
  event: "calendar-outline",
  announcement: "megaphone-outline",
};

function BusinessUpdateCard({ update }: { update: BusinessUpdate }) {
  const expiration = formatBusinessUpdateExpiration(update.expiresAt);

  return (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "rgba(13,148,136,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={UPDATE_TYPE_ICONS[update.type]}
            size={20}
            color={theme.colors.turquoise}
          />
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: theme.colors.turquoise,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            {getBusinessUpdateTypeLabel(update.type)}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 15,
              fontWeight: "800",
              color: theme.colors.charcoal,
            }}
          >
            {update.title}
          </Text>
          {update.description ? (
            <Text
              style={{
                marginTop: 4,
                fontSize: 14,
                lineHeight: 21,
                color: theme.colors.charcoal,
              }}
            >
              {update.description}
            </Text>
          ) : null}
          {expiration ? (
            <Text
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.muted,
              }}
            >
              {expiration}
            </Text>
          ) : null}
        </View>
      </View>

      {update.image ? (
        <Image
          source={{ uri: update.image }}
          style={{
            width: "100%",
            height: 140,
            borderRadius: theme.radius.sm,
            marginTop: 12,
            backgroundColor: "#eee",
          }}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}

const profileSectionCardStyle = {
  marginHorizontal: theme.spacing.md,
  marginTop: theme.spacing.md,
  backgroundColor: theme.colors.card,
  borderRadius: theme.radius.md,
  padding: theme.spacing.md,
  borderWidth: 1,
  borderColor: theme.colors.border,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

function ReviewStarsDisplay({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={size}
          color="#C49A3A"
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

function StarRatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={8}>
          <Ionicons
            name={star <= value ? "star" : "star-outline"}
            size={28}
            color="#C49A3A"
            style={{ marginRight: 6 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

function WriteReviewForm({
  draftRating,
  draftText,
  onChangeRating,
  onChangeText,
  onSubmit,
  submitting,
}: {
  draftRating: number;
  draftText: string;
  onChangeRating: (rating: number) => void;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <>
      <StarRatingPicker value={draftRating} onChange={onChangeRating} />
      <TextInput
        value={draftText}
        onChangeText={onChangeText}
        placeholder="Share your experience with this business..."
        placeholderTextColor={theme.colors.muted}
        multiline
        textAlignVertical="top"
        style={{
          minHeight: 100,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.softCard,
          padding: 12,
          fontSize: 14,
          color: theme.colors.charcoal,
        }}
      />
      <Pressable
        onPress={onSubmit}
        disabled={submitting}
        style={{
          marginTop: 12,
          height: 44,
          borderRadius: theme.radius.sm,
          backgroundColor: submitting ? theme.colors.muted : theme.colors.turquoise,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
          {submitting ? "Submitting..." : "Submit review"}
        </Text>
      </Pressable>
    </>
  );
}

function PostedReviewPreview({ review }: { review: BusinessReview }) {
  return (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: theme.colors.charcoal,
          }}
        >
          {review.username}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.muted,
            fontWeight: "600",
          }}
        >
          {formatReviewRelativeTime(review.createdAt)}
        </Text>
      </View>
      <View style={{ marginTop: 6 }}>
        <ReviewStarsDisplay rating={review.rating} />
      </View>
      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          lineHeight: 21,
          color: theme.colors.charcoal,
        }}
      >
        {review.text}
      </Text>
    </View>
  );
}

function WriteReviewSection({
  currentReviewer,
  isBusinessOwner,
  userReview,
  onLoginPress,
  draftRating,
  draftText,
  onChangeRating,
  onChangeText,
  onSubmit,
  submittingReview,
}: {
  currentReviewer: CurrentReviewer | null;
  isBusinessOwner: boolean;
  userReview: BusinessReview | null;
  onLoginPress: () => void;
  draftRating: number;
  draftText: string;
  onChangeRating: (rating: number) => void;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  submittingReview: boolean;
}) {
  return (
    <View style={profileSectionCardStyle}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: theme.colors.charcoal,
          marginBottom: theme.spacing.sm,
        }}
      >
        Write a review
      </Text>

      {!currentReviewer ? (
        <Pressable onPress={onLoginPress}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: theme.colors.turquoise,
            }}
          >
            Log in to write a review
          </Text>
        </Pressable>
      ) : isBusinessOwner ? (
        <Text
          style={{
            fontSize: 14,
            lineHeight: 21,
            color: theme.colors.muted,
            fontWeight: "600",
          }}
        >
          You can&apos;t review your own business.
        </Text>
      ) : userReview ? (
        <PostedReviewPreview review={userReview} />
      ) : (
        <WriteReviewForm
          draftRating={draftRating}
          draftText={draftText}
          onChangeRating={onChangeRating}
          onChangeText={onChangeText}
          onSubmit={onSubmit}
          submitting={submittingReview}
        />
      )}
    </View>
  );
}

export default function BusinessProfileV2() {
  const params = useLocalSearchParams();
  const profileId = String(params?.id || "");
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [currentReviewer, setCurrentReviewer] = useState<CurrentReviewer | null>(
    null
  );
  const [draftRating, setDraftRating] = useState(5);
  const [draftText, setDraftText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(
    null
  );

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Photos" | "Services" | "Reviews"
  >("Overview");

  useEffect(() => {
    loadBusiness();
  }, [profileId]);

  const focusUpdates = String(params?.focus || "") === "updates";

  useEffect(() => {
    if (!focusUpdates || loading) return;
    setActiveTab("Services");
  }, [focusUpdates, loading, profileId]);

  useFocusEffect(
    React.useCallback(() => {
      getCurrentReviewer().then(setCurrentReviewer);
      if (String(params?.focus || "") === "updates") {
        setActiveTab("Services");
      }
    }, [params?.focus])
  );

  useEffect(() => {
    let cancelled = false;

    const resolveOwner = async () => {
      if (!business) {
        if (!cancelled) setIsBusinessOwner(false);
        return;
      }

      if (canEdit(business)) {
        if (!cancelled) setIsBusinessOwner(true);
        return;
      }

      const businessId = getId(business);

      try {
        const localRaw = await AsyncStorage.getItem("my_local_businesses");
        const localList = localRaw ? JSON.parse(localRaw) : [];
        if (
          Array.isArray(localList) &&
          localList.some((item) => String(item?.id) === businessId)
        ) {
          if (!cancelled) setIsBusinessOwner(true);
          return;
        }

        const profileRaw = await AsyncStorage.getItem("user_profile_v2");
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          if (
            profile?.business_id &&
            String(profile.business_id) === businessId
          ) {
            if (!cancelled) setIsBusinessOwner(true);
            return;
          }
        }
      } catch {
        // fall through to not-owner
      }

      if (!cancelled) setIsBusinessOwner(false);
    };

    resolveOwner();

    return () => {
      cancelled = true;
    };
  }, [business]);

  const refreshReviews = async () => {
    const businessReviews = await loadBusinessReviews(profileId);
    setReviews(businessReviews);
    setCurrentReviewer(await getCurrentReviewer());
  };

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const localRaw = await AsyncStorage.getItem(`profile_v2_${profileId}`);

      if (localRaw) {
        const localBusiness = JSON.parse(localRaw);
        setBusiness(localBusiness);

        const saved = await AsyncStorage.getItem(
          `favorite-business-${getId(localBusiness)}`
        );
        setFavorite(saved === "true");
        return;
      }

      let data: Business | null = null;



      if (!data) {
        const response = await API.getListings();
        const list = Array.isArray(response) ? response : response?.results || [];

        data =
          list.find((item: Business) => String(item?.id) === profileId) || null;
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
      await refreshReviews();
      setLoading(false);
    }
  };

  const owner = canEdit(business);

  const reviewSummary = useMemo(
    () => summarizeBusinessReviews(reviews),
    [reviews]
  );

  const userReview = useMemo(() => {
    if (!currentReviewer) return null;
    return reviews.find((review) => review.userId === currentReviewer.userId) ?? null;
  }, [reviews, currentReviewer]);

  const otherReviews = useMemo(() => {
    if (!userReview) return reviewSummary.reviews;
    return reviewSummary.reviews.filter((review) => review.id !== userReview.id);
  }, [reviewSummary.reviews, userReview]);

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
  }, [business]);

  const galleryPhotos = useMemo(() => {
    const result: string[] = [];

    if (!Array.isArray(business?.images)) return result;

    business.images.forEach((img: any) => {
      const uri = img?.image_url || img?.image || img?.url;
      if (uri && !result.includes(uri)) result.push(uri);
    });

    return result;
  }, [business]);

  const hasInstagram = Boolean(getInstagram(business));

  const menuItems = useMemo(() => getBusinessMenuItems(business), [business]);
  const businessUpdates = useMemo(
    () => getVisibleBusinessUpdates(business),
    [business]
  );

  const businessHours = useMemo(
    () => getBusinessHoursFromRecord(business),
    [business]
  );

  const hoursDisplay = useMemo(
    () => getBusinessHoursDisplay(businessHours),
    [businessHours]
  );

  const weeklyHours = useMemo(
    () => getWeeklyHoursRows(businessHours),
    [businessHours]
  );

  const hoursToneColor =
    hoursDisplay.tone === "open"
      ? theme.colors.success
      : hoursDisplay.tone === "closed"
        ? theme.colors.muted
        : theme.colors.muted;

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
          title: getTitle(business),
          category: getCategory(business),
          image: getCover(business),
          address: getAddress(business),
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
    const instagram = getInstagram(business);

    if (!instagram) {
      Alert.alert("Instagram", "This business has not added Instagram yet.");
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

  const openLoginForReview = () => {
    Alert.alert("Login required", "Please log in to write a review.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log in", onPress: () => router.push("/(tabs)") },
    ]);
  };

  const openWriteReview = async () => {
    const reviewer = await getCurrentReviewer();

    if (!reviewer) {
      openLoginForReview();
      return;
    }

    setCurrentReviewer(reviewer);
    setActiveTab("Reviews");
  };

  const submitReview = async () => {
    if (!business || !currentReviewer) {
      openWriteReview();
      return;
    }

    if (isBusinessOwner) {
      Alert.alert(
        "Owner review",
        "You can't review your own business."
      );
      return;
    }

    const text = draftText.trim();
    if (!text) {
      Alert.alert("Review required", "Please write a short review before submitting.");
      return;
    }

    if (draftRating < 1 || draftRating > 5) {
      Alert.alert("Rating required", "Please select a star rating from 1 to 5.");
      return;
    }

    try {
      setSubmittingReview(true);

      const saved = await saveBusinessReview(profileId, {
        id: createReviewId(),
        businessId: profileId,
        userId: currentReviewer.userId,
        username: currentReviewer.username,
        rating: draftRating,
        text,
        createdAt: new Date().toISOString(),
      });

      setReviews(saved);
      setDraftText("");
      setDraftRating(5);
      Alert.alert("Thank you", "Your review has been posted.");
    } catch (error: any) {
      if (error?.message === "duplicate_review") {
        Alert.alert(
          "Already reviewed",
          "You have already left a review for this business."
        );
      } else {
        Alert.alert("Error", "Could not submit your review. Please try again.");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitOwnerReply = async (reviewId: string) => {
    const text = (replyDrafts[reviewId] || "").trim();
    if (!text) {
      Alert.alert("Reply required", "Please write a short reply before posting.");
      return;
    }

    try {
      setSubmittingReplyId(reviewId);
      const saved = await saveOwnerReply(profileId, reviewId, text);
      setReviews(saved);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      Alert.alert("Posted", "Your reply is now visible under the review.");
    } catch (error: any) {
      if (error?.message === "duplicate_reply") {
        Alert.alert("Already replied", "You have already replied to this review.");
      } else {
        Alert.alert("Error", "Could not post your reply. Please try again.");
      }
    } finally {
      setSubmittingReplyId(null);
    }
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
    accent,
    disabled,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    accent?: boolean;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        height: 64,
        borderRadius: theme.radius.sm,
        backgroundColor: accent
          ? theme.colors.turquoise
          : "rgba(255,255,255,0.98)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: accent ? 0 : 1,
        borderColor: "rgba(229,231,235,0.95)",
        paddingHorizontal: 4,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={
          disabled
            ? theme.colors.muted
            : accent
              ? "#fff"
              : theme.colors.turquoise
        }
      />

      <Text
        style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: "700",
          color: disabled
            ? theme.colors.muted
            : accent
              ? "#fff"
              : theme.colors.charcoal,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const EmptyState = ({
    icon,
    title,
    subtitle,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
  }) => (
    <View
      style={{
        alignItems: "center",
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.sm,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "rgba(13,148,136,0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: theme.spacing.sm,
        }}
      >
        <Ionicons name={icon} size={24} color={theme.colors.turquoise} />
      </View>

      <Text
        style={{
          fontSize: 15,
          fontWeight: "800",
          color: theme.colors.charcoal,
          textAlign: "center",
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            lineHeight: 20,
            color: theme.colors.muted,
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  const ActivityPlaceholder = ({
    icon,
    title,
    description,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
  }) => (
    <View
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "rgba(13,148,136,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={20} color={theme.colors.turquoise} />
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: theme.colors.charcoal,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 13,
              lineHeight: 19,
              color: theme.colors.muted,
            }}
          >
            {description}
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 11,
              fontWeight: "700",
              color: theme.colors.turquoise,
            }}
          >
            Coming soon
          </Text>
        </View>
      </View>
    </View>
  );

  const VerifiedBadge = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: "rgba(13,148,136,0.1)",
        borderRadius: theme.radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: "rgba(13,148,136,0.22)",
      }}
    >
      <Ionicons name="checkmark-circle" size={15} color={theme.colors.turquoise} />

      <Text
        style={{
          marginLeft: 5,
          fontSize: 12,
          fontWeight: "700",
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
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: "800",
            color: theme.colors.charcoal,
          }}
        >
          {title}
        </Text>

        {action ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text
              style={{
                color: theme.colors.turquoise,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {action}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {children}
    </View>
  );

  const ReviewStars = ({
    rating,
    size = 14,
  }: {
    rating: number;
    size?: number;
  }) => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={size}
          color="#C49A3A"
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  const ReviewCard = ({
    review,
    showOwnerReplyEditor = false,
  }: {
    review: BusinessReview;
    showOwnerReplyEditor?: boolean;
  }) => (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: theme.colors.charcoal,
          }}
        >
          {review.username}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.muted,
            fontWeight: "600",
          }}
        >
          {formatReviewRelativeTime(review.createdAt)}
        </Text>
      </View>

      <View style={{ marginTop: 6 }}>
        <ReviewStars rating={review.rating} />
      </View>

      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          lineHeight: 21,
          color: theme.colors.charcoal,
        }}
      >
        {review.text}
      </Text>

      {review.ownerReply ? (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.softCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: theme.colors.turquoise,
              letterSpacing: 0.3,
            }}
          >
            Owner response
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontSize: 14,
              lineHeight: 21,
              color: theme.colors.charcoal,
            }}
          >
            {review.ownerReply.text}
          </Text>
        </View>
      ) : showOwnerReplyEditor ? (
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: theme.colors.muted,
              marginBottom: 8,
            }}
          >
            Reply as owner
          </Text>
          <TextInput
            value={replyDrafts[review.id] || ""}
            onChangeText={(value) =>
              setReplyDrafts((prev) => ({ ...prev, [review.id]: value }))
            }
            placeholder="Write a public response..."
            placeholderTextColor={theme.colors.muted}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 72,
              borderRadius: theme.radius.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.softCard,
              padding: 12,
              fontSize: 14,
              color: theme.colors.charcoal,
            }}
          />
          <Pressable
            onPress={() => submitOwnerReply(review.id)}
            disabled={submittingReplyId === review.id}
            style={{
              marginTop: 10,
              height: 40,
              borderRadius: theme.radius.sm,
              backgroundColor:
                submittingReplyId === review.id
                  ? theme.colors.muted
                  : theme.colors.turquoise,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
              {submittingReplyId === review.id ? "Posting..." : "Post reply"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const HighlightBox = ({
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
        minHeight: 84,
        borderRadius: theme.radius.sm,
        backgroundColor: "rgba(13,148,136,0.08)",
        borderWidth: 1,
        borderColor: "rgba(13,148,136,0.14)",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
      }}
    >
      <Ionicons name={icon} size={20} color={theme.colors.turquoise} />

      <Text
        numberOfLines={1}
        style={{
          marginTop: 6,
          fontSize: 15,
          fontWeight: "800",
          color: theme.colors.charcoal,
        }}
      >
        {value}
      </Text>

      <Text
        numberOfLines={2}
        style={{
          marginTop: 3,
          fontSize: 11,
          lineHeight: 15,
          textAlign: "center",
          fontWeight: "600",
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
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
      >
        <View style={{ height: 352 }}>
          <ImageBackground
            source={{ uri: getCover(business) }}
            resizeMode="cover"
            style={{
              height: 248,
              width: "100%",
              backgroundColor: theme.colors.deepTeal,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(15,43,51,0.28)",
              }}
            />

            <View
              style={{
                position: "absolute",
                top: theme.spacing.sm,
                left: theme.spacing.md,
                right: theme.spacing.md,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Pressable
                onPress={() => router.back()}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.97)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(229,231,235,0.95)",
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={theme.colors.charcoal}
                />
              </Pressable>

              <View style={{ flex: 1 }} />

              <Pressable
                onPress={shareBusiness}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.97)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: "rgba(229,231,235,0.95)",
                }}
              >
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={theme.colors.charcoal}
                />
              </Pressable>

              <Pressable
                onPress={toggleFavorite}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.97)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(229,231,235,0.95)",
                }}
              >
                <Ionicons
                  name={favorite ? "heart" : "heart-outline"}
                  size={22}
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
          </ImageBackground>
          <View
            style={{
              position: "absolute",
              left: theme.spacing.md,
              right: theme.spacing.md,
              top: 196,
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ marginTop: -36 }}>
                <Image
                  source={{ uri: getAvatar(business) }}
                  resizeMode="cover"
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 16,
                    backgroundColor: "#eee",
                    borderWidth: 3,
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

              <View style={{ flex: 1, marginLeft: 14, paddingTop: 2 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: theme.colors.charcoal,
                  }}
                >
                  {getTitle(business)}
                </Text>

                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 4,
                    color: theme.colors.muted,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {getCategory(business)}
                </Text>

                <View style={{ marginTop: 8 }}>
                  {isVerified(business) ? <VerifiedBadge /> : null}
                </View>
              </View>
            </View>

            <View style={{ marginTop: theme.spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {reviewSummary.count > 0 ? (
                  <Text
                    style={{
                      color: theme.colors.charcoal,
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    {`⭐ ${reviewSummary.averageRating.toFixed(1)} · ${reviewSummary.count} review${reviewSummary.count === 1 ? "" : "s"}`}
                  </Text>
                ) : (
                  <Text
                    style={{
                      color: theme.colors.muted,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {" · No reviews yet"}
                  </Text>
                )}

                <Text
                  style={{
                    marginLeft: 5,
                    color: hoursToneColor,
                    fontWeight: "700",
                    fontSize: 14,
                  }}
                >
                  {` · ${hoursDisplay.primary}`}
                </Text>

                {owner ? (
                  <Text
                    onPress={openEdit}
                    style={{
                      marginLeft: 6,
                      color: theme.colors.turquoise,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    · Edit
                  </Text>
                ) : null}
              </View>

              {hoursDisplay.secondary ? (
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme.colors.muted,
                  }}
                >
                  {hoursDisplay.secondary}
                </Text>
              ) : null}
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
            gap: 8,
            paddingHorizontal: theme.spacing.md,
            marginTop: theme.spacing.md,
          }}
        >
          <ActionButton icon="call" label="Call" onPress={openCall} accent />
          <ActionButton
            icon="chatbubble-ellipses-outline"
            label="Message"
            onPress={openMessage}
          />
          <ActionButton icon="navigate" label="Directions" onPress={openDirections} />
          <ActionButton
            icon="logo-instagram"
            label="Instagram"
            onPress={openInstagram}
            disabled={!hasInstagram}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            marginTop: theme.spacing.md,
            marginHorizontal: theme.spacing.md,
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.sm,
            padding: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
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
                  height: 38,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? "rgba(13,148,136,0.12)" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    color: active ? theme.colors.turquoise : theme.colors.muted,
                    fontSize: 12,
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
                  fontSize: 14,
                  lineHeight: 22,
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
                    fontWeight: "700",
                    fontSize: 13,
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

              <View style={{ marginBottom: 16 }}>
                {businessHours ? (
                  <>
                    <Pressable
                      onPress={() => setHoursExpanded((open) => !open)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        borderRadius: theme.radius.sm,
                        backgroundColor: "rgba(13,148,136,0.06)",
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: "rgba(13,148,136,0.12)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color={theme.colors.turquoise}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "800",
                            color: theme.colors.charcoal,
                          }}
                        >
                          Business hours
                        </Text>
                        <Text
                          style={{
                            marginTop: 3,
                            fontSize: 13,
                            fontWeight: "600",
                            color: hoursToneColor,
                          }}
                        >
                          {hoursDisplay.primary}
                        </Text>
                      </View>

                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: theme.colors.turquoise,
                          marginRight: 4,
                        }}
                      >
                        {hoursExpanded ? "Hide" : "View hours"}
                      </Text>
                      <Ionicons
                        name={hoursExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={theme.colors.turquoise}
                      />
                    </Pressable>

                    {hoursExpanded ? (
                      <View
                        style={{
                          marginTop: 8,
                          padding: 10,
                          borderRadius: theme.radius.sm,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.softCard,
                        }}
                      >
                        {weeklyHours.map((row) => (
                          <View
                            key={row.key}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingVertical: 8,
                              paddingHorizontal: row.isToday ? 8 : 0,
                              borderRadius: 8,
                              backgroundColor: row.isToday
                                ? "rgba(13,148,136,0.12)"
                                : "transparent",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: row.isToday ? "800" : "600",
                                color: row.isToday
                                  ? theme.colors.turquoise
                                  : theme.colors.charcoal,
                              }}
                            >
                              {row.label}
                              {row.isToday ? " · Today" : ""}
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color: row.hoursText === "Closed"
                                  ? theme.colors.muted
                                  : theme.colors.charcoal,
                              }}
                            >
                              {row.hoursText}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      borderRadius: theme.radius.sm,
                      backgroundColor: theme.colors.softCard,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={theme.colors.muted}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: theme.colors.muted,
                      }}
                    >
                      Hours not added
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={theme.colors.turquoise}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 14,
                    lineHeight: 20,
                    color: theme.colors.charcoal,
                  }}
                >
                  {getAddress(business)}
                </Text>
              </View>

              {getPhone(business) ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={theme.colors.turquoise}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      color: theme.colors.charcoal,
                    }}
                  >
                    {getPhone(business)}
                  </Text>
                </View>
              ) : null}
            </Section>

            <Section title="Updates">
              {businessUpdates.length > 0 ? (
                businessUpdates.map((update) => (
                  <BusinessUpdateCard key={update.id} update={update} />
                ))
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 21,
                    color: theme.colors.muted,
                    fontWeight: "600",
                  }}
                >
                  No updates yet.
                </Text>
              )}
            </Section>

            <Section title="Highlights">
              <View style={{ flexDirection: "row", gap: 10 }}>
                <HighlightBox value="Active" label="Business" icon="flash" />
                <HighlightBox
                  value={
                    reviewSummary.count > 0
                      ? reviewSummary.averageRating.toFixed(1)
                      : "—"
                  }
                  label="Rating"
                  icon="star"
                />
                <HighlightBox value="Local" label="Community" icon="people" />
                <HighlightBox
                  value={isVerified(business) ? "Verified" : "Public"}
                  label="Profile"
                  icon="shield-checkmark"
                />
              </View>
            </Section>

            <Section
              title="Photos"
              action={
                galleryPhotos.length > 0 || photos.length > 0 ? "See all" : undefined
              }
              onActionPress={openGallery}
            >
              {galleryPhotos.length > 0 || photos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  contentContainerStyle={{
                    paddingRight: theme.spacing.sm,
                    paddingTop: 2,
                  }}
                >
                  {(galleryPhotos.length > 0 ? galleryPhotos : photos).map(
                    (uri, index) => (
                      <Pressable key={`${uri}-${index}`} onPress={openGallery}>
                        <Image
                          source={{ uri }}
                          style={{
                            width: 148,
                            height: 108,
                            borderRadius: 14,
                            marginRight: 10,
                            backgroundColor: "#eee",
                          }}
                          resizeMode="cover"
                        />
                      </Pressable>
                    )
                  )}
                </ScrollView>
              ) : (
                <EmptyState
                  icon="images-outline"
                  title="No photos yet"
                  subtitle="Gallery photos will appear here when added."
                />
              )}
            </Section>
          </>
        ) : null}
        {activeTab === "Photos" ? (
          <Section
            title="Photos & Gallery"
            action={galleryPhotos.length > 0 ? "Open gallery" : undefined}
            onActionPress={openGallery}
          >
            {galleryPhotos.length > 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  paddingTop: 4,
                }}
              >
                {galleryPhotos.map((uri, index) => (
                  <Pressable
                    key={`${uri}-${index}`}
                    onPress={openGallery}
                    style={{
                      width: "48%",
                      height: 128,
                      borderRadius: 14,
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
            ) : (
              <EmptyState
                icon="images-outline"
                title="No photos yet"
                subtitle={
                  owner
                    ? "Add photos to your gallery so customers can see your space and work."
                    : "This business has not uploaded gallery photos yet."
                }
              />
            )}
          </Section>
        ) : null}

        {activeTab === "Services" ? (
          <>
            <Section title="Business updates">
              {businessUpdates.length > 0 ? (
                businessUpdates.map((update) => (
                  <BusinessUpdateCard key={update.id} update={update} />
                ))
              ) : (
                <EmptyState
                  icon="megaphone-outline"
                  title="No updates yet."
                  subtitle={
                    owner
                      ? "Edit your business profile to post specials, offers, events, and announcements."
                      : undefined
                  }
                />
              )}
            </Section>

            <Section title="Services & menu">
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          backgroundColor: "#eee",
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          backgroundColor: "rgba(13,148,136,0.08)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="restaurant-outline"
                          size={24}
                          color={theme.colors.turquoise}
                        />
                      </View>
                    )}

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "800",
                          color: theme.colors.charcoal,
                        }}
                      >
                        {item.title}
                      </Text>

                      {item.description ? (
                        <Text
                          style={{
                            marginTop: 4,
                            fontSize: 13,
                            lineHeight: 19,
                            color: theme.colors.muted,
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}

                      {item.price ? (
                        <Text
                          style={{
                            marginTop: 6,
                            fontSize: 14,
                            fontWeight: "700",
                            color: theme.colors.turquoise,
                          }}
                        >
                          {item.price}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState
                  icon="list-outline"
                  title="No services added yet."
                  subtitle={
                    owner
                      ? "Edit your business profile to add menu items and services."
                      : undefined
                  }
                />
              )}
            </Section>
          </>
        ) : null}

        {activeTab === "Reviews" ? (
          <>
            {reviewSummary.count > 0 ? (
              <Section title="Rating summary">
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "800",
                      color: theme.colors.charcoal,
                      marginRight: 10,
                    }}
                  >
                    {reviewSummary.averageRating.toFixed(1)}
                  </Text>
                  <View>
                    <ReviewStars rating={Math.round(reviewSummary.averageRating)} size={18} />
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: theme.colors.muted,
                        fontWeight: "600",
                      }}
                    >
                      {reviewSummary.count} review
                      {reviewSummary.count === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
              </Section>
            ) : null}

            <WriteReviewSection
              currentReviewer={currentReviewer}
              isBusinessOwner={isBusinessOwner}
              userReview={userReview}
              onLoginPress={openLoginForReview}
              draftRating={draftRating}
              draftText={draftText}
              onChangeRating={setDraftRating}
              onChangeText={setDraftText}
              onSubmit={submitReview}
              submittingReview={submittingReview}
            />

            <Section title="All reviews">
              {otherReviews.length > 0 ? (
                otherReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showOwnerReplyEditor={
                      isBusinessOwner && !review.ownerReply
                    }
                  />
                ))
              ) : reviewSummary.count === 0 ? (
                <EmptyState
                  icon="chatbubble-ellipses-outline"
                  title="No reviews yet"
                  subtitle="Be the first to review"
                />
              ) : (
                <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                  Your review is shown above.
                </Text>
              )}
            </Section>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}