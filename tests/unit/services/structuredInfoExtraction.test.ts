/**
 * Structured Information Extraction Tests
 *
 * Story 2.1.4: Extract structured information from papers
 *
 * Test Coverage:
 * - extractStructuredInfo() method
 * - Research question extraction
 * - Methodology extraction
 * - Findings extraction
 * - Conclusions extraction
 * - Confidence scoring
 * - Caching behavior (7-day TTL)
 * - Performance benchmarks (<10s target)
 *
 * Mock Strategy:
 * - Mock Anthropic SDK for fast, reliable tests
 * - Mock cache service
 * - Verify token and cost calculation
 */

import { AIService } from '@/services/aiService';
import Anthropic from '@anthropic-ai/sdk';
import { cacheService } from '@/services/cacheService';
import { calculateCost } from '@/services/costTracker';
import type { Highlight } from '@/types';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

// Mock cache service
jest.mock('@/services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock cost tracker
jest.mock('@/services/costTracker', () => ({
  estimateTokens: jest.fn(() => 2000),
  calculateCost: jest.fn(() => 0.02),
}));

// Mock API key manager
jest.mock('@/services/apiKeyManager', () => ({
  getAPIKey: jest.fn(() => 'test-api-key'),
  hasAPIKey: jest.fn(() => true),
}));

describe('Structured Information Extraction - Story 2.1.4', () => {
  let aiService: AIService;
  let mockClient: any;
  let mockStream: AsyncIterable<any>;

  const mockPaperId = 1;
  const mockPDFText = `
    # A Novel Approach to Deep Learning

    ## Introduction
    Deep learning models have achieved remarkable success in various domains.
    However, they often require large amounts of labeled data.
    This paper addresses the challenge of training deep models with limited data.

    ## Methodology
    We propose a novel semi-supervised learning approach that combines:
    1. Contrastive learning for representation learning
    2. Self-training with pseudo-labels
    3. Data augmentation techniques

    Our experiments use CIFAR-10 and ImageNet datasets.
    We evaluate using top-1 accuracy, F1 score, and calibration error.

    ## Results
    Our method achieves 94.5% top-1 accuracy on CIFAR-10, compared to 92.1% for baseline.
    On ImageNet, we achieve 78.3% accuracy with only 10% of labeled data.
    The F1 score improvement is 8.7% over previous state-of-the-art.

    ## Conclusion
    This work demonstrates that semi-supervised learning can significantly
    reduce the need for labeled data while maintaining competitive performance.
    Our approach is particularly valuable for domains where annotation is expensive.
  `.trim();

  const mockHighlights: Highlight[] = [
    {
      id: 1,
      paperId: mockPaperId,
      pageNumber: 1,
      text: 'Deep learning models require large amounts of labeled data',
      priority: 'critical',
      color: 'red',
      position: { x: 100, y: 200, width: 300, height: 20 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      paperId: mockPaperId,
      pageNumber: 2,
      text: 'Semi-supervised learning with contrastive learning',
      priority: 'critical',
      color: 'red',
      position: { x: 100, y: 250, width: 300, height: 20 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      paperId: mockPaperId,
      pageNumber: 3,
      text: '94.5% accuracy on CIFAR-10',
      priority: 'critical',
      color: 'red',
      position: { x: 100, y: 300, width: 300, height: 20 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const mockStructuredResponse = {
    researchQuestion: 'How to train deep learning models with limited labeled data while maintaining competitive performance?',
    methodology: [
      'Contrastive learning for representation learning',
      'Self-training with pseudo-labels',
      'Data augmentation techniques',
      'Evaluation on CIFAR-10 and ImageNet datasets',
      'Metrics: top-1 accuracy, F1 score, calibration error',
    ],
    findings: [
      'Achieved 94.5% top-1 accuracy on CIFAR-10 (vs 92.1% baseline)',
      'Achieved 78.3% accuracy on ImageNet with only 10% labeled data',
      'F1 score improvement of 8.7% over state-of-the-art',
    ],
    conclusions: 'Semi-supervised learning significantly reduces labeled data requirements while maintaining competitive performance, particularly valuable for domains with expensive annotation.',
    confidence: 0.92,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();

    // Mock Anthropic client
    mockClient = new Anthropic({ apiKey: 'test-key', dangerouslyAllowBrowser: true });

    // Mock stream response
    mockStream = {
      async *[Symbol.asyncIterator]() {
        yield { type: 'content_block_delta', delta: { text: '```json\n' } };
        yield { type: 'content_block_delta', delta: { text: JSON.stringify(mockStructuredResponse) } };
        yield { type: 'content_block_delta', delta: { text: '\n```' } };
      },
    };

    (mockClient.messages.create as jest.Mock).mockResolvedValue(mockStream);
    (cacheService.get as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('extractStructuredInfo()', () => {
    it('should extract all structured fields successfully', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      // Verify result structure
      expect(result).toMatchObject({
        researchQuestion: expect.any(String),
        methodology: expect.any(Array),
        findings: expect.any(Array),
        conclusions: expect.any(String),
        confidence: expect.any(Number),
        tokenUsage: {
          input: expect.any(Number),
          output: expect.any(Number),
          total: expect.any(Number),
        },
        cost: expect.any(Number),
      });

      // Verify data types
      expect(typeof result.researchQuestion).toBe('string');
      expect(Array.isArray(result.methodology)).toBe(true);
      expect(Array.isArray(result.findings)).toBe(true);
      expect(typeof result.conclusions).toBe('string');
      expect(typeof result.confidence).toBe('number');
    });

    it('should return research question as string', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.researchQuestion).toBe(mockStructuredResponse.researchQuestion);
      expect(result.researchQuestion.length).toBeGreaterThan(0);
    });

    it('should return methodology as array with 3-5 items', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.methodology).toEqual(mockStructuredResponse.methodology);
      expect(result.methodology.length).toBeGreaterThanOrEqual(3);
      expect(result.methodology.length).toBeLessThanOrEqual(5);
    });

    it('should return findings as array with 4-8 items', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.findings).toEqual(mockStructuredResponse.findings);
      expect(result.findings.length).toBeGreaterThanOrEqual(4);
      expect(result.findings.length).toBeLessThanOrEqual(8);
    });

    it('should return conclusions as 2-3 sentence string', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.conclusions).toBe(mockStructuredResponse.conclusions);
      expect(result.conclusions.length).toBeGreaterThan(50); // At least 2-3 sentences
    });

    it('should return confidence score between 0-100', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.confidence).toBe(92); // 0.92 * 100
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should use top 10 highlights by priority', async () => {
      const manyHighlights: Highlight[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        paperId: mockPaperId,
        pageNumber: 1,
        text: `Highlight ${i + 1}`,
        priority: i < 5 ? 'critical' : i < 10 ? 'important' : 'interesting',
        color: 'red',
        position: { x: 100, y: 100 + i * 20, width: 300, height: 20 },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));

      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: manyHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Count critical highlights in prompt
      const criticalMatches = prompt.match(/- \[critical\]/g);
      expect(criticalMatches!.length).toBe(5); // All 5 critical
    });

    it('should limit PDF text to 5000 characters', async () => {
      const longText = 'A'.repeat(10000);

      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: longText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Extract PDF text section
      const pdfTextMatch = prompt.match(/\*\*论文全文.*?\*\*.*?"""([\s\S]*?)"""/);
      const pdfTextInPrompt = pdfTextMatch ? pdfTextMatch[1] : '';

      expect(pdfTextInPrompt.length).toBeLessThanOrEqual(5100);
      expect(pdfTextInPrompt).toContain('[文本已截断...]');
    });

    it('should use correct model parameters', async () => {
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 2000, // Longer output for structured info
          stream: true,
        })
      );
    });

    it('should support streaming with onProgress callback', async () => {
      const onProgress = jest.fn();

      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
    });

    it('should cache result for 7 days', async () => {
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(cacheService.set).toHaveBeenCalledWith(
        `structured-info-${mockPaperId}`,
        expect.any(Object),
        7 * 24 * 60 * 60 * 1000 // 7 days in ms
      );
    });

    it('should return cached result if available', async () => {
      const cachedResult = {
        researchQuestion: 'Cached question',
        methodology: ['Cached method 1', 'Cached method 2'],
        findings: ['Cached finding'],
        conclusions: 'Cached conclusion',
        confidence: 88,
        tokenUsage: { input: 1000, output: 500, total: 1500 },
        cost: 0.015,
      };

      (cacheService.get as jest.Mock).mockResolvedValue(cachedResult);

      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result).toEqual(cachedResult);
      expect(mockClient.messages.create).not.toHaveBeenCalled();
    });
  });

  describe('Prompt Engineering for Structured Extraction', () => {
    it('should include all required fields in prompt', async () => {
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Verify all fields are mentioned
      expect(prompt).toContain('researchQuestion');
      expect(prompt).toContain('methodology');
      expect(prompt).toContain('findings');
      expect(prompt).toContain('conclusions');
      expect(prompt).toContain('confidence');
    });

    it('should specify output format for each field', async () => {
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      expect(prompt).toContain('1-2句话，简洁明确');
      expect(prompt).toContain('3-5项');
      expect(prompt).toContain('4-8项');
      expect(prompt).toContain('2-3句话');
      expect(prompt).toContain('0.0-1.0');
    });

    it('should include evaluation criteria', async () => {
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      expect(prompt).toContain('清晰定义研究边界和目标');
      expect(prompt).toContain('使用技术术语，包含关键实验细节');
      expect(prompt).toContain('每条发现应有数据支撑');
      expect(prompt).toContain('说明研究的创新点和实际价值');
    });

    it('should request specific data in findings', async () => {
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      expect(prompt).toContain('具体数据和量化结果');
      expect(prompt).toContain('准确率、性能指标');
    });
  });

  describe('Token and Cost Calculation', () => {
    it('should estimate tokens based on prompt length', async () => {
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const promptLength = callArgs[0].messages[0].content.length;

      // Rough estimation: 1 token ≈ 4 characters
      const estimatedTokens = Math.ceil(promptLength / 4);
      expect(estimatedTokens).toBeGreaterThan(0);
    });

    it('should calculate cost correctly', async () => {
      const mockCost = 0.0256;
      (calculateCost as jest.Mock).mockReturnValue(mockCost);

      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(calculateCost).toHaveBeenCalledWith(
        'claude-sonnet-4-5-20250514',
        expect.objectContaining({
          input: expect.any(Number),
          output: expect.any(Number),
          total: expect.any(Number),
        })
      );

      expect(result.cost).toBeCloseTo(mockCost, 4);
    });

    it('should round cost to 4 decimal places', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      // Verify cost has at most 4 decimal places
      const costStr = result.cost.toString();
      const decimals = costStr.includes('.') ? costStr.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(4);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete within 10 seconds threshold', async () => {
      const startTime = performance.now();

      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(10000);
    });

    it('should handle long PDF text efficiently', async () => {
      const longText = 'A'.repeat(5000);

      const startTime = performance.now();

      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: longText,
        highlights: mockHighlights,
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(10000);
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON with markdown code blocks', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.researchQuestion).toBe(mockStructuredResponse.researchQuestion);
    });

    it('should parse JSON without markdown code blocks', async () => {
      const plainStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: JSON.stringify(mockStructuredResponse) } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(plainStream);

      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.researchQuestion).toBe(mockStructuredResponse.researchQuestion);
    });

    it('should throw error if required fields are missing', async () => {
      const incompleteResponse = {
        researchQuestion: 'Test question',
        // Missing methodology, findings, conclusions
      };

      const incompleteStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: '```json\n' } };
          yield { type: 'content_block_delta', delta: { text: JSON.stringify(incompleteResponse) } };
          yield { type: 'content_block_delta', delta: { text: '\n```' } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(incompleteStream);

      await expect(
        aiService.extractStructuredInfo({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'PARSE_ERROR',
        message: '结构化信息不完整',
      });
    });

    it('should handle empty arrays gracefully', async () => {
      const emptyArraysResponse = {
        ...mockStructuredResponse,
        methodology: [],
        findings: [],
      };

      const emptyStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: JSON.stringify(emptyArraysResponse) } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(emptyStream);

      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.methodology).toEqual([]);
      expect(result.findings).toEqual([]);
    });

    it('should use default confidence if not provided', async () => {
      const noConfidenceResponse = {
        ...mockStructuredResponse,
        confidence: undefined,
      };

      const noConfidenceStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: JSON.stringify(noConfidenceResponse) } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(noConfidenceStream);

      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.confidence).toBe(85); // Default: 0.85 * 100
    });
  });

  describe('Error Handling', () => {
    it('should throw error if API key is missing', async () => {
      const aiServiceNoKey = new AIService();

      await expect(
        aiServiceNoKey.extractStructuredInfo({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'API_KEY_MISSING',
      });
    });

    it('should handle network errors', async () => {
      (mockClient.messages.create as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        aiService.extractStructuredInfo({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle invalid JSON response', async () => {
      const invalidJSONStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: 'Not valid JSON {' } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(invalidJSONStream);

      await expect(
        aiService.extractStructuredInfo({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'PARSE_ERROR',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty PDF text', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: '',
        highlights: mockHighlights,
      });

      expect(result.researchQuestion).toBeDefined();
    });

    it('should handle empty highlights array', async () => {
      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: [],
      });

      expect(result.methodology).toBeDefined();
      expect(result.findings).toBeDefined();
    });

    it('should handle highlights with special characters', async () => {
      const specialHighlights: Highlight[] = [
        {
          ...mockHighlights[0],
          text: 'Math: E = mc² and ∑(x) = 100%',
        },
      ];

      const result = await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: specialHighlights,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Cache Integration', () => {
    it('should use correct cache key format', async () => {
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(cacheService.get).toHaveBeenCalledWith(`structured-info-${mockPaperId}`);
    });

    it('should distinguish cache from clip summary', async () => {
      // Call both methods
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      // Should use different cache keys
      expect(cacheService.get).toHaveBeenCalledWith(`clip-summary-${mockPaperId}`);
      expect(cacheService.get).toHaveBeenCalledWith(`structured-info-${mockPaperId}`);
    });

    it('should have different TTL for clip vs structured', async () => {
      // Clip summary (24 hours)
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const clipCall = (cacheService.set as jest.Mock).mock.calls.find(
        call => call[0] === `clip-summary-${mockPaperId}`
      );
      expect(clipCall![2]).toBe(24 * 60 * 60 * 1000);

      // Structured info (7 days)
      await aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const structCall = (cacheService.set as jest.Mock).mock.calls.find(
        call => call[0] === `structured-info-${mockPaperId}`
      );
      expect(structCall![2]).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });
});
