/**
 * In-memory sliding-window rate limiter.
 *
 * Best-effort only: state lives in a single process's memory, with no
 * cross-instance coordination. On a serverless platform (this project
 * targets Netlify) multiple instances can each keep their own counters, so
 * this is not a hard distributed guarantee — but for a single-brand store
 * it's more than enough to blunt a basic brute-force/spam script, without
 * paying for an external Redis-backed rate limiter.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup of expired buckets, run inline rather than via
// setInterval (which doesn't fit a serverless/edge lifecycle).
function cleanupIfLarge(now: number) {
  if (buckets.size <= 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  cleanupIfLarge(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/** Resets all rate-limit state. Test-only. */
export function resetRateLimits() {
  buckets.clear();
}
