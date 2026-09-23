export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';

export async function GET() {
  try {
    const setup = DAL.getResearchSetup();
    return NextResponse.json(setup);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch research setup' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = DAL.saveResearchSetup(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save research setup' }, { status: 500 });
  }
}
