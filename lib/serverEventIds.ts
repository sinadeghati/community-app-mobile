export const isServerEventId = (eventId: string) =>
  /^\d+$/.test(String(eventId || "").trim());
