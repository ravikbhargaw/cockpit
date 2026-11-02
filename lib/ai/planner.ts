/**
 * AI Research Planner Module
 * 
 * Converts Ravi's natural-language instruction into structured research criteria
 * and optimized search queries without inventing non-requested strict filters.
 */

import { callOpenAICompletion } from './openai';
import { validateResearchModel } from './pricing';
import { ParsedCriteria } from '@/types';

export interface PlannerResult {
  ok: boolean;
  criteria: ParsedCriteria;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  isFallback?: boolean;
}

const SYSTEM_PROMPT = `
You are the Executive AI Research Planner for Meaven Founder Cockpit.
Meaven Designs Pvt Ltd is a Bangalore-based glass and interior execution partner ("You bring the design. We handle the execution.").
Meaven partners with architecture firms, interior design firms, and design-and-build practices for:
- Glass partitions, glass doors, shower cubicles, mirrors
- Measurement, procurement, supply, installation, site coordination, QA/QC, handover
- Specialised interior execution

Your job is to analyze the founder's natural-language research instruction and extract:
1. Target geographies (e.g. "Bengaluru", "Bangalore")
2. Target company types (e.g. "Boutique architecture firm", "Interior design practice", "Design-build studio", "Commercial interior practice")
3. Target industries and project specializations (e.g. "Commercial", "Offices", "Workplaces", "Hospitality", "Retail", "Premium residential")
4. Target candidate count (default 20 if implied or stated)
5. 4 to 6 realistic, targeted web search queries designed to find real firm websites, portfolios, and listings in the target city on search engines (e.g. "Bangalore architecture firms commercial workplace projects", "Bangalore boutique interior design firms offices retail", "Bangalore turnkey design build interior execution firms").

CRITICAL INSTRUCTIONS:
- Do NOT invent non-requested strict exclusions.
- Ensure search queries target real company websites and practices, not consumer retail DIY.
- Produce 4 to 6 diverse, high-yield search queries.

You MUST return valid JSON matching this schema:
{
  "targetCompanyTypes": ["string"],
  "geographies": ["string"],
  "industries": ["string"],
  "services": ["string"],
  "minFitScore": number (default 70),
  "targetCandidateCount": number (default 20),
  "customRequirements": "string",
  "searchQueries": ["string"]
}
`;

export async function planResearchInstruction(instruction: string): Promise<PlannerResult> {
  // Validate model configuration upfront — fail clearly if invalid model configured
  const modelValidation = validateResearchModel();
  if (!modelValidation.valid) {
    return {
      ok: false,
      criteria: parseInstructionFallback(instruction),
      error: modelValidation.error,
    };
  }

  const userPrompt = `Founder Instruction: "${instruction}"`;

  const aiResult = await callOpenAICompletion<ParsedCriteria>(
    SYSTEM_PROMPT,
    userPrompt,
    { responseFormatJson: true, temperature: 0.2 }
  );

  if (aiResult.ok && aiResult.data) {
    const data = aiResult.data;
    const queries = Array.isArray(data.searchQueries) && data.searchQueries.length > 0
      ? data.searchQueries
      : generateFallbackQueries(instruction, data.geographies || ['Bengaluru']);

    return {
      ok: true,
      criteria: {
        targetCompanyTypes: data.targetCompanyTypes || ['Architecture Firm', 'Interior Design Studio'],
        geographies: data.geographies || ['Bengaluru'],
        industries: data.industries || ['Commercial / Workspace', 'Hospitality', 'Premium Residential'],
        services: data.services || ['Architecture', 'Interior Design', 'Turnkey Execution'],
        minFitScore: data.minFitScore || 70,
        customRequirements: data.customRequirements || instruction,
        searchQueries: queries,
      },
      usage: aiResult.usage,
    };
  }

  // If OpenAI call failed due to key / network, report error
  return {
    ok: false,
    criteria: parseInstructionFallback(instruction),
    isFallback: true,
    error: aiResult.error || 'Failed to complete AI research planning.',
  };
}

function parseInstructionFallback(instruction: string): ParsedCriteria {
  const text = instruction.toLowerCase();
  const geographies: string[] = [];
  const targetTypes: string[] = [];

  const cities = ['mumbai', 'bengaluru', 'bangalore', 'delhi', 'ncr', 'pune', 'hyderabad', 'chennai', 'goa'];
  cities.forEach(c => {
    if (text.includes(c)) {
      const formatted = c === 'bangalore' ? 'Bengaluru' : c.charAt(0).toUpperCase() + c.slice(1);
      if (!geographies.includes(formatted)) geographies.push(formatted);
    }
  });
  if (geographies.length === 0) geographies.push('India');

  if (text.includes('interior')) targetTypes.push('Interior Design Studio');
  if (text.includes('architect')) targetTypes.push('Architecture Firm');
  if (text.includes('turnkey') || text.includes('fitout') || text.includes('d&b')) targetTypes.push('Turnkey D&B');
  if (targetTypes.length === 0) targetTypes.push('Design & Build Studio');

  return {
    targetCompanyTypes: targetTypes,
    geographies,
    industries: ['Commercial / Residential Interiors'],
    services: ['Design', 'Fitout'],
    minFitScore: 70,
    customRequirements: instruction,
    searchQueries: generateFallbackQueries(instruction, geographies),
  };
}

function generateFallbackQueries(instruction: string, geographies: string[]): string[] {
  const geo = geographies.length > 0 ? geographies[0] : 'India';
  const cleanInst = instruction.replace(/[^\w\s]/gi, '');
  return [
    `${cleanInst} ${geo}`.trim(),
    `top interior design architecture studios ${geo}`.trim(),
    `commercial design fitout firms ${geo}`.trim(),
  ];
}
