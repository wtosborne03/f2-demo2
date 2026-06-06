/**
 * Lightweight SWR-style cache for the UserImageGrid component.
 *
 * Strategy: cache-first with background revalidation.
 * - On mount, cached pages are served instantly (stale data visible immediately).
 * - A background revalidation then fetches the latest page-0 data and updates
 *   the cache + any active subscribers.
 * - Subsequent infinite-scroll pages are also cached and served from cache on
 *   re-mount (e.g. navigating away and back).
 */

export interface GameImage {
  id: number;
  content: string;
  createdAt: number;
  game: number;
  minigame: number;
  minigameName?: string;
  prompt?: string;
  votes?: number;
}

interface CacheEntry {
  /** All images fetched so far for this key, across all pages. */
  images: GameImage[];
  /** The next page index to fetch (0-based). */
  nextPage: number;
  /** Whether all pages have been fetched. */
  exhausted: boolean;
  /** Unix ms timestamp of the last successful fetch of page 0. */
  fetchedAt: number;
}

/** How long cached data is considered "fresh" before a background revalidation is triggered (ms). */
const STALE_AFTER_MS = 30_000; // 30 seconds

const cache = new Map<string, CacheEntry>();

export function getCacheKey(userId: string, gameId: number | undefined): string {
  return `${userId}::${gameId ?? "all"}`;
}

export function getCached(key: string): CacheEntry | null {
  return cache.get(key) ?? null;
}

export function isStale(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt > STALE_AFTER_MS;
}

/**
 * Update (or create) the cache entry for a key after fetching a page.
 *
 * @param key      Cache key from getCacheKey().
 * @param page     The page index that was just fetched (0 = first page).
 * @param newData  The new images returned for that page.
 * @param limit    The page size limit used, so we know if the page was full.
 */
export function updateCache(
  key: string,
  page: number,
  newData: GameImage[],
  limit: number
): CacheEntry {
  const existing = cache.get(key);

  let images: GameImage[];
  if (page === 0) {
    // On a revalidation / first load, replace from the start
    images = newData;
  } else {
    // Append to whatever was already cached
    const base = existing?.images ?? [];
    images = [...base, ...newData];
  }

  const exhausted = newData.length < limit;
  const entry: CacheEntry = {
    images,
    nextPage: exhausted ? page : page + 1,
    exhausted,
    fetchedAt: page === 0 ? Date.now() : (existing?.fetchedAt ?? Date.now()),
  };

  cache.set(key, entry);
  return entry;
}

/** Fully remove a cache entry, e.g. to force a hard refresh. */
export function invalidateCache(key: string): void {
  cache.delete(key);
}
