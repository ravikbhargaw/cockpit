/**
 * AI Web Discovery & Domain Deduplication Module
 * 
 * Conducts public web discovery, extracts raw candidate organizations,
 * performs domain normalization and deduplication.
 */

import { callOpenAICompletion } from './openai';
import { searchWeb, SearchResultItem } from './search';
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
You are the Executive Web Discovery Agent for Meaven Founder Cockpit.
Your goal is to extract real, verifiable architecture, interior design, and design-build company candidates strictly from the provided live web search results.

CRITICAL INSTRUCTIONS:
1. ONLY extract companies that are evidenced in the search results provided.
2. DO NOT hallucinate fake companies or make up website URLs.
3. Extract the candidate's actual website whenever present in the search results or snippet.
4. Filter out generic consumer aggregators or review directories (e.g., Justdial, Indiamart, Sulekha, Houzz directory pages) as candidate names — focus on the actual firms and practices mentioned.
5. Capture real location (e.g., Bengaluru / Bangalore) and their stated company type/specialization (e.g., Boutique Architecture Firm, Interior Design Studio, Turnkey D&B, Commercial Interior Practice).

Return valid JSON with this schema:
{
  "candidates": [
    {
      "name": "string (company name)",
      "website": "string (company website URL)",
      "location": "string (city/region)",
      "companyType": "string",
      "industry": "string",
      "description": "string (1-2 sentence overview based on search evidence)",
      "sourceUrl": "string (the search result URL where found)",
      "sourceTitle": "string (source title/page name)"
    }
  ]
}
`;

export async function discoverCandidates(
  criteria: ParsedCriteria,
  instruction: string
): Promise<DiscoveryResult> {
  // Build targeted queries
  const geo = criteria.geographies?.[0] || 'Bengaluru';
  const customQueries = Array.isArray(criteria.searchQueries) ? criteria.searchQueries : [];

  const defaultQueries = [
    `${geo} boutique architecture interior design firms commercial projects`,
    `${geo} design build firms commercial turnkey interior execution`,
    `${geo} interior design firms office workplace commercial`,
    `${geo} architecture firms hospitality retail interior projects`,
    `${geo} premium residential architecture interior studios projects`,
  ];

  // Combine and deduplicate queries
  const allQueries = Array.from(new Set([...customQueries, ...defaultQueries])).slice(0, 5);

  let searchCalls = 0;
  const rawSearchResults: SearchResultItem[] = [];
  const seenUrls = new Set<string>();

  for (const q of allQueries) {
    try {
      searchCalls++;
      const res = await searchWeb(q, 10);
      if (res.ok && res.results.length > 0) {
        for (const item of res.results) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            rawSearchResults.push(item);
          }
        }
      }
    } catch (err: any) {
      console.warn(`Search query "${q}" failed:`, err?.message);
    }
  }

  if (rawSearchResults.length === 0) {
    return {
      ok: false,
      candidates: [],
      searchCalls,
      error: 'Web discovery search returned zero results across all queries. Please check network connectivity or search query terms.',
    };
  }

  // Pass live search results to AI for structured candidate extraction
  const userPrompt = `
Founder Instruction: "${instruction}"
Target Geographies: ${JSON.stringify(criteria.geographies || [geo])}
Target Company Types: ${JSON.stringify(criteria.targetCompanyTypes || [])}

Live Web Search Results (${rawSearchResults.length} unique pages found):
${JSON.stringify(rawSearchResults.slice(0, 35), null, 2)}
`;

  const aiResult = await callOpenAICompletion<{ candidates: any[] }>(
    DISCOVERY_SYSTEM_PROMPT,
    userPrompt,
    { responseFormatJson: true, temperature: 0.2 }
  );

  if (!aiResult.ok) {
    return {
      ok: false,
      candidates: [],
      searchCalls,
      error: aiResult.error || 'Failed to extract candidates from web search results.',
    };
  }

  if (aiResult.data?.candidates && Array.isArray(aiResult.data.candidates)) {
    const rawList = aiResult.data.candidates;
    const deduplicated = deduplicateCandidates(rawList);

    return {
      ok: true,
      candidates: deduplicated,
      searchCalls,
      usage: aiResult.usage,
    };
  }

  return {
    ok: false,
    candidates: [],
    searchCalls,
    error: 'AI extraction returned invalid or empty candidate list from search results.',
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
