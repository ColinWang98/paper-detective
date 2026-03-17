import { AIService, aiService } from '@/services/aiService';
import { cacheService } from '@/services/cacheService';
import * as costTracker from '@/services/costTracker';
import { getAPIKey, hasAPIKey } from '@/services/apiKeyManager';
import type { Highlight } from '@/types';

const { ReadableStream } = require('stream/web');

jest.mock('@/services/apiKeyManager');
jest.mock('@/services/cacheService');
jest.mock('@/services/costTracker');

const mockGetAPIKey = getAPIKey as jest.MockedFunction<typeof getAPIKey>;
const mockHasAPIKey = hasAPIKey as jest.MockedFunction<typeof hasAPIKey>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockCostTracker = costTracker as jest.Mocked<typeof costTracker>;

describe('AIService', () => {
  let service: AIService;
  let fetchMock: jest.Mock;

  const mockPaperId = 1;
  const mockPDFText = 'This is a sample academic paper about transformers...';
  const mockHighlights: Highlight[] = [
    {
      id: 1,
      paperId: 1,
      pageNumber: 1,
      text: 'Transformers revolutionized NLP',
      priority: 'critical',
      color: 'red',
      position: { x: 100, y: 200, width: 300, height: 20 },
      timestamp: '2026-02-10T10:00:00Z',
      createdAt: '2026-02-10T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AIService();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    mockHasAPIKey.mockReturnValue(true);
    mockGetAPIKey.mockReturnValue('glm-test-key-12345678901234567890');
    mockCacheService.getAnalysis.mockResolvedValue(null);
    mockCacheService.saveAnalysis.mockResolvedValue(undefined);
    mockCostTracker.estimateTokens.mockReturnValue({
      input: 5000,
      output: 2000,
      total: 7000,
    });
    mockCostTracker.calculateCost.mockReturnValue(0.01);
  });

  function mockJsonResponse(content: string, status = 200) {
    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content,
            },
          },
        ],
      }),
    });
  }

  function createStreamResponse(chunks: string[], status = 200) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller: { enqueue: (value: Uint8Array) => void; close: () => void }) {
        chunks.forEach((chunk) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`)
          );
        });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      body: stream,
      json: jest.fn(),
    });
  }

  describe('isConfigured', () => {
    it('returns true when API key is configured', () => {
      mockHasAPIKey.mockReturnValue(true);
      expect(service.isConfigured()).toBe(true);
    });

    it('returns false when API key is not configured', () => {
      mockHasAPIKey.mockReturnValue(false);
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('analyzePaper', () => {
    it('returns cached result if available', async () => {
      const cachedResult = {
        summary: 'Cached summary',
        researchQuestion: 'Cached question',
        methods: ['Method 1'],
        findings: ['Finding 1'],
        limitations: ['Limitation 1'],
        paperId: mockPaperId,
        tokenUsage: { input: 5000, output: 2000, total: 7000 },
        estimatedCost: 0.01,
        createdAt: '2026-02-10T10:00:00Z',
        model: 'glm-4.7-flash' as const,
      };

      mockCacheService.getAnalysis.mockResolvedValue(cachedResult);

      const result = await service.analyzePaper({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result).toEqual(cachedResult);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws error when API key is not configured', async () => {
      mockHasAPIKey.mockReturnValue(false);

      await expect(
        service.analyzePaper({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toThrow('请先在设置中配置API Key');
    });

    it('calls BigModel API with glm-4.7-flash', async () => {
      createStreamResponse(['{"summary":"Test"}']);

      await service.analyzePaper({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer glm-test-key-12345678901234567890',
          }),
          body: expect.stringContaining('"model":"glm-4.7-flash"'),
        })
      );
    });

    it('handles streaming response and calls onProgress', async () => {
      const onProgress = jest.fn();
      createStreamResponse(['Hello ', 'World']);

      jest.spyOn(service as any, 'parseAnalysisResponse').mockReturnValue({
        summary: 'Test summary',
        researchQuestion: 'Test question',
        methods: [],
        findings: [],
        limitations: [],
      } as any);

      await service.analyzePaper({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith('Hello ');
      expect(onProgress).toHaveBeenCalledWith('World');
    });

    it('parses valid JSON response correctly', async () => {
      mockJsonResponse(JSON.stringify({
        summary: 'This paper introduces transformers',
        researchQuestion: 'How to improve NLP performance?',
        methods: ['Self-attention', 'Parallel processing'],
        findings: ['Transformers achieve SOTA results'],
        limitations: ['Requires large datasets'],
      }));

      const result = await service.analyzePaper({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result.summary).toBe('This paper introduces transformers');
      expect(result.model).toBe('glm-4.7-flash');
    });

    it('calculates cost with glm-4.7-flash', async () => {
      mockJsonResponse('{"summary":"Test"}');

      await service.analyzePaper({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(mockCostTracker.calculateCost).toHaveBeenCalledWith(
        'glm-4.7-flash',
        expect.any(Object)
      );
    });
  });

  describe('testConnection', () => {
    it('returns success when API key is configured', async () => {
      mockJsonResponse('Hi');

      const result = await service.testConnection();

      expect(result).toEqual({
        success: true,
        message: '连接成功',
      });
      expect(fetchMock).toHaveBeenCalled();
    });

    it('returns error when API key is not configured', async () => {
      mockHasAPIKey.mockReturnValue(false);

      const result = await service.testConnection();

      expect(result).toEqual({
        success: false,
        message: '请先配置API Key',
      });
    });
  });

  describe('parseAnalysisResponse', () => {
    it('extracts JSON from markdown code blocks', () => {
      const response = '```json\n{"summary":"Test summary"}\n```';

      const result = (service as any).parseAnalysisResponse(response);

      expect(result.summary).toBe('Test summary');
      expect(result.model).toBe('glm-4.7-flash');
    });
  });

  describe('Singleton export', () => {
    it('exports singleton instance', () => {
      expect(aiService).toBeInstanceOf(AIService);
    });
  });
});
