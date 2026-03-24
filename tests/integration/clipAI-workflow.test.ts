import { act, renderHook } from '@testing-library/react';

import { AIService } from '@/services/aiService';
import { usePaperStore } from '@/lib/store';
import { cacheService } from '@/services/cacheService';
import { dbHelpers } from '@/lib/db';
import type { Highlight, Paper } from '@/types';

jest.mock('@/services/cacheService');
jest.mock('@/lib/db');
jest.mock('@/services/apiKeyManager', () => ({
  hasAPIKey: jest.fn(() => true),
  getAPIKey: jest.fn(() => 'test-bigmodel-key'),
  getProviderForApiKey: jest.fn(() => 'bigmodel'),
  getActiveProviderConfig: jest.fn(() => ({ id: 'bigmodel', model: 'glm-4.7-flash' })),
}));

const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;

const mockPaper: Paper = {
  id: 1,
  title: 'Test Paper on Deep Learning',
  authors: ['John Doe', 'Jane Smith'],
  year: 2024,
  uploadDate: '2026-03-17T00:00:00Z',
  pdfHash: 'test-hash-123',
  fileSize: 1024000,
  fileURL: 'blob:test-url',
  fileName: 'test-paper.pdf',
};

const mockHighlights: Highlight[] = [
  {
    id: 1,
    paperId: 1,
    pageNumber: 1,
    text: 'Deep learning models require millions of labeled examples',
    priority: 'critical',
    color: 'red',
    position: { x: 100, y: 200, width: 300, height: 20 },
    timestamp: '2026-03-17T00:00:00Z',
    createdAt: '2026-03-17T00:00:00Z',
  },
  {
    id: 2,
    paperId: 1,
    pageNumber: 2,
    text: 'Semi-supervised approach combining contrastive learning',
    priority: 'important',
    color: 'yellow',
    position: { x: 100, y: 240, width: 300, height: 20 },
    timestamp: '2026-03-17T00:01:00Z',
    createdAt: '2026-03-17T00:01:00Z',
  },
];

const mockPDFText = 'Deep learning for limited data scenarios with semi-supervised methods.';

function createJsonResponse(content: string) {
  return {
    ok: true,
    body: null,
    json: jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content,
          },
        },
      ],
    }),
  } as any;
}

describe('Clip AI integration workflow', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();

    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);

    mockDbHelpers.getPaper.mockResolvedValue(mockPaper);
    mockDbHelpers.getHighlights.mockResolvedValue(mockHighlights);
    mockDbHelpers.getGroupsWithHighlights.mockResolvedValue([]);
    mockDbHelpers.getClueCards.mockResolvedValue([]);
    mockDbHelpers.getCaseSetup.mockResolvedValue(undefined);
    mockDbHelpers.getEvidenceSubmissions.mockResolvedValue([]);

    global.fetch = jest.fn();

    act(() => {
      usePaperStore.setState({
        currentPaper: null,
        papers: [mockPaper],
        highlights: [],
        groups: [],
        aiClueCards: [],
        caseSetup: null,
        investigationTasks: [],
        evidenceSubmissions: [],
        activeTaskId: null,
        investigationPhase: 'setup',
        error: null,
        isLoading: false,
      });
    });
  });

  it('loads paper and highlights, then generates a clip summary', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse('{"summary":["Context","Method","Result"],"confidence":0.91}')
    );

    const paper = await mockDbHelpers.getPaper(1);
    const highlights = await mockDbHelpers.getHighlights(1);
    const result = await aiService.generateClipSummary({
      paperId: paper!.id!,
      pdfText: mockPDFText,
      highlights,
    });

    expect(paper?.title).toBe('Test Paper on Deep Learning');
    expect(highlights).toHaveLength(2);
    expect(result.summary).toEqual(['Context', 'Method', 'Result']);
    expect(result.confidence).toBe(91);
    expect(result.tokenUsage.total).toBeGreaterThan(0);
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'clip-summary-1',
      result,
      24 * 60 * 60 * 1000
    );
  });

  it('uses cache on repeated clip summary requests', async () => {
    const cachedResult = {
      summary: ['Cached 1', 'Cached 2', 'Cached 3'],
      confidence: 90,
      tokenUsage: { input: 10, output: 10, total: 20 },
      cost: 0.001,
    };
    mockCacheService.get.mockResolvedValue(cachedResult);

    const result = await aiService.generateClipSummary({
      paperId: 1,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result).toEqual(cachedResult);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('extracts structured info and caches it with a longer TTL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse(
        '{"researchQuestion":"How to reduce labeled data needs?","methodology":["Contrastive learning","Self-training"],"findings":["94.5% accuracy","Lower labeling cost"],"conclusions":"Semi-supervised learning is effective.","confidence":0.88}'
      )
    );

    const result = await aiService.extractStructuredInfo({
      paperId: 1,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result.researchQuestion).toContain('reduce labeled data');
    expect(result.methodology).toHaveLength(2);
    expect(result.findings).toHaveLength(2);
    expect(result.confidence).toBe(88);
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'structured-info-1',
      result,
      7 * 24 * 60 * 60 * 1000
    );
  });

  it('streams progress chunks when the response uses SSE', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode('data: {"choices":[{"delta":{"content":"{\\"summary\\":[\\"A\\""}}]}\n\n'),
      encoder.encode('data: {"choices":[{"delta":{"content":",\\"B\\",\\"C\\"],\\"confidence\\":0.9}"}}]}\n\n'),
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
      body,
      json: jest.fn(),
    });

    const result = await aiService.generateClipSummary({
      paperId: 1,
      pdfText: mockPDFText,
      highlights: mockHighlights,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalled();
    expect(result.summary).toEqual(['A', 'B', 'C']);
  });

  it('keeps store state aligned with manually loaded highlights', async () => {
    const { result } = renderHook(() => usePaperStore());

    await act(async () => {
      const highlights = await mockDbHelpers.getHighlights(1);
      usePaperStore.setState({ currentPaper: mockPaper, highlights });
    });

    expect(result.current.currentPaper?.id).toBe(1);
    expect(result.current.highlights).toHaveLength(2);
    expect(result.current.highlights[0].text).toContain('Deep learning models');
  });

  it('surfaces network failures as AI errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(
      aiService.generateClipSummary({
        paperId: 1,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      })
    ).rejects.toThrow('网络');
  });
});
