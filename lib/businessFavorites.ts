import AsyncStorage from "@react-native-async-storage/async-storage";
import { isUserLoggedIn } from "./businessReviews";
import { notifyFavoritesChanged } from "./favoritesRefresh";

export type FavoriteBusiness = {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  image?: string;
  address?: string;
  city?: string;
  state?: string;
  rating?: string | number;
  reviews?: number;
};

export type FavoriteBusinessSource = {
  id?: string | number;
  title?: string;
  name?: string;
  business_name?: string;
  category?: string;
  business_category?: string;
  image?: string;
  image_url?: string;
  cover_image?: string;
  address?: string;
  city?: string;
  state?: string;
  rating?: string | number;
  reviews?: number;
};

const FLAG_PREFIX = "favorite-business-";
const DATA_PREFIX = "favorite-business-data-";

export const favoriteBusinessFlagKey = (id: string) => `${FLAG_PREFIX}${id}`;
export const favoriteBusinessDataKey = (id: string) => `${DATA_PREFIX}${id}`;

const titleFrom = (item: FavoriteBusinessSource) =>
  item.business_name || item.name || item.title || "Saved Business";

const categoryFrom = (item: FavoriteBusinessSource) =>
  item.business_category || item.category || "Local Business";

const imageFrom = (item: FavoriteBusinessSource) =>
  item.cover_image || item.image_url || item.image;

export const buildFavoriteBusinessPayload = (
  item: FavoriteBusinessSource
): FavoriteBusiness => {
  const id = String(item.id || "");
  const name = titleFrom(item);

  return {
    id,
    name,
    title: name,
    category: categoryFrom(item),
    image: imageFrom(item),
    address:
      item.address || [item.city, item.state].filter(Boolean).join(", "),
    city: item.city,
    state: item.state,
    rating: item.rating ?? 4.8,
    reviews: item.reviews ?? 24,
  };
};

export const loadFavoriteBusinessMap = async (): Promise<
  Record<string, boolean>
> => {
  if (!(await isUserLoggedIn())) return {};

  const keys = await AsyncStorage.getAllKeys();
  const favMap: Record<string, boolean> = {};

  keys.forEach((key) => {
    if (key.startsWith(FLAG_PREFIX) && !key.includes("data")) {
      const id = key.replace(FLAG_PREFIX, "");
      favMap[id] = true;
    }
  });

  return favMap;
};

export const isBusinessFavorited = async (id: string): Promise<boolean> => {
  if (!id || !(await isUserLoggedIn())) return false;
  const saved = await AsyncStorage.getItem(favoriteBusinessFlagKey(id));
  return saved === "true";
};

export const saveBusinessFavorite = async (item: FavoriteBusinessSource) => {
  const id = String(item.id || "");
  if (!id) return;

  const payload = buildFavoriteBusinessPayload(item);
  await AsyncStorage.setItem(favoriteBusinessFlagKey(id), "true");
  await AsyncStorage.setItem(
    favoriteBusinessDataKey(id),
    JSON.stringify(payload)
  );
  notifyFavoritesChanged();
};

export const removeBusinessFavorite = async (id: string) => {
  if (!id) return;
  await AsyncStorage.removeItem(favoriteBusinessFlagKey(id));
  await AsyncStorage.removeItem(favoriteBusinessDataKey(id));
  notifyFavoritesChanged();
};

export const toggleBusinessFavorite = async (
  item: FavoriteBusinessSource,
  currentlyFavorited: boolean
): Promise<boolean> => {
  const id = String(item.id || "");
  if (!id) return currentlyFavorited;

  if (currentlyFavorited) {
    await removeBusinessFavorite(id);
    return false;
  }

  await saveBusinessFavorite(item);
  return true;
};

const readFavoriteBusinessesFromKeys = async (): Promise<FavoriteBusiness[]> => {
  const keys = await AsyncStorage.getAllKeys();
  const dataKeys = keys.filter((key) => key.startsWith(DATA_PREFIX));
  const result = await AsyncStorage.multiGet(dataKeys);

  return result
    .map(([, value]) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as FavoriteBusiness;
      } catch {
        return null;
      }
    })
    .filter((item): item is FavoriteBusiness => Boolean(item?.id));
};

/** Reads cached favorite payloads without auth or network. */
export const loadFavoriteBusinessesFromStorage =
  async (): Promise<FavoriteBusiness[]> => readFavoriteBusinessesFromKeys();

export const loadFavoriteBusinesses = async (): Promise<FavoriteBusiness[]> => {
  if (!(await isUserLoggedIn())) return [];
  return readFavoriteBusinessesFromKeys();
};

/** Remove all saved favorite flags/payloads — call on logout to prevent cross-user leakage. */
export const clearAllSavedFavorites = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const favoriteKeys = keys.filter(
    (key) => key.startsWith(FLAG_PREFIX) || key.startsWith(DATA_PREFIX)
  );
  if (favoriteKeys.length) {
    await AsyncStorage.multiRemove(favoriteKeys);
    notifyFavoritesChanged();
  }
};
