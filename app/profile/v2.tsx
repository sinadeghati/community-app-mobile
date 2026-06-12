import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../lib/api";
import {
  formatOfferingDiscountLabel,
  getBusinessOfferings,
  getOfferingAvailabilityLabel,
  getOfferingCategoryLabel,
  type BusinessOffering,
} from "../../lib/businessOfferings";
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
import { getBusinessGalleryUris } from "../../lib/businessGallery";
import { getBusinessDirectionsQuery } from "../../lib/businessLocation";
import {
  createReviewId,
  deleteBusinessReview,
  formatReviewRelativeTime,
  getCurrentReviewer,
  isReviewAuthor,
  loadBusinessReviews,
  saveBusinessReview,
  saveOwnerReply,
  summarizeBusinessReviews,
  updateBusinessReview,
  updateOwnerReply,
  type BusinessReview,
  type CurrentReviewer,
} from "../../lib/businessReviews";
import {
  isBusinessFavorited,
  toggleBusinessFavorite,
} from "../../lib/businessFavorites";
import { ensureLoggedInForSave } from "../../lib/savedActions";
import { requestDiscoverListingsRefresh } from "../../lib/discoverListingsRefresh";
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
  menu_items?: BusinessOffering[];
  menuItems?: BusinessOffering[];
  business_offerings?: BusinessOffering[];
  businessOfferings?: BusinessOffering[];
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

const isVerified = (item?: Business | null) =>
  Boolean(item?.is_verified || item?.verified);

const isFeatured = (item?: Business | null) =>
  Boolean(item?.is_featured || item?.featured || item?.is_sponsored);

const getInstagram = (item?: Business | null) => String(item?.instagram || "").trim();

const getWebsite = (item?: Business | null) => String(item?.website || "").trim();

const normalizeWebsiteUrl = (website: string) => {
  if (!website) return "";
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
};

