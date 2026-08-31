export type DisplayableListingContext = {
  deletedIds: Set<string>;
  ownedIds: Set<string>;
  profileStorageIds: Set<string>;
  apiBusinessIds?: Set<string>;
  userId?: string | null;
};

export type ListingLike = {
  id?: number | string;
  business_name?: string;
  name?: string;
  title?: string;
  owner_id?: unknown;
  user_id?: unknown;
  is_owner?: boolean;
  owner_is_current_user?: boolean;
  deleted?: unknown;
  _deleted?: unknown;
  is_deleted?: unknown;
};

export const getListingTitle = (item: ListingLike) =>
  String(item.business_name || item.name || item.title || "").trim();

export const isLikelyClientGeneratedBusinessId = (id: string) => {
  if (!/^\d+$/.test(id)) {
    return false;
  }
  const numeric = Number(id);
  return Number.isFinite(numeric) && numeric >= 1_000_000_000_000;
};

const isDeletedBusinessRecord = (item: Record<string, unknown>) =>
  Boolean(item.deleted || item._deleted || item.is_deleted);

const isRecordOwnedByCurrentUser = (
  record: Record<string, unknown>,
  userId: string
) => {
  const ownerId = String(record.owner_id ?? record.user_id ?? "").trim();
  if (ownerId && ownerId === userId) return true;
  if (record.is_owner === true || record.owner_is_current_user === true) {
    return true;
  }
  return false;
};

export const isOwnedLegacyDeletedBusiness = (
  item: ListingLike,
  context: DisplayableListingContext
): boolean => {
  if (!context.userId) return false;

  const id = String(item.id || "").trim();
  if (!id) return false;

  if (context.apiBusinessIds?.has(id)) {
    return false;
  }

  if (!isLikelyClientGeneratedBusinessId(id)) {
    return false;
  }

  const record = item as Record<string, unknown>;
  if (!isRecordOwnedByCurrentUser(record, context.userId)) return false;

  return (
    !context.profileStorageIds.has(id) && !context.ownedIds.has(id)
  );
};

export const isDisplayableBusinessRecord = (
  business: Record<string, unknown> | null | undefined,
  deletedIds?: Set<string>,
  isDeletedId?: (id: string, ids?: Set<string> | null) => boolean
): boolean => {
  if (!business) return false;

  const id = String(business.id || "").trim();
  if (!id) return false;
  if (isDeletedId && isDeletedId(id, deletedIds)) return false;
  if (isDeletedBusinessRecord(business)) return false;

  return Boolean(getListingTitle(business));
};
