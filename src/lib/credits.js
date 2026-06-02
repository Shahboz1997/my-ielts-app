/** Starting balance for new signups (keep in sync with Prisma User.credits @default). */
export const CREDITS_DEFAULT_NEW_USER = 3;

/** Returned in JSON when /api/check refuses analysis (client may read `code`). */
export const CREDITS_EXHAUSTED_CODE = 'CREDITS_EXHAUSTED';

/** Upper bound for stored essay-check credits (purchases + admin). */
export const CREDITS_MAX = 200;

/** Lower bound when clamping any persisted value (e.g. after decrement). */
export const CREDITS_MIN_GENERAL = 0;

/** Lower bound when an admin manually sets credits. */
export const CREDITS_MIN_ADMIN_MANUAL = 0;

export function clampCreditsGeneral(n) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return CREDITS_MIN_GENERAL;
  return Math.min(CREDITS_MAX, Math.max(CREDITS_MIN_GENERAL, x));
}

/** For POST /api/admin/credits — same cap as purchases. */
export function clampCreditsAdminManual(n) {
  return clampCreditsGeneral(n);
}

/** Stored balance for UI and /api/check guards (null → 0). */
export function normalizeCreditsBalance(value) {
  if (value == null) return CREDITS_MIN_GENERAL;
  const n = Number(value);
  if (!Number.isFinite(n)) return CREDITS_MIN_GENERAL;
  return clampCreditsGeneral(n);
}

export function userHasCheckCredits(credits) {
  return normalizeCreditsBalance(credits) >= 1;
}
