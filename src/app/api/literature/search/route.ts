import { NextResponse } from 'next/server';
import { literatureService } from '@/services/literature/literatureService';
import { RateLimitError, TimeoutError, RemoteServerError } from '@/services/literature/errors';
import { auth } from '@/app/auth';
import { applyRateLimit } from '@/services/rate-limit';

export async function GET(request: Request) {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limiting check (user-scoped or IP-scoped)
  const rateLimitResponse = await applyRateLimit(request, 'read', session.user.id);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limitStr = searchParams.get('limit');
  const offsetStr = searchParams.get('offset');
  const sourcesStr = searchParams.get('sources');

  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const options: any = {};
  if (limitStr) {
    const parsedLimit = parseInt(limitStr, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      options.limit = Math.min(parsedLimit, 50);
    }
  }
  if (offsetStr) {
    const parsedOffset = parseInt(offsetStr, 10);
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      options.offset = parsedOffset;
    }
  }
  if (sourcesStr) {
    const splitSources = sourcesStr.split(',').map(s => s.trim().toLowerCase());
    // Filter and sanitize, strictly ignoring arXiv
    options.sources = splitSources.filter(s => s === 'pubmed' || s === 'crossref' || s === 'semanticscholar');
  }

  try {
    const results = await literatureService.search(query.trim(), options);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[API /api/literature/search] Error:', error);

    if (error instanceof RateLimitError) {
      const retryAfter = error.retryAfterSeconds || 5;
      return NextResponse.json(
        {
          error: error.message,
          source: error.source,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    if (error instanceof TimeoutError) {
      return NextResponse.json(
        {
          error: error.message,
          source: error.source,
        },
        { status: 504 }
      );
    }

    if (error instanceof RemoteServerError) {
      return NextResponse.json(
        {
          error: error.message,
          source: error.source,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: error.message || 'Failed to search literature' }, { status: 500 });
  }
}
