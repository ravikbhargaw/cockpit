export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'All';
    const search = searchParams.get('search') || '';

    const candidates = await DAL.getResearchCandidates(status, search, true);
    const metrics = await DAL.getResearchQueueMetrics();

    return NextResponse.json({ candidates, metrics });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch research candidates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    if (!body.companyName && !body.name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    const created = await DAL.createResearchCandidate(body);
    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create research candidate' }, { status: 500 });
  }
}
