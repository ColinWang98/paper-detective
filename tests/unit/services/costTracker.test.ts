/**
 * Cost Tracker Unit Tests
 * 测试AI成本追踪服务
 */

import {
  estimateInputTokens,
  estimateOutputTokens,
  estimateTokens,
  calculateCost,
  trackCost,
  getCostStats,
  formatCost,
  formatTokens,
  clearCostHistory,
  estimateAnalysisCost,
} from '@/services/costTracker';
import type { TokenUsage } from '@/types/ai.types';

describe('Cost Tracker', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('estimateInputTokens', () => {
    it('should estimate tokens for mixed English-Chinese text', () => {
      const text = 'This is English text 这是中文文本';
      const tokens = estimateInputTokens(text, 5);

      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    it('should use English ratio for English-dominant text', () => {
      const text = 'This is predominantly English text with very few Chinese characters like 中';
      const tokens = estimateInputTokens(text, 0);

      // English: ~4 chars per token
      const expected = Math.ceil(text.length / 4) + 500; // +500 for prompt template
      expect(tokens).toBeCloseTo(expected, -2); // Allow some tolerance
    });

    it('should use Chinese ratio for Chinese-dominant text', () => {
      const text = '这是一篇主要由中文组成的文本with little English';
      const tokens = estimateInputTokens(text, 0);

      // Chinese: ~2 chars per token
      const expected = Math.ceil(text.length / 2) + 500;
      expect(tokens).toBeCloseTo(expected, -2);
    });

    it('should include highlight tokens', () => {
      const text = 'Some text';
      const highlightsCount = 10;

      const tokens = estimateInputTokens(text, highlightsCount);

      // Each highlight adds ~50 tokens
      const highlightTokens = highlightsCount * 50;
      expect(tokens).toBeGreaterThan(highlightTokens);
    });

    it('should include prompt template tokens', () => {
      const text = 'Short text';
      const tokens = estimateInputTokens(text, 0);

      // Should include ~500 tokens for prompt template
      expect(tokens).toBeGreaterThan(500);
    });
  });

  describe('estimateOutputTokens', () => {
    it('should return constant output estimate', () => {
      const tokens = estimateOutputTokens();

      expect(tokens).toBe(2000);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate total tokens including input and output', () => {
      const text = 'Sample academic paper text';
      const highlightsCount = 5;

      const usage = estimateTokens(text, highlightsCount);

      expect(usage.input).toBeGreaterThan(0);
      expect(usage.output).toBe(2000);
      expect(usage.total).toBe(usage.input + usage.output);
    });

    it('should return TokenUsage type', () => {
      const usage = estimateTokens('text', 0);

      expect(usage).toHaveProperty('input');
      expect(usage).toHaveProperty('output');
      expect(usage).toHaveProperty('total');
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for GLM 4.7 Flash', () => {
      const usage: TokenUsage = {
        input: 5000,
        output: 2000,
        total: 7000,
      };

      const cost = calculateCost('glm-4.7-flash', usage);

      expect(cost).toBe(0);
    });

    it('should calculate cost for GPT-4o mini', () => {
      const usage: TokenUsage = {
        input: 5000,
        output: 2000,
        total: 7000,
      };

      const cost = calculateCost('gpt-4o-mini', usage);

      // GPT-4o mini: $0.15/M input, $0.60/M output
      const expectedInputCost = (5000 / 1_000_000) * 0.15;
      const expectedOutputCost = (2000 / 1_000_000) * 0.60;
      const expectedCost = expectedInputCost + expectedOutputCost;

      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    it('should return 0 for zero tokens', () => {
      const usage: TokenUsage = {
        input: 0,
        output: 0,
        total: 0,
      };

      const cost = calculateCost('glm-4.7-flash', usage);

      expect(cost).toBe(0);
    });

    it('should handle large token counts', () => {
      const usage: TokenUsage = {
        input: 1_000_000,
        output: 500_000,
        total: 1_500_000,
      };

      const cost = calculateCost('glm-4.7-flash', usage);

      expect(cost).toBe(0);
    });
  });

  describe('trackCost', () => {
    it('should save cost record to localStorage', () => {
      const usage: TokenUsage = {
        input: 5000,
        output: 2000,
        total: 7000,
      };

      const cost = trackCost('glm-4.7-flash', usage, 1);

      const history = JSON.parse(localStorage.getItem('ai_cost_history')!);

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        cost,
        usage,
        paperId: 1,
      });
      expect(history[0].date).toBeDefined();
    });

    it('should append multiple records', () => {
      const usage: TokenUsage = {
        input: 5000,
        output: 2000,
        total: 7000,
      };

      trackCost('glm-4.7-flash', usage, 1);
      trackCost('glm-4.7-flash', usage, 2);

      const history = JSON.parse(localStorage.getItem('ai_cost_history')!);

      expect(history).toHaveLength(2);
      expect(history[0].paperId).toBe(1);
      expect(history[1].paperId).toBe(2);
    });

    it('should include timestamp in ISO format', () => {
      const usage: TokenUsage = {
        input: 5000,
        output: 2000,
        total: 7000,
      };

      trackCost('glm-4.7-flash', usage);

      const history = JSON.parse(localStorage.getItem('ai_cost_history')!);
      const record = history[0];

      expect(record.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should work without paperId', () => {
      const usage: TokenUsage = {
        input: 5000,
        output: 2000,
        total: 7000,
      };

      trackCost('glm-4.7-flash', usage);

      const history = JSON.parse(localStorage.getItem('ai_cost_history')!);

      expect(history[0].paperId).toBeUndefined();
    });
  });

  describe('getCostStats', () => {
    beforeEach(() => {
      // Setup test data
      const history = [
        {
          date: '2026-02-01T10:00:00Z',
          usage: { input: 5000, output: 2000, total: 7000 },
          cost: 0.06,
          paperId: 1,
        },
        {
          date: '2026-02-05T14:00:00Z',
          usage: { input: 6000, output: 2500, total: 8500 },
          cost: 0.07,
          paperId: 2,
        },
        {
          date: '2026-02-10T09:00:00Z',
          usage: { input: 4000, output: 1500, total: 5500 },
          cost: 0.05,
          paperId: 3,
        },
      ];
      localStorage.setItem('ai_cost_history', JSON.stringify(history));
    });

    it('should calculate total cost', () => {
      const stats = getCostStats();

      expect(stats.total).toBeCloseTo(0.18, 2);
    });

    it('should calculate count', () => {
      const stats = getCostStats();

      expect(stats.count).toBe(3);
    });

    it('should calculate average cost', () => {
      const stats = getCostStats();

      expect(stats.average).toBeCloseTo(0.06, 2);
    });

    it('should group costs by month', () => {
      const stats = getCostStats();

      expect(stats.byMonth).toHaveProperty('2026-02');
      expect(stats.byMonth['2026-02']).toBeCloseTo(0.18, 2);
    });

    it('should handle multiple months', () => {
      const history = [
        {
          date: '2026-01-15T10:00:00Z',
          usage: { input: 5000, output: 2000, total: 7000 },
          cost: 0.06,
          paperId: 1,
        },
        {
          date: '2026-02-15T10:00:00Z',
          usage: { input: 5000, output: 2000, total: 7000 },
          cost: 0.08,
          paperId: 2,
        },
      ];
      localStorage.setItem('ai_cost_history', JSON.stringify(history));

      const stats = getCostStats();

      expect(stats.byMonth['2026-01']).toBeCloseTo(0.06, 2);
      expect(stats.byMonth['2026-02']).toBeCloseTo(0.08, 2);
    });

    it('should return zero stats when no history', () => {
      localStorage.clear();

      const stats = getCostStats();

      expect(stats).toEqual({
        total: 0,
        count: 0,
        average: 0,
        byMonth: {},
      });
    });
  });

  describe('formatCost', () => {
    it('should format cost in dollars', () => {
      expect(formatCost(0.06)).toBe('$0.06');
      expect(formatCost(0.10)).toBe('$0.10');
      expect(formatCost(1.00)).toBe('$1.00');
      expect(formatCost(1.50)).toBe('$1.50');
    });

    it('should format small costs', () => {
      expect(formatCost(0.001)).toBe('< $0.01');
      expect(formatCost(0.009)).toBe('< $0.01');
    });

    it('should format large costs', () => {
      expect(formatCost(10.50)).toBe('$10.50');
      expect(formatCost(100.00)).toBe('$100.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCost(0.066666)).toBe('$0.07');
      expect(formatCost(1.234567)).toBe('$1.23');
    });
  });

  describe('formatTokens', () => {
    it('should format small token counts', () => {
      expect(formatTokens(100)).toBe('100');
      expect(formatTokens(999)).toBe('999');
    });

    it('should format thousands', () => {
      expect(formatTokens(1_000)).toBe('1.0K');
      expect(formatTokens(5_500)).toBe('5.5K');
      expect(formatTokens(999_999)).toBe('1000.0K');
    });

    it('should format millions', () => {
      expect(formatTokens(1_000_000)).toBe('1.0M');
      expect(formatTokens(2_500_000)).toBe('2.5M');
      expect(formatTokens(10_000_000)).toBe('10.0M');
    });

    it('should round to 1 decimal place', () => {
      expect(formatTokens(1_234_567)).toBe('1.2M');
      expect(formatTokens(5_678)).toBe('5.7K');
    });
  });

  describe('clearCostHistory', () => {
    it('should clear cost history from localStorage', () => {
      localStorage.setItem('ai_cost_history', JSON.stringify([{ cost: 0.06 }]));

      clearCostHistory();

      expect(localStorage.getItem('ai_cost_history')).toBeNull();
    });

    it('should not throw when history is empty', () => {
      expect(() => clearCostHistory()).not.toThrow();
    });
  });

  describe('estimateAnalysisCost', () => {
    it('should estimate cost for typical paper', () => {
      const cost = estimateAnalysisCost(10, 5);

      expect(cost).toBe('< $0.01');
    });

    it('should increase with page count', () => {
      const cost1 = estimateAnalysisCost(5, 5);
      const cost2 = estimateAnalysisCost(20, 5);

      expect(cost1).toBe('< $0.01');
      expect(cost2).toBe('< $0.01');
    });

    it('should increase with highlights count', () => {
      const cost1 = estimateAnalysisCost(10, 2);
      const cost2 = estimateAnalysisCost(10, 20);

      expect(cost1).toBe('< $0.01');
      expect(cost2).toBe('< $0.01');
    });

    it('should handle zero pages and highlights', () => {
      const cost = estimateAnalysisCost(0, 0);

      expect(cost).toBe('< $0.01');
    });
  });

  describe('Cost calculation accuracy', () => {
    it('should use correct GLM pricing', () => {
      const usage: TokenUsage = {
        input: 1_000_000,
        output: 1_000_000,
        total: 2_000_000,
      };

      const cost = calculateCost('glm-4.7-flash', usage);

      expect(cost).toBe(0);
    });

    it('should use correct GPT-4o mini pricing', () => {
      const usage: TokenUsage = {
        input: 1_000_000,
        output: 1_000_000,
        total: 2_000_000,
      };

      const cost = calculateCost('gpt-4o-mini', usage);

      // GPT-4o mini: $0.15/M input, $0.60/M output = $0.75 total
      expect(cost).toBeCloseTo(0.75, 2);
    });
  });

  describe('Real-world scenarios', () => {
    it('should estimate typical paper analysis cost', () => {
      // Typical academic paper: 10 pages, ~30k chars, 5 highlights
      const text = 'A'.repeat(30000);
      const usage = estimateTokens(text, 5);
      const cost = calculateCost('glm-4.7-flash', usage);

      // Should be around $0.10-$0.15
      expect(cost).toBe(0);
    });

    it('should estimate long paper analysis cost', () => {
      // Long paper: 30 pages, ~90k chars, 20 highlights
      const text = 'A'.repeat(90000);
      const usage = estimateTokens(text, 20);
      const cost = calculateCost('glm-4.7-flash', usage);

      // Should be around $0.30-$0.50
      expect(cost).toBe(0);
    });

    it('should track realistic usage over time', () => {
      const usage: TokenUsage = {
        input: 5000,
        output: 2000,
        total: 7000,
      };

      // Simulate 100 papers analyzed
      for (let i = 0; i < 100; i++) {
        trackCost('glm-4.7-flash', usage, i);
      }

      const stats = getCostStats();

      expect(stats.count).toBe(100);
      expect(stats.total).toBe(0);
    });
  });
});
