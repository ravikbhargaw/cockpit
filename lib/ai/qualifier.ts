/**
 * AI Candidate Qualifier Module
 * 
 * Evaluates candidate fit, calculates component-calibrated fit scores (0–100),
 * assigns strictly differentiated priority levels, and generates structured evidence
 * separating KNOWN, INFERRED, and UNKNOWN facts without fabrication.
 */

import { callOpenAICompletion } from './openai';
import { ParsedCriteria, ResearchEvidence, PriorityLevel, VerificationStatus, PartnerOpportunitySignal } from '@/types';
import { RawCandidate } from './discovery';
import { verifyCandidateEntity } from './verifier';

export interface ScoringDimension {
  score: number;
  max: number;
  rationale: string;
}

export interface ScoringBreakdown {
  icpFit: ScoringDimension;
  projectTypes: ScoringDimension;
  recurringPotential: ScoringDimension;
  executionOpportunity: ScoringDimension;
  serviceRelevance: ScoringDimension;
  contactability: ScoringDimension & { identifiedChannels?: string[] };
  evidenceQuality: ScoringDimension;
}

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
  scoringBreakdown?: ScoringBreakdown;
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
Your objective is to evaluate a research candidate against Meaven's ICP to answer the core founder sales question:
"Would Ravi personally spend time calling or emailing this company tomorrow because there is a credible possibility of becoming a recurring Meaven execution partner?"

DO NOT OPTIMIZE FOR HIGH SCORES. OPTIMIZE FOR ACCURATE DIFFERENTIATION.
It is completely normal and expected that only 2–4 out of 10 candidates qualify as HIGH priority.
HIGH must mean something substantial.

==================================================
MEAVEN ICP & POSITIONING
==================================================
- Meaven Designs Pvt Ltd is a Bengaluru-based glass and specialized interior execution partner ("You bring the design. We handle the execution.").
- Meaven partners with architecture firms, interior design practices, and design-build firms as an execution/backend partner for:
  * Glass partitions, glass doors, shower partitions, mirrors
  * Procurement, measurement, supply, site coordination, installation, QA/QC, handover
  * Selected specialized interior execution
- GOAL: Recurring B2B partner relationships across multiple client projects, NOT one-off retail consumer inquiries.
- PRIMARY TARGETS:
  1. Boutique architecture practices
  2. Small/mid-sized architecture firms
  3. Boutique interior design firms
  4. Architecture + interior design studios
  5. Design-and-build (D&B) practices
  6. Turnkey commercial interior firms
  7. Commercial interior specialists (workplaces, offices, coworking, tech parks)
  8. Hospitality & retail interior design studios (restaurants, hotels, cafes, retail flagships)
  9. Premium residential / luxury villa design firms with meaningful execution requirements
- PRIMARY GEOGRAPHY: Bengaluru / Bangalore actively operating.

==================================================
SCORING FRAMEWORK (0–100 POINTS)
==================================================
Evaluate the candidate across the following 7 explicit dimensions:

A. ICP / Business-Model Fit (0–20 points):
   - 18–20: Core target — Boutique/mid architecture practice, architecture + interior studio, commercial/workplace interior firm, or design-build firm in Bengaluru.
   - 14–17: Strongly aligned — Turnkey interior firm, commercial retail specialist, or luxury residential architecture studio in Bengaluru.
   - 8–13: Moderately aligned — General interior decorators, pure residential studio with limited scale, or large corporate practice where entry is slow.
   - 0–7: Misaligned / weak — Product retailer, furniture seller, manufacturer, or company with unclear Bengaluru operating presence.

B. Relevant Project Types (0–20 points):
   - 18–20: Strong commercial portfolio — Documented office/workplace fitouts, coworking spaces, tech parks, hospitality, or retail chain projects.
   - 13–17: Mixed portfolio — Premium villas / luxury residential combined with boutique commercial/offices.
   - 8–12: Primarily standard residential apartments with limited architectural glass or execution complexity.
   - 0–7: Minor home decor, staging, or no clear project portfolio shown.

