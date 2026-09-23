/**
 * Centralized Model & Pricing Architecture for AI Research Engine
 * 
 * Default Model: gpt-5.6-luna
 * Pricing for gpt-5.6-luna:
 * - Input: $0.20 / 1M tokens
 * - Output: $1.20 / 1M tokens
 * 
 * Configurable via process.env.RESEARCH_AI_MODEL and process.env.USD_TO_INR_RATE
 */

export const DEFAULT_RESEARCH_MODEL = process.env.RESEARCH_AI_MODEL || 'gpt-5.6-luna';

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
  'gpt-5.6-luna': {
    inputPer1MUSD: 0.20,
    outputPer1MUSD: 1.20,
  },
  'gpt-4o': {
    inputPer1MUSD: 2.50,
    outputPer1MUSD: 10.00,
  },
  'gpt-4o-mini': {
    inputPer1MUSD: 0.15,
    outputPer1MUSD: 0.60,
  },
};

export const SEARCH_CALL_COST_USD = 0.01; // Estimated cost per web search call

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

export function getActiveResearchModel(): string {
  return process.env.RESEARCH_AI_MODEL || DEFAULT_RESEARCH_MODEL;
}

export function getModelPricing(modelName?: string): ModelPricing {
  const model = modelName || getActiveResearchModel();
  return MODEL_PRICING_TABLE[model] || MODEL_PRICING_TABLE['gpt-5.6-luna'];
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
