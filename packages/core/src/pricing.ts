const LITELLM_PRICING_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';

const TIERED_THRESHOLD = 200_000;

export interface LiveModelPricing {
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  cache_creation_input_token_cost?: number;
  cache_read_input_token_cost?: number;
  input_cost_per_token_above_200k_tokens?: number;
  output_cost_per_token_above_200k_tokens?: number;
  cache_creation_input_token_cost_above_200k_tokens?: number;
  cache_read_input_token_cost_above_200k_tokens?: number;
}

let pricingCache: Map<string, LiveModelPricing> | null = null;

export async function fetchLivePricing(): Promise<Map<string, LiveModelPricing>> {
  if (pricingCache) return pricingCache;

  const res = await fetch(LITELLM_PRICING_URL, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Failed to fetch pricing: ${res.statusText}`);

  const data = (await res.json()) as Record<string, Record<string, unknown>>;
  const pricing = new Map<string, LiveModelPricing>();

  for (const [model, info] of Object.entries(data)) {
    if (typeof info !== 'object' || info == null) continue;
    if (typeof info.input_cost_per_token !== 'number') continue;
    pricing.set(model, info as LiveModelPricing);
  }

  pricingCache = pricing;
  return pricing;
}

export function resetPricingCache(): void {
  pricingCache = null;
}

const PROVIDER_PREFIXES = ['anthropic/', 'claude-'];

function findPricing(
  modelName: string,
  pricing: Map<string, LiveModelPricing>,
): LiveModelPricing | null {
  // Exact match
  if (pricing.has(modelName)) return pricing.get(modelName)!;

  // Try with provider prefixes
  for (const prefix of PROVIDER_PREFIXES) {
    const key = prefix + modelName;
    if (pricing.has(key)) return pricing.get(key)!;
  }

  // Prefix match — find the longest key that is a prefix of modelName
  let best: LiveModelPricing | null = null;
  let bestLen = 0;
  for (const [key, value] of pricing) {
    if (modelName.startsWith(key) || key.startsWith(modelName)) {
      if (key.length > bestLen) {
        best = value;
        bestLen = key.length;
      }
    }
  }
  return best;
}

function tieredCost(
  tokens: number,
  baseRate: number | undefined,
  tieredRate: number | undefined,
): number {
  if (tokens <= 0 || baseRate == null) return 0;
  if (tokens > TIERED_THRESHOLD && tieredRate != null) {
    const belowThreshold = Math.min(tokens, TIERED_THRESHOLD);
    return belowThreshold * baseRate + (tokens - TIERED_THRESHOLD) * tieredRate;
  }
  return tokens * baseRate;
}

export function calculateLiveCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens: number,
  cacheReadTokens: number,
  pricing: Map<string, LiveModelPricing>,
): number | null {
  const p = findPricing(modelName, pricing);
  if (!p) return null;

  return (
    tieredCost(inputTokens, p.input_cost_per_token, p.input_cost_per_token_above_200k_tokens) +
    tieredCost(outputTokens, p.output_cost_per_token, p.output_cost_per_token_above_200k_tokens) +
    tieredCost(cacheCreationTokens, p.cache_creation_input_token_cost, p.cache_creation_input_token_cost_above_200k_tokens) +
    tieredCost(cacheReadTokens, p.cache_read_input_token_cost, p.cache_read_input_token_cost_above_200k_tokens)
  );
}
