import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isSessionDecryptionError } from '@/lib/authSessionCookies';

/**
 * Server-side session read that tolerates stale JWT cookies (secret rotation, dev fallback).
 * Stale cookies are cleared in middleware (RSC cannot modify cookies).
 */
export async function safeAuth() {
  try {
    const session = await auth();
    return session ?? null;
  } catch (err) {
    if (isSessionDecryptionError(err)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[auth] Stale session ignored (decryption secret mismatch).');
      }
      return null;
    }
    throw err;
  }
}
