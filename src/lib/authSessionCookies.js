/** Auth.js session / OAuth cookie names (including chunked JWT cookies). */
export const AUTH_SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'authjs.pkce.code_verifier',
  '__Secure-authjs.pkce.code_verifier',
  'authjs.state',
  '__Secure-authjs.state',
  'authjs.callback-url',
  '__Secure-authjs.callback-url',
  'authjs.csrf-token',
  '__Host-authjs.csrf-token',
];

export function authSessionChunkCookieNames() {
  const names = [];
  for (let i = 0; i < 8; i++) {
    names.push(`authjs.session-token.${i}`);
    names.push(`__Secure-authjs.session-token.${i}`);
  }
  return names;
}

export function allAuthCookieNames() {
  return [...AUTH_SESSION_COOKIE_NAMES, ...authSessionChunkCookieNames()];
}

/** JWT cookie present but session unreadable — stale secret or corrupted token. */
export function isSessionDecryptionError(err) {
  let e = err;
  let depth = 0;
  while (e && depth < 6) {
    const name = e?.name || '';
    const msg = String(e?.message || '').toLowerCase();
    if (
      name === 'JWTSessionError' ||
      name === 'JWEDecryptionFailed' ||
      msg.includes('decryption secret') ||
      msg.includes('decryption failed') ||
      msg.includes('no matching')
    ) {
      return true;
    }
    e = e?.cause;
    depth += 1;
  }
  return false;
}

export function isPkceOrOAuthStateError(err) {
  let e = err;
  let depth = 0;
  while (e && depth < 6) {
    const name = e?.name || '';
    const msg = String(e?.message || '').toLowerCase();
    if (
      name === 'InvalidCheck' ||
      msg.includes('pkcecodeverifier') ||
      (msg.includes('pkce') && msg.includes('parsed'))
    ) {
      return true;
    }
    e = e?.cause;
    depth += 1;
  }
  return false;
}

export function hasAuthSessionCookie(cookieStore) {
  for (const name of allAuthCookieNames()) {
    if (cookieStore.get(name)) return true;
  }
  return false;
}

/** Clear auth cookies on a NextResponse (route handlers / middleware). */
export function appendClearAuthCookies(response) {
  for (const n of allAuthCookieNames()) {
    response.cookies.set(n, '', { maxAge: 0, path: '/' });
  }
  return response;
}
