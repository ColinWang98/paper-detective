import { dbHelpers } from '@/lib/db';
import { aiService } from '@/services/aiService';
import { cacheService } from '@/services/cacheService';
import { trackCost } from '@/services/costTracker';
import {
  IntelligenceBriefService,
  intelligenceBriefService,
  type IntelligenceBrief,
} from '@/services/intelligenceBriefService';
import type { Highlight } from '@/types';

jest.mock('@/services/aiService');
jest.mock('@/services/cacheService');
jest.mock('@/lib/db');
jest.mock('@/services/costTracker');

const mockAiService = aiService as jest.Mocked<typeof aiService>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;
const mockTrackCost = trackCost as jest.MockedFunction<typeof trackCost>;

function makeBrief(paperId: number): IntelligenceBrief {
  return {
    paperId,
    caseFile: {
      caseNumber: 142,
      title: 'Case File #142',
      researchQuestion: 'Test question',
      coreMethod: 'Test method',
      keyFindings: ['Test finding'],
      completenessScore: 85,
    },
    clipSummary: 'Test summary',
    structuredInfo: {
      researchQuestion: 'Test question',
      methods: ['Test method'],
      findings: ['Test finding'],
      limitations: [],
      confidence: { question: 90, methods: 90, findings: 90, limitations: 0 },
    },
    clueCards: [],
    userHighlights: {
      total: 1,
      byPriority: { critical: 1 },
      topHighlights: [],
    },
    tokenUsage: { input: 1000, output: 500, total: 1500 },
    cost: 0.01,
    duration: 1000,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-5-20250514',
    completeness: {
      clipSummary: true,
      structuredInfo: true,
      clueCards: true,
      userHighlights: true,
      overall: 85,
    },
  };
}

describe('IntelligenceBriefService', () => {
  let consoleErrorSpy: jest.SpyInstance;
  const mockPaperId = 1;
  const mockPDFText = 'This is a sample academic paper about machine learning transformers...';
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
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockAiService.isConfigured.mockReturnValue(true);
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);
    mockTrackCost.mockReturnValue(0.01);
    mockDbHelpers.getAllPapers.mockResolvedValue([
      { id: 1, title: 'Paper 1', authors: [], year: 2024, fileURL: '', fileName: '', uploadDate: '' },
    ] as any);

    mockAiService.generateClipSummary.mockResolvedValue({
      summary: [
        'Transformers revolutionized NLP.',
        'Self-attention enables parallel computation.',
        'The model achieved state-of-the-art results.',
      ],
      confidence: 95,
      tokenUsage: { input: 3000, output: 300, total: 3300 },
      cost: 0.015,
    } as any);

    mockAiService.extractStructuredInfo.mockResolvedValue({
      researchQuestion: 'How can attention mechanisms improve translation?',
      methodology: ['Self-attention', 'Encoder-decoder'],
      findings: ['Strong benchmark performance'],
      conclusions: 'Transformers outperform older sequence models.',
      confidence: 92,
      tokenUsage: { input: 5000, output: 800, total: 5800 },
      cost: 0.025,
    } as any);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('exports a singleton instance', () => {
    expect(intelligenceBriefService).toBeInstanceOf(IntelligenceBriefService);
  });

  it('generates a brief successfully', async () => {
    const result = await intelligenceBriefService.generateBrief({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result.stage).toBe('success');
    expect(result.brief.paperId).toBe(mockPaperId);
    expect(result.brief.completeness.overall).toBeGreaterThan(0);
    expect(mockCacheService.set).toHaveBeenCalled();
    expect(mockTrackCost).toHaveBeenCalled();
  });

  it('returns cached brief when available', async () => {
    const cachedBrief = makeBrief(mockPaperId);
    mockCacheService.get.mockResolvedValue(cachedBrief);

    const result = await intelligenceBriefService.generateBrief({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result.stage).toBe('success');
    expect(result.brief).toEqual(cachedBrief);
    expect(mockAiService.generateClipSummary).not.toHaveBeenCalled();
  });

  it('bypasses cache when forceRegenerate is true', async () => {
    mockCacheService.get.mockResolvedValue(makeBrief(mockPaperId));

    await intelligenceBriefService.generateBrief({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
      forceRegenerate: true,
    });

    expect(mockAiService.generateClipSummary).toHaveBeenCalled();
  });

  it('returns an error stage when API is not configured', async () => {
    mockAiService.isConfigured.mockReturnValue(false);

    const result = await intelligenceBriefService.generateBrief({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
    });

    expect(result.stage).toBe('error');
    expect(result.error).toBeDefined();
    expect(result.brief.completeness.overall).toBeGreaterThanOrEqual(0);
  });
});
