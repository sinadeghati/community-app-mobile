import AsyncStorage from "@react-native-async-storage/async-storage";
import authStorage from "../app/utils/authStorage";
import {
  getActiveUserId,
  loadUserProfile,
  profileIdFromRecord,
} from "./userSessionStorage";

export type CurrentReviewer = {
  userId: string;
  username: string;
};

/** Same logged-in signal as Profile/Home: access token present (no expiry gate). */
export const isUserLoggedIn = async (): Promise<boolean> => {
  const tokens = await authStorage.getTokens();
  return Boolean(tokens?.access);
};

const profileUserId = (profile: Record<string, unknown>): string | null => {
  const raw =
    profile.id ?? profile.user_id ?? profile.userId ?? profile.pk ?? null;
  if (raw == null || raw === "") return null;
  return String(raw);
};

export const getCurrentReviewer = async (): Promise<CurrentReviewer | null> => {
  const tokens = await authStorage.getTokens();
  if (!tokens?.access) {
    return null;
  }

  let userId: string | null = null;
  const tokenUserId = authStorage.getUserIdFromAccessToken(tokens.access);
  if (tokenUserId != null) {
    userId = String(tokenUserId);
  }

  let username = userId ? `User ${userId}` : "Community member";

  try {
    const activeUserId = await getActiveUserId();
    const cachedProfile = activeUserId
      ? await loadUserProfile(activeUserId)
      : null;
    if (cachedProfile) {
      if (!userId) {
        userId = profileIdFromRecord(cachedProfile);
      }
      username = String(
        cachedProfile.username ||
          cachedProfile.first_name ||
          cachedProfile.name ||
          cachedProfile.email ||
          username
      );
    }
  } catch {
    // keep fallback username
  }

  if (!userId) {
    return null;
  }

  return { userId, username };
};

export type OwnerReply = {
  text: string;
  createdAt: string;
  updatedAt?: string;
};

export type BusinessReview = {
  id: string;
  businessId: string;
  userId: string;
  username: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt?: string;
  ownerReply?: OwnerReply;
};

export type BusinessReviewSummary = {
  averageRating: number;
  count: number;
  reviews: BusinessReview[];
};

const reviewsStorageKey = (businessId: string) =>
  `business_reviews_${businessId}`;

