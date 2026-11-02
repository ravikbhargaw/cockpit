/**
 * Real Web Search Provider Module for Discover Pipeline
 * 
 * Supports configurable search providers via environment variables:
 * - SERPER_API_KEY: Google Search API via Serper (https://google.serper.dev/search)
 * - TAVILY_API_KEY: Tavily Search API (https://api.tavily.com/search)
 * - BRAVE_SEARCH_API_KEY: Brave Search API (https://api.search.brave.com/res/v1/web/search)
 * - SERPAPI_API_KEY: SerpAPI (https://serpapi.com/search)
 * 
 * Built-in zero-config provider:
 * - DuckDuckGo HTML Search: Native HTTP fetch, no API keys required, works in Edge & Node.js runtimes.
 */

import { normalizeDomain } from '@/lib/utils';

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface WebSearchResponse {
  ok: boolean;
  provider: string;
  query: string;
  results: SearchResultItem[];
  error?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Executes a live web search using the best available configured provider.
 */
export async function searchWeb(query: string, maxResults: number = 10): Promise<WebSearchResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { ok: false, provider: 'none', query, results: [], error: 'Search query is empty' };
  }

  // Check configured external search providers first
  if (process.env.SERPER_API_KEY) {
    try {
      const res = await searchSerper(cleanQuery, maxResults);
      if (res.ok && res.results.length > 0) return res;
    } catch (err: any) {
      console.warn('Serper search failed, falling back to next provider:', err?.message);
    }
  }

  if (process.env.TAVILY_API_KEY) {
    try {
      const res = await searchTavily(cleanQuery, maxResults);
      if (res.ok && res.results.length > 0) return res;
    } catch (err: any) {
      console.warn('Tavily search failed, falling back to next provider:', err?.message);
    }
  }

  if (process.env.BRAVE_SEARCH_API_KEY) {
    try {
      const res = await searchBrave(cleanQuery, maxResults);
      if (res.ok && res.results.length > 0) return res;
    } catch (err: any) {
      console.warn('Brave search failed, falling back to next provider:', err?.message);
    }
  }

  if (process.env.SERPAPI_API_KEY) {
    try {
      const res = await searchSerpApi(cleanQuery, maxResults);
      if (res.ok && res.results.length > 0) return res;
    } catch (err: any) {
      console.warn('SerpAPI search failed, falling back to next provider:', err?.message);
    }
  }

  // Primary production fallback: OpenAI Native Web Search via Responses API (uses existing OPENAI_API_KEY)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.trim() !== '' && openaiKey !== 'your_openai_api_key_here') {
    try {
      const res = await searchOpenAIWeb(cleanQuery, maxResults);
      return res;
    } catch (err: any) {
      return {
        ok: false,
        provider: 'openai_web_search',
        query: cleanQuery,
        results: [],
        error: `OpenAI native web search failed: ${err?.message}`,
      };
    }
  }

  // Local development / zero-key fallback: DuckDuckGo HTML search
  return searchDuckDuckGo(cleanQuery, maxResults);
}

/**
 * Provider: Google Search via Serper.dev
 */
async function searchSerper(query: string, maxResults: number): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPER_API_KEY!;
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey.trim(),
    },
    body: JSON.stringify({ q: query, num: maxResults }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, provider: 'serper', query, results: [], error: `Serper HTTP ${res.status}: ${errText}` };
  }

  const data = await res.json();
  const items: SearchResultItem[] = [];
  const organic = data.organic || [];

  for (const item of organic) {
    if (!item.link) continue;
    const domain = normalizeDomain(item.link) || '';
    items.push({
      title: item.title || '',
      url: item.link,
      snippet: item.snippet || '',
      domain,
    });
  }

  return { ok: true, provider: 'serper', query, results: filterAndDeduplicateResults(items) };
}

/**
 * Provider: Tavily Search API
 */
async function searchTavily(query: string, maxResults: number): Promise<WebSearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY!;
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey.trim(),
      query,
      max_results: maxResults,
      search_depth: 'basic',
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, provider: 'tavily', query, results: [], error: `Tavily HTTP ${res.status}: ${errText}` };
  }

  const data = await res.json();
  const items: SearchResultItem[] = [];
  const results = data.results || [];

  for (const item of results) {
    if (!item.url) continue;
    const domain = normalizeDomain(item.url) || '';
    items.push({
      title: item.title || '',
      url: item.url,
      snippet: item.content || '',
      domain,
    });
  }

  return { ok: true, provider: 'tavily', query, results: filterAndDeduplicateResults(items) };
}

/**
 * Provider: Brave Search API
 */
