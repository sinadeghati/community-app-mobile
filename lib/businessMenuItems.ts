export type BusinessMenuItem = {
  id: string;
  title: string;
  description?: string;
  price?: string;
  image?: string;
};

export const createMenuItemId = () =>
  `menu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createEmptyMenuItem = (): BusinessMenuItem => ({
  id: createMenuItemId(),
  title: "",
  description: "",
  price: "",
  image: "",
});

export const normalizeMenuItems = (raw: unknown): BusinessMenuItem[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry: unknown) => {
      const item = entry as Record<string, unknown>;
      const title = String(item?.title || "").trim();

      if (!title) return null;

      const description = String(item?.description || "").trim();
      const price = String(item?.price || "").trim();
      const image = String(item?.image || item?.image_url || "").trim();

      return {
        id: String(item?.id || createMenuItemId()),
        title,
        description: description || undefined,
        price: price || undefined,
        image: image || undefined,
      } satisfies BusinessMenuItem;
    })
    .filter(Boolean) as BusinessMenuItem[];
};

export const getBusinessMenuItems = (business?: {
  menu_items?: unknown;
  menuItems?: unknown;
} | null) =>
  normalizeMenuItems(business?.menu_items ?? business?.menuItems);

export const sanitizeMenuItemsForSave = (
  items: BusinessMenuItem[]
): BusinessMenuItem[] =>
  items
    .map((item) => {
      const title = item.title.trim();
      if (!title) return null;

      const description = item.description?.trim();
      const price = item.price?.trim();
      const image = item.image?.trim();

      return {
        id: item.id || createMenuItemId(),
        title,
        description: description || undefined,
        price: price || undefined,
        image: image || undefined,
      } satisfies BusinessMenuItem;
    })
    .filter(Boolean) as BusinessMenuItem[];
