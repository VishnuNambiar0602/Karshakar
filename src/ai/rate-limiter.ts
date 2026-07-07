const requestCounts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15; // Max 15 requests per minute per user

type RateLimitOptions = {
  ip?: string;
  endpoint?: string;
  maxRequests?: number;
  windowMs?: number;
};

export function isRateLimited(userId: string, options?: RateLimitOptions): boolean {
  const now = Date.now();
  const ip = options?.ip || '0.0.0.0';
  const endpoint = options?.endpoint || 'default';
  const windowMs = options?.windowMs || RATE_LIMIT_WINDOW;
  const maxRequests = options?.maxRequests || RATE_LIMIT_MAX_REQUESTS;
  const key = `${userId}:${ip}:${endpoint}`;
  const userRequests = requestCounts.get(key) || [];

  // Filter out requests that are outside the time window
  const recentRequests = userRequests.filter(
    (timestamp: number) => now - timestamp < windowMs
  );

  if (recentRequests.length >= maxRequests) {
    console.warn(`[RATE LIMIT] User ${userId} (${ip}) has been rate-limited on endpoint ${endpoint}.`);
    return true;
  }

  // Add the current request timestamp
  recentRequests.push(now);
  requestCounts.set(key, recentRequests);

  return false;
}