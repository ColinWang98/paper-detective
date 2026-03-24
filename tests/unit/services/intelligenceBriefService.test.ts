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
    mockDbHelpers.getCaseSetup.mockResolvedValue({
      paperId: mockPaperId,
      caseTitle: 'The Baseline Dispute',
      caseBackground: 'A paper claim needs verification.',
      coreDispute: 'Whether the contribution is real.',
      openingJudgment: 'Initial evidence is incomplete.',
      investigationGoal: 'Verify the paper using direct text evidence.',
      structureNodes: [],
      tasks: [
        {
          id: 'task-1',
          title: 'Define the Case',
          question: 'What problem does the paper claim to solve?',
          narrativeHook: 'Start with the opening claim.',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: 'completed',
        },
        {
          id: 'task-2',
          title: 'Identify the Real Innovation',
          question: 'What is genuinely new compared with prior work?',
          narrativeHook: 'Separate novelty from framing.',
          linkedStructureKinds: ['related-work', 'method'],
          requiredEvidenceTypes: ['comparison', 'method'],
          minEvidenceCount: 2,
          unlocksTaskIds: [],
          status: 'completed',
        },
        {
          id: 'task-3',
          title: 'Check Whether the Results Hold Up',
          question: 'Do the experiments support the main claim?',
          narrativeHook: 'Follow the evidence into the experiments.',
          linkedStructureKinds: ['experiment', 'result'],
          requiredEvidenceTypes: ['result'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: 'completed',
        },
        {
          id: 'task-4',
          title: 'Find the Weak Point',
          question: 'What limitation or unresolved risk remains?',
          narrativeHook: 'Find the unresolved risk.',
          linkedStructureKinds: ['discussion', 'limitation'],
          requiredEvidenceTypes: ['limitation'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: 'completed',
        },
      ],
      generatedAt: '2026-03-17T00:00:00.000Z',
      model: 'glm-4.7-flash',
      source: 'ai-generated',
    } as any);
    mockDbHelpers.getEvidenceSubmissions.mockResolvedValue([
      {
        paperId: mockPaperId,
        taskId: 'task-1',
        highlightId: 1,
        evidenceType: 'claim',
        note: 'Problem statement evidence.',
        createdAt: '2026-03-17T00:00:00.000Z',
      },
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
      apiKey: 'test-key',
    });

    expect(result.stage).toBe('success');
    expect(result.brief.paperId).toBe(mockPaperId);
    expect(result.brief.completeness.overall).toBeGreaterThan(0);
    expect(mockCacheService.set).toHaveBeenCalled();
    expect(mockTrackCost).toHaveBeenCalled();
  });

  it('references completed investigation tasks in the final report', async () => {
    const result = await intelligenceBriefService.generateBrief({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
      apiKey: 'test-key',
    });

    expect(result.brief.caseFile.title).toContain('The Baseline Dispute');
    expect(result.brief.clipSummary).toContain('Completed Tasks');
    expect(result.brief.clipSummary).toContain('Define the Case');
  });

  it('reflects evidence-backed findings in report sections', async () => {
    const result = await intelligenceBriefService.generateBrief({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
      apiKey: 'test-key',
    });

    expect(result.brief.structuredInfo.limitations).toContain('Problem statement evidence.');
  });

  it('returns cached brief when available', async () => {
    const cachedBrief = makeBrief(mockPaperId);
    mockCacheService.get.mockResolvedValue(cachedBrief);

    const result = await intelligenceBriefService.generateBrief({
      paperId: mockPaperId,
      pdfText: mockPDFText,
      highlights: mockHighlights,
      apiKey: 'test-key',
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
      apiKey: 'test-key',
    });

    expect(mockAiService.generateClipSummary).toHaveBeenCalled();
  });

  it('returns an error stage when API is not configured', async () => {
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