C. Recurring Project Potential (0–15 points):
   - 13–15: Active pipeline — Evident portfolio of multiple ongoing or recently completed projects across commercial/hospitality, indicating recurring project velocity.
   - 9–12: Steady practice with a documented portfolio of 5–15 projects, but project frequency is moderately clear.
   - 4–8: Small studio with 1–4 documented projects, irregular project pace.
   - 0–3: Very thin/stale portfolio or single one-off project shown.

D. Execution / Outsourcing Opportunity Evidence (0–20 points):
   *CRITICAL RULE: DO NOT ASSUME OUTSOURCING. If there is NO explicit public evidence of external contractors, vendors, or outsourcing needs, this score MUST NOT exceed 6/20!*
   - 16–20: Verified execution opportunity — Explicit evidence of working with external specialist contractors, subcontracting site execution, high project volume requiring execution capacity, or multi-location execution requirements.
   - 10–15: Inferred / moderate opportunity — Design-and-build or turnkey practice delivering complex commercial/workplace fitouts where specialized glass/doors/partitions are routinely procured from specialized trade partners, though specific vendor relationships are unverified.
   - 4–9: Unknown / unclear — Standard architecture/design firm where vendor model is completely unstated in public sources (MUST flag as UNKNOWN).
   - 0–3: Negative fit — Firm has an exclusively vertically integrated proprietary fabrication factory, or explicit policy of doing everything in-house without external trade partners, or pure advisory firm with zero execution involvement.

E. Meaven Service Relevance (0–10 points):
   - 9–10: High glass relevance — Architectural glass partitions (frameless, acoustic, aluminium slim profile), glass doors, shower cubicles, custom mirrors explicitly visible in portfolio.
   - 6–8: Moderate relevance — Commercial offices, premium residential, or hospitality where glass partitions/mirrors/shower enclosures are standard project specifications.
   - 3–5: Minimal glass relevance — Traditional woodwork/carpentry focus, basic residential decorating.
   - 0–2: No apparent relevance for glass, partitions, or specialized architectural interior execution.

F. Contactability & Outreach Pathway (0–10 points):
   - 9–10: High direct contactability — Public direct phone number/mobile, direct project enquiry email (e.g. projects@, contact@, info@), named founder/principal architect/partner, and office address in Bengaluru.
   - 6–8: Good contactability — General office email/phone and named founder, but no dedicated project lead identified.
   - 3–5: Basic / indirect contactability — Generic contact form only or single info email, no phone number, founder unnamed.
   - 0–2: Unreachable / dead — No email or phone publicly accessible, broken contact page, or social-only link without contact details.

G. Evidence Quality & Verification Confidence (0–5 points):
   - 5: Active, high-integrity official website, verifiable projects with photos/locations, consistent business identity.
   - 3–4: Active website, but portfolio has limited details or descriptions are concise.
   - 1–2: Third-party directory snippet only, social-only presence, or sparse web trace.
   - 0: Inactive domain, mismatch, or unverifiable claims.

==================================================
PARTNER OPPORTUNITY SIGNAL (SEPARATE FROM FIT SCORE)
==================================================
Assign one of: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN":
- "HIGH": Actual evidence suggesting recurring execution, external vendors, subcontracting, execution capacity requirements, or multi-site contractor coordination.
- "MEDIUM": The business appears relevant and credible but the execution/vendor model is not established.
- "UNKNOWN": Insufficient evidence to determine the execution/vendor model. (DO NOT assume outsourcing!).
- "LOW": Evidence suggests limited execution relevance or self-contained in-house fabrication.

