import AsyncStorage from "@react-native-async-storage/async-storage";
import authStorage from "../app/utils/authStorage";

/** Legacy global keys — never delete on logout; migrate into scoped keys on login. */
export const LEGACY_USER_PROFILE_KEY = "user_profile_v2";
export const LEGACY_MY_BUSINESSES_KEY = "my_local_businesses";
const LAST_SESSION_USER_KEY = "session_last_user_id";

const profileKey = (userId: string) => `user_profile_v2_${userId}`;
const profileUsernameKey = (username: string) =>
  `user_profile_v2_u_${username.toLowerCase()}`;
export const getMyBusinessesStorageKey = (userId: string) =>
  `my_local_businesses_${userId}`;

const businessesKey = getMyBusinessesStorageKey;

export const getActiveUserId = async (): Promise<string | null> => {
  const tokens = await authStorage.getTokens();
  const uid = authStorage.getUserIdFromAccessToken(tokens?.access);
  if (uid == null) return null;
  return String(uid);
};

export const markSessionUser = async (userId: string) => {
  await AsyncStorage.setItem(LAST_SESSION_USER_KEY, userId);
};

export const getLastSessionUserId = async (): Promise<string | null> => {
  const raw = await AsyncStorage.getItem(LAST_SESSION_USER_KEY);
  return raw || null;
};

export const profileIdFromRecord = (profile: Record<string, unknown> | null) => {
  if (!profile) return null;
  const raw =
    profile.id ?? profile.user_id ?? profile.userId ?? profile.pk ?? null;
  if (raw == null || raw === "") return null;
  return String(raw);
};

/** Explicit owner id fields only — do not treat listing user_id as owner. */
export const businessOwnerId = (business: Record<string, unknown>) => {
  const raw =
    business.owner_id ??
    business.ownerId ??
    business.owner_user_id ??
    null;
  if (raw == null || raw === "") return null;
  return String(raw);
};

export const businessListingUserId = (business: Record<string, unknown>) => {
  const raw = business.user_id ?? business.userId ?? null;
  if (raw == null || raw === "") return null;
  return String(raw);
};

export const inspectBusinessOwnershipFields = (
  business: Record<string, unknown>
) => ({
  id: business.id ?? null,
  name: business.business_name ?? business.name ?? business.title ?? null,
  ownerId: businessOwnerId(business),
  ownerUsername: businessOwnerUsername(business),
  userId: businessListingUserId(business),
  createdBy: business.createdBy ?? business.created_by ?? null,
  ownerEmail: business.owner_email ?? business.ownerEmail ?? null,
  is_owner: business.is_owner ?? null,
  owner_is_current_user: business.owner_is_current_user ?? null,
});

/** My Businesses ownership — used by Profile tab only. */
export const isMyBusinessForUser = (
  business: Record<string, unknown>,
  userId: string,
  identity?: { username?: string; email?: string }
): boolean => {
  const username = String(identity?.username || "")
    .trim()
    .toLowerCase();
  const email = String(identity?.email || "")
    .trim()
    .toLowerCase();

  const explicitOwnerId = businessOwnerId(business);
  const ownerUsername = businessOwnerUsername(business);
  const ownerEmail = String(business.owner_email ?? business.ownerEmail ?? "")
    .trim()
    .toLowerCase();
  const createdBy = String(business.createdBy ?? business.created_by ?? "")
    .trim()
    .toLowerCase();

  if (explicitOwnerId) {
    return explicitOwnerId === userId;
  }

  if (ownerUsername && username) {
    return ownerUsername === username;
  }

  if (ownerEmail && email) {
    return ownerEmail === email;
  }

  if (createdBy && (createdBy === userId || (email && createdBy === email))) {
    return true;
  }

  // Ownerless or legacy rows with only polluted user_id/is_owner — hide from My Businesses.
  return false;
};

export const toMyBusinessLogRow = (business: Record<string, unknown>) => ({
  id: business.id ?? null,
  name: business.name ?? business.business_name ?? business.title ?? null,
  ownerId: businessOwnerId(business),
  ownerUsername: businessOwnerUsername(business),
  ownerEmail: business.owner_email ?? business.ownerEmail ?? null,
  userId: business.userId ?? business.user_id ?? null,
  createdBy: business.createdBy ?? business.created_by ?? null,
  email: business.email ?? business.owner_email ?? business.ownerEmail ?? null,
});

const isBusinessProfileStorageKey = (key: string) =>
  key.startsWith("profile_v2_") && !key.includes("_u_");

