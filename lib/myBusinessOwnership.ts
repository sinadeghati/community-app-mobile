/** Pure My Businesses ownership rules — safe to unit test without AsyncStorage. */

export const businessOwnerId = (business: Record<string, unknown>) => {
  const raw =
    business.owner_id ??
    business.ownerId ??
    business.owner_user_id ??
    null;
  if (raw == null || raw === "") return null;
  return String(raw);
};

export const businessOwnerUsername = (business: Record<string, unknown>) => {
  const raw =
    business.owner_username ?? business.ownerUsername ?? business.owner_name ?? null;
  if (raw == null || raw === "") return null;
  return String(raw).trim().toLowerCase();
};

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
    if (explicitOwnerId !== userId) {
      return false;
    }

    const hasOwnerIdentity = Boolean(ownerUsername || ownerEmail);
    if (hasOwnerIdentity) {
      if (ownerUsername && username && ownerUsername !== username) {
        return false;
      }
      if (ownerEmail && email && ownerEmail !== email) {
        return false;
      }
      if (ownerUsername && !username) {
        return false;
      }
      if (ownerEmail && !email) {
        return false;
      }
      return true;
    }

    if (username || email) {
      return false;
    }

    return true;
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

  return false;
};

export const filterBusinessesForUser = (
  list: Record<string, unknown>[],
  userId: string,
  username?: string | null,
  email?: string | null
) =>
  list.filter((item) =>
    isMyBusinessForUser(item, userId, {
      username: username ?? undefined,
      email: email ?? undefined,
    })
  );
