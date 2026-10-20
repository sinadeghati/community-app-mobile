/**
 * Marker taps move the camera. The map then emits a background press.
 * That press must not clear the selection until the viewport guard ends.
 */
export const MAP_VIEWPORT_GUARD_MS = {
  animate: 500,
  immediate: 50,
} as const;

export function createMapDeselectGuard() {
  let active = false;
  let generation = 0;

  return {
    arm() {
      active = true;
      generation += 1;
      return generation;
    },
    generation() {
      return generation;
    },
    /** Ignore a release from an older marker tap. */
    release(armedGeneration?: number) {
      if (armedGeneration != null && armedGeneration !== generation) {
        return false;
      }
      active = false;
      return true;
    },
    shouldClearSelection(action?: string) {
      if (active) return false;
      if (action === "marker-press") return false;
      return true;
    },
  };
}

export function selectionAfterMapBackgroundPress<T>(
  selected: T | null,
  guard: { shouldClearSelection: (action?: string) => boolean },
  action?: string
): T | null {
  if (!guard.shouldClearSelection(action)) return selected;
  return null;
}

/** Visible selection is part of the snapshot key so idle and selected pins redraw once. */
export function androidMarkerTrackingSignature(input: {
  markerKey: string;
  selected: boolean;
  activeUpdate: boolean;
  kind: string;
}) {
  return `${input.markerKey}:${input.selected ? "selected" : "idle"}:${
    input.activeUpdate ? "update" : "plain"
  }:${input.kind}`;
}

export type AndroidMarkerSnapshotTick =
  | "waiting-for-layout"
  | "settled";

/**
 * Android custom markers must be snapshotted once per visual change.
 * A fallback tick before layout must not freeze the previous bitmap.
 */
export function createAndroidMarkerSnapshotTracker() {
  let signature: string | null = null;
  let tracks = true;
  let awaitingLayout = true;
  let layoutSeen = false;

  const arm = (nextSignature: string) => {
    signature = nextSignature;
    tracks = true;
    awaitingLayout = true;
    layoutSeen = false;
  };

  return {
    sync(nextSignature: string) {
      if (signature === nextSignature) return;
      arm(nextSignature);
    },
    noteLayout() {
      if (!awaitingLayout || layoutSeen) return false;
      layoutSeen = true;
      return true;
    },
    commitAfterLayout() {
      if (!awaitingLayout || !layoutSeen) return false;
      awaitingLayout = false;
      tracks = false;
      return true;
    },
    fallbackTick(): AndroidMarkerSnapshotTick {
      if (!awaitingLayout) return "settled";
      if (!layoutSeen) return "waiting-for-layout";
      this.commitAfterLayout();
      return "settled";
    },
    tracksViewChanges() {
      return tracks;
    },
  };
}

/** Ignores map presses only while the Search finger is down. */
export function createMapSearchGestureGuard() {
  let active = false;

  return {
    begin() {
      active = true;
    },
    end() {
      active = false;
    },
    shouldIgnoreBackgroundPress() {
      return active;
    },
  };
}

export function applySearchGestureToBackgroundPress(
  guard: { shouldIgnoreBackgroundPress: () => boolean },
  onBackgroundPress: () => void
) {
  if (guard.shouldIgnoreBackgroundPress()) return "ignored" as const;
  onBackgroundPress();
  return "handled" as const;
}