export const explainMyBusinessOwnershipMatch = (
  business: Record<string, unknown>,
  userId: string,
  identity?: { username?: string; email?: string }
): { owned: boolean; reason: string } => {
  const username = String(identity?.username || "")
    .trim()
    .toLowerCase();
  const email = String(identity?.email || "")
    .trim()
    .toLowerCase();

  const explicitOwnerId = businessOwnerId(business);
  const ownerUsername = businessOwnerUsername(business);
  const ownerEmail = String(business.owner_email ?? business.ownerEmail ?? "")
    .trim()
    .toLowerCase();
  const createdBy = String(business.createdBy ?? business.created_by ?? "")
    .trim()
    .toLowerCase();
  const listingUserId = businessListingUserId(business);

  if (explicitOwnerId && explicitOwnerId === userId) {
    return { owned: true, reason: "ownerId === currentUser.id" };
  }
  if (explicitOwnerId && explicitOwnerId !== userId) {
    return {
      owned: false,
      reason: `ownerId mismatch (business=${explicitOwnerId}, current=${userId})`,
    };
  }

  if (ownerUsername && username && ownerUsername === username) {
    return { owned: true, reason: "ownerUsername === currentUser.username" };
  }
  if (ownerUsername && username && ownerUsername !== username) {
    return {
      owned: false,
      reason: `ownerUsername mismatch (business=${ownerUsername}, current=${username})`,
    };
  }

  if (ownerEmail && email && ownerEmail === email) {
    return { owned: true, reason: "ownerEmail === currentUser.email" };
  }

  if (createdBy && (createdBy === userId || (email && createdBy === email))) {
    return { owned: true, reason: "createdBy matches currentUser.id or email" };
  }

  if (!explicitOwnerId && !ownerUsername && !ownerEmail && !createdBy) {
    return {
      owned: false,
      reason: "no owner fields (ownerId/ownerUsername/ownerEmail/createdBy missing)",
    };
  }

  return {
    owned: false,
    reason: `no rule matched (listing userId=${listingUserId ?? "none"}, is_owner=${String(business.is_owner ?? false)})`,
  };
};

export const BUSINESS_STORAGE_WRITE_SOURCES = {
  "my_local_businesses (legacy global)":
    "create-business.tsx (old), adoptLegacyBusinessesIfMatching",
  "my_local_businesses_{userId}":
    "saveUserBusinesses ← profile.tsx loadLocalBusinesses | loadUserBusinesses auto-save | adoptLegacyBusinessesIfMatching | upsertUserBusiness",
  "profile_v2_{businessId}":
    "create-business.tsx handleCreate | edit-business.tsx save",
} as const;

const likelyWriterForStorageKey = (storageKey: string) => {
  if (storageKey === LEGACY_MY_BUSINESSES_KEY) {
    return BUSINESS_STORAGE_WRITE_SOURCES["my_local_businesses (legacy global)"];
  }
  if (storageKey.startsWith("my_local_businesses_")) {
    return BUSINESS_STORAGE_WRITE_SOURCES["my_local_businesses_{userId}"];
  }
  if (storageKey.startsWith("profile_v2_") && !storageKey.includes("_u_")) {
    return BUSINESS_STORAGE_WRITE_SOURCES["profile_v2_{businessId}"];
  }
  return "unknown storage key pattern";
};

const businessNameMatchesNeedles = (
  business: Record<string, unknown>,
  needles: string[]
) => {
  const name = String(
    business.business_name ?? business.name ?? business.title ?? ""
  ).toLowerCase();
  return needles.some((needle) => name.includes(needle.toLowerCase()));
};

export type BusinessStorageHit = {
  storageKey: string;
  businessId: string | null;
  name: string | null;
  ownerId: string | null;
  ownerUsername: string | null;
  userId: string | null;
  createdBy: string | null;
  likelyWriter: string;
};

/** Scan all business-related AsyncStorage keys for target business names. */
export const diagnoseBusinessStorageDuplication = async (
  nameNeedles: string[] = ["home nurse", "tahchin corner"]
) => {
  const keys = await AsyncStorage.getAllKeys();
  const hits: BusinessStorageHit[] = [];

  const isBusinessStorageKey = (key: string) =>
    key === LEGACY_MY_BUSINESSES_KEY ||
    key.startsWith("my_local_businesses") ||
    (key.startsWith("profile_v2_") && !key.includes("_u_"));

  for (const storageKey of keys.filter(isBusinessStorageKey)) {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) continue;

    const recordHit = (business: Record<string, unknown>) => {
      if (!businessNameMatchesNeedles(business, nameNeedles)) return;
      const fields = inspectBusinessOwnershipFields(business);
      hits.push({
        storageKey,
        businessId: fields.id ? String(fields.id) : null,
        name: fields.name ? String(fields.name) : null,
        ownerId: fields.ownerId ? String(fields.ownerId) : null,
        ownerUsername: fields.ownerUsername ? String(fields.ownerUsername) : null,
        userId: fields.userId ? String(fields.userId) : null,
        createdBy: fields.createdBy ? String(fields.createdBy) : null,
        likelyWriter: likelyWriterForStorageKey(storageKey),
      });
    };

    try {
      if (storageKey.startsWith("profile_v2_") && !storageKey.includes("_u_")) {
        recordHit(JSON.parse(raw) as Record<string, unknown>);
        continue;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => recordHit(item as Record<string, unknown>));
      }
    } catch {
      /* skip malformed */
    }
  }

  console.log("STORAGE_DUPLICATION_SCAN", {
    searchNames: nameNeedles,
    hitCount: hits.length,
    hits,
    knownWritePaths: BUSINESS_STORAGE_WRITE_SOURCES,
  });

  return hits;
};

export const TEST_BUSINESS_NAME_NEEDLES = ["home nurse", "tahchin corner"];

const PARISA_CANONICAL_OWNER_IDS = new Set(["2"]);
const PARISA_CANONICAL_OWNER_USERNAMES = new Set(["parisa"]);