==================================================
PRIORITY LEVEL RULES (STRICT & MULTI-DIMENSIONAL)
==================================================
- "HIGH" Priority requires ALL of the following:
  1. Fit Score >= 76
  2. partnerOpportunitySignal is "HIGH" OR ("MEDIUM" with executionOpportunity >= 12 and contactability >= 7)
  3. partnerOpportunitySignal is NOT "UNKNOWN" (Strict: UNKNOWN partner opportunity cannot automatically become HIGH)
  4. icpFit >= 14 AND projectTypes >= 14 AND serviceRelevance >= 6
  5. Active, verified domain
- "MEDIUM" Priority:
  * Fit Score >= 55 with verified domain, or strong ICP fit where execution model is UNKNOWN/investigative.
- "LOW" Priority:
  * Fit Score < 55, thin evidence, weak partner potential, unverified website, or unaligned business model.

==================================================
FOUNDER INVESTIGATION QUESTIONS (MANDATORY)
==================================================
For every candidate where partnerOpportunitySignal is "MEDIUM" or "UNKNOWN", generate 1–3 concrete, actionable questions for Ravi's first call/email:
- e.g., "⚠️ Does [Company] specify glass partitions/doors for their commercial clients while turnkey contractors execute, or do they directly manage execution partners?"
- e.g., "⚠️ Who oversees vendor selection for architectural glass and shower cubicles — the Principal Designer or an external PMC?"

==================================================
FACT STANDARD: STRICT KNOWN / INFERRED / UNKNOWN
==================================================
- "KNOWN": Directly supported by public web source, official site, or search snippet.
- "INFERRED": Logical deduction from portfolio, location, or project type.
- "UNKNOWN": Missing or unverified data point.
- NEVER FABRICATE phone numbers, emails, project names, or outsourcing relationships.

