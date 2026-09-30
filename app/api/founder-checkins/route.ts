export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const todayStr = new Date().toISOString().split('T')[0];
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
  try {
    const body = await request.json();
    const { date, workCompleted, salesCompleted, bodyCompleted, sleepCompleted } = body;

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required' }, { status: 400 });
    }

    const updatedCheckin = await DAL.upsertFounderCheckin({
      date,
      workCompleted: Boolean(workCompleted),
      salesCompleted: Boolean(salesCompleted),
      bodyCompleted: Boolean(bodyCompleted),
      sleepCompleted: Boolean(sleepCompleted),
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const [stats, history] = await Promise.all([
      DAL.getFounderStats(todayStr),
      DAL.getFounderHistory(),
    ]);

    return NextResponse.json({
      success: true,
      checkin: updatedCheckin,
      stats,
      history,
    });
  } catch (error) {
    console.error('Error saving 180-Day Founder check-in:', error);
    return NextResponse.json(
      { error: 'Failed to save founder check-in' },
      { status: 500 }
    );
  }
}
