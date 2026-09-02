import { apiUrl } from "./apiConfig";

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
  class?: string;
  addresstype?: string;
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

type HouseNumberQuery = {
  houseNumber: string;
  streetQuery: string;
  hasHouseNumber: boolean;
  fullStreetLine: string;
};

/** Leading house number + street, e.g. "4440 Twain Avenue", "123 Main St". */
export const parseHouseNumberFromQuery = (query: string): HouseNumberQuery => {
  const trimmed = query.trim();
  const match = trimmed.match(/^(\d+[A-Za-z]?(?:-\d+[A-Za-z]?)?)\s+(.+)$/);

  if (!match) {
    return {
      houseNumber: "",
      streetQuery: trimmed,
      hasHouseNumber: false,
      fullStreetLine: trimmed,
    };
  }

  return {
    houseNumber: match[1],
    streetQuery: match[2].trim(),
    hasHouseNumber: true,
    fullStreetLine: trimmed,
  };
};

const STREET_SUFFIX_MAP: Record<string, string> = {
  st: "street",
  str: "street",
  ave: "avenue",
  av: "avenue",
  blvd: "boulevard",
  dr: "drive",
  rd: "road",
  ln: "lane",
  ct: "court",
  pl: "place",
  pkwy: "parkway",
  hwy: "highway",
  cir: "circle",
};

const normalizeStreetName = (value: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => STREET_SUFFIX_MAP[token] || token)
    .join(" ");

