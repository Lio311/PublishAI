import { NextResponse } from 'next/server';
import { literatureService } from '@/services/literature/literatureService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limitStr = searchParams.get('limit');
  const offsetStr = searchParams.get('offset');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const options: any = {};
  if (limitStr) {
    options.limit = parseInt(limitStr, 10);
  }
  if (offsetStr) {
    options.offset = parseInt(offsetStr, 10);
  }

  try {
    const results = await literatureService.search(query, options);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in literature search:', error);
    return NextResponse.json({ error: 'Failed to search literature' }, { status: 500 });
  }
}
