import type { DiscoverableListing } from "./discoverableListings";
import { getListingId } from "./discoverableListings";
import type { CommunityEvent } from "./communityEvents";
import { getEventScheduleIso } from "./mapEvents";
import { isEventListing } from "./discoverableListings";

const logEventRecord = (label: string, event: CommunityEvent) => {
  console.log(`[events/${label}]`, {
    id: event.id,
    title: event.title,
    scheduleIso: getEventScheduleIso(event),
    address: event.address,
    street_address: (event as CommunityEvent & { street_address?: string })
      .street_address,
    city: event.city,
    state: event.state,
    zip_code: (event as CommunityEvent & { zip_code?: string }).zip_code,
    country: (event as CommunityEvent & { country?: string }).country,
    latitude: event.latitude,
    longitude: event.longitude,
    coordinates_exact: (event as CommunityEvent & { coordinates_exact?: boolean })
      .coordinates_exact,
    is_public: event.is_public,
    is_active: (event as Record<string, unknown>).is_active,
    is_published: (event as Record<string, unknown>).is_published,
    category: event.category,
  });
};

export const logEventSaved = (event: CommunityEvent) => {
  logEventRecord("saved", event);
};

export const logDiscoverPipeline = (
  stage: string,
  events: CommunityEvent[],
  extra?: Record<string, unknown>
) => {
  console.log(`[events/discover/${stage}]`, {
    count: events.length,
    ids: events.map((event) => event.id),
    ...extra,
  });
};

export const logLoadedListingEventIds = (
  source: "explore" | "map",
  listings: DiscoverableListing[]
) => {
  const eventIds = listings
    .filter((item) => isEventListing(item))
    .map((item) => getListingId(item));

  console.log(`[${source}/events] loaded event ids`, eventIds);
};
