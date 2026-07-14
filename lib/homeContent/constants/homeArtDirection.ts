import type { HomeContentArtDirectionPolicy } from "../types/homeContentManifest.types";
import type { HomeArtDirectionMeta } from "../types/homeImageLibrary.types";

export const KOROOK_HOME_STYLE_VERSION = "korook-cinematic-v1";

/** Global art-direction policy — mirrored on CDN and enforced in admin QA. */
export const KOROOK_HOME_ART_DIRECTION_POLICY: HomeContentArtDirectionPolicy = {
  name: "Korook Cinematic Home",
  styleVersion: KOROOK_HOME_STYLE_VERSION,
  description:
    "Ultra-realistic AI travel photography with HDR golden-hour lighting and Persian color grading.",
  ultraRealistic: true,
  hdr: true,
  goldenHour: true,
  noText: true,
  noWatermark: true,
  noLogo: true,
  masterMinWidth: 3840,
  masterMinHeight: 2160,
  mobileDeliveryWidth: 1440,
  mobileDeliveryHeight: 2560,
  forbiddenElements: [
    "text",
    "watermark",
    "logo",
    "stock-photo-inconsistency",
    "off-brand-non-persian-scenes",
  ],
};

export const DEFAULT_HOME_ART_DIRECTION_META: HomeArtDirectionMeta = {
  styleVersion: KOROOK_HOME_STYLE_VERSION,
  ultraRealistic: true,
  hdr: true,
  goldenHour: true,
  noText: true,
  noWatermark: true,
  noLogo: true,
};

export type HomeArtDirectionQaChecklistItem = {
  id: string;
  label: string;
  required: boolean;
};

/** Admin upload wizard checklist derived from art-direction policy. */
export const HOME_ART_DIRECTION_QA_CHECKLIST: HomeArtDirectionQaChecklistItem[] =
  [
    {
      id: "master-4k",
      label: "4K master uploaded (min 3840×2160)",
      required: true,
    },
    {
      id: "style-v1",
      label: "Matches Korook cinematic style v1 (ultra-realistic AI)",
      required: true,
    },
    {
      id: "hdr-golden-hour",
      label: "HDR / cinematic lighting / golden hour",
      required: true,
    },
    {
      id: "no-text",
      label: "No text in frame",
      required: true,
    },
    {
      id: "no-watermark",
      label: "No watermark",
      required: true,
    },
    {
      id: "no-logo",
      label: "No logo",
      required: true,
    },
    {
      id: "persian-palette",
      label: "Persian color palette compliance (manual reviewer)",
      required: true,
    },
  ];

export const passesArtDirectionQa = (
  meta: HomeArtDirectionMeta,
  checklistPassed: Record<string, boolean>
): boolean => {
  const requiredIds = HOME_ART_DIRECTION_QA_CHECKLIST.filter(
    (item) => item.required
  ).map((item) => item.id);

  const checklistOk = requiredIds.every((id) => checklistPassed[id] === true);
  if (!checklistOk) return false;

  return (
    meta.styleVersion === KOROOK_HOME_STYLE_VERSION &&
    meta.ultraRealistic &&
    meta.hdr &&
    meta.goldenHour &&
    meta.noText &&
    meta.noWatermark &&
    meta.noLogo
  );
};
