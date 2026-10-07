import type { PendingBusinessClaimReturn } from "./businessClaimReturnIntent";

export type ClaimProfileHref = {
  pathname: "/profile/v2";
  params: {
    id: string;
  };
};

export type PostAuthNavigationAction =
  | { type: "dismiss_to_profile"; href: ClaimProfileHref }
  | { type: "reset_explore_then_profile"; href: ClaimProfileHref }
  | { type: "replace_explore" };

export const buildClaimProfileHref = (
  pending: PendingBusinessClaimReturn
): ClaimProfileHref => ({
  pathname: "/profile/v2",
  params: {
    id: pending.routeProfileId,
  },
});

/**
 * Claim auth must never `replace` a new profile on top of an existing one.
 * `dismissTo` unwinds Login/Register/Verify down to the profile opened from Explore.
 */
export const resolvePostAuthNavigationAction = (
  pending: PendingBusinessClaimReturn | null,
  options?: { profileAlreadyInStack?: boolean }
): PostAuthNavigationAction => {
  if (!pending) {
    return { type: "replace_explore" };
  }

  const href = buildClaimProfileHref(pending);
  if (options?.profileAlreadyInStack === false) {
    return { type: "reset_explore_then_profile", href };
  }
  return { type: "dismiss_to_profile", href };
};

/** Test helper modeling Expo stack frames (bottom → top). */
export type NavStackFrame = "tabs" | "profile" | "login" | "verify";

export const simulateStackAfterClaimAuth = (
  stackBefore: NavStackFrame[],
  action: PostAuthNavigationAction
): NavStackFrame[] => {
  const stack = [...stackBefore];

  if (action.type === "dismiss_to_profile") {
    while (stack.length > 0 && stack[stack.length - 1] !== "profile") {
      stack.pop();
    }
    if (stack[stack.length - 1] !== "profile") {
      stack.push("profile");
    }
    return stack;
  }

  if (action.type === "reset_explore_then_profile") {
    return ["tabs", "profile"];
  }

  if (action.type === "replace_explore") {
    return ["tabs"];
  }

  return stack;
};

/** Models the failed 5c00e55 fallback: replace login with another profile screen. */
export const simulateLegacyReplaceProfileFallback = (
  stackBefore: NavStackFrame[]
): NavStackFrame[] => {
  const stack = [...stackBefore];
  if (stack[stack.length - 1] === "login" || stack[stack.length - 1] === "verify") {
    stack.pop();
  }
  stack.push("profile");
  return stack;
};
