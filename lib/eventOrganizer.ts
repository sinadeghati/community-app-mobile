import { loadBusinessProfileRecord } from "./businessGallery";
import type { EventMapItem } from "./mapEvents";
import { loadUserProfile } from "./userSessionStorage";

const readName = (record: Record<string, unknown> | null | undefined) =>
  String(
    record?.name || record?.username || record?.display_name || ""
  ).trim();

const readBusinessName = (record: Record<string, unknown> | null | undefined) =>
  String(
    record?.business_name || record?.name || record?.title || ""
  ).trim();

/** Default host label when creating an event from business vs personal context. */
export const resolveDefaultEventOrganizer = async (options: {
  ownerId: string;
  businessId?: string;
}): Promise<string> => {
  if (options.businessId) {
    const business = await loadBusinessProfileRecord(options.businessId);
    const businessName = readBusinessName(business);
    if (businessName) return businessName;
  }

  const profile = await loadUserProfile(options.ownerId);
  return readName(profile as Record<string, unknown> | null);
};

/** Display-only organizer/host name (separate from owner_id permissions). */
export const getEventOrganizer = (event?: EventMapItem | null): string | null => {
  const record = (event ?? {}) as Record<string, unknown>;
  const organizer = String(
    record.organizer || record.organizer_name || record.organizerName || ""
  ).trim();

  return organizer || null;
};

export const formatEventHostLine = (event?: EventMapItem | null): string | null => {
  const organizer = getEventOrganizer(event);
  return organizer ? `Hosted by ${organizer}` : null;
};
