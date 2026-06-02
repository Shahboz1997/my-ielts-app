export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getZonedParts, zonedDateKey } from '@/lib/zonedTime';
import { sendPracticeReminderEmail } from '@/lib/reminderMail';
import { verifyCronRequest } from '@/lib/cronAuth';

/** Minutes after scheduled time still eligible (daily Vercel cron ≈ once/day UTC). */
const REMINDER_WINDOW_MINUTES = 25;

function parseDaySet(s) {
  if (typeof s !== 'string' || !s.trim()) return new Set([1, 2, 3, 4, 5]);
  const nums = s
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
  return new Set(nums.length ? nums : [1, 2, 3, 4, 5]);
}

function inReminderWindow(parts, hour, minute) {
  const now = parts.hour * 60 + parts.minute;
  const tgt = hour * 60 + minute;
  return now >= tgt && now <= tgt + REMINDER_WINDOW_MINUTES;
}

/**
 * Practice reminder cron — single entry point (see vercel.json).
 *
 * Auth: Authorization: Bearer <CRON_SECRET> only.
 * Hobby plan: cron may run at most once per day — frequent schedules fail deployment.
 */
export async function GET(request) {
  const auth = verifyCronRequest(request);
  if (!auth.ok) return auth.response;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[cron/practice-reminders] EMAIL_USER/EMAIL_PASS missing; skip');
    return NextResponse.json(
      { ok: false, error: 'EMAIL_USER/EMAIL_PASS missing' },
      { status: 503 }
    );
  }

  const prisma = getPrisma();
  const now = new Date();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const users = await prisma.user.findMany({
    where: { practiceRemindersEnabled: true },
    select: {
      id: true,
      email: true,
      name: true,
      language: true,
      practiceReminderHour: true,
      practiceReminderMinute: true,
      practiceReminderTimezone: true,
      practiceReminderDays: true,
      practiceReminderLastSent: true,
    },
  });

  for (const u of users) {
    const tz = u.practiceReminderTimezone || 'UTC';
    const parts = getZonedParts(now, tz);
    const days = parseDaySet(u.practiceReminderDays);

    if (!days.has(parts.weekday)) {
      skipped++;
      continue;
    }
    if (!inReminderWindow(parts, u.practiceReminderHour ?? 19, u.practiceReminderMinute ?? 0)) {
      skipped++;
      continue;
    }

    const todayKey = zonedDateKey(now, tz);
    if (u.practiceReminderLastSent) {
      const lastKey = zonedDateKey(u.practiceReminderLastSent, tz);
      if (lastKey === todayKey) {
        skipped++;
        continue;
      }
    }

    if (!u.email || !String(u.email).includes('@')) {
      skipped++;
      continue;
    }

    const res = await sendPracticeReminderEmail({
      to: u.email,
      name: u.name,
      locale: u.language === 'ru' ? 'ru' : 'en',
    });

    if (res.ok) {
      await prisma.user.update({
        where: { id: u.id },
        data: { practiceReminderLastSent: now },
      });
      sent++;
    } else {
      failed++;
      console.warn(
        '[cron/practice-reminders] send failed',
        u.id,
        u.email,
        res.reason || 'unknown'
      );
    }
  }

  const summary = { ok: true, checked: users.length, sent, skipped, failed };
  console.log('[cron/practice-reminders]', summary);
  return NextResponse.json(summary);
}
