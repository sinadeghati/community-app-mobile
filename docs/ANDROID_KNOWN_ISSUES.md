# Android known issues

## Profile photo cropper — system bar overlap (SDK 54)

**Status:** Known issue, no fix on current Expo SDK.

**Affected flow:** Profile → change profile photo → native crop/edit screen (`expo-image-picker` with `allowsEditing: true`).

**Symptoms on Android:**
- Crop / Done / toolbar controls can sit under the status bar or navigation bar.
- Black or system UI areas may obscure cropper chrome.
- Crop area may be visible while editor controls are hard to see or tap.

**Root cause:**
- App has `edgeToEdgeEnabled: true` in `app.json`.
- `expo-image-picker@17.0.11` (Expo SDK 54) does not include the official Android edge-to-edge crop activity fix.
- That fix shipped in `expo-image-picker@55.0.12` (Expo SDK 55): [expo/expo#44208](https://github.com/expo/expo/pull/44208).

**Current policy (2026-08):**
- Stay on **Expo SDK 54**.
- Do **not** patch `expo-image-picker` native code in `node_modules`.
- Do **not** add a custom in-app crop UI for this unless product approves a larger change.
- iOS behavior is unaffected.

**Workaround for QA:** Users can still select and save a photo; cropping may require careful interaction or a device with smaller system bars. No backend or upload change required.

**Future fix options (not scheduled):**
1. Upgrade to Expo SDK 55+ and rebuild the Android dev client.
2. Product-approved custom crop flow (Android-only) — explicitly out of scope for now.
