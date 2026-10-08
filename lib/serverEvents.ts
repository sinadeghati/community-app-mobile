import type { CommunityEvent } from "./communityEventTypes";
import { parseEventDate } from "./mapEvents";
import { formatServerEventApiError } from "./serverEventApiErrors";
import { mapApiEventToCommunityEvent } from "./serverEventMapping";
import {
  buildServerEventPayload,
  validateCommunityEventInput,
} from "./serverEventPayload";

export type { ApiEventRow } from "./serverEventMapping";
export {
  mapApiEventToCommunityEvent,
  buildServerEventPayload,
  validateCommunityEventInput,
  formatServerEventApiError,
};
export { isServerEventId } from "./serverEventIds";

export const hasDisplayableServerEvent = (event: CommunityEvent) => {
  const hasLocation = Boolean(
    String(
      event.location ||
        event.address ||
        event.street_address ||
        event.city ||
        ""
    ).trim()
  );
  return hasLocation && Boolean(parseEventDate(event));
};
