import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const result = DAL.approveCandidate(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to approve candidate' }, { status: 500 });
  }
}