export const createReviewId = () =>
  `review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const normalizeBusinessReviews = (raw: unknown): BusinessReview[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry: unknown) => {
      const item = entry as Record<string, unknown>;
      const businessId = String(item.businessId || "");
      const userId = String(item.userId || "");
      const rating = Number(item.rating);
      const text = String(item.text || "").trim();

      if (!businessId || !userId || !text || rating < 1 || rating > 5) {
        return null;
      }

      const ownerReplyRaw = item.ownerReply as Record<string, unknown> | undefined;
      const ownerReplyText = String(ownerReplyRaw?.text || "").trim();
      const ownerReplyUpdatedAt = String(ownerReplyRaw?.updatedAt || "").trim();
      const ownerReply =
        ownerReplyText.length > 0
          ? {
              text: ownerReplyText,
              createdAt: String(
                ownerReplyRaw?.createdAt || new Date().toISOString()
              ),
              ...(ownerReplyUpdatedAt
                ? { updatedAt: ownerReplyUpdatedAt }
                : {}),
            }
          : undefined;

      const updatedAt = String(item.updatedAt || "").trim();

      return {
        id: String(item.id || createReviewId()),
        businessId,
        userId,
        username: String(item.username || "Community member"),
        rating: Math.round(rating),
        text,
        createdAt: String(item.createdAt || new Date().toISOString()),
        ...(updatedAt ? { updatedAt } : {}),
        ownerReply,
      } satisfies BusinessReview;
    })
    .filter(Boolean) as BusinessReview[];
};

export const getBusinessReviewSummary = async (
  businessId: string
): Promise<BusinessReviewSummary> => {
  const reviews = await loadBusinessReviews(businessId);
  return summarizeBusinessReviews(reviews);
};

/** Map / profile preview line when reviews exist (matches profile header style). */
export const formatMapPreviewReviewText = (
  summary: BusinessReviewSummary | undefined
): string | null => {
  if (!summary || summary.count <= 0) return null;

  return `⭐ ${summary.averageRating.toFixed(1)} • ${summary.count} review${
    summary.count === 1 ? "" : "s"
  }`;
};

export const summarizeBusinessReviews = (
  reviews: BusinessReview[]
): BusinessReviewSummary => {
  if (!reviews.length) {
    return { averageRating: 0, count: 0, reviews: [] };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    averageRating: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    reviews: [...reviews].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  };
};

export const loadBusinessReviews = async (
  businessId: string
): Promise<BusinessReview[]> => {
  if (!businessId) return [];

  try {
    const raw = await AsyncStorage.getItem(reviewsStorageKey(businessId));
    return normalizeBusinessReviews(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
};

export const saveBusinessReview = async (
  businessId: string,
  review: BusinessReview
): Promise<BusinessReview[]> => {
  const existing = await loadBusinessReviews(businessId);

  if (existing.some((item) => item.userId === review.userId)) {
    throw new Error("duplicate_review");
  }

  const next = [review, ...existing];
  await AsyncStorage.setItem(reviewsStorageKey(businessId), JSON.stringify(next));

  return next;
};

export const isReviewAuthor = (
  review: BusinessReview,
  reviewer: CurrentReviewer | null | undefined
) => Boolean(reviewer && review.userId === reviewer.userId);

export const updateBusinessReview = async (
  businessId: string,
  reviewId: string,
  userId: string,
  updates: { rating: number; text: string }
): Promise<BusinessReview[]> => {
  const trimmed = updates.text.trim();
  if (!trimmed) {
    throw new Error("empty_review");
  }

  const rating = Math.round(updates.rating);
  if (rating < 1 || rating > 5) {
    throw new Error("invalid_rating");
  }

  const existing = await loadBusinessReviews(businessId);
  const index = existing.findIndex((item) => item.id === reviewId);

  if (index < 0) {
    throw new Error("review_not_found");
  }

  if (existing[index].userId !== userId) {
    throw new Error("forbidden");
  }

  const next = [...existing];
  next[index] = {
    ...next[index],
    rating,
    text: trimmed,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    reviewsStorageKey(businessId),
    JSON.stringify(next)
  );

  return next;
};

export const deleteBusinessReview = async (
  businessId: string,
  reviewId: string,
  userId: string
): Promise<BusinessReview[]> => {
  const existing = await loadBusinessReviews(businessId);
  const review = existing.find((item) => item.id === reviewId);

  if (!review) {
    throw new Error("review_not_found");
  }

  if (review.userId !== userId) {
    throw new Error("forbidden");
  }

  const next = existing.filter((item) => item.id !== reviewId);

  await AsyncStorage.setItem(
    reviewsStorageKey(businessId),
    JSON.stringify(next)
  );

  return next;
};

export const saveOwnerReply = async (
  businessId: string,
  reviewId: string,
  text: string
): Promise<BusinessReview[]> => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("empty_reply");
  }

  const existing = await loadBusinessReviews(businessId);
  const index = existing.findIndex((item) => item.id === reviewId);

  if (index < 0) {
    throw new Error("review_not_found");
  }

  if (existing[index].ownerReply) {
    throw new Error("duplicate_reply");
  }

  const next = [...existing];
  next[index] = {
    ...next[index],
    ownerReply: {
      text: trimmed,
      createdAt: new Date().toISOString(),
    },
  };

  await AsyncStorage.setItem(
    reviewsStorageKey(businessId),
    JSON.stringify(next)
  );

  return next;
};

export const updateOwnerReply = async (
  businessId: string,
  reviewId: string,
  text: string
): Promise<BusinessReview[]> => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("empty_reply");
  }

  const existing = await loadBusinessReviews(businessId);
  const index = existing.findIndex((item) => item.id === reviewId);

  if (index < 0) {
    throw new Error("review_not_found");
  }

  if (!existing[index].ownerReply) {
    throw new Error("reply_not_found");
  }

  const next = [...existing];
  next[index] = {
    ...next[index],
    ownerReply: {
      ...next[index].ownerReply!,
      text: trimmed,
      updatedAt: new Date().toISOString(),
    },
  };

  await AsyncStorage.setItem(
    reviewsStorageKey(businessId),
    JSON.stringify(next)
  );

  return next;
};

export const formatReviewRelativeTime = (iso: string) => {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return "";

  const diffMs = Date.now() - created;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString();
};
