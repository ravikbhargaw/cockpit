/**
 * Centralized Server-Side OpenAI Helper
 * 
 * Executes structured completions securely using server-side OPENAI_API_KEY.
 * Model defaults to gpt-5.6-luna via getActiveResearchModel().
 */

import { getActiveResearchModel } from './pricing';

export interface OpenAICompletionOptions {
  model?: string;
  temperature?: number;
  responseFormatJson?: boolean;
}

export interface OpenAICompletionResult<T = any> {
  ok: boolean;
  data?: T;
  rawText?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export async function callOpenAICompletion<T = any>(
  systemPrompt: string,
  userPrompt: string,
  options: OpenAICompletionOptions = {}
): Promise<OpenAICompletionResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = options.model || getActiveResearchModel();

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
    return {
      ok: false,
      error: 'OPENAI_API_KEY is not configured in .env.local',
      model,
    };
  }

  const payload: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  // gpt-5.6-luna only supports default temperature 1. Only include temperature if explicitly set and not gpt-5.6-luna.
  if (options.temperature !== undefined && options.temperature !== 1 && !model.includes('gpt-5.6') && !model.includes('gpt-5')) {
    payload.temperature = options.temperature;
  }

  if (options.responseFormatJson) {
    payload.response_format = { type: 'json_object' };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        error: `OpenAI API returned HTTP ${res.status}: ${errText.substring(0, 300)}`,
        model,
      };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const usage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };

    if (options.responseFormatJson) {
      try {
        const cleanedContent = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanedContent);
        return {
          ok: true,
          data: parsed,
          rawText: content,
          usage,
          model,
        };
      } catch (parseErr: any) {
        return {
          ok: false,
          error: `Failed to parse JSON response from OpenAI: ${parseErr.message}`,
          rawText: content,
          usage,
          model,
        };
      }
    }

    return {
      ok: true,
      rawText: content,
      usage,
      model,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: `Network or runtime error during OpenAI call: ${err.message}`,
      model,
    };
  }
}
