
// Simple logging function (genkit verbose export was removed)
const verbose = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message);
  }
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export type CacheResult<T> = 
    | { state: 'hit', data: T, age: number }
    | { state: 'stale', data: T, age: number }
    | { state: 'miss' };

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export function getCache<T>(key: string): CacheResult<T> {
  const entry = cache.get(key);
  if (!entry) {
    verbose(`[CACHE MISS] for key: ${key}`);
    return { state: 'miss' };
  }

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    verbose(`[CACHE STALE] for key: ${key}`);
    return { state: 'stale', data: entry.data as T, age };
  }

  verbose(`[CACHE HIT] for key: ${key}`);
  return { state: 'hit', data: entry.data as T, age };
}

export function setCache<T>(key:string, data: T) {
  verbose(`[CACHE SET] for key: ${key}`);
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  cache.set(key, entry);
}

export function clearCache() {
  cache.clear();
}