async function searchBrave(query: string, maxResults: number): Promise<WebSearchResponse> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY!;
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': apiKey.trim(),
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, provider: 'brave', query, results: [], error: `Brave HTTP ${res.status}: ${errText}` };
  }

  const data = await res.json();
  const items: SearchResultItem[] = [];
  const results = data.web?.results || [];

  for (const item of results) {
    if (!item.url) continue;
    const domain = normalizeDomain(item.url) || '';
    items.push({
      title: item.title || '',
      url: item.url,
      snippet: item.description || '',
      domain,
    });
  }

  return { ok: true, provider: 'brave', query, results: filterAndDeduplicateResults(items) };
}

/**
 * Provider: SerpAPI
 */
async function searchSerpApi(query: string, maxResults: number): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPAPI_API_KEY!;
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey.trim()}&num=${maxResults}&engine=google`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, provider: 'serpapi', query, results: [], error: `SerpAPI HTTP ${res.status}: ${errText}` };
  }

  const data = await res.json();
  const items: SearchResultItem[] = [];
  const organic = data.organic_results || [];

  for (const item of organic) {
    if (!item.link) continue;
    const domain = normalizeDomain(item.link) || '';
    items.push({
      title: item.title || '',
      url: item.link,
      snippet: item.snippet || '',
      domain,
    });
  }

  return { ok: true, provider: 'serpapi', query, results: filterAndDeduplicateResults(items) };
}

/**
 * Provider: OpenAI Native Web Search via Responses API (v1/responses)
 * Leverages the existing OPENAI_API_KEY without requiring external search provider secrets.
 * Natively supported in Cloudflare Pages / Edge Workers via standard fetch.
 */
export async function searchOpenAIWeb(query: string, maxResults: number): Promise<WebSearchResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
    return {
      ok: false,
      provider: 'openai_web_search',
      query,
      results: [],
      error: 'OPENAI_API_KEY is not configured for web search.',
    };
  }

  const model = process.env.RESEARCH_AI_MODEL?.trim() || 'gpt-4o-mini';

  try {
    const payload = {
      model,
      input: `Search the web for real, established Bangalore architecture firms, interior design studios, commercial interior designers and fitout companies matching: "${query}".
