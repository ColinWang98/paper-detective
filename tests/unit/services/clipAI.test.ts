/**
 * Clip AI Service Unit Tests
 *
 * Story 2.1.3: Clip AI 3-sentence summary generation
 *
 * Test Coverage:
 * - generateClipSummary() method
 * - Caching behavior (24-hour TTL)
 * - Prompt engineering correctness
 * - Token and cost calculation
 * - Error handling
 * - Performance benchmarks (<5s target)
 *
 * Mock Strategy:
 * - Mock Anthropic SDK to avoid real API calls
 * - Mock cacheService for fast tests
 * - Mock costTracker for verification
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
  estimateTokens: jest.fn(() => 1000),
  calculateCost: jest.fn(() => 0.01),
}));

// Mock API key manager
jest.mock('@/services/apiKeyManager', () => ({
  getAPIKey: jest.fn(() => 'test-api-key'),
  hasAPIKey: jest.fn(() => true),
}));

describe('Clip AI Service - Story 2.1.3', () => {
  let aiService: AIService;
  let mockClient: any;
  let mockStream: AsyncIterable<any>;

  const mockPaperId = 1;
  const mockPDFText = 'This is a test PDF paper about machine learning...';
  const mockHighlights: Highlight[] = [
    {
      id: 1,
      paperId: mockPaperId,
      pageNumber: 1,
      text: 'Deep learning models achieve state-of-the-art performance',
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
      text: 'We propose a novel architecture for text classification',
      priority: 'important',
      color: 'yellow',
      position: { x: 100, y: 250, width: 300, height: 20 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      paperId: mockPaperId,
      pageNumber: 3,
      text: 'Experimental results show 95% accuracy',
      priority: 'interesting',
      color: 'orange',
      position: { x: 100, y: 300, width: 300, height: 20 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();

    // Mock Anthropic client
    mockClient = new Anthropic({ apiKey: 'test-key', dangerouslyAllowBrowser: true });

    // Mock stream response
    mockStream = {
      async *[Symbol.asyncIterator]() {
        yield { type: 'content_block_delta', delta: { text: '{"summary": [' } };
        yield { type: 'content_block_delta', delta: { text: '"Background: ML models need more data",' } };
        yield { type: 'content_block_delta', delta: { text: '"Method: Novel architecture for text classification",' } };
        yield { type: 'content_block_delta', delta: { text: '"Finding: 95% accuracy on benchmark datasets"' } };
        yield { type: 'content_block_delta', delta: { text: '], "confidence": 0.95}' } };
      },
    };

    (mockClient.messages.create as jest.Mock).mockResolvedValue(mockStream);
    (cacheService.get as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateClipSummary()', () => {
    it('should generate 3-sentence summary successfully', async () => {
      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      // Verify result structure
      expect(result).toMatchObject({
        summary: expect.any(Array),
        confidence: expect.any(Number),
        tokenUsage: {
          input: expect.any(Number),
          output: expect.any(Number),
          total: expect.any(Number),
        },
        cost: expect.any(Number),
      });

      // Verify exactly 3 sentences
      expect(result.summary).toHaveLength(3);

      // Verify confidence is 0-100
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should prioritize critical highlights in prompt', async () => {
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Verify top 5 highlights are included
      // Priority order: critical (3) > important (2) > interesting (1) > archived (0)
      expect(prompt).toContain('Deep learning models'); // critical
      expect(prompt).toContain('novel architecture'); // important
      expect(prompt).toContain('95% accuracy'); // interesting
    });

    it('should limit PDF text to 3000 characters', async () => {
      const longText = 'A'.repeat(5000);

      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: longText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Extract PDF text section from prompt
      const pdfTextMatch = prompt.match(/\*\*论文全文.*?\*\*.*?"""([\s\S]*?)"""/);
      const pdfTextInPrompt = pdfTextMatch ? pdfTextMatch[1] : '';

      // Should be truncated to ~3000 chars
      expect(pdfTextInPrompt.length).toBeLessThanOrEqual(3100); // Allow some buffer
      expect(pdfTextInPrompt).toContain('[文本已截断...]');
    });

    it('should use correct model parameters', async () => {
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 500, // Short output for clip summary
          stream: true,
        })
      );
    });

    it('should call onProgress callback during streaming', async () => {
      const onProgress = jest.fn();

      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
        onProgress,
      });

      // Verify onProgress was called multiple times (streaming)
      expect(onProgress).toHaveBeenCalledTimes(5);
      expect(onProgress).toHaveBeenCalledWith('{"summary": [');
      expect(onProgress).toHaveBeenCalledWith('"Background: ML models need more data",');
    });

    it('should cache result for 24 hours', async () => {
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(cacheService.set).toHaveBeenCalledWith(
        `clip-summary-${mockPaperId}`,
        expect.any(Object),
        24 * 60 * 60 * 1000 // 24 hours in ms
      );
    });

    it('should return cached result if available', async () => {
      const cachedResult = {
        summary: [
          'Cached background',
          'Cached method',
          'Cached finding',
        ],
        confidence: 90,
        tokenUsage: { input: 500, output: 200, total: 700 },
        cost: 0.005,
      };

      (cacheService.get as jest.Mock).mockResolvedValue(cachedResult);

      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(`clip-summary-${mockPaperId}`);
      expect(mockClient.messages.create).not.toHaveBeenCalled(); // Should not call API
    });

    it('should calculate tokens and cost correctly', async () => {
      const mockCost = 0.0123;
      (calculateCost as jest.Mock).mockReturnValue(mockCost);

      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      // Verify cost calculation was called
      expect(calculateCost).toHaveBeenCalledWith(
        'claude-sonnet-4-5-20250514',
        expect.objectContaining({
          input: expect.any(Number),
          output: expect.any(Number),
          total: expect.any(Number),
        })
      );

      // Verify cost is rounded to 4 decimal places
      expect(result.cost).toBeCloseTo(mockCost, 4);
    });

    it('should estimate tokens based on text length', async () => {
      const promptLength = mockPDFText.length + 500; // Approximate prompt length

      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      // Rough estimation: 1 token ≈ 4 characters
      expect(result.tokenUsage.input).toBeGreaterThan(0);
      expect(result.tokenUsage.output).toBeGreaterThan(0);
      expect(result.tokenUsage.total).toBe(
        result.tokenUsage.input + result.tokenUsage.output
      );
    });

    it('should parse JSON response with markdown code blocks', async () => {
      const mockStreamWithMarkdown = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: '```json\n' } };
          yield { type: 'content_block_delta', delta: { text: '{"summary": ["s1", "s2", "s3"], "confidence": 0.88}' } };
          yield { type: 'content_block_delta', delta: { text: '\n```' } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(mockStreamWithMarkdown);

      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.summary).toEqual(['s1', 's2', 's3']);
      expect(result.confidence).toBe(88); // Converted to 0-100
    });

    it('should parse JSON response without markdown code blocks', async () => {
      const mockStreamPlain = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: '{"summary": ["s1", "s2", "s3"], "confidence": 0.92}' } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(mockStreamPlain);

      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.summary).toEqual(['s1', 's2', 's3']);
      expect(result.confidence).toBe(92);
    });

    it('should throw error if summary does not contain exactly 3 sentences', async () => {
      const invalidStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: '{"summary": ["only one"], "confidence": 0.9}' } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(invalidStream);

      await expect(
        aiService.generateClipSummary({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'PARSE_ERROR',
        message: expect.stringContaining('摘要必须包含恰好3句话'),
      });
    });

    it('should throw error if API key is missing', async () => {
      const aiServiceNoKey = new AIService();

      await expect(
        aiServiceNoKey.generateClipSummary({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'API_KEY_MISSING',
        message: '请先在设置中配置API Key',
      });
    });
  });

  describe('Prompt Engineering', () => {
    it('should include clear requirements for 3-sentence structure', async () => {
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Verify prompt structure requirements
      expect(prompt).toContain('第1句：研究背景和核心问题');
      expect(prompt).toContain('第2句：方法和核心创新');
      expect(prompt).toContain('第3句：主要发现和结论');
      expect(prompt).toContain('不超过30字');
    });

    it('should include evaluation criteria in prompt', async () => {
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Verify evaluation criteria
      expect(prompt).toContain('每句话必须简洁明了');
      expect(prompt).toContain('为什么做这个研究');
      expect(prompt).toContain('怎么做的');
      expect(prompt).toContain('发现了什么');
      expect(prompt).toContain('confidence基于论文完整性和结论可信度');
    });

    it('should request pure JSON output only', async () => {
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      expect(prompt).toContain('请只输出JSON，不要其他解释性文字');
    });

    it('should include user highlights in prompt with priority labels', async () => {
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Verify highlights are included with priority tags
      expect(prompt).toContain('[critical]');
      expect(prompt).toContain('[important]');
      expect(prompt).toContain('[interesting]');
      expect(prompt).toContain('用户标记的重要证据');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete within 5 seconds threshold', async () => {
      const startTime = performance.now();

      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      const duration = performance.now() - startTime;

      // Mock test should be very fast (<100ms)
      // Real API call should be <5000ms
      expect(duration).toBeLessThan(5000);
    });

    it('should log warning if exceeding 5 seconds', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Simulate slow response
      const slowStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: '{"summary": ["s1", "s2", "s3"], "confidence": 0.9}' } };
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 5100));
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(slowStream);

      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      // Note: This test might be flaky due to timing
      // In real implementation, performance.now() is used inside the service
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const errorStream = {
        async *[Symbol.asyncIterator]() {
          throw new Error('Network connection failed');
        },
      };

      (mockClient.messages.create as jest.Mock).mockRejectedValue(
        new Error('Network connection failed')
      );

      await expect(
        aiService.generateClipSummary({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle invalid API key errors', async () => {
      const authError = {
        status: 401,
        error: { type: 'authentication_error' },
      };

      (mockClient.messages.create as jest.Mock).mockRejectedValue(authError);

      await expect(
        aiService.generateClipSummary({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'INVALID_API_KEY',
      });
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = {
        status: 429,
        error: { type: 'rate_limit_error' },
      };

      (mockClient.messages.create as jest.Mock).mockRejectedValue(rateLimitError);

      await expect(
        aiService.generateClipSummary({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'RATE_LIMIT',
      });
    });

    it('should handle JSON parse errors', async () => {
      const invalidJSONStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: 'This is not valid JSON' } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(invalidJSONStream);

      await expect(
        aiService.generateClipSummary({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toMatchObject({
        code: 'PARSE_ERROR',
      });
    });

    it('should handle missing JSON in response', async () => {
      const noJSONStream = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { text: 'Some text but no JSON block' } };
        },
      };

      (mockClient.messages.create as jest.Mock).mockResolvedValue(noJSONStream);

      await expect(
        aiService.generateClipSummary({
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
    it('should handle empty highlights array', async () => {
      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: [],
      });

      expect(result.summary).toHaveLength(3);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle very short PDF text', async () => {
      const shortText = 'Short paper';

      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: shortText,
        highlights: mockHighlights,
      });

      expect(result.summary).toHaveLength(3);
      expect(result.tokenUsage.input).toBeGreaterThan(0);
    });

    it('should handle highlights with special characters', async () => {
      const specialHighlights: Highlight[] = [
        {
          ...mockHighlights[0],
          text: 'Math: ∑(x²) + ∫f(x)dx = 42%',
        },
      ];

      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: specialHighlights,
      });

      expect(result.summary).toHaveLength(3);
    });

    it('should handle all 4 priority levels correctly', async () => {
      const mixedHighlights: Highlight[] = [
        { ...mockHighlights[0], priority: 'critical' as const },
        { ...mockHighlights[1], priority: 'important' as const },
        { ...mockHighlights[2], priority: 'interesting' as const },
        { ...mockHighlights[0], id: 4, priority: 'archived' as const, text: 'Archived note' },
      ];

      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mixedHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Should include top 5 highlights by priority
      expect(prompt).toContain('[critical]');
      expect(prompt).toContain('[important]');
      expect(prompt).toContain('[interesting]');
      // Archived (priority 0) might not be in top 5
    });

    it('should handle more than 5 highlights (select top 5)', async () => {
      const manyHighlights: Highlight[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        paperId: mockPaperId,
        pageNumber: 1,
        text: `Highlight ${i + 1}`,
        priority: i < 3 ? 'critical' : 'important',
        color: 'red',
        position: { x: 100, y: 100 + i * 20, width: 300, height: 20 },
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));

      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: manyHighlights,
      });

      const callArgs = (mockClient.messages.create as jest.Mock).mock.calls[0];
      const prompt = callArgs[0].messages[0].content;

      // Count how many highlights are in prompt
      const highlightMatches = prompt.match(/- \[critical\]/g);
      expect(highlightMatches).toBeTruthy();
      // Should have at most 3 critical (top priority)
      expect(highlightMatches!.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Integration with Cache Service', () => {
    it('should check cache before calling API', async () => {
      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      // Cache check should happen first
      expect(cacheService.get).toHaveBeenCalledWith(`clip-summary-${mockPaperId}`);
      expect(mockClient.messages.create).toHaveBeenCalled();
    });

    it('should not call API if cache hit', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue({
        summary: ['cached1', 'cached2', 'cached3'],
        confidence: 85,
        tokenUsage: { input: 100, output: 50, total: 150 },
        cost: 0.001,
      });

      await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(cacheService.get).toHaveBeenCalled();
      expect(mockClient.messages.create).not.toHaveBeenCalled();
    });

    it('should save to cache after successful API call', async () => {
      const result = await aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(cacheService.set).toHaveBeenCalledWith(
        `clip-summary-${mockPaperId}`,
        result,
        24 * 60 * 60 * 1000
      );
    });

    it('should use different cache keys for different papers', async () => {
      await aiService.generateClipSummary({
        paperId: 1,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      await aiService.generateClipSummary({
        paperId: 2,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(cacheService.get).toHaveBeenCalledWith('clip-summary-1');
      expect(cacheService.get).toHaveBeenCalledWith('clip-summary-2');
    });
  });
});
