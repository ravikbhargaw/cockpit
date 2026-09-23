export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const updatedAccount = await DAL.updateContact(id, body);
    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const updatedAccount = await DAL.archiveContact(id);
    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to archive contact' }, { status: 500 });
  }
}
