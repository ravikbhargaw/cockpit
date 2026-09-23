/**
 * AI Research Planner Module
 * 
 * Converts Ravi's natural-language instruction into structured research criteria
 * and optimized search queries without inventing non-requested strict filters.
 */

import { callOpenAICompletion } from './openai';
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
Your job is to analyze a founder's natural-language research instruction and extract structured research criteria and search queries.

CRITICAL INSTRUCTIONS:
1. Do NOT invent non-requested strict filters. ONLY capture what the founder explicitly specified or strongly implied.
2. Produce 2 to 4 clean, effective web search queries to discover candidate companies on the public web.
3. Keep search queries realistic and targeted for web discovery (e.g., "luxury residential interior designers Mumbai").

You MUST return valid JSON matching this schema:
{
  "targetCompanyTypes": ["string"],
  "geographies": ["string"],
  "industries": ["string"],
  "services": ["string"],
  "minFitScore": number (default 70),
  "customRequirements": "string",
  "searchQueries": ["string"]
}
`;

export async function planResearchInstruction(instruction: string): Promise<PlannerResult> {
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
      : generateFallbackQueries(instruction, data.geographies || []);

    return {
      ok: true,
      criteria: {
        targetCompanyTypes: data.targetCompanyTypes || [],
        geographies: data.geographies || [],
        industries: data.industries || [],
        services: data.services || [],
        minFitScore: data.minFitScore || 70,
        customRequirements: data.customRequirements || instruction,
        searchQueries: queries,
      },
      usage: aiResult.usage,
    };
  }

  // Graceful rule-based fallback if OpenAI key is missing or call failed
  const fallbackCriteria = parseInstructionFallback(instruction);
  return {
    ok: true,
    criteria: fallbackCriteria,
    isFallback: true,
    error: aiResult.error,
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
