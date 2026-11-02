export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { requireAuth } from '@/lib/session';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const result = await DAL.approveCandidate(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to approve candidate' }, { status: 500 });
  }
}
