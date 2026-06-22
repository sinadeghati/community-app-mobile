import { Alert, Linking, Platform } from "react-native";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import type { EventMapItem } from "./mapEvents";

export type TicketProvider =
  | "eventbrite"
  | "luma"
  | "ticketmaster"
  | "generic";

const TICKET_URL_KEYS = [
  "ticket_url",
  "tickets_url",
  "ticketUrl",
  "website",
] as const;

export const normalizeTicketUrl = (raw: string): string | null => {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

export const isValidTicketUrl = (raw: string): boolean =>
  normalizeTicketUrl(raw) != null;

export const getTicketProvider = (url: string): TicketProvider => {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();

  if (host.includes("eventbrite.")) return "eventbrite";
  if (host.includes("lu.ma") || host.includes("luma.com")) return "luma";
  if (host.includes("ticketmaster.")) return "ticketmaster";
  return "generic";
};

export const getTicketProviderLabel = (provider: TicketProvider): string => {
  switch (provider) {
    case "eventbrite":
      return "Eventbrite";
    case "luma":
      return "Luma";
    case "ticketmaster":
      return "Ticketmaster";
    default:
      return "Tickets";
  }
};

export const getEventTicketUrl = (event?: EventMapItem | null): string | null => {
  if (!event) return null;

  const record = event as Record<string, unknown>;
  for (const key of TICKET_URL_KEYS) {
    const normalized = normalizeTicketUrl(String(record[key] || ""));
    if (normalized) return normalized;
  }

  return null;
};

export const getBuyTicketsLabel = (event?: EventMapItem | null): string => {
  const url = getEventTicketUrl(event);
  if (!url) return "Buy Tickets";
  return `Buy Tickets · ${getTicketProviderLabel(getTicketProvider(url))}`;
};

export const openEventTicketUrl = async (
  url: string
): Promise<boolean> => {
  const normalized = normalizeTicketUrl(url);
  if (!normalized) {
    Alert.alert("Invalid link", "Please enter a valid ticket URL.");
    return false;
  }

  try {
    if (Platform.OS === "web") {
      await Linking.openURL(normalized);
      return true;
    }

    await openBrowserAsync(normalized, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      showInRecents: true,
    });
    return true;
  } catch (error) {
    console.log("openEventTicketUrl error:", error);
    try {
      await Linking.openURL(normalized);
      return true;
    } catch {
      Alert.alert(
        "Could not open tickets",
        "We could not open this ticket link. Check the URL and try again."
      );
      return false;
    }
  }
};
