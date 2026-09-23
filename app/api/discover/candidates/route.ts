export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'All';
    const search = searchParams.get('search') || '';

    const candidates = DAL.getResearchCandidates(status, search, true);
    const metrics = DAL.getResearchQueueMetrics();

    return NextResponse.json({ candidates, metrics });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch research candidates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.companyName && !body.name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    const created = DAL.createResearchCandidate(body);
    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create research candidate' }, { status: 500 });
  }
}
