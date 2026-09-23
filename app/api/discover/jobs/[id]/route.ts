export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const job = await DAL.getResearchJobById(jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Research Job not found' },
        { status: 404 }
      );
    }

    const allCandidates = await DAL.getResearchCandidates();
    const jobCandidates = allCandidates.filter((c: any) => c.jobId === jobId);

    return NextResponse.json({
      success: true,
      job,
      candidates: jobCandidates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch research job' },
      { status: 500 }
    );
  }
}
