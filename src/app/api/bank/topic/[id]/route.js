import { NextResponse } from 'next/server';
import { getTopicDetailById } from '@/lib/bankTopicCache.js';

/**
 * GET /api/bank/topic/:id
 */
export async function GET(_request, context) {
  try {
    const params = await context.params;
    const result = getTopicDetailById(params?.id);
    if (!result.ok) {
      return NextResponse.json({ error: 'Topic not found' }, { status: result.status });
    }
    return NextResponse.json(result.payload);
  } catch (e) {
    console.error('[api/bank/topic]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
