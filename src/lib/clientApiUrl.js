/**
 * Same-origin API URLs in the browser (always uses the page you opened).
 */
export function clientApiUrl(path) {
  const p = String(path ?? "");
  const norm = p.startsWith("/") ? p : `/${p}`;
  if (typeof window === "undefined") return norm;
  // Always same-origin in the browser so preview / vercel.app URLs work when
  // NEXT_PUBLIC_APP_URL points at the production custom domain.
  return `${window.location.origin}${norm}`;
}
