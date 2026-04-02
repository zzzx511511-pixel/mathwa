export type FavoriteOffer = {
  path: string;
  title: string;
  kind: "offer" | "demo";
  addedAt: number;
};

const STORAGE_KEY = "mathwa:favorites:v1";

let cachedJson: string | null = null;
let cachedList: FavoriteOffer[] = [];

function parse(raw: string | null): FavoriteOffer[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        const path = typeof o.path === "string" ? o.path : "";
        const title = typeof o.title === "string" ? o.title : "";
        const kind = o.kind === "demo" ? "demo" : "offer";
        const addedAt = typeof o.addedAt === "number" ? o.addedAt : Date.now();
        if (!path.startsWith("/offers/")) return null;
        return { path, title: title || "عرض عقاري", kind, addedAt } satisfies FavoriteOffer;
      })
      .filter(Boolean) as FavoriteOffer[];
  } catch {
    return [];
  }
}

export function favoritesEventName() {
  return "mathwa:favorites-changed";
}

export function getFavorites(): FavoriteOffer[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  if (raw === cachedJson) return cachedList;
  cachedJson = raw;
  cachedList = parse(raw);
  return cachedList;
}

export function setFavorites(list: FavoriteOffer[]) {
  if (typeof window === "undefined") return;
  const byPath = new Map<string, FavoriteOffer>();
  for (const item of list) {
    byPath.set(item.path, item);
  }
  const next = Array.from(byPath.values()).sort((a, b) => b.addedAt - a.addedAt);
  const json = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, json);
  cachedJson = json;
  cachedList = next;
  window.dispatchEvent(new CustomEvent(favoritesEventName()));
}

export function isFavoritePath(path: string): boolean {
  return getFavorites().some((f) => f.path === path);
}

export function addFavorite(item: Omit<FavoriteOffer, "addedAt"> & { addedAt?: number }) {
  const list = getFavorites().filter((f) => f.path !== item.path);
  list.unshift({
    path: item.path,
    title: item.title,
    kind: item.kind,
    addedAt: item.addedAt ?? Date.now()
  });
  setFavorites(list);
}

export function removeFavorite(path: string) {
  setFavorites(getFavorites().filter((f) => f.path !== path));
}

export function toggleFavorite(item: Omit<FavoriteOffer, "addedAt"> & { addedAt?: number }): boolean {
  if (isFavoritePath(item.path)) {
    removeFavorite(item.path);
    return false;
  }
  addFavorite(item);
  return true;
}
