import { NextResponse } from 'next/server';
import { db } from '@/services/db';
import { agentEvaluations } from '@/services/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const evaluations = await db
      .select()
      .from(agentEvaluations)
      .orderBy(desc(agentEvaluations.createdAt))
      .limit(10);
      
    return NextResponse.json({ data: evaluations });
  } catch (error) {
    console.error('Failed to fetch evaluations:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
  }
}
