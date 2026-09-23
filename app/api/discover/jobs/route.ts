export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { planResearchInstruction } from '@/lib/ai/planner';
import { calculateEstimatedCost } from '@/lib/ai/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs = DAL.getResearchJobs();
    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch research jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const initialCost = calculateEstimatedCost(
      planResult.usage?.promptTokens || 0,
      planResult.usage?.completionTokens || 0,
      0
    );

    const job = DAL.createResearchJob(
      cleanInst,
      planResult.criteria,
      process.env.RESEARCH_AI_MODEL || 'gpt-5.6-luna',
      budgetLimit || 150
    );

    if (!job) {
      throw new Error('Failed to create research job');
    }

    DAL.updateResearchJobMetrics(job.id, {
      estimatedCost: initialCost.costINR,
      status: 'PLANNING',
      statusMessage: 'Research criteria planned successfully. Ready to run discovery.',
    });

    const updatedJob = DAL.getResearchJobById(job.id);

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
