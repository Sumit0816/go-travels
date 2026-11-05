/**
 * Small in-memory sliding-window rate limiter for public forms (per server instance).
 * Enough to stop accidental double-submits and casual abuse; a shared store (Redis) or a
 * CAPTCHA such as Turnstile can be added at launch if spam appears.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>()
  return {
    /** Records a hit and returns whether it is allowed. */
    check(key: string, now = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        return false
      }
      recent.push(now)
      hits.set(key, recent)
      // Keep memory bounded on a busy instance.
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
      }
      return true
    },
  }
}
