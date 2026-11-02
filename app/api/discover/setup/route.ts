export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { requireAuth } from '@/lib/session';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const setup = await DAL.getResearchSetup();
    return NextResponse.json(setup);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch research setup' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const updated = await DAL.saveResearchSetup(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save research setup' }, { status: 500 });
  }
}
