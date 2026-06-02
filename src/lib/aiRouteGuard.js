import { getPrisma, withPrismaRetry } from '@/lib/prisma';
import {
  AI_RATE_LIMITS,
  getClientIp,
  hashClientIp,
  jsonAuthRequired,
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

/**
 * Task/topic/image helpers on POST /api/check.
 * Authenticated: user + IP rate limits.
 * Guest: IP rate limits only (no sign-in required).
 */
export async function resolveAuxiliaryAiAccess(request, session, route) {
  const ipHash = await hashClientIp(getClientIp(request));

  if (session?.user?.id) {
    return requireAuthenticatedAiAccess(request, session, route);
  }

  const guestBurst = await enforceRateLimit(`guest-ip:${ipHash}`, 'checkGuestIp');
  if (!guestBurst.ok) return guestBurst;

  const ipRl = await enforceRateLimit(`ip:${ipHash}`, route);
  if (!ipRl.ok) return ipRl;

  return { ok: true, userId: null, ipHash, isGuest: true };
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

/**
 * Access control for main essay analysis on POST /api/check (signed-in only).
 */
export async function resolveMainCheckAccess(request, session) {
  const ip = getClientIp(request);
  const ipHash = await hashClientIp(ip);
  const userId = session?.user?.id || null;

  if (!userId) {
    return {
      ok: false,
      response: jsonAuthRequired('Sign in to analyze your essay.'),
    };
  }

  const authAccess = await requireAuthenticatedAiAccess(request, session, 'check');
  if (!authAccess.ok) return authAccess;
  return { ok: true, userId, ipHash, isGuest: false };
}
