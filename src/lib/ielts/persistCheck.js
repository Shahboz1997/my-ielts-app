import { revalidateTag } from 'next/cache';
import { writingProfileTag } from '@/lib/writingProfileCache.js';

/**
 * Run create and update separately to avoid transaction timeout (e.g. "Unable to start a transaction in the given time").
 * Ensure DATABASE_URL / DIRECT_URL in .env.local is correct and reachable (VPN/network).
 */
export async function persistCheckResult({ prisma, userId, userText, promptText, isT1, result }) {
  const typeValue = isT1 ? 'TASK_1' : 'TASK_2';
  const savedScore = Number.isFinite(Number(result?.overall_band)) ? Number(result.overall_band) : null;

  const savedCheck = await prisma.check.create({
    data: {
      type: typeValue,
      content: userText,
      promptText: promptText || null,
      score: savedScore,
      feedback: result,
      userId,
    },
  });
  try {
    revalidateTag(writingProfileTag(userId));
  } catch (_) {}
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: 1 } },
    select: { credits: true },
  });
  return {
    savedId: savedCheck.id,
    creditsRemaining: updatedUser.credits ?? 0,
  };
}
