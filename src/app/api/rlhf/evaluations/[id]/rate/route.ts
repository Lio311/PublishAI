import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { agentEvaluations } from '@/services/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, feedbackText } = body;

    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Invalid rating. Must be an integer between 1 and 5, or null.' }, { status: 400 });
    }

    if (feedbackText !== undefined && feedbackText !== null && typeof feedbackText !== 'string') {
      return NextResponse.json({ error: 'Invalid feedbackText. Must be a string.' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const updated = await db
      .update(agentEvaluations)
      .set({
        rating,
        feedbackText: feedbackText || null,
      })
      .where(eq(agentEvaluations.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Failed to update evaluation rating:', error);
    return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 });
  }
}