const getWebsiteDisplay = (website: string) =>
  website.replace(/^https?:\/\//i, "").replace(/\/$/, "");

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

function Section({
  title,
  action,
  onActionPress,
  children,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={profileSectionCardStyle}>
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
}

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

function WriteReviewSection({
  currentReviewer,
  isBusinessOwner,
  isOwnerCheckReady,
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
  isOwnerCheckReady: boolean;
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
          Owners cannot review their own business.
        </Text>
      ) : userReview ? (
        <Text
          style={{
            fontSize: 14,
            lineHeight: 21,
            color: theme.colors.muted,
            fontWeight: "600",
          }}
        >
          Your review is shown below.
        </Text>
      ) : !isOwnerCheckReady ? null : (
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

type BusinessReviewCardProps = {
  review: BusinessReview;
  showOwnerReplyEditor?: boolean;
  currentReviewer: CurrentReviewer | null;
  isBusinessOwner: boolean;
  editingReviewId: string | null;
  editingReplyId: string | null;
  editRating: number;
  editText: string;
  replyDraftText: string;
  savingReviewEdit: boolean;
  submittingReplyId: string | null;
  onStartEditReview: (review: BusinessReview) => void;
  onConfirmDeleteReview: (review: BusinessReview) => void;
  onCancelEditReview: () => void;
  onSaveEditedReview: (reviewId: string) => void;
  onEditRatingChange: (rating: number) => void;
  onEditTextChange: (text: string) => void;
  onStartEditOwnerReply: (review: BusinessReview) => void;
  onCancelEditOwnerReply: (reviewId: string) => void;
  onSubmitOwnerReply: (reviewId: string) => void;
  onReplyDraftChange: (text: string) => void;
};

const BusinessReviewCard = memo(function BusinessReviewCard({
  review,
  showOwnerReplyEditor = false,
  currentReviewer,
  isBusinessOwner,
  editingReviewId,
  editingReplyId,
  editRating,
  editText,
  replyDraftText,
  savingReviewEdit,
  submittingReplyId,
  onStartEditReview,
  onConfirmDeleteReview,
  onCancelEditReview,
  onSaveEditedReview,
  onEditRatingChange,
  onEditTextChange,
  onStartEditOwnerReply,
  onCancelEditOwnerReply,
  onSubmitOwnerReply,
  onReplyDraftChange,
}: BusinessReviewCardProps) {
  const isAuthor =
    Boolean(currentReviewer) &&
    isReviewAuthor(review, currentReviewer) &&
    !isBusinessOwner;
  const isEditing = editingReviewId === review.id;
  const isEditingReply = editingReplyId === review.id;
  const reviewTimestamp = review.updatedAt || review.createdAt;
  const isSubmittingReply = submittingReplyId === review.id;

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
            flex: 1,
            marginRight: 8,
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
          {formatReviewRelativeTime(reviewTimestamp)}
        </Text>
      </View>

      {isAuthor ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            marginTop: 8,
          }}
        >
          <Pressable onPress={() => onStartEditReview(review)} hitSlop={8}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: theme.colors.turquoise,
              }}
            >
              Edit
            </Text>
          </Pressable>
          <Pressable onPress={() => onConfirmDeleteReview(review)} hitSlop={8}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: theme.colors.danger,
              }}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      ) : null}

      {isEditing ? (
        <View style={{ marginTop: 10 }}>
          <StarRatingPicker value={editRating} onChange={onEditRatingChange} />
          <TextInput
            value={editText}
            onChangeText={onEditTextChange}
            placeholder="Update your review..."
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
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={onCancelEditReview}
              style={{
                flex: 1,
                height: 40,
                borderRadius: theme.radius.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.charcoal,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSaveEditedReview(review.id)}
              disabled={savingReviewEdit}
              style={{
                flex: 1,
                height: 40,
                borderRadius: theme.radius.sm,
                backgroundColor: savingReviewEdit
                  ? theme.colors.muted
                  : theme.colors.turquoise,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
                {savingReviewEdit ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
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
        </>
      )}

      {review.ownerReply && !isEditingReply ? (
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
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
            {isBusinessOwner ? (
              <Pressable
                onPress={() => onStartEditOwnerReply(review)}
                hitSlop={8}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: theme.colors.turquoise,
                  }}
                >
                  Edit
                </Text>
              </Pressable>
            ) : null}
          </View>
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
      ) : null}

      {isBusinessOwner && isEditingReply ? (
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: theme.colors.muted,
              marginBottom: 8,
            }}
          >
            Edit owner response
          </Text>
          <TextInput
            value={replyDraftText}
            onChangeText={onReplyDraftChange}
            placeholder="Update your public response..."
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
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={() => onCancelEditOwnerReply(review.id)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: theme.radius.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.charcoal,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSubmitOwnerReply(review.id)}
              disabled={isSubmittingReply}
              style={{
                flex: 1,
                height: 40,
                borderRadius: theme.radius.sm,
                backgroundColor: isSubmittingReply
                  ? theme.colors.muted
                  : theme.colors.turquoise,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
                {isSubmittingReply ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
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
            Reply
          </Text>
          <TextInput
            value={replyDraftText}
            onChangeText={onReplyDraftChange}
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
            onPress={() => onSubmitOwnerReply(review.id)}
            disabled={isSubmittingReply}
            style={{
              marginTop: 10,
              height: 40,
              borderRadius: theme.radius.sm,
              backgroundColor: isSubmittingReply
                ? theme.colors.muted
                : theme.colors.turquoise,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
              {isSubmittingReply ? "Posting..." : "Post reply"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

const GALLERY_SKELETON_CELL = {
  width: "48%" as const,
  height: 128,
  borderRadius: 14,
  backgroundColor: "#E8EAED",
};

function GalleryPhotosSkeleton({ count }: { count: number }) {
  const cells = Array.from({ length: count }, (_, index) => index);

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        paddingTop: 4,
      }}
    >
      {cells.map((index) => (
        <View key={`gallery-skeleton-${index}`} style={GALLERY_SKELETON_CELL} />
      ))}
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
  const [isOwnerCheckReady, setIsOwnerCheckReady] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(
    null
  );
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState("");
  const [savingReviewEdit, setSavingReviewEdit] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const editNavigatingRef = useRef(false);
  const [editNavigating, setEditNavigating] = useState(false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Photos" | "Services" | "Reviews"
  >("Overview");
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(
    null
  );

  const focusUpdates = String(params?.focus || "") === "updates";

  useEffect(() => {
    if (!focusUpdates || loading) return;
    setActiveTab("Services");
  }, [focusUpdates, loading, profileId]);

  const refreshFavoriteState = React.useCallback(async () => {
    if (!profileId) return;
    setFavorite(await isBusinessFavorited(profileId));
  }, [profileId]);

  useFocusEffect(
    React.useCallback(() => {
      editNavigatingRef.current = false;
      setEditNavigating(false);
      getCurrentReviewer().then(setCurrentReviewer);
      refreshFavoriteState();
      if (String(params?.focus || "") === "updates") {
        setActiveTab("Services");
      }
    }, [params?.focus, refreshFavoriteState])
  );

  const handleProfileBack = React.useCallback(() => {
    if (String(params?.fromCreate || "") === "1") {
      router.replace("/(tabs)/profile");
      return;
    }
    router.back();
  }, [params?.fromCreate]);

  const verifyCurrentUserOwnsBusiness = React.useCallback(async (): Promise<boolean> => {
    if (!business || !profileId) return false;

    const { requireAuthenticatedUser, verifyBusinessOwnerAccess } = await import(
      "../../lib/userSessionStorage"
    );

    const userId = await requireAuthenticatedUser();
    if (!userId) return false;

    const access = await verifyBusinessOwnerAccess(
      business as Record<string, unknown>,
      profileId
    );
    return access.ok;
  }, [business, profileId]);

  useEffect(() => {
    let cancelled = false;

    const resolveOwner = async () => {
      if (!business) {
        if (!cancelled) {
          setIsBusinessOwner(false);
          setIsOwnerCheckReady(true);
        }
        return;
      }

      if (!cancelled) {
        setIsOwnerCheckReady(false);
      }

      try {
        const owned = await verifyCurrentUserOwnsBusiness();
        if (!cancelled) setIsBusinessOwner(owned);
      } catch {
        if (!cancelled) setIsBusinessOwner(false);
      } finally {
        if (!cancelled) setIsOwnerCheckReady(true);
      }
    };

    resolveOwner();

    return () => {
      cancelled = true;
    };
  }, [business, verifyCurrentUserOwnsBusiness]);

  const refreshReviews = async () => {
    const businessReviews = await loadBusinessReviews(profileId);
    setReviews(businessReviews);
    setCurrentReviewer(await getCurrentReviewer());
  };

  const loadBusiness = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;

      try {
        if (!silent) setLoading(true);

        const {
          loadMyBusinessesForProfile,
          requireAuthenticatedUser,
          loadUserProfile,
        } = await import("../../lib/userSessionStorage");

        const userId = await requireAuthenticatedUser();
        if (userId) {
          const profile = await loadUserProfile(userId);
          const identity = {
            username: String(profile?.username || "").trim() || undefined,
            email: String(profile?.email || "").trim() || undefined,
          };
          const myBusinesses = await loadMyBusinessesForProfile(userId, identity);
          const owned = myBusinesses.find(
            (item) => String(item.id || "") === profileId
          );
          if (owned) {
            setBusiness(owned as Business);
            setFavorite(await isBusinessFavorited(getId(owned)));
            return;
          }
        }

        const localRaw = await AsyncStorage.getItem(`profile_v2_${profileId}`);

        if (localRaw) {
          const localBusiness = JSON.parse(localRaw);
          setBusiness(localBusiness);
          setFavorite(await isBusinessFavorited(getId(localBusiness)));
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
          setFavorite(await isBusinessFavorited(getId(data)));
        }
      } catch (error) {
        console.log("Business profile load error:", error);
        if (!silent) {
          Alert.alert("Error", "Could not load this business profile.");
        }
      } finally {
        await refreshReviews();
        if (!silent) setLoading(false);
      }
    },
    [profileId]
  );

  useEffect(() => {
    void loadBusiness();
  }, [loadBusiness]);

  const skipNextFocusReloadRef = useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      if (skipNextFocusReloadRef.current) {
        skipNextFocusReloadRef.current = false;
        return;
      }

      void loadBusiness({ silent: true });
    }, [loadBusiness])
  );

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

  const profileScrollRef = useRef<ScrollView>(null);
  const reviewsBlockOffsetYRef = useRef(0);
  const yourReviewSectionOffsetYRef = useRef(0);

  useEffect(() => {
    if (activeTab !== "Reviews" || (!editingReviewId && !editingReplyId)) {
      return;
    }

    const timeout = setTimeout(() => {
      const scrollView = profileScrollRef.current;
      if (!scrollView) return;

      if (editingReviewId && userReview?.id === editingReviewId) {
        scrollView.scrollTo({
          y: Math.max(
            0,
            reviewsBlockOffsetYRef.current +
              yourReviewSectionOffsetYRef.current -
              120
          ),
          animated: true,
        });
        return;
      }

      scrollView.scrollToEnd({ animated: true });
    }, 200);

    return () => clearTimeout(timeout);
  }, [activeTab, editingReviewId, editingReplyId, userReview?.id]);

  const galleryPhotos = useMemo(
    () => getBusinessGalleryUris(business as Record<string, unknown> | null),
    [business]
  );
  const galleryPhotosKey = useMemo(
    () => `${profileId}:${galleryPhotos.join("|")}`,
    [profileId, galleryPhotos]
  );
  const galleryReadyCacheRef = useRef(new Map<string, boolean>());
  const [galleryReady, setGalleryReady] = useState(false);

  useEffect(() => {
    if (activeTab !== "Photos") return;

    if (galleryPhotos.length === 0) {
      setGalleryReady(true);
      return;
    }

    if (galleryReadyCacheRef.current.get(galleryPhotosKey)) {
      setGalleryReady(true);
      return;
    }

    let cancelled = false;
    setGalleryReady(false);

    const prefetchGallery = async () => {
      await Promise.all(
        galleryPhotos.map((uri) =>
          Image.prefetch(uri).catch(() => false)
        )
      );

      if (cancelled) return;

      galleryReadyCacheRef.current.set(galleryPhotosKey, true);
      setGalleryReady(true);
    };

    void prefetchGallery();

    return () => {
      cancelled = true;
    };
  }, [activeTab, galleryPhotos, galleryPhotosKey]);

  const hasInstagram = Boolean(getInstagram(business));
  const hasWebsite = Boolean(getWebsite(business));

  const businessOfferings = useMemo(
    () => getBusinessOfferings(business),
    [business]
  );
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

    const allowed = await ensureLoggedInForSave(
      favorite ? "manage your favorites" : "save businesses"
    );
    if (!allowed) return;

    const next = await toggleBusinessFavorite(business, favorite);
    setFavorite(next);
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
    const query = getBusinessDirectionsQuery(
      (business || {}) as Record<string, unknown>
    );

    if (!query) {
      Alert.alert(
        "Directions unavailable",
        "This business does not have a verified address yet."
      );
      return;
    }

    const encoded = encodeURIComponent(query);
    const isCoordinatePair = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(query);
    const url = isCoordinatePair
      ? `https://www.google.com/maps/search/?api=1&query=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    Linking.openURL(url);
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

  const openWebsite = () => {
    const website = getWebsite(business);

    if (!website) {
      Alert.alert("Website", "This business has not added a website yet.");
      return;
    }

    Linking.openURL(normalizeWebsiteUrl(website));
  };

  const persistBusinessPhoto = async (field: "cover" | "logo", uri: string) => {
    if (!business || !profileId) return;

    try {
      const storageKey = `profile_v2_${profileId}`;
      const raw = await AsyncStorage.getItem(storageKey);
      const record = (
        raw ? JSON.parse(raw) : { ...(business as Record<string, unknown>) }
      ) as Record<string, unknown>;

      if (field === "cover") {
        record.cover_image = uri;
        record.image = uri;
      } else {
        record.logo = uri;
        record.avatar = uri;
        record.profile_image = uri;
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(record));

      const { getActiveUserId, loadUserProfile, upsertUserBusiness } =
        await import("../../lib/userSessionStorage");
      const ownerId = await getActiveUserId();
      if (ownerId) {
        const ownerProfile = await loadUserProfile(ownerId);
        const ownerUsername = String(ownerProfile?.username || "").trim();
        await upsertUserBusiness(ownerId, record, ownerUsername);
      }

      setBusiness({ ...business, ...(record as Business) });
      requestDiscoverListingsRefresh();
    } catch (error) {
      console.log("BUSINESS_PHOTO_UPDATE_ERROR:", error);
      Alert.alert("Error", "Could not update this photo.");
    }
  };

  const pickCoverImage = async () => {
    if (!isBusinessOwner) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await persistBusinessPhoto("cover", result.assets[0].uri);
    }
  };

  const pickLogoImage = async () => {
    if (!isBusinessOwner) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await persistBusinessPhoto("logo", result.assets[0].uri);
    }
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

  const openEdit = async () => {
    if (editNavigatingRef.current) return;
    editNavigatingRef.current = true;
    setEditNavigating(true);

    try {
      const { requireAuthenticatedUser } = await import(
        "../../lib/userSessionStorage"
      );
      const userId = await requireAuthenticatedUser();
      if (!userId) {
        editNavigatingRef.current = false;
        setEditNavigating(false);
        router.replace("/(tabs)");
        return;
      }

      const owned = await verifyCurrentUserOwnsBusiness();
      if (!owned) {
        editNavigatingRef.current = false;
        setEditNavigating(false);
        Alert.alert("Owner only", "Only the business owner can edit this profile.");
        return;
      }

      router.push({
        pathname: "/profile/edit-business",
        params: { id: getId(business) },
      });
    } catch {
      editNavigatingRef.current = false;
      setEditNavigating(false);
    }
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

    if (await verifyCurrentUserOwnsBusiness()) {
      setIsBusinessOwner(true);
      setCurrentReviewer(reviewer);
      setActiveTab("Reviews");
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

    if (await verifyCurrentUserOwnsBusiness()) {
      setIsBusinessOwner(true);
      Alert.alert(
        "Owner review",
        "Owners cannot review their own business."
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

    const isEditingReply = editingReplyId === reviewId;

    try {
      setSubmittingReplyId(reviewId);
      const saved = isEditingReply
        ? await updateOwnerReply(profileId, reviewId, text)
        : await saveOwnerReply(profileId, reviewId, text);
      setReviews(saved);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setEditingReplyId(null);
      Alert.alert(
        isEditingReply ? "Updated" : "Posted",
        isEditingReply
          ? "Your response has been updated."
          : "Your reply is now visible under the review."
      );
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

  const startEditReview = (review: BusinessReview) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditText(review.text);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditText("");
  };

  const saveEditedReview = async (reviewId: string) => {
    if (!currentReviewer) {
      openLoginForReview();
      return;
    }

    if (await verifyCurrentUserOwnsBusiness()) {
      setIsBusinessOwner(true);
      Alert.alert(
        "Owner review",
        "Owners cannot review their own business."
      );
      return;
    }

    const text = editText.trim();
    if (!text) {
      Alert.alert("Review required", "Please write a short review before saving.");
      return;
    }

    if (editRating < 1 || editRating > 5) {
      Alert.alert("Rating required", "Please select a star rating from 1 to 5.");
      return;
    }

    try {
      setSavingReviewEdit(true);
      const saved = await updateBusinessReview(
        profileId,
        reviewId,
        currentReviewer.userId,
        { rating: editRating, text }
      );
      setReviews(saved);
      cancelEditReview();
      Alert.alert("Updated", "Your review has been updated.");
    } catch (error: any) {
      if (error?.message === "forbidden") {
        Alert.alert("Not allowed", "You can only edit your own review.");
      } else {
        Alert.alert("Error", "Could not update your review. Please try again.");
      }
    } finally {
      setSavingReviewEdit(false);
    }
  };

  const confirmDeleteReview = (review: BusinessReview) => {
    if (!currentReviewer || !isReviewAuthor(review, currentReviewer)) {
      Alert.alert("Not allowed", "You can only delete your own review.");
      return;
    }

    Alert.alert(
      "Delete review?",
      "This will remove your review and update the business rating.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const saved = await deleteBusinessReview(
                profileId,
                review.id,
                currentReviewer.userId
              );
              setReviews(saved);
              if (editingReviewId === review.id) {
                cancelEditReview();
              }
            } catch (error: any) {
              if (error?.message === "forbidden") {
                Alert.alert("Not allowed", "You can only delete your own review.");
              } else {
                Alert.alert(
                  "Error",
                  "Could not delete your review. Please try again."
                );
              }
            }
          },
        },
      ]
    );
  };

  const startEditOwnerReply = (review: BusinessReview) => {
    setEditingReplyId(review.id);
    setReplyDrafts((prev) => ({
      ...prev,
      [review.id]: review.ownerReply?.text || "",
    }));
  };

  const cancelEditOwnerReply = (reviewId: string) => {
    setEditingReplyId(null);
    setReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
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

  const review = userReview;
  const ReviewCard_REMOVED_START = false
    ? (
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
              flex: 1,
              marginRight: 8,
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
            {formatReviewRelativeTime(reviewTimestamp)}
          </Text>
        </View>

        {isAuthor ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              marginTop: 8,
            }}
          >
            <Pressable onPress={() => startEditReview(review)} hitSlop={8}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: theme.colors.turquoise,
                }}
              >
                Edit
              </Text>
            </Pressable>
            <Pressable onPress={() => confirmDeleteReview(review)} hitSlop={8}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: theme.colors.danger,
                }}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isEditing ? (
          <View style={{ marginTop: 10 }}>
            {console.log("REVIEW_FOCUS_DIAG_EDIT_INPUT_RENDER", {
              reviewId: review.id,
              textInputKey: editTextInputKey,
              editingReviewId,
              hasExplicitKeyProp: false,
            })}
            <StarRatingPicker value={editRating} onChange={setEditRating} />
            <TextInput
              value={editText}
              onChangeText={(value) => {
                console.log("REVIEW_FOCUS_DIAG_EDIT_ON_CHANGE", {
                  reviewId: review.id,
                  nextLength: value.length,
                  editingReviewId,
                });
                setEditText(value);
              }}
              placeholder="Update your review..."
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
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <Pressable
                onPress={cancelEditReview}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: theme.radius.sm,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.colors.charcoal,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => saveEditedReview(review.id)}
                disabled={savingReviewEdit}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: theme.radius.sm,
                  backgroundColor: savingReviewEdit
                    ? theme.colors.muted
                    : theme.colors.turquoise,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
                  {savingReviewEdit ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
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
          </>
        )}

        {review.ownerReply && !isEditingReply ? (
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
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
              {isBusinessOwner ? (
                <Pressable
                  onPress={() => startEditOwnerReply(review)}
                  hitSlop={8}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: theme.colors.turquoise,
                    }}
                  >
                    Edit
                  </Text>
                </Pressable>
              ) : null}
            </View>
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
        ) : null}

        {isBusinessOwner && isEditingReply ? (
          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: theme.colors.muted,
                marginBottom: 8,
              }}
            >
              Edit owner response
            </Text>
            {console.log("REVIEW_FOCUS_DIAG_REPLY_INPUT_RENDER", {
              reviewId: review.id,
              textInputKey: replyTextInputKey,
              editingReplyId,
              replyingToReviewId: null,
              mode: "edit_owner_reply",
              hasExplicitKeyProp: false,
            })}
            <TextInput
              value={replyDrafts[review.id] || ""}
              onChangeText={(value) => {
                console.log("REVIEW_FOCUS_DIAG_REPLY_ON_CHANGE", {
                  reviewId: review.id,
                  nextLength: value.length,
                  editingReplyId,
                  mode: "edit_owner_reply",
                });
                setReplyDrafts((prev) => ({ ...prev, [review.id]: value }));
              }}
              placeholder="Update your public response..."
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
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <Pressable
                onPress={() => cancelEditOwnerReply(review.id)}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: theme.radius.sm,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.colors.charcoal,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => submitOwnerReply(review.id)}
                disabled={submittingReplyId === review.id}
                style={{
                  flex: 1,
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
                  {submittingReplyId === review.id ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
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
              Reply
            </Text>
            {console.log("REVIEW_FOCUS_DIAG_REPLY_INPUT_RENDER", {
              reviewId: review.id,
              textInputKey: replyTextInputKey,
              editingReplyId,
              replyingToReviewId: review.id,
              mode: "new_owner_reply",
              hasExplicitKeyProp: false,
            })}
            <TextInput
              value={replyDrafts[review.id] || ""}
              onChangeText={(value) => {
                console.log("REVIEW_FOCUS_DIAG_REPLY_ON_CHANGE", {
                  reviewId: review.id,
                  nextLength: value.length,
                  editingReplyId,
                  replyingToReviewId: review.id,
                  mode: "new_owner_reply",
                });
                setReplyDrafts((prev) => ({ ...prev, [review.id]: value }));
              }}
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
    )
    : null;

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
          onPress={handleProfileBack}
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={activeTab === "Reviews"}
      >
        <ScrollView
          ref={profileScrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={
            activeTab === "Reviews" ? "handled" : "never"
          }
          automaticallyAdjustKeyboardInsets={activeTab === "Reviews"}
          contentContainerStyle={{
            paddingBottom:
              activeTab === "Reviews" ? 320 : theme.spacing.xl,
          }}
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
                onPress={handleProfileBack}
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

            {isBusinessOwner ? (
              <Pressable
                onPress={pickCoverImage}
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
                  Change Cover
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

                {isBusinessOwner ? (
                  <Text
                    onPress={openEdit}
                    style={{
                      marginLeft: 6,
                      color: theme.colors.turquoise,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    · Edit details
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
          <ActionButton
            icon="globe-outline"
            label="Website"
            onPress={openWebsite}
            disabled={!hasWebsite}
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

              {hasWebsite ? (
                <Pressable
                  onPress={openWebsite}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={theme.colors.turquoise}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      color: theme.colors.turquoise,
                      fontWeight: "700",
                    }}
                  >
                    {getWebsiteDisplay(getWebsite(business))}
                  </Text>
                </Pressable>
              ) : null}
            </Section>

            <Section title="Announcements & Promotions">
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 19,
                  color: theme.colors.muted,
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                Specials, offers, events, and news from this business.
              </Text>
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
                  No announcements or promotions yet.
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
          </>
        ) : null}
        {activeTab === "Photos" ? (
          <Section
            title="Photos & Gallery"
            action={
              galleryReady && galleryPhotos.length > 0 ? "Open gallery" : undefined
            }
            onActionPress={openGallery}
          >
            {!galleryReady && galleryPhotos.length > 0 ? (
              <GalleryPhotosSkeleton count={galleryPhotos.length} />
            ) : galleryReady && galleryPhotos.length > 0 ? (
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
                    onPress={() => setSelectedGalleryImage(uri)}
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
                  isBusinessOwner
                    ? "Add photos to your gallery so customers can see your space and work."
                    : "This business has not uploaded gallery photos yet."
                }
              />
            )}
          </Section>
        ) : null}

        {activeTab === "Services" ? (
          <>
            <Section title="Announcements & Promotions">
              {businessUpdates.length > 0 ? (
                businessUpdates.map((update) => (
                  <BusinessUpdateCard key={update.id} update={update} />
                ))
              ) : (
                <EmptyState
                  icon="megaphone-outline"
                  title="No announcements yet"
                  subtitle={
                    isBusinessOwner
                      ? "Use Edit profile to add specials, offers, events, and announcements."
                      : "This business has not posted any announcements or promotions yet."
                  }
                />
              )}
            </Section>

            <Section title="Services & menu">
              {businessOfferings.length > 0 ? (
                businessOfferings.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                      opacity: item.availability === "sold_out" ? 0.72 : 1,
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
                          name={
                            item.category === "product"
                              ? "cube-outline"
                              : "briefcase-outline"
                          }
                          size={24}
                          color={theme.colors.turquoise}
                        />
                      </View>
                    )}

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "800",
                            color: theme.colors.charcoal,
                          }}
                        >
                          {item.title}
                        </Text>
                        {item.featured ? (
                          <Ionicons
                            name="star"
                            size={14}
                            color={theme.colors.turquoise}
                          />
                        ) : null}
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 6,
                          marginTop: 6,
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: "rgba(13,148,136,0.08)",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: theme.colors.turquoise,
                            }}
                          >
                            {getOfferingCategoryLabel(item.category)}
                          </Text>
                        </View>

                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: "rgba(107,114,128,0.12)",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: theme.colors.muted,
                            }}
                          >
                            {getOfferingAvailabilityLabel(item.availability)}
                          </Text>
                        </View>

                        {formatOfferingDiscountLabel(item.discountPercent) ? (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: "rgba(220,38,38,0.1)",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: "#DC2626",
                              }}
                            >
                              {formatOfferingDiscountLabel(item.discountPercent)}
                            </Text>
                          </View>
                        ) : null}

                        {item.featured ? (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: "rgba(13,148,136,0.08)",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: theme.colors.turquoise,
                              }}
                            >
                              Featured
                            </Text>
                          </View>
                        ) : null}
                      </View>

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
                    isBusinessOwner
                      ? "Edit your business profile to add offerings and services."
                      : undefined
                  }
                />
              )}
            </Section>
          </>
        ) : null}

        {activeTab === "Reviews" ? (
          <View
            onLayout={(event) => {
              reviewsBlockOffsetYRef.current = event.nativeEvent.layout.y;
            }}
          >
            {console.log("REVIEW_FOCUS_DIAG_PARENT_REVIEWS_TAB", {
              editingReviewId,
              editingReplyId,
              editTextLength: editText.length,
              replyDraftKeys: Object.keys(replyDrafts),
              parentComponent: "BusinessProfileV2",
              nestedReviewCardLine: 1289,
            })}
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
              isOwnerCheckReady={isOwnerCheckReady}
              userReview={userReview}
              onLoginPress={openLoginForReview}
              draftRating={draftRating}
              draftText={draftText}
              onChangeRating={setDraftRating}
              onChangeText={setDraftText}
              onSubmit={submitReview}
              submittingReview={submittingReview}
            />

            {userReview ? (
              <View
                onLayout={(event) => {
                  yourReviewSectionOffsetYRef.current =
                    event.nativeEvent.layout.y;
                }}
              >
                <Section title="Your review">
                  <BusinessReviewCard
                  review={userReview}
                  currentReviewer={currentReviewer}
                  isBusinessOwner={isBusinessOwner}
                  editingReviewId={editingReviewId}
                  editingReplyId={editingReplyId}
                  editRating={editRating}
                  editText={editText}
                  replyDraftText={replyDrafts[userReview.id] || ""}
                  savingReviewEdit={savingReviewEdit}
                  submittingReplyId={submittingReplyId}
                  onStartEditReview={startEditReview}
                  onConfirmDeleteReview={confirmDeleteReview}
                  onCancelEditReview={cancelEditReview}
                  onSaveEditedReview={saveEditedReview}
                  onEditRatingChange={setEditRating}
                  onEditTextChange={setEditText}
                  onStartEditOwnerReply={startEditOwnerReply}
                  onCancelEditOwnerReply={cancelEditOwnerReply}
                  onSubmitOwnerReply={submitOwnerReply}
                  onReplyDraftChange={(text) =>
                    setReplyDrafts((prev) => ({ ...prev, [userReview.id]: text }))
                  }
                />
                </Section>
              </View>
            ) : null}

            <Section title="All reviews">
              {otherReviews.length > 0 ? (
                otherReviews.map((review) => (
                  <BusinessReviewCard
                    key={review.id}
                    review={review}
                    showOwnerReplyEditor={
                      isBusinessOwner && !review.ownerReply
                    }
                    currentReviewer={currentReviewer}
                    isBusinessOwner={isBusinessOwner}
                    editingReviewId={editingReviewId}
                    editingReplyId={editingReplyId}
                    editRating={editRating}
                    editText={editText}
                    replyDraftText={replyDrafts[review.id] || ""}
                    savingReviewEdit={savingReviewEdit}
                    submittingReplyId={submittingReplyId}
                    onStartEditReview={startEditReview}
                    onConfirmDeleteReview={confirmDeleteReview}
                    onCancelEditReview={cancelEditReview}
                    onSaveEditedReview={saveEditedReview}
                    onEditRatingChange={setEditRating}
                    onEditTextChange={setEditText}
                    onStartEditOwnerReply={startEditOwnerReply}
                    onCancelEditOwnerReply={cancelEditOwnerReply}
                    onSubmitOwnerReply={submitOwnerReply}
                    onReplyDraftChange={(text) =>
                      setReplyDrafts((prev) => ({ ...prev, [review.id]: text }))
                    }
                  />
                ))
              ) : reviewSummary.count === 0 ? (
                <EmptyState
                  icon="chatbubble-ellipses-outline"
                  title="No reviews yet"
                  subtitle={
                    isBusinessOwner ? undefined : "Be the first to review"
                  }
                />
              ) : userReview ? (
                <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                  No other reviews yet.
                </Text>
              ) : null}
            </Section>
          </View>
        ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!selectedGalleryImage} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "#000",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => setSelectedGalleryImage(null)}
            style={{ position: "absolute", top: 60, right: 24, zIndex: 10 }}
          >
            <Text style={{ color: "#fff", fontSize: 32 }}>×</Text>
          </Pressable>

          {selectedGalleryImage ? (
            <Image
              source={{ uri: selectedGalleryImage }}
              style={{ width: "100%", height: "80%" }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}