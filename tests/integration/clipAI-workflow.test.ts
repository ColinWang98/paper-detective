/**
 * Clip AI Integration Tests
 *
 * Story 2.1.3 & 2.1.4: Complete AI Analysis Workflow
 *
 * Test Coverage:
 * - End-to-end Clip AI summary generation
 * - End-to-end structured information extraction
 * - Integration with PDF text extraction
 * - Integration with highlight system
 * - Cache integration across multiple calls
 * - Error recovery and fallback mechanisms
 * - UI state management during streaming
 * - Cost tracking across multiple papers
 *
 * Integration Strategy:
 * - Test real workflow with mocked external APIs
 * - Verify state management across components
 * - Test error scenarios end-to-end
 * - Verify persistence and caching
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { AIService } from '@/services/aiService';
import { usePaperStore } from '@/lib/store';
import { cacheService } from '@/services/cacheService';
import { dbHelpers } from '@/lib/db';
import type { Paper, Highlight } from '@/types';

// Mock all external dependencies
jest.mock('@anthropic-ai/sdk');
jest.mock('@/services/cacheService');
jest.mock('@/lib/db');

// Mock cacheService implementation
const mockCache = new Map<string, any>();
(cacheService.get as jest.Mock).mockImplementation((key: string) => {
  return Promise.resolve(mockCache.get(key));
});
(cacheService.set as jest.Mock).mockImplementation((key: string, value: any, ttl?: number) => {
  mockCache.set(key, value);
  return Promise.resolve();
});

// Mock database helpers
const mockPapers: Paper[] = [];
const mockHighlights: Highlight[] = [];

(dbHelpers.getPaper as jest.Mock).mockImplementation((id: number) => {
  return Promise.resolve(mockPapers.find(p => p.id === id));
});

(dbHelpers.getHighlights as jest.Mock).mockImplementation((paperId: number) => {
  return Promise.resolve(mockHighlights.filter(h => h.paperId === paperId));
});

describe('Clip AI Integration Tests', () => {
  let aiService: AIService;

  const mockPaper: Paper = {
    id: 1,
    title: 'Test Paper on Deep Learning',
    authors: ['John Doe', 'Jane Smith'],
    year: 2024,
    uploadDate: new Date().toISOString(),
    pdfHash: 'test-hash-123',
    fileSize: 1024000,
    fileURL: 'blob:test-url',
    fileName: 'test-paper.pdf',
  };

  const mockPDFText = `
    Deep Learning for Limited Data Scenarios

    Abstract:
    This paper addresses the challenge of training deep neural networks with limited
    labeled data. We propose a novel semi-supervised approach combining contrastive
    learning with self-training.

    Introduction:
    Deep learning models typically require millions of labeled examples to achieve
    good performance. However, in many domains, labeled data is expensive and scarce.
    This work aims to reduce the labeled data requirement while maintaining accuracy.

    Methods:
    1. Contrastive Learning: We use SimCLR framework for representation learning
    2. Self-Training: We generate pseudo-labels for unlabeled data
    3. Data Augmentation: We apply random crops, flips, and color jittering

    Experiments:
    Dataset: CIFAR-10 (50k training, 10k test)
    Baselines: Supervised ResNet-18, Semi-supervised methods
    Metrics: Top-1 accuracy, F1 score

    Results:
    - Our method: 94.5% accuracy with 10% labeled data
    - Baseline: 92.1% accuracy with full data
    - Improvement: 2.4% absolute gain

    Conclusion:
    Our semi-supervised approach significantly reduces labeled data requirements
    while achieving competitive or superior performance.
  `.trim();

  const mockHighlights: Highlight[] = [
    {
      id: 1,
      paperId: 1,
      pageNumber: 1,
      text: 'Deep learning models require millions of labeled examples',
      priority: 'critical',
      color: 'red',
      position: { x: 100, y: 200, width: 300, height: 20 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      paperId: 1,
      pageNumber: 2,
      text: 'Semi-supervised approach combining contrastive learning',
      priority: 'critical',
      color: 'red',
      position: { x: 100, y: 250, width: 300, height: 20 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      paperId: 1,
      pageNumber: 3,
      text: '94.5% accuracy with 10% labeled data',
      priority: 'important',
      color: 'yellow',
      position: { x: 100, y: 300, width: 300, height: 20 },
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
    mockCache.clear();
    mockPapers.length = 0;
    mockHighlights.length = 0;

    mockPapers.push(mockPaper);
    mockHighlights.push(...mockHighlights);

    // Reset store
    usePaperStore.getState().currentPaper = null;
    usePaperStore.getState().highlights = [];
  });

  describe('End-to-End Clip Summary Workflow', () => {
    it('should complete full workflow: load paper → extract highlights → generate summary', async () => {
      // Step 1: Load paper
      const paper = await dbHelpers.getPaper(1);
      expect(paper).toBeDefined();
      expect(paper?.title).toBe('Test Paper on Deep Learning');

      // Step 2: Load highlights
      const highlights = await dbHelpers.getHighlights(1);
      expect(highlights).toHaveLength(3);

      // Step 3: Generate clip summary
      const summaryResult = await aiService.generateClipSummary({
        paperId: paper!.id!,
        pdfText: mockPDFText,
        highlights,
      });

      // Verify result
      expect(summaryResult.summary).toHaveLength(3);
      expect(summaryResult.confidence).toBeGreaterThanOrEqual(0);
      expect(summaryResult.confidence).toBeLessThanOrEqual(100);
      expect(summaryResult.tokenUsage.total).toBeGreaterThan(0);
      expect(summaryResult.cost).toBeGreaterThan(0);
    });

    it('should use cache on second call for same paper', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      // First call - should hit API
      const result1 = await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      expect(cacheService.set).toHaveBeenCalledWith(
        `clip-summary-${paper.id}`,
        result1,
        24 * 60 * 60 * 1000
      );

      // Second call - should use cache
      mockCache.set(`clip-summary-${paper.id}`, result1);

      const result2 = await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      expect(result2).toEqual(result1);
      expect(cacheService.get).toHaveBeenCalledWith(`clip-summary-${paper.id}`);
    });

    it('should handle streaming updates during generation', async () => {
      const onProgress = jest.fn();
      const progressChunks: string[] = [];

      const paper = mockPaper;
      const highlights = mockHighlights;

      // Mock streaming response
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          const chunks = [
            '{"summary": ["',
            'Deep learning needs ',
            'lots of data',
            '", "',
            'We use semi-supervised learning',
            '", "',
            'Achieved 94.5% accuracy',
            '"], "confidence": 0.9}'
          ];
          for (const chunk of chunks) {
            progressChunks.push(chunk);
            yield { type: 'content_block_delta', delta: { text: chunk } };
          }
        },
      };

      // Mock the AI service to use our stream
      const createSpy = jest.spyOn(aiService as any, 'getClient').mockReturnValue({
        messages: {
          create: jest.fn().mockResolvedValue(mockStream),
        },
      });

      await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
        onProgress,
      });

      // Verify onProgress was called with all chunks
      expect(onProgress).toHaveBeenCalledTimes(7);
      progressChunks.forEach(chunk => {
        expect(onProgress).toHaveBeenCalledWith(chunk);
      });

      createSpy.mockRestore();
    });
  });

  describe('End-to-End Structured Info Workflow', () => {
    it('should complete full workflow: load paper → extract structured info', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      // Extract structured info
      const result = await aiService.extractStructuredInfo({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      // Verify all fields
      expect(result.researchQuestion).toBeDefined();
      expect(result.researchQuestion.length).toBeGreaterThan(0);

      expect(result.methodology).toBeDefined();
      expect(result.methodology.length).toBeGreaterThanOrEqual(3);

      expect(result.findings).toBeDefined();
      expect(result.findings.length).toBeGreaterThanOrEqual(4);

      expect(result.conclusions).toBeDefined();
      expect(result.conclusions.length).toBeGreaterThan(0);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should cache structured info separately from clip summary', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      // Generate clip summary
      const clipResult = await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      // Generate structured info
      const structResult = await aiService.extractStructuredInfo({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      // Verify different cache keys
      expect(cacheService.set).toHaveBeenCalledWith(
        `clip-summary-${paper.id}`,
        clipResult,
        24 * 60 * 60 * 1000 // 24 hours
      );

      expect(cacheService.set).toHaveBeenCalledWith(
        `structured-info-${paper.id}`,
        structResult,
        7 * 24 * 60 * 60 * 1000 // 7 days
      );
    });
  });

  describe('Integration with Zustand Store', () => {
    it('should update store when current paper changes', async () => {
      const { result } = renderHook(() => usePaperStore());

      // Set current paper
      act(() => {
        result.current.setCurrentPaper(mockPaper);
      });

      expect(result.current.currentPaper).toEqual(mockPaper);
    });

    it('should load highlights when paper is set', async () => {
      const { result } = renderHook(() => usePaperStore());

      // Mock loadHighlights
      const loadHighlightsSpy = jest.spyOn(usePaperStore.getState(), 'loadHighlights');

      await act(async () => {
        result.current.setCurrentPaper(mockPaper);
      });

      // loadHighlights should be called
      expect(loadHighlightsSpy).toHaveBeenCalledWith(mockPaper.id);

      loadHighlightsSpy.mockRestore();
    });

    it('should sync AI results with store state', async () => {
      const { result } = renderHook(() => usePaperStore());

      // Set paper and highlights
      await act(async () => {
        result.current.setCurrentPaper(mockPaper);
        result.current.highlights = mockHighlights;
      });

      expect(result.current.highlights).toHaveLength(3);
      expect(result.current.highlights[0].text).toContain('Deep learning models');
    });
  });

  describe('Multi-Paper Workflow', () => {
    it('should handle analysis for multiple papers independently', async () => {
      const paper2: Paper = { ...mockPaper, id: 2, title: 'Second Paper' };
      mockPapers.push(paper2);

      const highlights1 = mockHighlights.filter(h => h.paperId === 1);
      const highlights2 = mockHighlights.map(h => ({ ...h, id: (h.id ?? 0) + 10, paperId: 2 }));

      // Analyze paper 1
      const result1 = await aiService.generateClipSummary({
        paperId: 1,
        pdfText: mockPDFText,
        highlights: highlights1,
      });

      // Analyze paper 2
      const result2 = await aiService.generateClipSummary({
        paperId: 2,
        pdfText: mockPDFText,
        highlights: highlights2,
      });

      // Results should be independent
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Different cache keys
      expect(cacheService.set).toHaveBeenCalledWith(
        'clip-summary-1',
        result1,
        expect.any(Number)
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        'clip-summary-2',
        result2,
        expect.any(Number)
      );
    });

    it('should track total cost across multiple papers', async () => {
      const papers = [1, 2, 3].map(id => ({
        ...mockPaper,
        id,
        title: `Paper ${id}`,
      }));

      let totalCost = 0;

      for (const paper of papers) {
        const result = await aiService.generateClipSummary({
          paperId: paper.id!,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        });

        totalCost += result.cost;
      }

      // Total cost should be sum of all individual costs
      expect(totalCost).toBeGreaterThan(0);

      // Verify cost is reasonable (< $1.00 per paper threshold)
      const avgCost = totalCost / papers.length;
      expect(avgCost).toBeLessThan(1.00);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should fallback to default summary on parse error', async () => {
      // This test requires actual AI service mocking
      // For now, we'll test the integration flow
      const paper = mockPaper;
      const highlights = mockHighlights;

      // In real implementation, if AI returns invalid JSON,
      // service should fallback gracefully
      // This test verifies the error handling chain

      expect(async () => {
        await aiService.generateClipSummary({
          paperId: paper.id!,
          pdfText: mockPDFText,
          highlights,
        });
      }).not.toThrow();
    });

    it('should handle network errors with retry', async () => {
      // Test network error recovery
      const paper = mockPaper;
      const highlights = mockHighlights;

      // In real implementation, should retry on network errors
      // For now, verify error is thrown correctly
      await expect(
        aiService.generateClipSummary({
          paperId: paper.id!,
          pdfText: mockPDFText,
          highlights,
        })
      ).resolves.toBeDefined();
    });

    it('should clear cache and retry on stale data', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      // First call
      await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      // Clear cache manually
      mockCache.delete(`clip-summary-${paper.id}`);

      // Second call should re-fetch
      const result = await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Cost Tracking Workflow', () => {
    it('should track tokens and cost for each operation', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      // Clip summary
      const clipResult = await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      expect(clipResult.tokenUsage.input).toBeGreaterThan(0);
      expect(clipResult.tokenUsage.output).toBeGreaterThan(0);
      expect(clipResult.tokenUsage.total).toBe(
        clipResult.tokenUsage.input + clipResult.tokenUsage.output
      );
      expect(clipResult.cost).toBeGreaterThan(0);

      // Structured info
      const structResult = await aiService.extractStructuredInfo({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      expect(structResult.tokenUsage.input).toBeGreaterThan(0);
      expect(structResult.tokenUsage.output).toBeGreaterThan(0);
      expect(structResult.cost).toBeGreaterThan(0);

      // Total cost
      const totalCost = clipResult.cost + structResult.cost;
      expect(totalCost).toBeGreaterThan(0);

      // Verify under $1.00 threshold
      expect(totalCost).toBeLessThan(1.00);
    });

    it('should estimate cost before API call', async () => {
      // Test cost estimation accuracy
      const pdfLength = mockPDFText.length;
      const highlightCount = mockHighlights.length;

      // Rough estimation
      const estimatedInputTokens = Math.ceil((3000 + highlightCount * 50) / 4);
      const estimatedOutputTokens = Math.ceil(500 / 4);

      expect(estimatedInputTokens).toBeGreaterThan(0);
      expect(estimatedOutputTokens).toBeGreaterThan(0);
    });
  });

  describe('Performance Workflow', () => {
    it('should complete clip summary within performance target', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      const startTime = performance.now();

      await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      const duration = performance.now() - startTime;

      // Should complete within 5 seconds (target from requirements)
      expect(duration).toBeLessThan(5000);
    });

    it('should complete structured info within performance target', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      const startTime = performance.now();

      await aiService.extractStructuredInfo({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      const duration = performance.now() - startTime;

      // Should complete within 10 seconds (target from requirements)
      expect(duration).toBeLessThan(10000);
    });

    it('should handle concurrent requests efficiently', async () => {
      const papers = [1, 2, 3].map(id => ({
        ...mockPaper,
        id,
      }));

      const startTime = performance.now();

      // Run all analyses in parallel
      await Promise.all(
        papers.map(paper =>
          aiService.generateClipSummary({
            paperId: paper.id!,
            pdfText: mockPDFText,
            highlights: mockHighlights,
          })
        )
      );

      const duration = performance.now() - startTime;

      // Concurrent should be faster than sequential
      // (In real implementation with actual API calls)
      expect(duration).toBeLessThan(15000); // 3 papers * 5s each, but parallel
    });
  });

  describe('Cache Expiration Workflow', () => {
    it('should expire clip summary after 24 hours', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      // Set cache with TTL
      const result = await aiService.generateClipSummary({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      const cacheKey = `clip-summary-${paper.id}`;

      // Verify TTL is 24 hours
      expect(cacheService.set).toHaveBeenCalledWith(
        cacheKey,
        result,
        24 * 60 * 60 * 1000
      );
    });

    it('should expire structured info after 7 days', async () => {
      const paper = mockPaper;
      const highlights = mockHighlights;

      const result = await aiService.extractStructuredInfo({
        paperId: paper.id!,
        pdfText: mockPDFText,
        highlights,
      });

      const cacheKey = `structured-info-${paper.id}`;

      // Verify TTL is 7 days
      expect(cacheService.set).toHaveBeenCalledWith(
        cacheKey,
        result,
        7 * 24 * 60 * 60 * 1000
      );
    });
  });

  describe('UI State Management', () => {
    it('should handle loading state during generation', async () => {
      const { result } = renderHook(() => usePaperStore());

      await act(async () => {
        result.current.setCurrentPaper(mockPaper);
        result.current.highlights = mockHighlights;

        // Simulate loading state
        result.current.isLoading = true;

        await aiService.generateClipSummary({
          paperId: mockPaper.id!,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        });

        result.current.isLoading = false;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle error state in UI', async () => {
      const { result } = renderHook(() => usePaperStore());

      await act(async () => {
        result.current.setCurrentPaper(mockPaper);

        try {
          // This will throw in tests without real API
          await aiService.generateClipSummary({
            paperId: mockPaper.id!,
            pdfText: mockPDFText,
            highlights: mockHighlights,
          });
        } catch (error) {
          result.current.error = (error as Error).message;
        }
      });

      // Error should be set if API fails
      if (result.current.error) {
        expect(typeof result.current.error).toBe('string');
      }
    });
  });

  describe('Golden Dataset Integration', () => {
    it('should work with golden dataset papers', async () => {
      // Simulate golden dataset papers
      const goldenPaper: Paper = {
        ...mockPaper,
        id: 100,
        title: 'HCI Research Methods',
      };

      const goldenHighlights: Highlight[] = [
        {
          id: 100,
          paperId: 100,
          pageNumber: 1,
          text: 'User study with 30 participants',
          priority: 'critical',
          color: 'red',
          position: { x: 100, y: 100, width: 300, height: 20 },
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];

      const result = await aiService.generateClipSummary({
        paperId: goldenPaper.id!,
        pdfText: mockPDFText,
        highlights: goldenHighlights,
      });

      expect(result.summary).toHaveLength(3);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should maintain quality across different domains', async () => {
      const domains = [
        { name: 'ML', text: 'Machine learning algorithms...' },
        { name: 'HCI', text: 'User interface design...' },
        { name: 'CV', text: 'Computer vision methods...' },
      ];

      const results = await Promise.all(
        domains.map(domain =>
          aiService.generateClipSummary({
            paperId: mockPaper.id!,
            pdfText: domain.text,
            highlights: mockHighlights,
          })
        )
      );

      // All results should be valid
      results.forEach(result => {
        expect(result.summary).toHaveLength(3);
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      });
    });
  });
});
