export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import {
  getClientIp,
  getGuestCheckQuotaStatus,
  hashClientIp,
} from '@/lib/aiRouteGuard.js';

/** Remaining free essay checks for this IP (guest demo). */
export async function GET(request) {
  try {
    const ipHash = await hashClientIp(getClientIp(request));
    const quota = await getGuestCheckQuotaStatus(ipHash);
    return NextResponse.json(quota);
  } catch (err) {
    console.error('[/api/guest-check-quota]', err);
    return NextResponse.json(
      { error: 'Could not load guest quota.' },
      { status: 503 }
    );
  }
}
