/**
 * Run: npx tsx lib/mapDeselectGuard.test.ts
 */
import {
  androidMarkerTrackingSignature,
  applySearchGestureToBackgroundPress,
  createAndroidMarkerSnapshotTracker,
  createMapDeselectGuard,
  createMapSearchGestureGuard,
  selectionAfterMapBackgroundPress,
} from "./mapDeselectGuard";

const assert = (label: string, condition: boolean) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
};

const business = { id: "biz-1" };
const guard = createMapDeselectGuard();

const markerWindow = guard.arm();
assert(
  "background press during the marker-press window keeps the business",
  selectionAfterMapBackgroundPress(business, guard) === business
);
assert(
  "marker-press action during the window keeps the business",
  selectionAfterMapBackgroundPress(business, guard, "marker-press") === business
);

guard.arm();
assert(
  "a stale viewport release does not end the newer marker window",
  guard.release(markerWindow) === false &&
    selectionAfterMapBackgroundPress(business, guard) === business
);

guard.release();
assert(
  "a later background press clears the selected business",
  selectionAfterMapBackgroundPress(business, guard) === null
);
assert(
  "a marker-press action still does not clear after the window",
  selectionAfterMapBackgroundPress(business, guard, "marker-press") === business
);

const idleSignature = androidMarkerTrackingSignature({
  markerKey: "biz-1",
  selected: false,
  activeUpdate: false,
  kind: "business",
});
const selectedSignature = androidMarkerTrackingSignature({
  markerKey: "biz-1",
  selected: true,
  activeUpdate: false,
  kind: "business",
});
assert(
  "selection state is part of the Android tracking signature",
  idleSignature !== selectedSignature
);

const snapshot = createAndroidMarkerSnapshotTracker();
snapshot.sync(idleSignature);
snapshot.noteLayout();
assert("initial idle snapshot commits once", snapshot.commitAfterLayout());
assert("initial idle snapshot disables tracking", !snapshot.tracksViewChanges());
assert(
  "a second commit does not take another idle snapshot",
  snapshot.commitAfterLayout() === false
);

snapshot.sync(selectedSignature);
assert(
  "idle-to-selected enables one fresh snapshot",
  snapshot.tracksViewChanges()
);
assert(
  "fallback before the selected layout does not freeze the idle bitmap",
  snapshot.fallbackTick() === "waiting-for-layout" &&
    snapshot.tracksViewChanges()
);
snapshot.noteLayout();
assert(
  "selected layout commits the turquoise pin and disables tracking",
  snapshot.commitAfterLayout() && snapshot.tracksViewChanges() === false
);

snapshot.sync(idleSignature);
assert(
  "selected-to-idle enables one fresh snapshot",
  snapshot.tracksViewChanges()
);
assert(
  "fallback before the idle layout does not freeze the selected bitmap",
  snapshot.fallbackTick() === "waiting-for-layout" &&
    snapshot.tracksViewChanges()
);
snapshot.noteLayout();
assert(
  "idle layout commits the white pin and disables tracking",
  snapshot.fallbackTick() === "settled" && snapshot.tracksViewChanges() === false
);

const searchGesture = createMapSearchGestureGuard();
let backgroundPresses = 0;
const countBackgroundPress = () => {
  backgroundPresses += 1;
};
searchGesture.begin();
assert(
  "the same Search gesture is not handled as a background Map press",
  applySearchGestureToBackgroundPress(searchGesture, countBackgroundPress) ===
    "ignored" && backgroundPresses === 0
);
searchGesture.end();
assert(
  "a separate Map press immediately after Search is handled normally",
  applySearchGestureToBackgroundPress(searchGesture, countBackgroundPress) ===
    "handled" && backgroundPresses === 1
);

console.log("mapDeselectGuard tests passed");
