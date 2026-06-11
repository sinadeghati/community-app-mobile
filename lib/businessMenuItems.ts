/**
 * @deprecated Use businessOfferings — kept for backward-compatible imports.
 */
export {
  type BusinessOffering as BusinessMenuItem,
  type BusinessOfferingCategory,
  type BusinessOfferingAvailability,
  BUSINESS_OFFERING_CATEGORIES,
  BUSINESS_OFFERING_AVAILABILITY,
  createBusinessOfferingId as createMenuItemId,
  createEmptyBusinessOffering as createEmptyMenuItem,
  normalizeBusinessOfferings as normalizeMenuItems,
  getBusinessOfferings as getBusinessMenuItems,
  sanitizeBusinessOfferingsForSave as sanitizeMenuItemsForSave,
} from "./businessOfferings";
