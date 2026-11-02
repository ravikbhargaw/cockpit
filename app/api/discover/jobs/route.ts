export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { planResearchInstruction } from '@/lib/ai/planner';
import { calculateEstimatedCost, getActiveResearchModel } from '@/lib/ai/pricing';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const jobs = await DAL.getResearchJobs();
    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch research jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { instruction, budgetLimit } = body;

    if (!instruction || typeof instruction !== 'string' || instruction.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Instruction text is required' },
        { status: 400 }
      );
    }

    const cleanInst = instruction.trim();
    const planResult = await planResearchInstruction(cleanInst);

    if (!planResult.ok) {
      return NextResponse.json(
        { success: false, error: planResult.error || 'Failed to plan research instruction' },
        { status: 400 }
      );
    }

    const initialCost = calculateEstimatedCost(
      planResult.usage?.promptTokens || 0,
      planResult.usage?.completionTokens || 0,
      0
    );

    const activeModel = getActiveResearchModel();

    const job = await DAL.createResearchJob(
      cleanInst,
      planResult.criteria,
      activeModel,
      budgetLimit || 150
    );

    if (!job) {
      throw new Error('Failed to create research job');
    }

    await DAL.updateResearchJobMetrics(job.id, {
      estimatedCost: initialCost.costINR,
      status: 'PLANNING',
      statusMessage: 'Research criteria planned successfully. Ready to run discovery.',
    });

    const updatedJob = await DAL.getResearchJobById(job.id);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      isFallback: planResult.isFallback,
      error: planResult.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create research job' },
      { status: 500 }
    );
  }
}
