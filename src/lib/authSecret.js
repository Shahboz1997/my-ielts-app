const DEV_FALLBACK = 'dev-secret-min-32-chars-required-for-auth';
const BUILD_FALLBACK = 'build-placeholder-secret-min-32-characters';

export function isNextBuildPhase() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

/** Shared auth secret for NextAuth, share tokens, and rate-limit hashing. */
export function getAuthSecret({ required = true } = {}) {
  const authSecret = (process.env.AUTH_SECRET || '').trim();
  const nextAuthSecret = (process.env.NEXTAUTH_SECRET || '').trim();
  const isDev = process.env.NODE_ENV === 'development';

  if (
    authSecret &&
    nextAuthSecret &&
    authSecret !== nextAuthSecret &&
    isDev
  ) {
    console.warn(
      '[auth] AUTH_SECRET and NEXTAUTH_SECRET differ — using AUTH_SECRET. Keep only one in .env.local to avoid broken sessions.'
    );
  }

  const secret = authSecret || nextAuthSecret;
  if (secret.length > 0) return secret;

  if (isDev) {
    console.warn(
      '[auth] NEXTAUTH_SECRET / AUTH_SECRET missing; using dev fallback. Set in .env.local for production.'
    );
    return DEV_FALLBACK;
  }

  if (isNextBuildPhase()) {
    return BUILD_FALLBACK;
  }

  if (!required) return undefined;

  throw new Error('NEXTAUTH_SECRET or AUTH_SECRET must be set in production.');
}
