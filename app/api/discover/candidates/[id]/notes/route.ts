import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.note || body.note.trim() === '') {
      return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
    }
    const updatedCandidate = DAL.addCandidateNote(params.id, body);
    return NextResponse.json(updatedCandidate);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add research note' }, { status: 500 });
  }
}
