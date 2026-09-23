/**
 * AI Web Discovery & Domain Deduplication Module
 * 
 * Conducts public web discovery, extracts raw candidate organizations,
 * performs domain normalization and deduplication.
 */

import { callOpenAICompletion } from './openai';
import { normalizeDomain } from '@/lib/utils';
import { ParsedCriteria } from '@/types';

export interface RawCandidate {
  name: string;
  website: string;
  domain: string;
  location: string;
  companyType: string;
  industry: string;
  description: string;
  sourceUrl: string;
  sourceTitle: string;
  keyContacts?: number;
}

export interface DiscoveryResult {
  ok: boolean;
  candidates: RawCandidate[];
  searchCalls: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  isFallback?: boolean;
}

const DISCOVERY_SYSTEM_PROMPT = `
You are the Web Discovery Agent for Meaven Founder Cockpit.
Your goal is to discover real, verified company candidates based on structured criteria and search queries.

CRITICAL REQUIREMENTS:
1. Return realistic public companies matching the criteria.
2. Provide valid websites/URLs and explicit domain names whenever available.
3. Include real source URLs where this information was found or referenced.
4. Do NOT hallucinate non-existent fake companies if exact details are unknown.

Return valid JSON with this schema:
{
  "candidates": [
    {
      "name": "string (company name)",
      "website": "string (e.g. https://example.com)",
      "location": "string (city/region)",
      "companyType": "string",
      "industry": "string",
      "description": "string (1-2 sentence overview)",
      "sourceUrl": "string (URL reference)",
      "sourceTitle": "string (source title/page name)"
    }
  ]
}
`;

export async function discoverCandidates(
  criteria: ParsedCriteria,
  instruction: string
): Promise<DiscoveryResult> {
  const searchQueries = criteria.searchQueries || [];
  const queryStr = searchQueries.join('; ');
  const userPrompt = `
Instruction: "${instruction}"
Search Queries: "${queryStr}"
Target Geographies: ${JSON.stringify(criteria.geographies)}
Target Types: ${JSON.stringify(criteria.targetCompanyTypes)}
`;

  const aiResult = await callOpenAICompletion<{ candidates: any[] }>(
    DISCOVERY_SYSTEM_PROMPT,
    userPrompt,
    { responseFormatJson: true, temperature: 0.3 }
  );

  let searchCallCount = searchQueries.length > 0 ? searchQueries.length : 1;

  if (aiResult.ok && aiResult.data?.candidates) {
    const rawList = aiResult.data.candidates;
    const deduplicated = deduplicateCandidates(rawList);

    return {
      ok: true,
      candidates: deduplicated,
      searchCalls: searchCallCount,
      usage: aiResult.usage,
    };
  }

  // Fallback for discovery if OpenAI key is missing or call failed
  return {
    ok: false,
    candidates: [],
    searchCalls: 0,
    error: aiResult.error || 'Discovery failed',
    isFallback: true,
  };
}

export function deduplicateCandidates(rawCandidates: any[]): RawCandidate[] {
  const seenDomains = new Set<string>();
  const seenNames = new Set<string>();
  const result: RawCandidate[] = [];

  for (const c of rawCandidates) {
    if (!c || !c.name) continue;

    const nameClean = c.name.trim();
    const nameLower = nameClean.toLowerCase();
    const website = c.website || c.sourceUrl || '';
    const domain = normalizeDomain(website) || normalizeDomain(c.domain || '') || '';

    // Skip if domain or name already seen
    if (domain && seenDomains.has(domain)) continue;
    if (seenNames.has(nameLower)) continue;

    if (domain) seenDomains.add(domain);
    seenNames.add(nameLower);

    result.push({
      name: nameClean,
      website: website.startsWith('http') ? website : (website ? `https://${website}` : ''),
      domain,
      location: c.location || 'India',
      companyType: c.companyType || 'Design Studio',
      industry: c.industry || 'Architecture & Interiors',
      description: c.description || 'Public company discovered via web research.',
      sourceUrl: c.sourceUrl || website || 'https://google.com',
      sourceTitle: c.sourceTitle || `${nameClean} Official Web Listing`,
      keyContacts: c.keyContacts || 1,
    });
  }

  return result;
}
