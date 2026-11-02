/**
 * Centralized Model & Pricing Architecture for AI Research Engine
 * 
 * Default Model: gpt-4o-mini
 * Pricing for gpt-4o-mini:
 * - Input: $0.15 / 1M tokens
 * - Output: $0.60 / 1M tokens
 * 
 * Configurable via process.env.RESEARCH_AI_MODEL and process.env.USD_TO_INR_RATE
 */

export const DEFAULT_RESEARCH_MODEL = 'gpt-4o-mini';

/**
 * Maximum safety budget in INR per Research Job.
 * Note: ₹150 is a safety ceiling, NOT a target spend.
 * The system completes research using minimum required model calls.
 */
export const MAX_SAFETY_BUDGET_INR = 150;

export interface ModelPricing {
  inputPer1MUSD: number;
  outputPer1MUSD: number;
}

export const MODEL_PRICING_TABLE: Record<string, ModelPricing> = {
  'gpt-4o-mini': {
    inputPer1MUSD: 0.15,
    outputPer1MUSD: 0.60,
  },
  'gpt-4o': {
    inputPer1MUSD: 2.50,
    outputPer1MUSD: 10.00,
  },
  'gpt-4-turbo': {
    inputPer1MUSD: 10.00,
    outputPer1MUSD: 30.00,
  },
};

export const SEARCH_CALL_COST_USD = 0.005; // Estimated cost per web search query

export function getExchangeRateUSDToINR(): number {
  const envRate = process.env.USD_TO_INR_RATE;
  if (envRate) {
    const parsed = parseFloat(envRate);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 85.0; // Default exchange rate
}

/**
 * Validates whether a model string is a genuine, supported OpenAI model.
 * Fails clearly if an invalid or hallucinated model (e.g. gpt-5.6-luna) is configured.
 */
export function validateResearchModel(modelName?: string): { valid: boolean; model: string; error?: string } {
  const envModel = process.env.RESEARCH_AI_MODEL;
  const target = (modelName || envModel || DEFAULT_RESEARCH_MODEL).trim();

  if (!target) {
    return { valid: false, model: '', error: 'Research AI model name is empty.' };
  }

  const clean = target.toLowerCase();
  // Check for known invalid/fabricated model names
  if (clean.includes('luna') || clean.includes('gpt-5.6') || clean.includes('fake')) {
    return {
      valid: false,
      model: target,
      error: `Invalid AI model configured: "${target}". Please configure a valid OpenAI model such as 'gpt-4o-mini' or 'gpt-4o' in RESEARCH_AI_MODEL.`,
    };
  }

  // Must match valid OpenAI prefix
  if (!clean.startsWith('gpt-4') && !clean.startsWith('gpt-3.5') && !clean.startsWith('o1') && !clean.startsWith('o3')) {
    return {
      valid: false,
      model: target,
      error: `Unsupported OpenAI model: "${target}". Expected 'gpt-4o-mini', 'gpt-4o', or a standard OpenAI chat completion model.`,
    };
  }

  return { valid: true, model: target };
}

export function getActiveResearchModel(): string {
  const validation = validateResearchModel();
  if (!validation.valid) {
    // Return the invalid model so caller / validator can report the exact misconfiguration
    return validation.model || DEFAULT_RESEARCH_MODEL;
  }
  return validation.model;
}

export function getModelPricing(modelName?: string): ModelPricing {
  const model = modelName || getActiveResearchModel();
  return MODEL_PRICING_TABLE[model] || MODEL_PRICING_TABLE['gpt-4o-mini'];
}

export interface CostCalculationResult {
  inputTokens: number;
  outputTokens: number;
  searchCalls: number;
  costUSD: number;
  costINR: number;
  formattedINR: string;
  isBudgetExceeded: boolean;
}

export function calculateEstimatedCost(
  inputTokens: number,
  outputTokens: number,
  searchCalls: number = 0,
  modelName?: string,
  maxBudgetINR: number = MAX_SAFETY_BUDGET_INR
): CostCalculationResult {
  const pricing = getModelPricing(modelName);
  const exchangeRate = getExchangeRateUSDToINR();

  const inputCostUSD = (inputTokens / 1_000_000) * pricing.inputPer1MUSD;
  const outputCostUSD = (outputTokens / 1_000_000) * pricing.outputPer1MUSD;
  const searchCostUSD = searchCalls * SEARCH_CALL_COST_USD;

  const costUSD = inputCostUSD + outputCostUSD + searchCostUSD;
  const costINR = costUSD * exchangeRate;

  // Round INR to 2 decimal places
  const roundedINR = Math.round(costINR * 100) / 100;

  return {
    inputTokens,
    outputTokens,
    searchCalls,
    costUSD,
    costINR: roundedINR,
    formattedINR: `₹${roundedINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    isBudgetExceeded: roundedINR >= maxBudgetINR,
  };
}