export type PollutedBusinessStorageRecord = {
  storageKey: string;
  profileKey: string | null;
  businessId: string | null;
  name: string | null;
  ownerId: string | null;
  ownerUsername: string | null;
  ownerEmail: string | null;
};

const isParisaCanonicalOwner = (business: Record<string, unknown>) => {
  const ownerId = businessOwnerId(business);
  const ownerUsername = businessOwnerUsername(business);
  return (
    (ownerId != null && PARISA_CANONICAL_OWNER_IDS.has(ownerId)) ||
    (ownerUsername != null &&
      PARISA_CANONICAL_OWNER_USERNAMES.has(ownerUsername))
  );
};

const canonicalOwnerPatch = (source: Record<string, unknown>) => {
  const ownerId = businessOwnerId(source) ?? "2";
  const ownerUsername = businessOwnerUsername(source) ?? "parisa";
  const ownerEmail = String(
    source.owner_email ?? source.ownerEmail ?? ""
  ).trim();
  return {
    owner_id: ownerId,
    ownerId,
    owner_username: ownerUsername,
    ownerUsername: ownerUsername,
    ...(ownerEmail
      ? { owner_email: ownerEmail, ownerEmail }
      : {}),
    created_by: source.created_by ?? source.createdBy ?? ownerId,
    createdBy: source.createdBy ?? source.created_by ?? ownerId,
  };
};

const collectTestBusinessStorageRecords = async (
  nameNeedles: string[] = TEST_BUSINESS_NAME_NEEDLES
): Promise<PollutedBusinessStorageRecord[]> => {
  const keys = await AsyncStorage.getAllKeys();
  const records: PollutedBusinessStorageRecord[] = [];

  const isBusinessStorageKey = (key: string) =>
    key === LEGACY_MY_BUSINESSES_KEY ||
    key.startsWith("my_local_businesses") ||
    isBusinessProfileStorageKey(key);

  const pushRecord = (storageKey: string, business: Record<string, unknown>) => {
    if (!businessNameMatchesNeedles(business, nameNeedles)) return;
    const fields = inspectBusinessOwnershipFields(business);
    records.push({
      storageKey,
      profileKey: isBusinessProfileStorageKey(storageKey) ? storageKey : null,
      businessId: fields.id ? String(fields.id) : null,
      name: fields.name ? String(fields.name) : null,
      ownerId: fields.ownerId ? String(fields.ownerId) : null,
      ownerUsername: fields.ownerUsername ? String(fields.ownerUsername) : null,
      ownerEmail: fields.ownerEmail ? String(fields.ownerEmail) : null,
    });
  };

  for (const storageKey of keys.filter(isBusinessStorageKey)) {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) continue;

    try {
      if (isBusinessProfileStorageKey(storageKey)) {
        pushRecord(storageKey, JSON.parse(raw) as Record<string, unknown>);
        continue;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) =>
          pushRecord(storageKey, item as Record<string, unknown>)
        );
      }
    } catch {
      /* skip malformed */
    }
  }

  return records;
};

/** Log every stored copy of test businesses (Home Nurse / Tahchin Corner). */
export const inspectPollutedTestBusinessStorage = async (
  nameNeedles: string[] = TEST_BUSINESS_NAME_NEEDLES
) => {
  const records = await collectTestBusinessStorageRecords(nameNeedles);
  console.log("POLLUTED_TEST_BUSINESS_SCAN", {
    searchNames: nameNeedles,
    recordCount: records.length,
    records,
  });
  return records;
};

export type PollutedBusinessCleanupReport = {
  canonicalByBusinessId: Record<
    string,
    { ownerId: string; ownerUsername: string; ownerEmail: string | null }
  >;
  removedFromKeys: { storageKey: string; businessId: string; name: string }[];
  repairedProfileKeys: string[];
};

/**
 * Remove polluted per-user copies of Parisa test businesses.
 * Keeps profile_v2_* rows for Map/Explore; repairs owner fields when polluted.
 */
