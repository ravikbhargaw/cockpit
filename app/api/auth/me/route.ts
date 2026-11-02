export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  return NextResponse.json({
    authenticated: true,
    user: auth.user,
  });
}
