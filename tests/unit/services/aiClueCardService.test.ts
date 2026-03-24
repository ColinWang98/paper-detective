import { AIClueCardService, aiClueCardService } from '@/services/aiClueCardService';
import { aiService } from '@/services/aiService';
import { dbHelpers } from '@/lib/db';
import { cacheService } from '@/services/cacheService';
import type { Highlight } from '@/types';
import type { AIClueCard } from '@/types/ai.types';

jest.mock('@/services/aiService');
jest.mock('@/lib/db');
jest.mock('@/services/cacheService');

const mockAIService = aiService as jest.Mocked<typeof aiService>;
const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

const mockPaperId = 1;
const mockPDFText = 'This is a sample academic paper about machine learning.';
const mockHighlights: Highlight[] = [
  {
    id: 1,
    paperId: 1,
    pageNumber: 1,
    text: 'Novel deep learning approach for image classification',
    priority: 'critical',
    color: 'red',
    position: { x: 100, y: 200, width: 300, height: 20 },
    timestamp: '2026-02-10T10:00:00Z',
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 2,
    paperId: 1,
    pageNumber: 2,
    text: 'Achieved 95% accuracy on test dataset',
    priority: 'important',
    color: 'yellow',
    position: { x: 100, y: 200, width: 300, height: 20 },
    timestamp: '2026-02-10T10:01:00Z',
    createdAt: '2026-02-10T10:01:00Z',
  },
];

const mockGeneratedCards = [
  {
    type: 'question',
    title: 'Research Problem',
    content: 'How to improve image classification accuracy?',
    confidence: 95,
    pageNumber: 1,
  },
  {
    type: 'method',
    title: 'CNN Architecture',
    content: 'Novel convolutional neural network with attention mechanism.',
    confidence: 90,
    pageNumber: 2,
  },
];