export const cleanupPollutedTestBusinessStorage = async (
  nameNeedles: string[] = TEST_BUSINESS_NAME_NEEDLES
): Promise<PollutedBusinessCleanupReport> => {
  const records = await collectTestBusinessStorageRecords(nameNeedles);
  const hitsById = new Map<string, PollutedBusinessStorageRecord[]>();

  records.forEach((record) => {
    if (!record.businessId) return;
    const list = hitsById.get(record.businessId) || [];
    list.push(record);
    hitsById.set(record.businessId, list);
  });

  const canonicalByBusinessId: PollutedBusinessCleanupReport["canonicalByBusinessId"] =
    {};
  const canonicalBusinessById = new Map<string, Record<string, unknown>>();

  for (const [businessId, hits] of hitsById.entries()) {
    let canonicalBusiness: Record<string, unknown> | null = null;

    for (const hit of hits) {
      if (!hit.storageKey.startsWith("profile_v2_")) continue;
      const raw = await AsyncStorage.getItem(hit.storageKey);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (isParisaCanonicalOwner(parsed)) {
          canonicalBusiness = parsed;
          break;
        }
      } catch {
        /* skip */
      }
    }

    if (!canonicalBusiness) {
      for (const hit of hits) {
        if (!hit.storageKey.startsWith("my_local_businesses_2")) continue;
        const raw = await AsyncStorage.getItem(hit.storageKey);
        if (!raw) continue;
        try {
          const list = JSON.parse(raw);
          if (!Array.isArray(list)) continue;
          const match = list.find(
            (item) => String((item as Record<string, unknown>).id) === businessId
          ) as Record<string, unknown> | undefined;
          if (match && isParisaCanonicalOwner(match)) {
            canonicalBusiness = match;
            break;
          }
        } catch {
          /* skip */
        }
      }
    }

    if (!canonicalBusiness) {
      for (const hit of hits) {
        if (!hit.storageKey.startsWith("profile_v2_")) continue;
        const raw = await AsyncStorage.getItem(hit.storageKey);
        if (!raw) continue;
        try {
          canonicalBusiness = JSON.parse(raw) as Record<string, unknown>;
          break;
        } catch {
          /* skip */
        }
      }
    }

    if (!canonicalBusiness) continue;

    const ownerPatch = canonicalOwnerPatch(
      isParisaCanonicalOwner(canonicalBusiness)
        ? canonicalBusiness
        : { ...canonicalBusiness, owner_id: "2", owner_username: "parisa" }
    );

    canonicalByBusinessId[businessId] = {
      ownerId: String(ownerPatch.owner_id),
      ownerUsername: String(ownerPatch.owner_username),
      ownerEmail:
        String(ownerPatch.owner_email || ownerPatch.ownerEmail || "") || null,
    };
    canonicalBusinessById.set(businessId, {
      ...canonicalBusiness,
      ...ownerPatch,
    });
  }

  const removedFromKeys: PollutedBusinessCleanupReport["removedFromKeys"] = [];
  const repairedProfileKeys: string[] = [];
  const testBusinessIds = new Set(Object.keys(canonicalByBusinessId));

  const listKeys = (await AsyncStorage.getAllKeys()).filter(
    (key) =>
      key === LEGACY_MY_BUSINESSES_KEY || key.startsWith("my_local_businesses_")
  );

  for (const storageKey of listKeys) {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) continue;

    let list: Record<string, unknown>[];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      list = parsed as Record<string, unknown>[];
    } catch {
      continue;
    }

    const kept: Record<string, unknown>[] = [];
    for (const item of list) {
      const id = String(item.id || "");
      const isTest =
        testBusinessIds.has(id) ||
        businessNameMatchesNeedles(item, nameNeedles);

      if (!isTest) {
        kept.push(item);
        continue;
      }

      if (!id || !canonicalByBusinessId[id]) {
        kept.push(item);
        continue;
      }

      if (isParisaCanonicalOwner(item)) {
        kept.push({ ...item, ...canonicalOwnerPatch(canonicalBusinessById.get(id) || item) });
        continue;
      }

      removedFromKeys.push({
        storageKey,
        businessId: id,
        name: String(
          item.business_name ?? item.name ?? item.title ?? "unknown"
        ),
      });
    }

    if (kept.length !== list.length) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(kept));
    }
  }

  for (const [businessId, canonical] of canonicalBusinessById.entries()) {
    const profileKey = `profile_v2_${businessId}`;
    const raw = await AsyncStorage.getItem(profileKey);
    if (!raw) continue;

    try {
      const business = JSON.parse(raw) as Record<string, unknown>;
      const ownerPatch = canonicalOwnerPatch(canonical);
      const needsRepair =
        businessOwnerId(business) !== ownerPatch.owner_id ||
        businessOwnerUsername(business) !== ownerPatch.owner_username;

      if (needsRepair) {
        await AsyncStorage.setItem(
          profileKey,
          JSON.stringify({ ...business, ...ownerPatch })
        );
        repairedProfileKeys.push(profileKey);
      }
    } catch {
      /* skip */
    }
  }

  const report: PollutedBusinessCleanupReport = {
    canonicalByBusinessId,
    removedFromKeys,
    repairedProfileKeys,
  };

  console.log("CLEANED_MY_BUSINESSES", report);
  return report;
};

export type BusinessWithStorageSources = {
  business: Record<string, unknown>;
  loadedFrom: string[];
  mergeOrder: string[];
};

