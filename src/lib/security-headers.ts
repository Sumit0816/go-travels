/**
 * HTTP security headers for every response (applied in next.config.ts). Pure, so the policy
 * is unit-tested.
 *
 * The Content-Security-Policy allows inline scripts because Next.js streams page data in inline
 * <script> tags; the policy's job here is to block other sites (no third-party scripts except
 * Google Analytics, no plugins, no framing of our pages, forms only post to us).
 */
type Options = {
  dev?: boolean
  /** The site is served over HTTPS (the public URL starts with https://). */
  https?: boolean
}

export function contentSecurityPolicy({ dev = false, https = false }: Options = {}): string {
  const google = ['https://www.googletagmanager.com', 'https://*.google-analytics.com']
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), google[0]!],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', ...google],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      ...google,
      'https://*.analytics.google.com',
      ...(dev ? ['ws:', 'wss:'] : []),
    ],
    // Contact page map.
    'frame-src': ['https://www.google.com', 'https://maps.google.com'],
    'worker-src': ["'self'", 'blob:'],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  }
  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(' ')}`)
  if (https) parts.push('upgrade-insecure-requests')
  return parts.join('; ')
}

export function securityHeaders({ dev = false, https = false }: Options = {}) {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy({ dev, https }) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    },
    // Browsers only honour this over HTTPS; two years, as hstspreload.org asks.
    ...(https
      ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
      : []),
  ]
}
