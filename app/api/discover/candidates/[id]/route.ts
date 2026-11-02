export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { requireAuth } from '@/lib/session';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const candidate = await DAL.getCandidateById(params.id);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    return NextResponse.json(candidate);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch candidate details' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const updated = await DAL.updateCandidate(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Candidate PUT route error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update candidate' }, { status: 500 });
  }
}