const streetNamesMatch = (left: string, right: string) => {
  const a = normalizeStreetName(left);
  const b = normalizeStreetName(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

const isRoadOnlyNominatimResult = (result: NominatimResult) => {
  const address = result.address;
  if (!address) return true;
  if (address.house_number) return false;
  return result.class === "highway" || result.addresstype === "road";
};

const dedupeNominatimResults = (results: NominatimResult[]) => {
  const byId = new Map<string, NominatimResult>();
  for (const result of results) {
    byId.set(String(result.place_id), result);
  }
  return Array.from(byId.values());
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

export type AddressSearchBias = {
  latitude: number;
  longitude: number;
  /** Nominatim viewbox: west, north, east, south */
  viewbox?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
};

/** Default San Diego County bias when device location is unavailable. */
export const SAN_DIEGO_ADDRESS_BIAS: AddressSearchBias = {
  latitude: 32.7157,
  longitude: -117.1611,
  viewbox: {
    west: -117.35,
    south: 32.53,
    east: -116.85,
    north: 33.05,
  },
};

export type AddressSearchOptions = {
  bias?: AddressSearchBias | null;
  city?: string;
  state?: string;
};

const distanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildAddressSearchQuery = (
  query: string,
  options?: AddressSearchOptions
) => {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;

  const city = options?.city?.trim();
  const state = options?.state?.trim()?.toUpperCase();

  if (city) {
    const cityPattern = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const statePattern = state
      ? new RegExp(`\\b${state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
      : null;

    if (!cityPattern.test(trimmed)) {
      return `${trimmed}, ${city}${state ? `, ${state}` : ""}`;
    }

    if (state && !statePattern?.test(trimmed)) {
      return `${trimmed}, ${state}`;
    }

    return trimmed;
  }

  if (
    !/\b(ca|california)\b/i.test(trimmed) &&
    !/\b(san diego|la jolla|chula vista|escondido)\b/i.test(trimmed)
  ) {
    return `${trimmed}, San Diego, CA`;
  }

  return trimmed;
};

const buildStructuredStreetParam = (
  query: string,
  houseCtx: HouseNumberQuery
) => {
  const firstSegment = query.split(",")[0]?.trim() || query.trim();
  if (houseCtx.hasHouseNumber) {
    return firstSegment;
  }
  return firstSegment;
};

const appendViewboxParams = (
  params: URLSearchParams,
  bias?: AddressSearchBias | null
) => {
  const box = bias?.viewbox;
  if (!box) return;

  params.set(
    "viewbox",
    `${box.west},${box.north},${box.east},${box.south}`
  );
  params.set("bounded", "0");
};

const fetchGeocodeResults = async (
  params: URLSearchParams
): Promise<NominatimResult[]> => {
  const response = await fetch(
    `${apiUrl("/geocode/suggest/")}?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (response.status === 429 || response.status === 502) {
    return [];
  }

  if (!response.ok) return [];

  const payload = (await response.json()) as NominatimResult[] | { detail?: string };
  if (!Array.isArray(payload)) return [];
  return payload;
};

const applyHouseNumberFromQuery = (
  parsed: ParsedAddress,
  result: NominatimResult,
  houseCtx: HouseNumberQuery
): ParsedAddress => {
  if (!houseCtx.hasHouseNumber) {
    return parsed;
  }

  const resultHouse = String(result.address?.house_number || "").trim();
  const resultRoad = String(
    result.address?.road || result.address?.pedestrian || ""
  ).trim();

  if (resultHouse && resultHouse !== houseCtx.houseNumber) {
    return parsed;
  }

  if (resultHouse === houseCtx.houseNumber) {
    return parsed;
  }

  if (!resultRoad || !streetNamesMatch(houseCtx.streetQuery, resultRoad)) {
    return parsed;
  }

  const streetAddress = `${houseCtx.houseNumber} ${resultRoad}`.trim();
  const nextParsed = {
    ...parsed,
    streetAddress,
  };

  return {
    ...nextParsed,
    formatted: formatSuggestionLabel(nextParsed, result.display_name),
  };
};

const rankAddressResults = (
  results: NominatimResult[],
  bias: AddressSearchBias,
  query: string,
  houseCtx: HouseNumberQuery
) => {
  const preferredState = "CA";
  const localRadiusKm = 90;
  const queryStreet = query.split(",")[0]?.trim().toLowerCase() || "";

  const scored = results
    .map((result) => {
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);
      const parsed = parseNominatimResult(result);
      const distance =
        Number.isFinite(latitude) && Number.isFinite(longitude)
          ? distanceKm(bias.latitude, bias.longitude, latitude, longitude)
          : Number.POSITIVE_INFINITY;
      const state = parsed?.state || "";
      const city = parsed?.city || "";
      const stateBoost =
        state === preferredState ? 0 : state ? 250 : 120;
      const sanDiegoBoost = /san diego/i.test(city) ? -40 : 0;

      let matchBoost = 0;
      const resultHouse = String(result.address?.house_number || "").trim();
      const resultRoad = String(
        result.address?.road || result.address?.pedestrian || ""
      ).trim();
      const streetLine = String(parsed?.streetAddress || "").toLowerCase();

      if (houseCtx.hasHouseNumber) {
        if (resultHouse === houseCtx.houseNumber) {
          matchBoost -= 900;
          if (streetNamesMatch(houseCtx.streetQuery, resultRoad)) {
            matchBoost -= 200;
          }
        } else if (resultHouse) {
          matchBoost += 500;
        } else if (streetNamesMatch(houseCtx.streetQuery, resultRoad)) {
          matchBoost -= 350;
        } else if (isRoadOnlyNominatimResult(result)) {
          matchBoost += 250;
        }
      }

      if (queryStreet && streetLine) {
        if (streetLine === queryStreet) {
          matchBoost -= 300;
        } else if (
          streetLine.startsWith(queryStreet) ||
          queryStreet.startsWith(streetLine)
        ) {
          matchBoost -= 150;
        }
      }

      return {
        result,
        distance,
        score: distance + stateBoost + sanDiegoBoost + matchBoost,
      };
    })
    .sort((a, b) => a.score - b.score);

  const local = scored.filter((entry) => entry.distance <= localRadiusKm);
  return (local.length > 0 ? local : scored).map((entry) => entry.result);
};

const resultsToAddressSuggestions = (
  results: NominatimResult[],
  houseCtx: HouseNumberQuery
): AddressSuggestion[] => {
  const suggestions: AddressSuggestion[] = [];
  const seenLabels = new Set<string>();

  for (const result of results) {
    const baseParsed = parseNominatimResult(result);
    if (!baseParsed) continue;

    const parsed = applyHouseNumberFromQuery(baseParsed, result, houseCtx);
    const label = formatSuggestionLabel(parsed, result.display_name);
    const labelKey = label.toLowerCase();
    if (seenLabels.has(labelKey)) continue;
    seenLabels.add(labelKey);

    suggestions.push({
      id: String(result.place_id),
      label,
      parsed,
    });
  }

  return suggestions;
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
    const results = await fetchGeocodeResults(params);
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
  query: string,
  options?: AddressSearchOptions
): Promise<AddressSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return [];
  }

  const bias = options?.bias ?? SAN_DIEGO_ADDRESS_BIAS;
  const houseCtx = parseHouseNumberFromQuery(trimmed);
  const searchQuery = buildAddressSearchQuery(trimmed, options);
  const city = options?.city?.trim();
  const state = options?.state?.trim();

  const baseParams = {
    format: "json",
    addressdetails: "1",
    limit: "12",
    countrycodes: "us",
  };

  try {
    const requests: Promise<NominatimResult[]>[] = [
      (async () => {
        const params = new URLSearchParams({ ...baseParams, q: searchQuery });
        appendViewboxParams(params, bias);
        return fetchGeocodeResults(params);
      })(),
    ];

    if (searchQuery !== trimmed) {
      requests.push(
        (async () => {
          const params = new URLSearchParams({ ...baseParams, q: trimmed });
          appendViewboxParams(params, bias);
          return fetchGeocodeResults(params);
        })()
      );
    }

    if (houseCtx.hasHouseNumber) {
      requests.push(
        (async () => {
          const params = new URLSearchParams({
            ...baseParams,
            street: buildStructuredStreetParam(trimmed, houseCtx),
          });
          if (city) params.set("city", city);
          if (state) params.set("state", state);
          appendViewboxParams(params, bias);
          return fetchGeocodeResults(params);
        })()
      );
    }

    const batches = await Promise.all(requests);
    let results = dedupeNominatimResults(batches.flat());

    if (results.length === 0 && searchQuery !== trimmed) {
      const fallbackParams = new URLSearchParams({
        ...baseParams,
        q: trimmed,
      });
      appendViewboxParams(fallbackParams, bias);
      results = await fetchGeocodeResults(fallbackParams);
    }

    if (results.length === 0) {
      return [];
    }

    const ranked = rankAddressResults(results, bias, trimmed, houseCtx);

    if (houseCtx.hasHouseNumber) {
      const matching = ranked.filter((result) => {
        const resultHouse = String(result.address?.house_number || "").trim();
        const resultRoad = String(
          result.address?.road || result.address?.pedestrian || ""
        ).trim();
        if (resultHouse === houseCtx.houseNumber) return true;
        return streetNamesMatch(houseCtx.streetQuery, resultRoad);
      });
      if (matching.length > 0) {
        return resultsToAddressSuggestions(matching, houseCtx).slice(0, 6);
      }
    }

    return resultsToAddressSuggestions(ranked, houseCtx).slice(0, 6);
  } catch {
    return [];
  }
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
    const results = await fetchGeocodeResults(params);
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
    const results = await fetchGeocodeResults(params);
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
