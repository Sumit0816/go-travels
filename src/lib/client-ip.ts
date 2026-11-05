/**
 * The visitor's IP for rate limiting. `x-real-ip` is set by the proxy (Vercel, nginx) from the
 * connection itself. Otherwise the last `x-forwarded-for` entry is the one our proxy added; the
 * first entries come from the visitor and can be faked.
 */
export function clientIpFrom(headers: Pick<Headers, 'get'>): string {
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real
  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return chain.at(-1) ?? 'unknown'
}

/** Requests per visitor per window for public forms. Looser outside production (test runs). */
export const formRateLimit = (production: number) =>
  process.env.NODE_ENV === 'production' ? production : production * 10