For each firm you identify, return their canonical official company website URL (e.g., https://firmname.com or https://firmname.in) along with firm name and summary.
CRITICAL REQUIREMENTS:
- Prioritize direct official company homepages and portfolio websites.
- Explicitly DO NOT return or cite Google Maps URLs, Google search URLs, directory pages (e.g. Justdial, Sulekha, IndiaMART), social media pages (e.g. LinkedIn, Instagram, Facebook), or search aggregator links.
- Provide direct markdown links in your response text to their actual company homepages: [Firm Name](https://officialdomain.com).
- If you find a firm name through local results, perform a search to locate their actual official company domain and link directly to that website.`,
      tools: [{ type: 'web_search' }],
    };

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        provider: 'openai_web_search',
        query,
        results: [],
        error: `OpenAI Responses API returned HTTP ${res.status}: ${errText.substring(0, 300)}`,
      };
    }

    const data = await res.json();
    const items: SearchResultItem[] = [];

    // Extract citations from message output content annotations
    const outputList = Array.isArray(data.output) ? data.output : [];
    const msg = outputList.find((o: any) => o.type === 'message');
    const contentList = Array.isArray(msg?.content) ? msg.content : [];

    for (const c of contentList) {
      if (c.type === 'output_text') {
        const text = typeof c.text === 'string' ? c.text : '';
        const annotations = Array.isArray(c.annotations) ? c.annotations : [];

        // 1. Process structured url_citation annotations
        for (const ann of annotations) {
          if (ann.type === 'url_citation' && ann.url) {
            let targetUrl = ann.url;
            try {
              const u = new URL(targetUrl);
              u.searchParams.delete('utm_source');
              targetUrl = u.toString();
            } catch {}

            const domain = normalizeDomain(targetUrl) || '';
            const title = ann.title || domain;

            let snippet = '';
            if (typeof ann.start_index === 'number' && typeof ann.end_index === 'number') {
              const start = Math.max(0, ann.start_index - 80);
              const end = Math.min(text.length, ann.end_index + 160);
              snippet = text.substring(start, end).replace(/\n+/g, ' ').trim();
            } else {
              snippet = title;
            }

            items.push({
              title,
              url: targetUrl,
              snippet,
              domain,
            });
          }
        }

        // 2. Process markdown links in output_text: [Title](https://...)
        const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
        let match;
        while ((match = mdLinkRegex.exec(text)) !== null) {
          let linkTitle = match[1].trim();
          let linkUrl = match[2].trim();
          try {
            const u = new URL(linkUrl);
            u.searchParams.delete('utm_source');
            linkUrl = u.toString();
          } catch {}

          const domain = normalizeDomain(linkUrl);
          if (domain && !items.some(it => it.url === linkUrl)) {
            const matchIndex = match.index;
            const snipStart = Math.max(0, matchIndex - 50);
            const snipEnd = Math.min(text.length, matchIndex + match[0].length + 150);
            const snip = text.substring(snipStart, snipEnd).replace(/\n+/g, ' ').trim();

            items.push({
              title: linkTitle,
              url: linkUrl,
              snippet: snip,
              domain,
            });
          }
        }
      }
    }

    const filtered = filterAndDeduplicateResults(items).slice(0, maxResults);

    const usage = {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };

    if (filtered.length === 0) {
      return {
        ok: false,
        provider: 'openai_web_search',
        query,
        results: [],
        usage,
        error: 'OpenAI web search completed but returned zero valid web candidate citations.',
      };
    }

    return {
      ok: true,
      provider: 'openai_web_search',
      query,
      results: filtered,
      usage,
    };
  } catch (err: any) {
    return {
      ok: false,
      provider: 'openai_web_search',
      query,
      results: [],
      error: `OpenAI web search call failed: ${err.message}`,
    };
  }
}

/**
 * Provider: DuckDuckGo HTML Search (Built-in Zero-Config Fallback)
 * Fetches HTML from DuckDuckGo and parses organic results directly.
 */
async function searchDuckDuckGo(query: string, maxResults: number): Promise<WebSearchResponse> {
  try {
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: new URLSearchParams({ q: query }).toString(),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return {
        ok: false,
        provider: 'duckduckgo',
        query,
        results: [],
        error: `DuckDuckGo returned HTTP ${res.status}`,
      };
    }

    const html = await res.text();
    const items: SearchResultItem[] = [];

    // Parse links and titles from DDG HTML
    // Match result__title links
    const titleRegex = /<h2[^>]+class="[^"]*result__title[^"]*"[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

    const titles: { url: string; title: string }[] = [];
    let m;
    while ((m = titleRegex.exec(html)) !== null) {
      let targetUrl = m[1];
      if (targetUrl.includes('uddg=')) {
        const match = targetUrl.match(/uddg=([^&]+)/);
        if (match) targetUrl = decodeURIComponent(match[1]);
      }
      const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();
      titles.push({ url: targetUrl, title: decodeHtmlEntities(rawTitle) });
    }

    const snippetsByUrl: Record<string, string> = {};
    while ((m = snippetRegex.exec(html)) !== null) {
      let targetUrl = m[1];
      if (targetUrl.includes('uddg=')) {
        const match = targetUrl.match(/uddg=([^&]+)/);
        if (match) targetUrl = decodeURIComponent(match[1]);
      }
      const rawSnippet = m[2].replace(/<[^>]+>/g, '').trim();
      snippetsByUrl[targetUrl] = decodeHtmlEntities(rawSnippet);
    }

    for (const t of titles) {
      if (!t.url.startsWith('http')) continue;
      const domain = normalizeDomain(t.url) || '';
      items.push({
        title: t.title,
        url: t.url,
        snippet: snippetsByUrl[t.url] || '',
        domain,
      });
    }

    // Fallback if title regex found nothing: match result__snippet directly
    if (items.length === 0) {
      for (const [url, snippet] of Object.entries(snippetsByUrl)) {
        if (!url.startsWith('http')) continue;
        const domain = normalizeDomain(url) || '';
        items.push({
          title: domain,
          url,
          snippet,
          domain,
        });
      }
    }

    const filtered = filterAndDeduplicateResults(items).slice(0, maxResults);

    if (filtered.length === 0) {
      return {
        ok: false,
        provider: 'duckduckgo',
        query,
        results: [],
        error: 'DuckDuckGo returned 0 results or anti-bot challenge page.',
      };
    }

    return {
      ok: true,
      provider: 'duckduckgo',
      query,
      results: filtered,
    };
  } catch (err: any) {
    return {
      ok: false,
      provider: 'duckduckgo',
      query,
      results: [],
      error: `Web search execution failed: ${err.message}`,
    };
  }
}

/**
 * Filter out noisy search results and deduplicate by root domain
 */
function filterAndDeduplicateResults(items: SearchResultItem[]): SearchResultItem[] {
  const seenDomains = new Set<string>();
  const filtered: SearchResultItem[] = [];

  const excludedDomains = new Set([
    'duckduckgo.com',
    'google.com',
    'google.co.in',
    'bing.com',
    'yahoo.com',
    'wikipedia.org',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'youtube.com',
    'pinterest.com',
    'reddit.com',
    'quora.com',
  ]);

  for (const item of items) {
    if (item.url && (item.url.includes('/maps/') || item.url.includes('google.com/maps') || item.url.includes('maps.google'))) {
      continue;
    }

    const dom = normalizeDomain(item.domain || item.url);
    if (!dom) continue;
    if (excludedDomains.has(dom)) continue;
    if (seenDomains.has(dom)) continue;

    seenDomains.add(dom);
    filtered.push(item);
  }

  return filtered;
}

/**
 * Simple HTML entity decoder
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
