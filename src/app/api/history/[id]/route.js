export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { safeAuth } from '@/lib/safeAuth';
import { getHistoryCheckForUser, patchHistoryCheckForUser, formatHistoryDbError } from '@/lib/historyChecks';
import { writingProfileTag } from '@/lib/writingProfileCache.js';

export async function GET(_request, { params }) {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await params;
  const id = typeof resolved?.id === 'string' ? resolved.id : resolved?.id?.[0];
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const check = await getHistoryCheckForUser(session.user.id, id);
    if (!check) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ check });
  } catch (err) {
    console.error('[/api/history/[id]] error:', err);
    return NextResponse.json(
      { error: err?.message || 'Database unavailable' },
      { status: 503 }
    );
  }
}

export async function PATCH(request, { params }) {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolved = await params;
  const id = typeof resolved?.id === 'string' ? resolved.id : resolved?.id?.[0];
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const scoreRaw = body?.score;
  const scoreNum =
    scoreRaw === null || scoreRaw === undefined ? null : Number(scoreRaw);
  if (scoreNum !== null && !Number.isFinite(scoreNum)) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }

  let feedbackValue = body?.feedback;
  let feedbackPatch = body?.feedbackPatch;
  const tutorComment =
    typeof body?.tutorComment === 'string'
      ? body.tutorComment
      : typeof body?.tutor_comment === 'string'
        ? body.tutor_comment
        : undefined;
  const essayText = typeof body?.essayText === 'string' ? body.essayText : undefined;

  if (feedbackPatch !== undefined && feedbackPatch !== null) {
    if (typeof feedbackPatch === 'string') {
      try {
        feedbackPatch = JSON.parse(feedbackPatch);
      } catch {
        return NextResponse.json({ error: 'Invalid feedbackPatch JSON' }, { status: 400 });
      }
    }
    if (typeof feedbackPatch !== 'object' || Array.isArray(feedbackPatch)) {
      return NextResponse.json({ error: 'Invalid feedbackPatch' }, { status: 400 });
    }
  }

  const hasPartialPatch =
    feedbackPatch != null || tutorComment !== undefined || essayText !== undefined;

  if (feedbackValue === undefined && !hasPartialPatch) {
    return NextResponse.json({ error: 'Missing feedback or feedbackPatch' }, { status: 400 });
  }

  if (typeof feedbackValue === 'string') {
    try {
      feedbackValue = JSON.parse(feedbackValue);
    } catch {
      return NextResponse.json({ error: 'Invalid feedback JSON' }, { status: 400 });
    }
  }

  try {
    const updated = await patchHistoryCheckForUser(session.user.id, id, {
      score: scoreNum,
      feedback: feedbackValue,
      feedbackPatch,
      tutorComment,
      essayText,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
      revalidateTag(writingProfileTag(session.user.id));
    } catch (_) {}

    return NextResponse.json({
      ok: true,
      id: updated.id,
      score: updated.score != null ? Number(updated.score) : null,
    });
  } catch (err) {
    console.error('[/api/history/[id]] PATCH error:', err);
    return NextResponse.json(
      { error: formatHistoryDbError(err) },
      { status: 503 }
    );
  }
}