/** Raw candidates with provenance — which storage keys each row came from. */
export const gatherRawMyBusinessCandidatesWithProvenance = async (
  userId: string
): Promise<BusinessWithStorageSources[]> => {
  const entries: { source: string; business: Record<string, unknown> }[] = [];

  const scopedKey = getMyBusinessesStorageKey(userId);
  const scopedRaw = await AsyncStorage.getItem(scopedKey);
  if (scopedRaw) {
    const scoped = JSON.parse(scopedRaw);
    if (Array.isArray(scoped)) {
      (scoped as Record<string, unknown>[]).forEach((business) => {
        entries.push({ source: scopedKey, business });
      });
    }
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_MY_BUSINESSES_KEY);
  if (legacyRaw) {
    const legacyList = JSON.parse(legacyRaw);
    if (Array.isArray(legacyList)) {
      legacyList.forEach((business) => {
        entries.push({
          source: LEGACY_MY_BUSINESSES_KEY,
          business: business as Record<string, unknown>,
        });
      });
    }
  }

  const keys = await AsyncStorage.getAllKeys();
  const profileKeys = keys.filter(
    (key) => key.startsWith("profile_v2_") && !key.includes("_u_")
  );
  if (profileKeys.length) {
    const pairs = await AsyncStorage.multiGet(profileKeys);
    pairs.forEach(([key, value]) => {
      if (!value || !key) return;
      try {
        entries.push({
          source: key,
          business: JSON.parse(value) as Record<string, unknown>,
        });
      } catch {
        /* skip */
      }
    });
  }

  const byId = new Map<
    string,
    { business: Record<string, unknown>; sources: string[]; mergeOrder: string[] }
  >();

  entries.forEach(({ source, business }) => {
    const id = String(business.id || "");
    if (!id) return;
    const prev = byId.get(id);
    byId.set(id, {
      business: { ...(prev?.business || {}), ...business },
      sources: [...new Set([...(prev?.sources || []), source])],
      mergeOrder: [...(prev?.mergeOrder || []), source],
    });
  });

  return Array.from(byId.values()).map(({ business, sources, mergeOrder }) => ({
    business,
    loadedFrom: sources,
    mergeOrder,
  }));
};

/** All candidate rows before ownership filter (scoped list + every profile_v2_*). */
export const gatherRawMyBusinessCandidates = async (
  userId: string
): Promise<Record<string, unknown>[]> => {
  const withSources = await gatherRawMyBusinessCandidatesWithProvenance(userId);
  return withSources.map((entry) => entry.business);
};

export const businessOwnedByUser = (
  business: Record<string, unknown>,
  userId: string
) => businessOwnerId(business) === userId;

export const businessOwnerUsername = (business: Record<string, unknown>) => {
  const raw =
    business.owner_username ?? business.ownerUsername ?? business.owner_name ?? null;
  if (raw == null || raw === "") return null;
  return String(raw).trim().toLowerCase();
};

/** Strict My Businesses ownership — never include ownerless/orphan businesses. */
export const isBusinessOwnedByCurrentUser = (
  business: Record<string, unknown>,
  userId: string,
  username?: string | null,
  email?: string | null
) =>
  isMyBusinessForUser(business, userId, {
    username: username ?? undefined,
    email: email ?? undefined,
  });

export const filterBusinessesForUser = (
  list: Record<string, unknown>[],
  userId: string,
  username?: string | null,
  email?: string | null
) =>
  list.filter((item) =>
    isBusinessOwnedByCurrentUser(item, userId, username, email)
  );

const dedupeBusinessesById = (list: Record<string, unknown>[]) => {
  const byId = new Map<string, Record<string, unknown>>();
  list.forEach((item) => {
    const id = String(item.id || "");
    if (!id) return;
    byId.set(id, { ...(byId.get(id) || {}), ...item });
  });
  return Array.from(byId.values());
};

const canClaimLegacyRecord = async (
  userId: string,
  recordUserId: string | null
) => {
  if (recordUserId && recordUserId === userId) return true;
  if (recordUserId) return false;
  const lastUser = await getLastSessionUserId();
  return lastUser === userId;
};

