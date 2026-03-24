import { AIService } from '@/services/aiService';
import { cacheService } from '@/services/cacheService';
import { calculateCost } from '@/services/costTracker';
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
  estimateTokens: jest.fn(() => ({ input: 1500, output: 0, total: 1500 })),
  calculateCost: jest.fn(() => 0.02),
}));

jest.mock('@/services/apiKeyManager', () => ({
  getAPIKey: jest.fn(() => 'test-api-key'),
  hasAPIKey: jest.fn(() => true),
  getProviderForApiKey: jest.fn(() => 'bigmodel'),
  getActiveProviderConfig: jest.fn(() => ({ id: 'bigmodel', model: 'glm-4.7-flash' })),
}));

const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockCalculateCost = calculateCost as jest.MockedFunction<typeof calculateCost>;

const mockPaperId = 1;
const mockPDFText = `
Introduction: This paper studies retrieval quality under constrained compute.
Method: We combine reranking with a lightweight evidence scorer and ablations.
Results: The method improves accuracy and reduces latency across two benchmarks.
Discussion: Gains are strongest on medium-length contexts and weaker on very long inputs.
`.trim();

const mockHighlights: Highlight[] = [
  {
    id: 1,
    paperId: mockPaperId,
    pageNumber: 1,
    text: 'The paper targets retrieval quality under tight compute budgets.',
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
    text: 'A lightweight evidence scorer is combined with reranking.',
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
    text: 'Accuracy improves by 4.2 points while latency drops by 18%.',
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

describe('AIService.extractStructuredInfo', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);
    mockCalculateCost.mockReturnValue(0.02);
    global.fetch = jest.fn();
  });

  it('extracts structured fields and caches them for 7 days', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse(
        '{"researchQuestion":"How can retrieval quality improve under tight compute budgets?","methodology":["Use reranking","Add a lightweight evidence scorer"],"findings":["Accuracy improves by 4.2 points","Latency drops by 18%"],"conclusions":"The approach improves quality with modest overhead across two benchmarks.","confidence":0.92}'
      )
    );

    const result = await aiService.extractStructuredInfo({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result).toMatchObject({
      researchQuestion: 'How can retrieval quality improve under tight compute budgets?',
      methodology: ['Use reranking', 'Add a lightweight evidence scorer'],
      findings: ['Accuracy improves by 4.2 points', 'Latency drops by 18%'],
      conclusions: 'The approach improves quality with modest overhead across two benchmarks.',
      confidence: 92,
    });
    expect(result.tokenUsage.total).toBeGreaterThan(0);
    expect(result.cost).toBeCloseTo(0.02, 4);
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'structured-info-1',
      result,
      7 * 24 * 60 * 60 * 1000
    );
  });

  it('returns cached structured info without calling fetch', async () => {
    const cachedResult = {
      researchQuestion: 'cached question',
      methodology: ['cached method'],
      findings: ['cached finding'],
      conclusions: 'cached conclusion',
      confidence: 85,
      tokenUsage: { input: 100, output: 50, total: 150 },
      cost: 0.001,
    };
    mockCacheService.get.mockResolvedValue(cachedResult);

    const result = await aiService.extractStructuredInfo({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result).toEqual(cachedResult);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('builds a prompt that truncates long text and includes prioritized highlights', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse(
        '{"researchQuestion":"Q","methodology":["M1"],"findings":["F1"],"conclusions":"C","confidence":0.9}'
      )
    );

    await aiService.extractStructuredInfo({
      paperId: mockPaperId,
      pdfText: 'A'.repeat(7000),
      highlights: mockHighlights,
    });

    const request = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const prompt = request.messages[0].content as string;

    expect(prompt).toContain('[文本已截断');
    expect(prompt).toContain('[critical]');
    expect(prompt).toContain('[important]');
    expect(prompt).toContain('[interesting]');
    expect(prompt).toContain('researchQuestion');
    expect(request.max_tokens).toBe(2000);
    expect(request.stream).toBe(true);
  });

  it('streams progress chunks when response.body is present', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode('data: {"choices":[{"delta":{"content":"{\\"researchQuestion\\":\\"Q\\","}}]}\n\n'),
      encoder.encode('data: {"choices":[{"delta":{"content":"\\"methodology\\":[\\"M1\\"],\\"findings\\":[\\"F1\\"],\\"conclusions\\":\\"C\\",\\"confidence\\":0.88}"}}]}\n\n'),
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

    const result = await aiService.extractStructuredInfo({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalled();
    expect(result.researchQuestion).toBe('Q');
    expect(result.confidence).toBe(88);
  });

  it('parses markdown-wrapped JSON responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse(
        '```json\n{"researchQuestion":"Q","methodology":["M1"],"findings":["F1"],"conclusions":"C","confidence":0.88}\n```'
      )
    );

    const result = await aiService.extractStructuredInfo({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result.researchQuestion).toBe('Q');
    expect(result.methodology).toEqual(['M1']);
    expect(result.findings).toEqual(['F1']);
    expect(result.conclusions).toBe('C');
    expect(result.confidence).toBe(88);
  });

  it('throws a parse error when required fields are missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse('{"researchQuestion":"Q","methodology":["M1"]}')
    );

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

  it('uses default confidence when the model omits it', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse(
        '{"researchQuestion":"Q","methodology":["M1"],"findings":["F1"],"conclusions":"C"}'
      )
    );

    const result = await aiService.extractStructuredInfo({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result.confidence).toBe(85);
  });

  it('maps HTTP and network failures to AI error codes', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createJsonResponse('bad key', false, 401))
      .mockResolvedValueOnce(createJsonResponse('slow down', false, 429))
      .mockRejectedValueOnce(new Error('network timeout'));

    await expect(
      aiService.extractStructuredInfo({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      })
    ).rejects.toMatchObject({ code: 'INVALID_API_KEY' });

    await expect(
      aiService.extractStructuredInfo({
        paperId: mockPaperId + 1,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      })
    ).rejects.toMatchObject({ code: 'RATE_LIMIT' });

    await expect(
      aiService.extractStructuredInfo({
        paperId: mockPaperId + 2,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      })
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('uses a structured-info cache key distinct from clip summary', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse(
        '{"researchQuestion":"Q","methodology":["M1"],"findings":["F1"],"conclusions":"C","confidence":0.9}'
      )
    );

    await aiService.extractStructuredInfo({
      paperId: 42,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(mockCacheService.get).toHaveBeenCalledWith('structured-info-42');
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'structured-info-42',
      expect.any(Object),
      7 * 24 * 60 * 60 * 1000
    );
  });
});
