import { NextRequest, NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { discoverCandidates } from '@/lib/ai/discovery';
import { qualifyCandidate } from '@/lib/ai/qualifier';
import { calculateEstimatedCost } from '@/lib/ai/pricing';
import { normalizeDomain } from '@/lib/utils';
import { ParsedCriteria } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const job = DAL.getResearchJobById(jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Research Job not found' },
        { status: 404 }
      );
    }

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalSearchCalls = 0;

    // 1. Stage: DISCOVERING
    DAL.updateResearchJobStatus(jobId, 'DISCOVERING', 'Searching public web & industry registries for candidates...');

    const criteria: ParsedCriteria = job.parsedCriteria || {};
    const discoveryRes = await discoverCandidates(criteria, job.originalInstruction);

    totalPromptTokens += discoveryRes.usage?.promptTokens || 0;
    totalCompletionTokens += discoveryRes.usage?.completionTokens || 0;
    totalSearchCalls += discoveryRes.searchCalls || 1;

    let costCheck = calculateEstimatedCost(totalPromptTokens, totalCompletionTokens, totalSearchCalls, job.modelName, job.budgetLimit);

    if (costCheck.isBudgetExceeded) {
      DAL.updateResearchJobMetrics(jobId, {
        status: 'READY_FOR_REVIEW',
        statusMessage: `Safety budget ceiling reached (₹${costCheck.costINR}). Discovery completed.`,
        estimatedCost: costCheck.costINR,
        searchCallCount: totalSearchCalls,
      });
      return NextResponse.json({ success: true, job: DAL.getResearchJobById(jobId), candidates: [] });
    }

    const rawCandidates = discoveryRes.candidates || [];

    // 2. Stage: FILTERING (Deduplicate against existing DB companies & candidates)
    DAL.updateResearchJobStatus(jobId, 'FILTERING', `Deduplicating ${rawCandidates.length} discovered candidates against database...`);

    const existingCompanies = DAL.getCompanies();
    const existingCandidates = DAL.getResearchCandidates();

    const existingDomains = new Set<string>();
    const existingNames = new Set<string>();

    existingCompanies.forEach((c: any) => {
      const d = normalizeDomain(c.website || c.domain);
      if (d) existingDomains.add(d);
      if (c.name) existingNames.add(c.name.trim().toLowerCase());
    });

    existingCandidates.forEach((c: any) => {
      const d = normalizeDomain(c.website || c.domain);
      if (d) existingDomains.add(d);
      if (c.companyName || c.name) existingNames.add((c.companyName || c.name).trim().toLowerCase());
    });

    const filteredCandidates = rawCandidates.filter(c => {
      const dom = normalizeDomain(c.website || c.domain);
      const name = (c.name || '').trim().toLowerCase();
      if (dom && existingDomains.has(dom)) return false;
      if (name && existingNames.has(name)) return false;
      return true;
    });

    // 3. Stage: QUALIFYING
    DAL.updateResearchJobStatus(jobId, 'QUALIFYING', `Qualifying ${filteredCandidates.length} fresh candidates...`);

    const qualifiedList: any[] = [];

    for (const rawCand of filteredCandidates) {
      // Check budget guard ceiling before each qualification call
      costCheck = calculateEstimatedCost(totalPromptTokens, totalCompletionTokens, totalSearchCalls, job.modelName, job.budgetLimit);
      if (costCheck.isBudgetExceeded) {
        break; // Pause qualification gracefully
      }

      const qualRes = await qualifyCandidate(rawCand, criteria);

      totalPromptTokens += qualRes.usage?.promptTokens || 0;
      totalCompletionTokens += qualRes.usage?.completionTokens || 0;

      if (qualRes.ok && qualRes.result) {
        const q = qualRes.result;
        qualifiedList.push({
          companyName: q.name,
          website: rawCand.website,
          domain: rawCand.domain,
          location: rawCand.location,
          companyType: rawCand.companyType,
          industry: rawCand.industry,
          description: rawCand.description,
          source: 'AI Research Engine',
          sourceUrl: rawCand.sourceUrl,
          fitScore: q.fitScore,
          fitReason: q.fitReason,
          priority: q.priority,
          verificationStatus: q.verificationStatus || 'VERIFIED',
          verificationReason: q.verificationReason || '',
          partnerModelSignals: q.partnerModelSignals || [],
          partnerOpportunitySignal: q.partnerOpportunitySignal || 'UNKNOWN',
          partnerOpportunityReason: q.partnerOpportunityReason || '',
          evidenceLimitations: q.evidenceLimitations || '',
          founderInvestigationFlags: q.founderInvestigationFlags || [],
          businessSignals: q.businessSignals,
          evidenceList: q.evidenceList,
          jobId: jobId,
          researchStatus: 'READY_FOR_REVIEW',
          qualificationStatus: 'Qualified',
        });
      }
    }

    // 4. Save candidates into DB
    const savedCandidates: any[] = [];
    for (const candData of qualifiedList) {
      const created = DAL.createResearchCandidate(candData);
      savedCandidates.push(created);
    }

    // 5. Final Stage: READY_FOR_REVIEW
    const finalCost = calculateEstimatedCost(totalPromptTokens, totalCompletionTokens, totalSearchCalls, job.modelName, job.budgetLimit);
    const qualifiedCount = savedCandidates.filter(c => (c.fitScore || 0) >= (criteria.minFitScore || 70)).length;

    DAL.updateResearchJobMetrics(jobId, {
      candidateCount: rawCandidates.length,
      qualifiedCount: qualifiedList.length,
      finalShortlistCount: qualifiedCount,
      estimatedCost: finalCost.costINR,
      searchCallCount: totalSearchCalls,
      status: 'READY_FOR_REVIEW',
      statusMessage: `Research complete! Incurred ${finalCost.formattedINR} (${qualifiedCount} qualified candidates ready for review).`,
    });

    const updatedJob = DAL.getResearchJobById(jobId);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      candidates: savedCandidates,
    });
  } catch (error: any) {
    DAL.updateResearchJobStatus(params.id, 'FAILED', `Job execution error: ${error.message}`);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute research job' },
      { status: 500 }
    );
  }
}
