const PLACEHOLDER_PROFILE_NAMES = new Set([
  "new user",
  "user",
  "guest",
  "unknown",
]);

export const isPlaceholderProfileName = (value: unknown): boolean => {
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_PROFILE_NAMES.has(trimmed.toLowerCase());
};

export const resolveProfileDisplayName = (
  profile: Record<string, unknown> | null | undefined
): string | null => {
  if (!profile) return null;

  const name = String(profile.name || "").trim();
  const username = String(profile.username || "").trim();
  const email = String(profile.email || "").trim();

  if (name && !isPlaceholderProfileName(name)) {
    return name;
  }
  if (username) {
    return username;
  }
  if (email) {
    return email;
  }

  return null;
};