describe('AIClueCardService', () => {
  let service: AIClueCardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AIClueCardService();

    mockAIService.isConfigured.mockReturnValue(true);
    mockAIService.generateText.mockResolvedValue(JSON.stringify(mockGeneratedCards));

    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);

    mockDbHelpers.addClueCard.mockImplementation(async (card) => {
      const baseCard = card as Omit<AIClueCard, 'id'>;
      return baseCard.type === 'question' ? 1 : 2;
    });
    mockDbHelpers.getClueCards.mockResolvedValue([]);
    mockDbHelpers.updateClueCard.mockResolvedValue(1);
    mockDbHelpers.deleteClueCard.mockResolvedValue(undefined);
    mockDbHelpers.deleteClueCardsByPaper.mockResolvedValue(undefined);
  });

  describe('generateClueCards', () => {
    it('generates, persists, and summarizes clue cards', async () => {
      const onProgress = jest.fn();
      const onCardGenerated = jest.fn();

      const result = await service.generateClueCards({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
        onProgress,
        onCardGenerated,
      });

      expect(mockAIService.generateText).toHaveBeenCalled();
      expect(mockDbHelpers.addClueCard).toHaveBeenCalledTimes(2);
      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].id).toBe(1);
      expect(result.cards[0].source).toBe('ai-generated');
      expect(result.summary.total).toBe(2);
      expect(result.summary.byType.question).toBe(1);
      expect(result.summary.byType.method).toBe(1);
      expect(result.cost).toBeGreaterThanOrEqual(0);
      expect(result.tokenUsage.total).toBeGreaterThan(0);
      expect(onCardGenerated).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenCalledWith('完成！', 100);
    });

    it('returns cached results without calling AI again', async () => {
      const cachedResult = {
        cards: [],
        summary: {
          total: 0,
          byType: { question: 0, method: 0, finding: 0, limitation: 0 },
          avgConfidence: 0,
        },
        tokenUsage: { input: 1, output: 1, total: 2 },
        cost: 0.001,
        duration: 5,
      };
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.generateClueCards({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
      });

      expect(result).toEqual(cachedResult);
      expect(mockAIService.generateText).not.toHaveBeenCalled();
      expect(mockDbHelpers.addClueCard).not.toHaveBeenCalled();
    });

    it('throws when the API key is missing', async () => {
      mockAIService.isConfigured.mockReturnValue(false);

      await expect(
        service.generateClueCards({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toThrow('API Key');
    });

    it('passes only the selected card types into the cache key and prompt', async () => {
      await service.generateClueCards({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
        cardTypes: ['question'],
      });

      expect(mockCacheService.get).toHaveBeenCalledWith('clue-cards-1-question');
      expect(mockAIService.generateText.mock.calls[0][0].prompt).toContain('question');
    });

    it('wraps downstream errors with service-specific context', async () => {
      mockAIService.generateText.mockRejectedValue(new Error('API Error'));

      await expect(
        service.generateClueCards({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        })
      ).rejects.toThrow('AI线索卡片生成失败');
    });
  });

  it('filters and sorts stored clue cards', async () => {
    const cards: AIClueCard[] = [
      {
        id: 1,
        paperId: 1,
        type: 'finding',
        source: 'ai-generated',
        title: 'Accuracy',
        content: 'Achieved high accuracy',
        confidence: 92,
        pageNumber: 3,
        isExpanded: false,
        createdAt: '2026-02-10T10:00:00Z',
      },
      {
        id: 2,
        paperId: 1,
        type: 'question',
        source: 'clip-summary',
        title: 'Problem',
        content: 'What is the core problem?',
        confidence: 80,
        pageNumber: 1,
        isExpanded: false,
        createdAt: '2026-02-09T10:00:00Z',
      },
    ];
    mockDbHelpers.getClueCards.mockResolvedValue(cards);

    const filtered = await service.getClueCardsFiltered(1, {
      types: ['finding'],
      minConfidence: 90,
      pageNumbers: [3],
      searchQuery: 'accuracy',
    });
    const sorted = service.sortClueCards(cards, 'page');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
    expect(sorted.map((card) => card.id)).toEqual([2, 1]);
  });

  it('computes stats from stored clue cards', async () => {
    const cards: AIClueCard[] = [
      {
        id: 1,
        paperId: 1,
        type: 'question',
        source: 'ai-generated',
        title: 'Problem',
        content: 'Problem content',
        confidence: 80,
        pageNumber: 1,
        isExpanded: false,
        createdAt: '2026-02-10T10:00:00Z',
      },
      {
        id: 2,
        paperId: 1,
        type: 'finding',
        source: 'clip-summary',
        title: 'Finding',
        content: 'Finding content',
        confidence: 100,
        pageNumber: 2,
        isExpanded: false,
        createdAt: '2026-02-10T11:00:00Z',
      },
    ];
    mockDbHelpers.getClueCards.mockResolvedValue(cards);

    const stats = await service.getClueCardsStats(1);

    expect(stats.total).toBe(2);
    expect(stats.byType.question).toBe(1);
    expect(stats.byType.finding).toBe(1);
    expect(stats.bySource['ai-generated']).toBe(1);
    expect(stats.bySource['clip-summary']).toBe(1);
    expect(stats.avgConfidence).toBe(90);
  });

  it('creates derived cards from clip summary and structured info', async () => {
    mockDbHelpers.addClueCard
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(8);

    const clipCards = await service.generateCardsFromClipSummary(
      1,
      ['Context sentence', 'Method sentence', 'Finding sentence'],
      88
    );

    const structuredCards = await service.generateCardsFromStructuredInfo(
      1,
      {
        researchQuestion: 'How to improve NLP performance?',
        methodology: ['Method 1', 'Method 2'],
        findings: ['Finding 1', 'Finding 2'],
        conclusions: 'Conclusion',
      },
      90
    );

    expect(clipCards).toHaveLength(3);
    expect(clipCards.map((card) => card.type)).toEqual(['question', 'method', 'finding']);
    expect(structuredCards.some((card) => card.type === 'limitation')).toBe(true);
    expect(mockDbHelpers.addClueCard).toHaveBeenCalled();
  });

  it('exports a reusable singleton instance', () => {
    const { aiClueCardService: aiClueCardServiceAgain } = require('@/services/aiClueCardService');

    expect(aiClueCardService).toBeInstanceOf(AIClueCardService);
    expect(aiClueCardServiceAgain).toBeDefined();
    expect(typeof aiClueCardServiceAgain.generateClueCards).toBe('function');
  });
});
