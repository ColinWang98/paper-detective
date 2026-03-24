import { AIService } from '@/services/aiService';
import { cacheService } from '@/services/cacheService';
import { calculateCost, estimateTokens } from '@/services/costTracker';
import type { Highlight } from '@/types';

jest.mock('@/services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    getAnalysis: jest.fn(),
    saveAnalysis: jest.fn(),
  },
}));

jest.mock('@/services/costTracker', () => ({
  estimateTokens: jest.fn(() => ({ input: 1000, output: 0, total: 1000 })),
  calculateCost: jest.fn(() => 0.01),
}));

jest.mock('@/services/apiKeyManager', () => ({
  getAPIKey: jest.fn(() => 'test-api-key'),
  hasAPIKey: jest.fn(() => true),
  getProviderForApiKey: jest.fn(() => 'bigmodel'),
  getActiveProviderConfig: jest.fn(() => ({ id: 'bigmodel', model: 'glm-4.7-flash' })),
}));

const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockEstimateTokens = estimateTokens as jest.MockedFunction<typeof estimateTokens>;
const mockCalculateCost = calculateCost as jest.MockedFunction<typeof calculateCost>;

const mockPaperId = 1;
const mockPDFText = 'This is a test PDF paper about machine learning.';
const mockHighlights: Highlight[] = [
  {
    id: 1,
    paperId: mockPaperId,
    pageNumber: 1,
    text: 'Deep learning models achieve state-of-the-art performance',
    priority: 'critical',
    color: 'red',
    position: { x: 100, y: 200, width: 300, height: 20 },
    timestamp: '2026-03-17T00:00:00Z',
    createdAt: '2026-03-17T00:00:00Z',
  },
  {
    id: 2,
    paperId: mockPaperId,
    pageNumber: 2,
    text: 'We propose a novel architecture for text classification',
    priority: 'important',
    color: 'yellow',
    position: { x: 100, y: 250, width: 300, height: 20 },
    timestamp: '2026-03-17T00:01:00Z',
    createdAt: '2026-03-17T00:01:00Z',
  },
  {
    id: 3,
    paperId: mockPaperId,
    pageNumber: 3,
    text: 'Experimental results show 95% accuracy',
    priority: 'interesting',
    color: 'orange',
    position: { x: 100, y: 300, width: 300, height: 20 },
    timestamp: '2026-03-17T00:02:00Z',
    createdAt: '2026-03-17T00:02:00Z',
  },
];

function createJsonResponse(content: string, ok = true, status = 200) {
  return {
    ok,
    status,
    body: null,
    json: jest.fn().mockResolvedValue(
      ok
        ? {
            choices: [
              {
                message: {
                  content,
                },
              },
            ],
          }
        : { message: content }
    ),
  } as any;
}

describe('AIService.generateClipSummary', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);
    mockEstimateTokens.mockReturnValue({ input: 1000, output: 0, total: 1000 });
    mockCalculateCost.mockReturnValue(0.01);
    global.fetch = jest.fn();
  });

  it('generates a 3-sentence summary and caches it for 24 hours', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse('{"summary":["Background","Method","Finding"],"confidence":0.95}')
    );

    const result = await aiService.generateClipSummary({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result.summary).toEqual(['Background', 'Method', 'Finding']);
    expect(result.confidence).toBe(95);
    expect(result.tokenUsage.total).toBeGreaterThan(0);
    expect(result.cost).toBeCloseTo(0.01, 4);
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'clip-summary-1',
      result,
      24 * 60 * 60 * 1000
    );
  });

  it('returns cached result without calling fetch', async () => {
    const cachedResult = {
      summary: ['cached1', 'cached2', 'cached3'],
      confidence: 85,
      tokenUsage: { input: 100, output: 50, total: 150 },
      cost: 0.001,
    };
    mockCacheService.get.mockResolvedValue(cachedResult);

    const result = await aiService.generateClipSummary({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result).toEqual(cachedResult);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('builds a prompt that truncates long text and includes prioritized highlights', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse('{"summary":["A","B","C"],"confidence":0.9}')
    );

    await aiService.generateClipSummary({
      paperId: mockPaperId,
      pdfText: 'A'.repeat(5000),
      highlights: mockHighlights,
    });

    const request = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const prompt = request.messages[0].content as string;

    expect(prompt).toContain('[文本已截断');
    expect(prompt).toContain('[critical]');
    expect(prompt).toContain('[important]');
    expect(prompt).toContain('[interesting]');
    expect(prompt).toContain('summary');
    expect(request.model).toBeDefined();
    expect(request.max_tokens).toBe(500);
    expect(request.stream).toBe(true);
  });

  it('streams progress chunks when response.body is present', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode('data: {"choices":[{"delta":{"content":"{\\"summary\\":[\\"A\\""}}]}\n\n'),
      encoder.encode('data: {"choices":[{"delta":{"content":",\\"B\\",\\"C\\"],\\"confidence\\":0.88}"}}]}\n\n'),
      encoder.encode('data: [DONE]\n\n'),
    ];
    const body = {
      getReader() {
        let index = 0;
        return {
          read: jest.fn().mockImplementation(async () => {
            if (index >= chunks.length) {
              return { done: true, value: undefined };
            }

            return { done: false, value: chunks[index++] };
          }),
        };
      },
    };
    const onProgress = jest.fn();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      body,
      json: jest.fn(),
    });

    const result = await aiService.generateClipSummary({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalled();
    expect(result.summary).toEqual(['A', 'B', 'C']);
    expect(result.confidence).toBe(88);
  });

  it('parses markdown-wrapped JSON responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse('```json\n{"summary":["s1","s2","s3"],"confidence":0.88}\n```')
    );

    const result = await aiService.generateClipSummary({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result.summary).toEqual(['s1', 's2', 's3']);
    expect(result.confidence).toBe(88);
  });

  it('throws a parse error when summary does not contain exactly 3 sentences', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse('{"summary":["only one"],"confidence":0.9}')
    );

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

  it('maps HTTP errors to AI error codes', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createJsonResponse('bad key', false, 401))
      .mockResolvedValueOnce(createJsonResponse('slow down', false, 429));

    await expect(
      aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      })
    ).rejects.toMatchObject({ code: 'INVALID_API_KEY' });

    await expect(
      aiService.generateClipSummary({
        paperId: mockPaperId + 1,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      })
    ).rejects.toMatchObject({ code: 'RATE_LIMIT' });
  });

  it('maps rejected fetch calls to network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network failure'));

    await expect(
      aiService.generateClipSummary({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      })
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('uses different cache keys for different papers', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse('{"summary":["A","B","C"],"confidence":0.9}')
    );

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

    expect(mockCacheService.get).toHaveBeenCalledWith('clip-summary-1');
    expect(mockCacheService.get).toHaveBeenCalledWith('clip-summary-2');
  });
});
