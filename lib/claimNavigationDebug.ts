/** Development-only navigation diagnostics for claim auth return. */
export const logClaimNavigation = (
  phase: string,
  details: Record<string, unknown>
): void => {
  if (!__DEV__) return;
  console.log(`[claim-nav] ${phase}`, details);
};
