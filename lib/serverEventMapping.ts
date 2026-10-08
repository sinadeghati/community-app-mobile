import type { CommunityEvent } from "./communityEventTypes";
import { formatEventAddress } from "./eventLocation";
import {
  syncEventEndScheduleFields,
  syncEventScheduleFields,
} from "./eventDateTime";

export type ApiEventRow = Record<string, unknown>;

export const mapApiEventToCommunityEvent = (row: ApiEventRow): CommunityEvent => {
  const id = String(row.id ?? "");
  const title = String(row.title ?? "");
  const status = String(row.status ?? "published");
  const isPublished = status === "published";
  const scheduleIso =
    String(row.event_date ?? row.starts_at ?? row.eventDateIso ?? "").trim();
  const scheduleFields = syncEventScheduleFields(scheduleIso);
  const endIso = String(row.ends_at ?? row.endDateIso ?? "").trim();
  const endFields = endIso ? syncEventEndScheduleFields(endIso) : {};

  return {
    id,
    title,
    name: title,
    business_name: title,
    description: String(row.description ?? row.about ?? ""),
    about: String(row.about ?? row.description ?? ""),
    location: String(row.location ?? ""),
    address: String(
      row.address ??
        formatEventAddress({
          streetAddress: row.street_address as string | undefined,
          city: row.city as string | undefined,
          state: row.state as string | undefined,
          zipCode: row.zip_code as string | undefined,
          country: row.country as string | undefined,
        }) ??
        ""
    ),
    street_address: row.street_address as string | undefined,
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    zip_code: row.zip_code as string | undefined,
    country: String(row.country ?? "United States"),
    category: String(row.category ?? row.business_category ?? "Event"),
    business_category: String(row.business_category ?? row.category ?? "Event"),
    owner_id: String(row.owner_id ?? ""),
    business_id: row.listing_id != null ? String(row.listing_id) : undefined,
    organizer: row.organizer as string | undefined,
    ticket_url: row.ticket_url as string | undefined,
    is_public: isPublished,
    is_active: true,
    is_published: isPublished,
    coordinates_exact:
      row.latitude != null &&
      row.longitude != null &&
      Number.isFinite(Number(row.latitude)) &&
      Number.isFinite(Number(row.longitude)),
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    lat: row.latitude as number | undefined,
    lng: row.longitude as number | undefined,
    image: (row.image_url ?? row.cover_image ?? row.image) as string | undefined,
    cover_image: (row.cover_image ?? row.image_url ?? row.image) as string | undefined,
    image_url: (row.image_url ?? row.cover_image ?? row.image) as string | undefined,
    event_date: scheduleIso,
    ...scheduleFields,
    ...endFields,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    status,
  } as CommunityEvent & { status?: string };
};
