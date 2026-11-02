export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { requireAuth } from '@/lib/session';
import { getISTDateString } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const todayStr = getISTDateString();
    const targetDate = dateParam || todayStr;

    const [checkin, stats, history] = await Promise.all([
      DAL.getFounderCheckinByDate(targetDate),
      DAL.getFounderStats(todayStr),
      DAL.getFounderHistory(),
    ]);

    return NextResponse.json({
      date: targetDate,
      checkin,
      stats,
      history,
    });
  } catch (error) {
    console.error('Error fetching 180-Day Founder data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch founder check-in data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;

  return NextResponse.json(
    {
      retired: true,
      message: 'The 180-Day Founder feature has been retired. Historical records are preserved in the database.',
    },
    { status: 410 }
  );
}
