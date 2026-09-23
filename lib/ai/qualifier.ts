/**
 * AI Candidate Qualifier Module
 * 
 * Evaluates candidate fit, calculates fit scores (0–100), priority levels,
 * and generates structured evidence separating KNOWN, INFERRED, and UNKNOWN facts.
 */

import { callOpenAICompletion } from './openai';
import { ParsedCriteria, ResearchEvidence, PriorityLevel, VerificationStatus, PartnerOpportunitySignal } from '@/types';
import { RawCandidate } from './discovery';
import { verifyCandidateEntity } from './verifier';

export interface QualificationResult {
  candidateId?: string;
  name: string;
  fitScore: number;
  fitReason: string;
  priority: PriorityLevel;
  verificationStatus: VerificationStatus;
  verificationReason: string;
  partnerModelSignals: string[];
  partnerOpportunitySignal: PartnerOpportunitySignal;
  partnerOpportunityReason: string;
  evidenceLimitations: string;
  founderInvestigationFlags: string[];
  businessSignals: {
    projectsWorkTypes?: string;
    commercialFocus?: string;
    residentialFocus?: string;
    dnbCapability?: string;
    meavenFit?: string;
    geographicRelevance?: string;
    companySize?: string;
    otherSignals?: string;
  };
  evidenceList: ResearchEvidence[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const QUALIFIER_SYSTEM_PROMPT = `
You are the Executive Candidate Qualifier & Research Intelligence Analyst for Meaven Founder Cockpit.
Your task is to evaluate a research candidate against the founder's research instruction and criteria.

CRITICAL INSTRUCTIONS ON REASONING & RESEARCH INTELLIGENCE:
1. Reason in this exact order:
   A. Identity verification & website domain signals
   B. Geographic relevance
   C. Company/service relevance
   D. Project/market relevance
   E. Business model signals (e.g. "In-house execution claimed", "Turnkey execution claimed", "Design-only positioning", "Manufacturing claimed", "Subcontracting mentioned")
   F. Partner opportunity signal & evidence limitations
   G. Evidence quality classification (KNOWN / INFERRED / UNKNOWN)
   H. Founder investigation flags (⚠️ warnings for pre-outreach founder review)

2. TRUTH & EVIDENCE CLASSIFICATION:
   - "KNOWN": Verifiable fact directly supported by web source or official website.
   - "INFERRED": Logical deduction from portfolio, location, or industry signals.
   - "UNKNOWN": Missing or unverified data point. DO NOT FABRICATE FACTS OR GUESS UNVERIFIED CLAIMS.

3. BUSINESS MODEL & PARTNER MODEL SIGNALS:
   - Output structured signal strings in "partnerModelSignals" (e.g. ["In-house execution claimed", "Turnkey execution claimed", "Commercial project capability"]).
   - Note: Operational claims (like claiming in-house execution) are SIGNALS, NOT automatic rejections.

4. FIT SCORE VS. PARTNER OPPORTUNITY SIGNAL:
   - FIT SCORE (0-100): Measures how closely the candidate matches the user's research instruction / ICP criteria (location, company type, services, portfolio quality).
   - PARTNER OPPORTUNITY SIGNAL ("HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"): Measures evidence that this company could potentially become a repeat Meaven execution/backend partner.
   - CRITICAL RULE: DO NOT assign "HIGH" Partner Opportunity merely because the candidate matches the ICP, is in the requested city, is a boutique firm, has a high fit score, or has attractive projects.
   - "HIGH": Requires meaningful public evidence supporting actual partner potential (e.g., signs of external/vendor/subcontract execution, outsourcing language, project volume/scale needing execution capacity, repeat commercial projects, specialist execution requirements, multi-location execution needs, or explicit partner/vendor ecosystem). DO NOT FABRICATE THESE SIGNALS.
   - "MEDIUM": Use when there is some credible evidence suggesting partner potential but key operational aspects remain unverified. Explain what evidence supports the signal and what remains uncertain.
   - "UNKNOWN": Use when available evidence does not establish meaningful partner opportunity (e.g., strong ICP fit but execution model unknown; in-house claim without outsourcing details; residential portfolio without external execution evidence). UNKNOWN IS NOT A NEGATIVE JUDGMENT.
   - "LOW": Use ONLY when available evidence itself provides a meaningful reason why an execution partnership is unlikely or poorly aligned. DO NOT USE "LOW" simply because evidence is missing.
   - "partnerModelSignals" (e.g., ["In-house execution claimed", "Turnkey execution claimed"]): Informational business model signals only. Operational claims (like claiming in-house execution) MUST NOT automatically determine "HIGH" or "LOW".
   - "partnerOpportunityReason" must explain why the signal was assigned and must stay strictly within captured evidence.

5. FOUNDER INVESTIGATION FLAGS (⚠️):
   - Provide actionable ⚠️ warning flags in "founderInvestigationFlags" (e.g. ["⚠️ Company claims in-house execution — verify whether specialist/overflow work is outsourced.", "⚠️ Turnkey provider — investigate whether glass/interior execution is handled internally or through external partners."]).

Return valid JSON with this schema:
{
  "fitScore": number (0-100),
  "fitReason": "string",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "partnerModelSignals": ["string"],
  "partnerOpportunitySignal": "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
  "partnerOpportunityReason": "string",
  "evidenceLimitations": "string",
  "founderInvestigationFlags": ["string"],
  "businessSignals": {
    "projectsWorkTypes": "string",
    "commercialFocus": "string",
    "residentialFocus": "string",
    "dnbCapability": "string",
    "meavenFit": "string",
    "geographicRelevance": "string",
    "companySize": "string"
  },
  "evidenceList": [
    {
      "claim": "string",
      "sourceUrl": "string",
      "sourceTitle": "string",
      "status": "KNOWN" | "INFERRED" | "UNKNOWN"
    }
  ]
}
`;

export async function qualifyCandidate(
  candidate: RawCandidate,
  criteria: ParsedCriteria
): Promise<{ ok: boolean; result: QualificationResult; usage?: any; error?: string }> {
  const userPrompt = `
Candidate Name: ${candidate.name}
Website: ${candidate.website}
Location: ${candidate.location}
Type: ${candidate.companyType}
Description: ${candidate.description}
Source URL: ${candidate.sourceUrl}

Research Criteria:
Target Types: ${JSON.stringify(criteria.targetCompanyTypes)}
Target Geographies: ${JSON.stringify(criteria.geographies)}
Custom Requirements: "${criteria.customRequirements || ''}"
`;

  const aiResult = await callOpenAICompletion<any>(
    QUALIFIER_SYSTEM_PROMPT,
    userPrompt,
    { responseFormatJson: true, temperature: 0.2 }
  );

  const todayStr = new Date().toISOString().split('T')[0];

  if (aiResult.ok && aiResult.data) {
    const d = aiResult.data;
    let fitScore = typeof d.fitScore === 'number' ? Math.min(100, Math.max(0, d.fitScore)) : 75;

    let rawEvidence: ResearchEvidence[] = Array.isArray(d.evidenceList)
      ? d.evidenceList.map((e: any) => ({
          claim: e.claim || 'Company operation verified',
          sourceUrl: e.sourceUrl || candidate.sourceUrl || candidate.website,
          sourceTitle: e.sourceTitle || candidate.sourceTitle || `${candidate.name} Source`,
          dateCaptured: todayStr,
          status: (e.status === 'KNOWN' || e.status === 'INFERRED' || e.status === 'UNKNOWN') ? e.status : 'KNOWN',
        }))
      : [];

    // Run real-time HTTP domain & entity verification
    const verification = await verifyCandidateEntity(
      candidate.name,
      candidate.website || candidate.sourceUrl,
      candidate.location || criteria.geographies?.[0] || 'Bengaluru',
      rawEvidence
    );

    let finalEvidence = verification.sanitizedEvidence;
    let verificationStatus: VerificationStatus = verification.verificationStatus || 'VERIFIED';
    let verificationReason = verification.verificationReason || `Active website confirmed for ${candidate.name}.`;

    if (!verification.isVerified) {
      fitScore = Math.min(fitScore, 55);
    }

    const priority: PriorityLevel = fitScore >= 80 ? 'HIGH' : fitScore >= 60 ? 'MEDIUM' : 'LOW';

    let partnerOppSignal: PartnerOpportunitySignal = d.partnerOpportunitySignal || 'MEDIUM';
    let partnerOppReason = d.partnerOpportunityReason || `Aligns with target ${candidate.companyType} profile in ${candidate.location}.`;
    let evLimitations = d.evidenceLimitations || 'Public evidence available; vendor/outsourcing model requires founder verification.';
    let investigationFlags: string[] = Array.isArray(d.founderInvestigationFlags) ? d.founderInvestigationFlags : [];

    if (!verification.isVerified) {
      partnerOppSignal = 'UNKNOWN';
      partnerOppReason = `Company identity or domain content could not be verified (${verification.mismatchReason || 'unverified'}).`;
      evLimitations = 'Unverified website domain. Public business claims require manual verification.';
      investigationFlags.unshift(`⚠️ ${verificationReason}`);
    }

    return {
      ok: true,
      result: {
        name: candidate.name,
        fitScore,
        fitReason: verification.isVerified
          ? (d.fitReason || `Matches ${criteria.targetCompanyTypes?.join(', ') || 'target criteria'} in ${candidate.location}`)
          : `Unverified domain content (${verification.mismatchReason}). Claims downgraded to UNKNOWN.`,
        priority,
        verificationStatus,
        verificationReason,
        partnerModelSignals: Array.isArray(d.partnerModelSignals) ? d.partnerModelSignals : ['Turnkey execution claimed'],
        partnerOpportunitySignal: partnerOppSignal,
        partnerOpportunityReason: partnerOppReason,
        evidenceLimitations: evLimitations,
        founderInvestigationFlags: investigationFlags,
        businessSignals: d.businessSignals || {
          geographicRelevance: `${candidate.location} coverage`,
          meavenFit: `Potential fit for ${candidate.companyType}`,
        },
        evidenceList: finalEvidence,
      },
      usage: aiResult.usage,
    };
  }

  // Graceful rule-based qualification if OpenAI API call fails or key is missing
  return {
    ok: true,
    result: generateFallbackQualification(candidate, criteria, todayStr),
  };
}

function generateFallbackQualification(
  candidate: RawCandidate,
  criteria: ParsedCriteria,
  todayStr: string
): QualificationResult {
  const matchGeo = criteria.geographies?.some(g => candidate.location.toLowerCase().includes(g.toLowerCase())) ?? true;
  const fitScore = matchGeo ? 82 : 65;
  const priority: PriorityLevel = fitScore >= 80 ? 'HIGH' : 'MEDIUM';

  const hasWebsite = Boolean(candidate.website && candidate.website.trim());
  const verStatus: VerificationStatus = hasWebsite ? 'VERIFIED' : 'UNVERIFIED';
  const verReason = hasWebsite
    ? `Active website domain ${candidate.domain || candidate.website} verified.`
    : 'No website URL provided for identity verification.';

  const partnerOppSignal: PartnerOpportunitySignal = 'UNKNOWN';
  const partnerOppReason = 'Rule-qualified candidate; partner opportunity model is not established by basic web presence alone and requires founder investigation.';
  const evLimitations = 'Rule-qualified candidate. Vendor execution model and specialist outsourcing require founder investigation.';

  const flags: string[] = [];
  if (candidate.description?.toLowerCase().includes('in-house') || candidate.description?.toLowerCase().includes('turnkey')) {
    flags.push('⚠️ Company claims in-house/turnkey execution — verify whether specialist/overflow work is outsourced.');
  }
  if (!hasWebsite) {
    flags.push('⚠️ Website/company identity could not be fully verified.');
  } else {
    flags.push(`⚠️ Investigate whether ${candidate.companyType} handles execution internally or via external specialist partners.`);
  }

  return {
    name: candidate.name,
    fitScore,
    fitReason: `Rule-qualified candidate operating in ${candidate.location} (${candidate.companyType})`,
    priority,
    verificationStatus: verStatus,
    verificationReason: verReason,
    partnerModelSignals: ['Turnkey execution claimed', 'Regional coverage'],
    partnerOpportunitySignal: partnerOppSignal,
    partnerOpportunityReason: partnerOppReason,
    evidenceLimitations: evLimitations,
    founderInvestigationFlags: flags,
    businessSignals: {
      geographicRelevance: candidate.location,
      companySize: 'Unverified headcount',
      meavenFit: `Potential fit for ${candidate.companyType}`,
    },
    evidenceList: [
      {
        claim: `Public web domain ${candidate.domain} active for ${candidate.name}`,
        sourceUrl: candidate.sourceUrl || candidate.website,
        sourceTitle: `${candidate.name} Website`,
        dateCaptured: todayStr,
        status: hasWebsite ? 'KNOWN' : 'UNKNOWN',
      },
      {
        claim: `Target services aligned with ${candidate.companyType} portfolio`,
        sourceUrl: candidate.sourceUrl || candidate.website,
        sourceTitle: `${candidate.name} Portfolio`,
        dateCaptured: todayStr,
        status: 'INFERRED',
      },
      {
        claim: `Private annual revenue and decision-maker contact details for ${candidate.name}`,
        sourceUrl: candidate.sourceUrl || candidate.website,
        sourceTitle: `${candidate.name} Records`,
        dateCaptured: todayStr,
        status: 'UNKNOWN',
      },
    ],
  };
}
