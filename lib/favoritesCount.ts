import {
  loadFavoriteBusinesses,
  loadFavoriteBusinessesFromStorage,
} from "./businessFavorites";
import {
  loadInterestedEvents,
  loadInterestedEventsFromStorage,
} from "./mapEventDetails";
import { getActiveUserId } from "./userSessionStorage";

/** Matches Favorites tab — saved businesses + interested events. */
export const countSavedFavoritesFromStorage = async (): Promise<number> => {
  const [businesses, events] = await Promise.all([
    loadFavoriteBusinessesFromStorage(),
    loadInterestedEventsFromStorage(),
  ]);
  return businesses.length + events.length;
};

export const countSavedFavorites = async (): Promise<number> => {
  if (!(await getActiveUserId())) return 0;

  const [businesses, events] = await Promise.all([
    loadFavoriteBusinesses(),
    loadInterestedEvents(),
  ]);
  return businesses.length + events.length;
};
