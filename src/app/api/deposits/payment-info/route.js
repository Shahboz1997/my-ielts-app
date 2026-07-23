export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import { getPaymentInstructions } from '@/lib/paymentInstructions';
import { SUPPORT_EMAIL } from '@/lib/support';

/**
 * Payment card details for the top-up modal (auth required).
 */
export async function GET() {
  const session = await safeAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const info = getPaymentInstructions();
  return NextResponse.json({
    ...info,
    supportEmail: SUPPORT_EMAIL,
  });
}
