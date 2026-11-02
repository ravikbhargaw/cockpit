export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { requireAuth } from '@/lib/session';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length === 0) {
      return NextResponse.json({
        companies: [],
        contacts: [],
        opportunities: [],
        interactions: [],
        candidates: [],
      });
    }

    const results = await DAL.searchEntities(query);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