const readLegacyProfile = async (): Promise<Record<string, unknown> | null> => {
  try {
    const legacyRaw = await AsyncStorage.getItem(LEGACY_USER_PROFILE_KEY);
    if (!legacyRaw) return null;
    return JSON.parse(legacyRaw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const loadProfileByUsername = async (username: string) => {
  const key = username.trim().toLowerCase();
  if (!key) return null;
  try {
    const raw = await AsyncStorage.getItem(profileUsernameKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const pickNonEmpty = (...values: unknown[]) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return undefined;
};

/** Merge local profile layers — richest custom fields win (never let empty API shell win). */
export const mergeStoredUserProfiles = (
  userId: string,
  ...layers: (Record<string, unknown> | null | undefined)[]
): Record<string, unknown> => {
  const defined = layers.filter(Boolean) as Record<string, unknown>[];
  if (!defined.length) {
    return { id: userId, user_id: userId };
  }

  const base = Object.assign({}, ...defined);

  return {
    ...base,
    id: userId,
    user_id: userId,
    name: pickNonEmpty(...defined.map((layer) => layer.name)),
    username: pickNonEmpty(...defined.map((layer) => layer.username)),
    email: pickNonEmpty(...defined.map((layer) => layer.email)),
    bio: pickNonEmpty(...defined.map((layer) => layer.bio)),
    city: pickNonEmpty(...defined.map((layer) => layer.city)),
    phone: pickNonEmpty(...defined.map((layer) => layer.phone)),
    instagram: pickNonEmpty(...defined.map((layer) => layer.instagram)),
    profileImage: pickNonEmpty(
      ...defined.map((layer) => layer.profileImage),
      ...defined.map((layer) => layer.profile_image)
    ),
    profile_image: pickNonEmpty(
      ...defined.map((layer) => layer.profile_image),
      ...defined.map((layer) => layer.profileImage)
    ),
  };
};

const profileIdentityMatches = (
  profile: Record<string, unknown>,
  identity: { username?: string; email?: string }
) => {
  const profileUsername = String(profile.username || "").trim().toLowerCase();
  const profileEmail = String(profile.email || "").trim().toLowerCase();
  const identityUsername = String(identity.username || "").trim().toLowerCase();
  const identityEmail = String(identity.email || "").trim().toLowerCase();

  if (identityUsername && profileUsername && identityUsername === profileUsername) {
    return true;
  }
  if (identityEmail && profileEmail && identityEmail === profileEmail) {
    return true;
  }
  return false;
};

export const loadUserProfile = async (
  userId: string,
  identity?: { username?: string; email?: string }
): Promise<Record<string, unknown> | null> => {
  try {
    const layers: Record<string, unknown>[] = [];

    const scopedRaw = await AsyncStorage.getItem(profileKey(userId));
    if (scopedRaw) {
      layers.push(JSON.parse(scopedRaw) as Record<string, unknown>);
    }

    const usernames = new Set<string>();
    if (identity?.username) {
      usernames.add(String(identity.username).trim().toLowerCase());
    }
    for (const layer of layers) {
      const name = String(layer.username || "").trim().toLowerCase();
      if (name) usernames.add(name);
    }

    for (const username of usernames) {
      const byUsername = await loadProfileByUsername(username);
      if (byUsername) layers.push(byUsername);
    }

    if (layers.length) {
      return mergeStoredUserProfiles(userId, ...layers);
    }

    const legacy = await readLegacyProfile();
    if (legacy) {
      const legacyId = profileIdFromRecord(legacy);
      const legacyMatches =
        legacyId === userId ||
        (identity && profileIdentityMatches(legacy, identity)) ||
        (await canClaimLegacyRecord(userId, legacyId));

      if (legacyMatches) {
        const migrated = mergeStoredUserProfiles(userId, legacy);
        await saveUserProfile(userId, migrated);
        return migrated;
      }
    }

    return null;
  } catch {
    return null;
  }
};

/** After API identity is known, recover legacy global profile for the matching user only. */
export const adoptLegacyBusinessesIfMatching = async (
  userId: string,
  identity: { username?: string; email?: string }
) => {
  try {
    const legacyRaw = await AsyncStorage.getItem(LEGACY_MY_BUSINESSES_KEY);
    if (!legacyRaw) return;

    const legacyList = JSON.parse(legacyRaw);
    if (!Array.isArray(legacyList)) return;

    const current = (await loadUserBusinesses(userId, identity)) as Record<
      string,
      unknown
    >[];
    const claimed: Record<string, unknown>[] = [];

    for (const item of legacyList) {
      const record = item as Record<string, unknown>;
      if (businessOwnedByUser(record, userId)) {
        claimed.push(record);
        continue;
      }

      if (isBusinessOwnedByCurrentUser(record, userId, identity.username)) {
        claimed.push({
          ...record,
          owner_id: record.owner_id ?? userId,
          user_id: record.user_id ?? userId,
          owner_username:
            record.owner_username ??
            record.ownerUsername ??
            identity.username,
        });
      }
    }

    if (claimed.length) {
      console.log("BUSINESS_STORAGE_WRITE", {
        writer: "adoptLegacyBusinessesIfMatching",
        targetKey: businessesKey(userId),
        userId,
        ownerUsername: identity.username,
        claimedCount: claimed.length,
        claimedNames: claimed.map(
          (b) => b.business_name || b.name || b.id
        ),
      });

      await saveUserBusinesses(
        userId,
        dedupeBusinessesById([...current, ...claimed]),
        identity.username
      );
    }
  } catch {
    /* ignore */
  }
};

const hasCustomProfileFields = (profile: Record<string, unknown> | null) =>
  Boolean(
    pickNonEmpty(
      profile?.bio,
      profile?.city,
      profile?.phone,
      profile?.instagram,
      profile?.profileImage,
      profile?.profile_image
    )
  );

export const adoptLegacyProfileIfMatching = async (
  userId: string,
  identity: { username?: string; email?: string }
): Promise<Record<string, unknown> | null> => {
  const existing = await loadUserProfile(userId, identity);
  if (existing && hasCustomProfileFields(existing)) {
    return existing;
  }

  const legacy = await readLegacyProfile();
  if (!legacy) return existing;

  const legacyId = profileIdFromRecord(legacy);
  const matches =
    legacyId === userId ||
    profileIdentityMatches(legacy, identity) ||
    (await canClaimLegacyRecord(userId, legacyId));

  if (!matches) return existing;

  const migrated = mergeStoredUserProfiles(userId, existing, legacy);
  await saveUserProfile(userId, migrated);
  return migrated;
};

export const saveUserProfile = async (
  userId: string,
  profile: Record<string, unknown>
) => {
  const payload = {
    ...profile,
    id: profile.id ?? userId,
    user_id: profile.user_id ?? userId,
  };

  await AsyncStorage.setItem(profileKey(userId), JSON.stringify(payload));

  const username = String(payload.username || "").trim().toLowerCase();
  if (username) {
    await AsyncStorage.setItem(
      profileUsernameKey(username),
      JSON.stringify(payload)
    );
  }

  await markSessionUser(userId);
};

const loadBusinessesFromProfileKeys = async (
  userId: string,
  username?: string | null,
  email?: string | null
): Promise<Record<string, unknown>[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const profileKeys = keys.filter(isBusinessProfileStorageKey);
    if (!profileKeys.length) return [];

    const pairs = await AsyncStorage.multiGet(profileKeys);
    const list: Record<string, unknown>[] = [];

    for (const [, value] of pairs) {
      if (!value) continue;
      try {
        const business = JSON.parse(value) as Record<string, unknown>;
        if (isBusinessOwnedByCurrentUser(business, userId, username, email)) {
          list.push(business);
        }
      } catch {
        /* skip */
      }
    }

    return list;
  } catch {
    return [];
  }
};

/**
 * Profile → My Businesses: read all public profile_v2_* records, filter by owner.
 * Optional scoped my_local_businesses_{userId} fallback when canonical profile_v2
 * has no explicit other owner (does not write storage).
 */
export const loadMyBusinessesForProfile = async (
  userId: string,
  identity?: { username?: string; email?: string }
): Promise<Record<string, unknown>[]> => {
  try {
    const catalogById = new Map<string, Record<string, unknown>>();
    const keys = await AsyncStorage.getAllKeys();
    const profileKeys = keys.filter(isBusinessProfileStorageKey);

    if (profileKeys.length) {
      const pairs = await AsyncStorage.multiGet(profileKeys);
      for (const [, value] of pairs) {
        if (!value) continue;
        try {
          const business = JSON.parse(value) as Record<string, unknown>;
          const id = String(business.id || "");
          if (!id) continue;
          catalogById.set(id, { ...(catalogById.get(id) || {}), ...business });
        } catch {
          /* skip */
        }
      }
    }

    const ownedById = new Map<string, Record<string, unknown>>();

    catalogById.forEach((business, id) => {
      if (!isMyBusinessForUser(business, userId, identity)) return;
      ownedById.set(id, business);
    });

    const scopedRaw = await AsyncStorage.getItem(businessesKey(userId));
    if (scopedRaw) {
      const scoped = JSON.parse(scopedRaw);
      if (Array.isArray(scoped)) {
        for (const item of scoped) {
          const record = item as Record<string, unknown>;
          const id = String(record.id || "");
          if (!id) continue;

          const catalog = catalogById.get(id);
          if (catalog) {
            const catalogOwnerId = businessOwnerId(catalog);
            const catalogOwnerUsername = businessOwnerUsername(catalog);
            const catalogOwnerEmail = String(
              catalog.owner_email ?? catalog.ownerEmail ?? ""
            )
              .trim()
              .toLowerCase();
            const catalogNamesOwner = Boolean(
              catalogOwnerId || catalogOwnerUsername || catalogOwnerEmail
            );
            if (
              catalogNamesOwner &&
              !isMyBusinessForUser(catalog, userId, identity)
            ) {
              continue;
            }
          }

          if (!isMyBusinessForUser(record, userId, identity)) continue;
          ownedById.set(id, { ...(catalog || {}), ...record });
        }
      }
    }

    return Array.from(ownedById.values());
  } catch {
    return [];
  }
};

export const diagnoseMyBusinesses = async (
  userId: string,
  identity?: { username?: string; email?: string }
) => {
  const scopedKey = getMyBusinessesStorageKey(userId);
  const scopedRaw = await AsyncStorage.getItem(scopedKey);
  const scopedList = scopedRaw ? JSON.parse(scopedRaw) : [];

  console.log("[MyBusinesses] current user", {
    id: userId,
    username: identity?.username ?? null,
    email: identity?.email ?? null,
    scopedStorageKey: scopedKey,
    scopedStorageCount: Array.isArray(scopedList) ? scopedList.length : 0,
  });

  const candidates: Record<string, unknown>[] = [];
  if (Array.isArray(scopedList)) {
    candidates.push(...scopedList);
  }

  const keys = await AsyncStorage.getAllKeys();
  const profileKeys = keys.filter(
    (key) => key.startsWith("profile_v2_") && !key.includes("_u_")
  );
  const pairs = await AsyncStorage.multiGet(profileKeys);
  pairs.forEach(([key, value]) => {
    if (!value) return;
    try {
      const business = JSON.parse(value) as Record<string, unknown>;
      candidates.push(business);
      const fields = inspectBusinessOwnershipFields(business);
      const owned = isMyBusinessForUser(business, userId, identity);
      console.log("[MyBusinesses] profile_v2 record", {
        storageKey: key,
        ...fields,
        owned,
      });
    } catch {
      /* skip */
    }
  });

  if (Array.isArray(scopedList)) {
    scopedList.forEach((item: Record<string, unknown>) => {
      const fields = inspectBusinessOwnershipFields(item);
      const owned = isMyBusinessForUser(item, userId, identity);
      console.log("[MyBusinesses] scoped list item", {
        ...fields,
        owned,
      });
    });
  }

  const filtered = await loadMyBusinessesForProfile(userId, identity);
  console.log("[MyBusinesses] render count", {
    filteredCount: filtered.length,
    names: filtered.map(
      (b) => b.business_name || b.name || b.id
    ),
  });

  return filtered;
};

export const loadUserBusinesses = async (
  userId: string,
  identity?: { username?: string; email?: string }
): Promise<unknown[]> => {
  try {
    const username = identity?.username ?? null;
    let list: Record<string, unknown>[] = [];

    const scopedRaw = await AsyncStorage.getItem(businessesKey(userId));
    if (scopedRaw) {
      const scoped = JSON.parse(scopedRaw);
      if (Array.isArray(scoped)) list = scoped as Record<string, unknown>[];
    }

    const legacyRaw = await AsyncStorage.getItem(LEGACY_MY_BUSINESSES_KEY);
    if (legacyRaw) {
      const legacyList = JSON.parse(legacyRaw);
      if (Array.isArray(legacyList)) {
        for (const item of legacyList) {
          const record = item as Record<string, unknown>;
          if (isBusinessOwnedByCurrentUser(record, userId, username)) {
            list.push(record);
          }
        }
      }
    }

    const fromProfiles = await loadBusinessesFromProfileKeys(
      userId,
      username,
      identity?.email ?? null
    );
    list = dedupeBusinessesById([...list, ...fromProfiles]);
    const owned = filterBusinessesForUser(list, userId, username);

    const scopedCount = scopedRaw
      ? (JSON.parse(scopedRaw) as unknown[]).length
      : 0;
    if (owned.length !== scopedCount) {
      console.log("BUSINESS_STORAGE_WRITE", {
        writer: "loadUserBusinesses (auto-save on count mismatch)",
        targetKey: businessesKey(userId),
        userId,
        ownerUsername: username,
        scopedCount,
        ownedCount: owned.length,
      });

      await saveUserBusinesses(userId, owned, username);
    }

    return owned;
  } catch {
    return [];
  }
};

export const saveUserBusinesses = async (
  userId: string,
  list: unknown[],
  ownerUsername?: string | null
) => {
  const username = ownerUsername?.trim().toLowerCase() || null;
  const normalized = filterBusinessesForUser(
    Array.isArray(list) ? (list as Record<string, unknown>[]) : [],
    userId,
    username
  ).map((record) => ({
    ...record,
    owner_id: businessOwnerId(record) ?? userId,
    user_id: businessListingUserId(record) ?? userId,
    ...(username && !businessOwnerUsername(record)
      ? { owner_username: username, ownerUsername: username }
      : {}),
  }));

  const targetKey = businessesKey(userId);

  console.log("BUSINESS_STORAGE_WRITE", {
    writer: "saveUserBusinesses",
    targetKey,
    userId,
    ownerUsername: username,
    businessCount: normalized.length,
    businesses: normalized.map((b) => toMyBusinessLogRow(b)),
    likelyCalledFrom:
      "profile.tsx loadLocalBusinesses | loadUserBusinesses | adoptLegacyBusinessesIfMatching | upsertUserBusiness",
  });

  await AsyncStorage.setItem(targetKey, JSON.stringify(normalized));
  await markSessionUser(userId);
};

export const upsertUserBusiness = async (
  userId: string,
  business: Record<string, unknown>,
  ownerUsername?: string | null
) => {
  const businessId = String(business.id || "");
  if (!businessId) return;

  const username =
    ownerUsername ?? businessOwnerUsername(business) ?? undefined;
  const list = (await loadUserBusinesses(userId, {
    username: username ?? undefined,
  })) as Record<string, unknown>[];
  const tagged = {
    ...business,
    owner_id: business.owner_id ?? userId,
    user_id: business.user_id ?? userId,
    owner_username:
      business.owner_username ??
      business.ownerUsername ??
      username ??
      undefined,
    ownerUsername:
      business.ownerUsername ??
      business.owner_username ??
      username ??
      undefined,
  };

  const next = list.some((item) => String(item.id) === businessId)
    ? list.map((item) =>
        String(item.id) === businessId ? { ...item, ...tagged } : item
      )
    : [...list, tagged];

  console.log("BUSINESS_STORAGE_WRITE", {
    writer: "upsertUserBusiness",
    targetKey: businessesKey(userId),
    userId,
    businessId,
    ownerUsername: username,
    likelyCalledFrom: "create-business.tsx | edit-business.tsx",
  });

  await saveUserBusinesses(userId, next, username);
};

/** Login: profile cache only — businesses load after identity (username) is known. */
export const prepareSessionForUser = async (userId: string) => {
  await loadUserProfile(userId);
  await markSessionUser(userId);
};

/** Logout: auth + session flag only — keep all user-scoped profile/business data. */
export const clearUserSession = async () => {
  await authStorage.clearTokens();
  await AsyncStorage.setItem("is_logged_in", "false");
};

/** API supplies identity; saved local custom fields must survive login refresh. */
export const mergeProfileWithApi = (
  cached: Record<string, unknown> | null,
  api: Record<string, unknown>
) => {
  const userId = String(
    pickNonEmpty(api.user_id, api.id, cached?.user_id, cached?.id) ?? ""
  );

  return mergeStoredUserProfiles(userId, cached, {
    ...api,
    id: userId,
    user_id: userId,
    username: pickNonEmpty(api.username, cached?.username),
    email: pickNonEmpty(api.email, cached?.email),
    name: pickNonEmpty(cached?.name, api.name, api.first_name),
    business_id: pickNonEmpty(api.business_id, cached?.business_id),
  });
};
