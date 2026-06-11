export type ParsedAddress = {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  formatted: string;
};

export type AddressSuggestion = {
  id: string;
  label: string;
  parsed: ParsedAddress;
};

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
  "ISO3166-2-lvl4"?: string;
};

type NominatimResult = {
  place_id: number | string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
};

const US_STATE_ABBREV: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

const parseStateCode = (raw: string) => {
  const value = String(raw || "").trim();
  if (!value) return "";

  const isoMatch = value.match(/^US-([A-Z]{2})$/i);
  if (isoMatch) return isoMatch[1].toUpperCase();

  if (value.length === 2) return value.toUpperCase();

  return US_STATE_ABBREV[value.toLowerCase()] || value.slice(0, 2).toUpperCase();
};

const formatSuggestionLabel = (
  parsed: ParsedAddress,
  displayName?: string
) => {
  if (parsed.streetAddress && parsed.city && parsed.state && parsed.zipCode) {
    return `${parsed.streetAddress}, ${parsed.city}, ${parsed.state} ${parsed.zipCode}`;
  }
  return displayName?.trim() || parsed.formatted;
};

export const parseNominatimResult = (result: NominatimResult): ParsedAddress | null => {
  const address = result.address;
  if (!address) return null;

  const streetAddress = [address.house_number, address.road || address.pedestrian]
    .filter(Boolean)
    .join(" ")
    .trim();

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    "";

  const state = parseStateCode(address["ISO3166-2-lvl4"] || address.state || "");
  const zipCode = String(address.postcode || "")
    .replace(/\D/g, "")
    .slice(0, 5);

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  const formatted = formatSuggestionLabel(
    {
      streetAddress,
      city,
      state,
      zipCode,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      formatted: String(result.display_name || "").trim(),
    },
    result.display_name
  );

  if (!streetAddress && !city) {
    return null;
  }

  return {
    streetAddress,
    city,
    state,
    zipCode,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    formatted,
  };
};

export type PlaceSearchSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

/** City / region / place search — shared Nominatim stack, no hardcoded cities. */
export const searchPlaceSuggestions = async (
  query: string
): Promise<PlaceSearchSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "1",
    limit: "8",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "PersianMapMobile/1.0",
        },
      }
    );

    if (!response.ok) return [];

    const results = (await response.json()) as NominatimResult[];
    if (!Array.isArray(results)) return [];

    const suggestions: PlaceSearchSuggestion[] = [];

    for (const result of results) {
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      const parsed = parseNominatimResult(result);
      const label =
        parsed?.formatted?.trim() ||
        String(result.display_name || "").trim() ||
        trimmed;

      suggestions.push({
        id: String(result.place_id),
        label,
        latitude,
        longitude,
      });
    }

    return suggestions;
  } catch {
    return [];
  }
};

export const searchAddressSuggestions = async (
  query: string
): Promise<AddressSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "1",
    limit: "6",
    countrycodes: "us",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "PersianMapMobile/1.0",
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const results = (await response.json()) as NominatimResult[];
  if (!Array.isArray(results)) {
    return [];
  }

  const suggestions: AddressSuggestion[] = [];

  for (const result of results) {
    const parsed = parseNominatimResult(result);
    if (!parsed) continue;

    suggestions.push({
      id: String(result.place_id),
      label: formatSuggestionLabel(parsed, result.display_name),
      parsed,
    });
  }

  return suggestions;
};

export type StructuredAddressQuery = {
  streetAddress?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
};

export const geocodeStructuredAddress = async (
  input: StructuredAddressQuery
): Promise<{ latitude: number; longitude: number } | null> => {
  const city = input.city.trim();
  const state = input.state.trim();
  const zipCode = input.zipCode.trim();
  const street = input.streetAddress?.trim() || "";

  if (!city || !state) return null;

  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    countrycodes: "us",
    city,
    state,
  });

  if (street) params.set("street", street);
  if (zipCode) params.set("postalcode", zipCode);
  if (input.country?.trim()) {
    params.set("country", input.country.trim());
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "PersianMapMobile/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const results = (await response.json()) as NominatimResult[];
    if (!Array.isArray(results) || !results.length) return null;

    const latitude = Number(results[0].lat);
    const longitude = Number(results[0].lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  } catch {
    return null;
  }
};

export const geocodeAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number } | null> => {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    limit: "1",
    countrycodes: "us",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "PersianMapMobile/1.0",
        },
      }
    );

    if (!response.ok) return null;

    const results = (await response.json()) as NominatimResult[];
    if (!Array.isArray(results) || !results.length) return null;

    const latitude = Number(results[0].lat);
    const longitude = Number(results[0].lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  } catch {
    return null;
  }
};
