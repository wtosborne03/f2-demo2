/**
 * Lightweight SWR-style cache for the UserImageGrid component using IndexedDB.
 *
 * Strategy: cache-first with background revalidation.
 * - On mount, cached pages are served instantly (stale data visible immediately).
 * - A background revalidation then fetches the latest page-0 data and updates
 * the cache + any active subscribers.
 * - Subsequent infinite-scroll pages are also cached and served from cache on
 * re-mount (e.g. navigating away and back).
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
  /** The key itself, used as the primary key in IndexedDB */
  key: string;
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

const DB_NAME = 'SvelteImageCacheDB';
const STORE_NAME = 'imageCache';
const DB_VERSION = 1;

/**
 * Helper to initialize or get the IndexedDB instance.
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getCacheKey(userId: string, gameId: number | undefined): string {
  return `${userId}::${gameId ?? "all"}`;
}

/**
 * Asynchronously retrieves an entry from IndexedDB.
 */
export async function getCached(key: string): Promise<CacheEntry | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get from IndexedDB cache:', error);
    return null;
  }
}

export function isStale(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt > STALE_AFTER_MS;
}

/**
 * Update (or create) the cache entry for a key after fetching a page.
 * Saves the result asynchronously to IndexedDB.
 */
export async function updateCache(
  key: string,
  page: number,
  newData: GameImage[],
  limit: number
): Promise<CacheEntry> {
  // 1. Get the existing entry first
  const existing = await getCached(key);

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
    key, // Required for IndexedDB keyPath
    images,
    nextPage: exhausted ? page : page + 1,
    exhausted,
    fetchedAt: page === 0 ? Date.now() : (existing?.fetchedAt ?? Date.now()),
  };

  // 2. Write the entry back to IndexedDB
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to write to IndexedDB cache:', error);
  }

  return entry;
}

/** Fully remove a cache entry from IndexedDB, e.g. to force a hard refresh. */
export async function invalidateCache(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to invalidate IndexedDB cache:', error);
  }
}