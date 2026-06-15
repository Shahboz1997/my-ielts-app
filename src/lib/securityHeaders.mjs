/**
 * HTTP security headers (checkvibe, securityheaders.com, OWASP).
 * DNS records (SPF/DMARC/DKIM) must be set at the domain registrar — see scripts/dns-security-records.txt
 */

const IS_PROD = process.env.NODE_ENV === 'production';

function buildContentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    [
      "script-src 'self' 'unsafe-inline'",
      IS_PROD ? '' : "'unsafe-eval'",
      'https://va.vercel-scripts.com',
      'https://vercel.live',
    ]
      .filter(Boolean)
      .join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: data:",
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      'https://va.vercel-scripts.com',
      'https://vitals.vercel-insights.com',
      'https://accounts.google.com',
      'https://oauth2.googleapis.com',
      'wss:',
    ].join(' '),
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
  ];

  if (IS_PROD) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/** @returns {Array<[string, string]>} */
export function getSecurityHeaderEntries() {
  const entries = [
    ['X-DNS-Prefetch-Control', 'off'],
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
    ['Cross-Origin-Opener-Policy', 'same-origin-allow-popups'],
    ['Cross-Origin-Resource-Policy', 'same-site'],
    ['X-XSS-Protection', '0'],
    ['Content-Security-Policy', buildContentSecurityPolicy()],
  ];

  if (IS_PROD) {
    entries.push([
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    ]);
  }

  return entries;
}

/** For next.config `headers()` — [{ key, value }, …] */
export function getSecurityHeadersForNextConfig() {
  return getSecurityHeaderEntries().map(([key, value]) => ({ key, value }));
}

/** Apply headers to a NextResponse (middleware). */
export function applySecurityHeaders(response) {
  for (const [key, value] of getSecurityHeaderEntries()) {
    response.headers.set(key, value);
  }
  return response;
}
