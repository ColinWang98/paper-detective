import type { TokenUsage, CostRecord } from '@/types/ai.types';

const BIGMODEL_PRICING = {
  'glm-4.7-flash': {
    input: 0,
    output: 0,
  },
} as const;

const OPENAI_PRICING = {
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.6,
  },
} as const;

const CHARS_PER_TOKEN = {
  english: 4,
  chinese: 2,
  mixed: 3,
} as const;

export function estimateInputTokens(
  text: string,
  highlightsCount: number
): number {
  const chineseRatio = text.length === 0
    ? 0
    : (text.match(/[\u4e00-\u9fa5]/g) || []).length / text.length;
  const charsPerToken = chineseRatio > 0.5
    ? CHARS_PER_TOKEN.chinese
    : CHARS_PER_TOKEN.mixed;

  const textTokens = Math.ceil(text.length / charsPerToken);
  const highlightsTokens = highlightsCount * 50;
  const promptTokens = 500;

  return textTokens + highlightsTokens + promptTokens;
}

export function estimateOutputTokens(): number {
  return 2000;
}

export function estimateTokens(
  text: string,
  highlightsCount: number
): TokenUsage {
  const input = estimateInputTokens(text, highlightsCount);
  const output = estimateOutputTokens();

  return {
    input,
    output,
    total: input + output,
  };
}

export function calculateCost(
  model: string,
  usage: TokenUsage
): number {
  const pricing =
    model in BIGMODEL_PRICING
      ? BIGMODEL_PRICING[model as keyof typeof BIGMODEL_PRICING]
      : OPENAI_PRICING[model as keyof typeof OPENAI_PRICING];

  if (!pricing) {
    return 0;
  }

  const inputCost = (usage.input / 1_000_000) * pricing.input;
  const outputCost = (usage.output / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

export function trackCost(
  model: string,
  usage: TokenUsage,
  paperId?: number
): number {
  const cost = calculateCost(model, usage);
  const history: CostRecord[] = JSON.parse(
    localStorage.getItem('ai_cost_history') || '[]'
  );

  history.push({
    date: new Date().toISOString(),
    usage,
    cost,
    paperId,
  });

  localStorage.setItem('ai_cost_history', JSON.stringify(history));

  return cost;
}

export function getCostStats(): {
  total: number;
  count: number;
  average: number;
  byMonth: Record<string, number>;
} {
  const history: CostRecord[] = JSON.parse(
    localStorage.getItem('ai_cost_history') || '[]'
  );

  const total = history.reduce((sum, record) => sum + record.cost, 0);
  const count = history.length;
  const average = count > 0 ? total / count : 0;
  const byMonth: Record<string, number> = {};

  history.forEach((record) => {
    const month = record.date.substring(0, 7);
    byMonth[month] = (byMonth[month] || 0) + record.cost;
  });

  return { total, count, average, byMonth };
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return '< $0.01';
  }
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function clearCostHistory(): void {
  localStorage.removeItem('ai_cost_history');
}

export function estimateAnalysisCost(
  pdfPageCount: number,
  highlightsCount: number
): string {
  const avgCharsPerPage = 3000;
  const totalChars = pdfPageCount * avgCharsPerPage;
  const usage = estimateTokens(totalChars.toString(), highlightsCount);
  const cost = calculateCost('glm-4.7-flash', usage);

  return formatCost(cost);
}
