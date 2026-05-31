import { getPrisma, withPrismaRetry } from '@/lib/prisma';
import {
  AI_RATE_LIMITS,
  GUEST_CHECK_LIMIT,
  getClientIp,
  hashClientIp,
  jsonAuthRequired,
  jsonGuestQuotaExhausted,
  jsonRateLimitExceeded,
} from '@/lib/aiAccessShared';

export {
  AI_RATE_LIMITS,
  AUTH_REQUIRED_CODE,
  GUEST_CHECK_LIMIT,
  GUEST_QUOTA_EXHAUSTED_CODE,
  RATE_LIMIT_EXCEEDED_CODE,
  getClientIp,
  hashClientIp,
  isAuxiliaryOpenAiCheckRequest,
  isMainEssayAnalysisRequest,
  jsonAuthRequired,
  jsonGuestQuotaExhausted,
  jsonRateLimitExceeded,
} from '@/lib/aiAccessShared';

function rateLimitBucketKey(scope, route, windowStartMs, windowMs) {
  const windowId = Math.floor(windowStartMs / windowMs);
  return `${scope}:${route}:${windowId}`;
}

async function consumeRateLimitBucket(bucketKey, { limit, windowMs }) {
  const prisma = getPrisma();
  const now = new Date();

  return withPrismaRetry(async () => {
    const existing = await prisma.aiRateLimitBucket.findUnique({
      where: { bucketKey },
    });

    if (!existing || now.getTime() - existing.windowStart.getTime() >= windowMs) {
      await prisma.aiRateLimitBucket.upsert({
        where: { bucketKey },
        create: { bucketKey, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return { ok: true, remaining: limit - 1 };
    }

    if (existing.count >= limit) {
      const retryAfterMs = Math.max(
        1,
        windowMs - (now.getTime() - existing.windowStart.getTime())
      );
      return { ok: false, retryAfterMs };
    }

    await prisma.aiRateLimitBucket.update({
      where: { bucketKey },
      data: { count: { increment: 1 } },
    });
    return { ok: true, remaining: limit - existing.count - 1 };
  });
}

async function enforceRateLimit(scope, route) {
  const cfg = AI_RATE_LIMITS[route];
  if (!cfg) return { ok: true };

  const nowMs = Date.now();
  const bucketKey = rateLimitBucketKey(scope, route, nowMs, cfg.windowMs);
  const result = await consumeRateLimitBucket(bucketKey, cfg);
  if (!result.ok) {
    return { ok: false, response: jsonRateLimitExceeded(result.retryAfterMs) };
  }
  return { ok: true };
}

export async function requireAuthenticatedAiAccess(request, session, route) {
  if (!session?.user?.id) {
    return {
      ok: false,
      response: jsonAuthRequired('Sign in to use AI features.'),
    };
  }

  const ipHash = await hashClientIp(getClientIp(request));
  const userScope = `user:${session.user.id}`;

  const userRl = await enforceRateLimit(userScope, route);
  if (!userRl.ok) return userRl;

  const ipRl = await enforceRateLimit(`ip:${ipHash}`, route);
  if (!ipRl.ok) return ipRl;

  return { ok: true, userId: session.user.id };
}

/** Read-only guest quota for UI (does not increment). */
export async function getGuestCheckQuotaStatus(ipHash) {
  const prisma = getPrisma();

  return withPrismaRetry(async () => {
    const row = await prisma.guestCheckQuota.findUnique({ where: { ipHash } });
    const used = Math.min(GUEST_CHECK_LIMIT, row?.count ?? 0);
    const remaining = Math.max(0, GUEST_CHECK_LIMIT - used);
    return { limit: GUEST_CHECK_LIMIT, used, remaining };
  });
}

async function consumeGuestCheckQuota(ipHash) {
  const prisma = getPrisma();

  return withPrismaRetry(async () => {
    const updated = await prisma.guestCheckQuota.updateMany({
      where: { ipHash, count: { lt: GUEST_CHECK_LIMIT } },
      data: { count: { increment: 1 } },
    });

    if (updated.count > 0) {
      const row = await prisma.guestCheckQuota.findUnique({ where: { ipHash } });
      return { ok: true, used: row?.count ?? 1 };
    }

    const existing = await prisma.guestCheckQuota.findUnique({ where: { ipHash } });
    if (existing) {
      return { ok: false, used: existing.count };
    }

    try {
      await prisma.guestCheckQuota.create({ data: { ipHash, count: 1 } });
      return { ok: true, used: 1 };
    } catch (e) {
      if (e?.code !== 'P2002') throw e;
      return consumeGuestCheckQuota(ipHash);
    }
  });
}

/**
 * Access control for main essay analysis on POST /api/check.
 * Authenticated: rate limit + credits (caller still validates credits).
 * Guest: IP rate limit + lifetime quota (GUEST_CHECK_LIMIT).
 */
export async function resolveMainCheckAccess(request, session) {
  const ip = getClientIp(request);
  const ipHash = await hashClientIp(ip);
  const userId = session?.user?.id || null;

  if (userId) {
    const authAccess = await requireAuthenticatedAiAccess(request, session, 'check');
    if (!authAccess.ok) return authAccess;
    return { ok: true, userId, ipHash, isGuest: false };
  }

  const guestBurst = await enforceRateLimit(`guest-ip:${ipHash}`, 'checkGuestIp');
  if (!guestBurst.ok) return guestBurst;

  const quota = await consumeGuestCheckQuota(ipHash);
  if (!quota.ok) {
    return { ok: false, response: jsonGuestQuotaExhausted() };
  }

  return { ok: true, userId: null, ipHash, isGuest: true, guestChecksUsed: quota.used };
}
