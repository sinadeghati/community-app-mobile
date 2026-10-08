import type { EventMapItem } from "./mapEvents";

export type CommunityEventInput = {
  title: string;
  description?: string;
  location?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  date?: string;
  time?: string;
  eventDateIso?: string;
  endDate?: string;
  endTime?: string;
  endDateIso?: string;
  ticketUrl?: string;
  businessId?: string;
  category?: string;
  isPublic?: boolean;
  image?: string;
  cover_image?: string;
};

export type CommunityEvent = EventMapItem & {
  id: string;
  title: string;
  description?: string;
  about?: string;
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  location?: string;
  event_date: string;
  category: string;
  business_category: string;
  owner_id: string;
  business_id?: string;
  organizer?: string;
  ticket_url?: string;
  is_public: boolean;
  is_active?: boolean;
  is_published?: boolean;
  coordinates_exact?: boolean;
  latitude?: number;
  longitude?: number;
  image?: string;
  cover_image?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  status?: string;
};

export type CommunityEventSaveResult =
  | { ok: true; event: CommunityEvent }
  | { ok: false; message: string };
