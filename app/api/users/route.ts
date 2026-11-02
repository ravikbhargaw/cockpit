export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { requireAuth } from '@/lib/session';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const currentUser = auth.user;
    const users = await DAL.getUsers();
    return NextResponse.json({ users, currentUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