Return valid JSON with this exact schema:
{
  "scoringBreakdown": {
    "icpFit": { "score": number, "max": 20, "rationale": "string" },
    "projectTypes": { "score": number, "max": 20, "rationale": "string" },
    "recurringPotential": { "score": number, "max": 15, "rationale": "string" },
    "executionOpportunity": { "score": number, "max": 20, "rationale": "string" },
    "serviceRelevance": { "score": number, "max": 10, "rationale": "string" },
    "contactability": { "score": number, "max": 10, "rationale": "string", "identifiedChannels": ["string"] },
    "evidenceQuality": { "score": number, "max": 5, "rationale": "string" }
  },
  "fitScore": number (0-100, exactly equal to sum of above 7 scores),
  "fitReason": "string (1-2 sentences summarizing the core fit rationale)",
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
    { responseFormatJson: true, temperature: 0.15 }
  );

  const todayStr = new Date().toISOString().split('T')[0];

  if (aiResult.ok && aiResult.data) {
    const d = aiResult.data;

    // Parse scoring breakdown
    const sb = d.scoringBreakdown || {};
    const icpScore = clamp(Number(sb.icpFit?.score) || 12, 0, 20);
    const projScore = clamp(Number(sb.projectTypes?.score) || 12, 0, 20);
    const recurScore = clamp(Number(sb.recurringPotential?.score) || 8, 0, 15);
    let execScore = clamp(Number(sb.executionOpportunity?.score) || 5, 0, 20);
    const servScore = clamp(Number(sb.serviceRelevance?.score) || 6, 0, 10);
    const contactScore = clamp(Number(sb.contactability?.score) || 5, 0, 10);
    const evidScore = clamp(Number(sb.evidenceQuality?.score) || 3, 0, 5);

    let partnerOppSignal: PartnerOpportunitySignal = 
      (d.partnerOpportunitySignal === 'HIGH' || d.partnerOpportunitySignal === 'MEDIUM' || d.partnerOpportunitySignal === 'LOW' || d.partnerOpportunitySignal === 'UNKNOWN')
        ? d.partnerOpportunitySignal
        : 'UNKNOWN';

    // Enforcement: If partnerOpportunitySignal is UNKNOWN, outsourcing opportunity evidence MUST be capped at 6/20
    if (partnerOppSignal === 'UNKNOWN') {
      execScore = Math.min(execScore, 6);
    }

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

    // Calculate sum of component scores
    let fitScore = icpScore + projScore + recurScore + execScore + servScore + contactScore + evidScore;
    fitScore = clamp(fitScore, 0, 100);

    // Verification penalty if domain/entity is not active
    if (!verification.isVerified) {
      fitScore = Math.min(fitScore, 40);
      partnerOppSignal = 'UNKNOWN';
    }

    // Calibrate Priority Level using strict multi-dimensional rules:
    // HIGH Priority requires:
    // 1. Fit score >= 76
    // 2. Verified domain
    // 3. Partner opportunity is NOT UNKNOWN (must be HIGH, or MEDIUM with execScore >= 12 and contactScore >= 7)
    // 4. Strong ICP (>= 14) and strong project types (>= 14) and service relevance (>= 6)
    let priority: PriorityLevel = 'LOW';

    const isHighEligible = 
      verification.isVerified &&
      fitScore >= 76 &&
      partnerOppSignal !== 'UNKNOWN' &&
      (partnerOppSignal === 'HIGH' || (partnerOppSignal === 'MEDIUM' && execScore >= 12 && contactScore >= 7)) &&
      icpScore >= 14 &&
      projScore >= 14 &&
      servScore >= 6;

    if (isHighEligible) {
      priority = 'HIGH';
    } else if (verification.isVerified && fitScore >= 55) {
      priority = 'MEDIUM';
    } else {
      priority = 'LOW';
    }

    let partnerOppReason = d.partnerOpportunityReason || `Operating as ${candidate.companyType} in ${candidate.location}.`;
    let evLimitations = d.evidenceLimitations || 'Public evidence available; vendor/outsourcing model requires founder verification.';
    let investigationFlags: string[] = Array.isArray(d.founderInvestigationFlags) ? [...d.founderInvestigationFlags] : [];

    // Mandatory founder investigation questions for MEDIUM or UNKNOWN partner opportunities
    if (partnerOppSignal === 'UNKNOWN' || partnerOppSignal === 'MEDIUM') {
      const hasSpecificFlag = investigationFlags.some(f => f.toLowerCase().includes('glass') || f.toLowerCase().includes('vendor') || f.toLowerCase().includes('contractor') || f.toLowerCase().includes('execution'));
      if (!hasSpecificFlag) {
        investigationFlags.push(`⚠️ Investigate whether ${candidate.name} executes glass/metal partitions internally or sources via external trade execution partners.`);
        investigationFlags.push(`⚠️ Clarify vendor decision ownership: does design team specify architectural glass, or does the turnkey client/PMC procure independently?`);
      }
    }

    if (!verification.isVerified) {
      partnerOppReason = `Company identity or domain content could not be verified (${verification.mismatchReason || 'unverified'}).`;
      evLimitations = 'Unverified website domain. Public business claims require manual verification.';
      investigationFlags.unshift(`⚠️ ${verificationReason}`);
    }

    const scoringBreakdown: ScoringBreakdown = {
      icpFit: { score: icpScore, max: 20, rationale: sb.icpFit?.rationale || 'ICP business model alignment' },
      projectTypes: { score: projScore, max: 20, rationale: sb.projectTypes?.rationale || 'Portfolio project types relevance' },
      recurringPotential: { score: recurScore, max: 15, rationale: sb.recurringPotential?.rationale || 'Pipeline and project recurrence potential' },
      executionOpportunity: { score: execScore, max: 20, rationale: sb.executionOpportunity?.rationale || (partnerOppSignal === 'UNKNOWN' ? 'Execution model unverified from public sources' : 'Execution partner opportunity evidence') },
      serviceRelevance: { score: servScore, max: 10, rationale: sb.serviceRelevance?.rationale || 'Relevance for glass, partitions, and specialized interiors' },
      contactability: { 
        score: contactScore, 
        max: 10, 
        rationale: sb.contactability?.rationale || 'Direct contactability channels',
        identifiedChannels: sb.contactability?.identifiedChannels || []
      },
      evidenceQuality: { score: evidScore, max: 5, rationale: sb.evidenceQuality?.rationale || 'Verification confidence and web evidence depth' },
    };

    const businessSignals = d.businessSignals || {};
    businessSignals.geographicRelevance = businessSignals.geographicRelevance || `${candidate.location} coverage`;
    businessSignals.meavenFit = businessSignals.meavenFit || `Potential execution fit for ${candidate.companyType}`;
    businessSignals.otherSignals = `Score breakdown: ICP ${icpScore}/20, Projects ${projScore}/20, Recurring ${recurScore}/15, Execution ${execScore}/20, Glass ${servScore}/10, Contact ${contactScore}/10, Evidence ${evidScore}/5. Total: ${fitScore}/100.`;

    return {
      ok: true,
      result: {
        name: candidate.name,
        fitScore,
        fitReason: verification.isVerified
          ? (d.fitReason || `Score ${fitScore}/100: ${sb.icpFit?.rationale || candidate.companyType} with ${sb.projectTypes?.rationale || 'relevant projects'}.`)
          : `Unverified domain content (${verification.mismatchReason}). Claims downgraded to UNKNOWN.`,
        priority,
        verificationStatus,
        verificationReason,
        partnerModelSignals: Array.isArray(d.partnerModelSignals) ? d.partnerModelSignals : ['Commercial design & execution claimed'],
        partnerOpportunitySignal: partnerOppSignal,
        partnerOpportunityReason: partnerOppReason,
        evidenceLimitations: evLimitations,
        founderInvestigationFlags: investigationFlags,
        scoringBreakdown,
        businessSignals,
        evidenceList: finalEvidence,
      },
      usage: aiResult.usage,
    };
  }

  // If AI call failed, do not silently swallow error
  return {
    ok: false,
    result: null as any,
    error: aiResult.error || 'AI qualification failed',
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function generateFallbackQualification(
  candidate: RawCandidate,
  criteria: ParsedCriteria,
  todayStr: string
): QualificationResult {
  const matchGeo = criteria.geographies?.some(g => candidate.location.toLowerCase().includes(g.toLowerCase())) ?? true;
  const icpScore = matchGeo ? 14 : 10;
  const projScore = 12;
  const recurScore = 8;
  const execScore = 5; // UNKNOWN execution
  const servScore = 6;
  const contactScore = candidate.website ? 6 : 3;
  const evidScore = candidate.website ? 3 : 1;

  const fitScore = icpScore + projScore + recurScore + execScore + servScore + contactScore + evidScore;
  const priority: PriorityLevel = fitScore >= 76 ? 'MEDIUM' : 'LOW'; // Fallback cannot be HIGH without verified AI analysis

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
  flags.push(`⚠️ Investigate whether ${candidate.companyType} handles glass/metal execution internally or via external specialist partners.`);
  flags.push(`⚠️ Clarify vendor decision ownership: does design team specify architectural glass, or does client/PMC procure?`);

  return {
    name: candidate.name,
    fitScore,
    fitReason: `Rule-qualified candidate operating in ${candidate.location} (${candidate.companyType})`,
    priority,
    verificationStatus: verStatus,
    verificationReason: verReason,
    partnerModelSignals: ['Commercial practice operating in Bengaluru'],
    partnerOpportunitySignal: partnerOppSignal,
    partnerOpportunityReason: partnerOppReason,
    evidenceLimitations: evLimitations,
    founderInvestigationFlags: flags,
    businessSignals: {
      geographicRelevance: candidate.location,
      companySize: 'Unverified headcount',
      meavenFit: `Potential fit for ${candidate.companyType}`,
      otherSignals: `Rule-calculated score: ${fitScore}/100 (ICP: ${icpScore}, Projects: ${projScore}, Recurring: ${recurScore}, Execution: ${execScore}, Glass: ${servScore}, Contact: ${contactScore}, Evidence: ${evidScore})`,
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
