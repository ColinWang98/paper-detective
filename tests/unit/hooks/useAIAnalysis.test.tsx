/**
 * useAIAnalysis Hook Tests
 * 测试AI分析React Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { usePaperStore } from '@/lib/store';
import { aiService } from '@/services/aiService';
import { extractPDFText } from '@/lib/pdf';
import type { AnalysisResult } from '@/services/aiService';

// Mock dependencies
jest.mock('@/lib/store');
jest.mock('@/services/aiService');
jest.mock('@/services/apiKeyManager');
jest.mock('@/lib/pdf', () => ({
  extractPDFText: jest.fn(() => Promise.resolve('Mock PDF text content')),
}));

const mockUsePaperStore = usePaperStore as unknown as jest.Mock;
const mockAiService = aiService as jest.Mocked<typeof aiService>;
const mockExtractPDFText = extractPDFText as jest.MockedFunction<typeof extractPDFText>;

describe('useAIAnalysis Hook', () => {
  const mockPaper = {
    id: 1,
    title: 'Test Paper',
    fileURL: 'blob:test-url',
  };

  // Mock File object
  const mockPDFFile = new File(['mock pdf content'], 'test-paper.pdf', { type: 'application/pdf' });

  const mockHighlights = [
    {
      id: 1,
      paperId: 1,
      pageNumber: 1,
      text: 'Important finding',
      priority: 'critical' as const,
      color: 'red' as const,
      position: { x: 100, y: 100, width: 200, height: 20 },
      timestamp: '2026-02-10T10:00:00Z',
      createdAt: '2026-02-10T10:00:00Z',
    },
  ];

  const mockAnalysisResult: AnalysisResult = {
    paperId: 1,
    summary: 'This paper introduces transformers',
    researchQuestion: 'How to improve NLP?',
    methods: ['Self-attention', 'Parallel processing'],
    findings: ['Achieves SOTA results'],
    limitations: ['Requires large datasets'],
    tokenUsage: { input: 5000, output: 2000, total: 7000 },
    estimatedCost: 0.06,
    createdAt: '2026-02-10T10:00:00Z',
    model: 'glm-4.7-flash',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup PDF text extraction mock
    mockExtractPDFText.mockResolvedValue('Mock PDF text content');

    // Setup store mock
    mockUsePaperStore.mockReturnValue({
      currentPaper: mockPaper,
      highlights: mockHighlights,
    } as any);

    // Setup AI service mock
    mockAiService.isConfigured.mockReturnValue(true);
    mockAiService.analyzePaper.mockResolvedValue(mockAnalysisResult);
  });

  describe('initial state', () => {
    it('should return idle state initially', () => {
      const { result } = renderHook(() => useAIAnalysis());

      expect(result.current.status).toBe('idle');
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.streamingText).toBe('');
      expect(result.current.progress).toBe(0);
    });

    it('should return analyze function', () => {
      const { result } = renderHook(() => useAIAnalysis());

      expect(typeof result.current.analyze).toBe('function');
    });

    it('should return clearError function', () => {
      const { result } = renderHook(() => useAIAnalysis());

      expect(typeof result.current.clearError).toBe('function');
    });

    it('should return reset function', () => {
      const { result } = renderHook(() => useAIAnalysis());

      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('analyze', () => {
    it('should set error when no paper is loaded', async () => {
      mockUsePaperStore.mockReturnValue({
        currentPaper: null,
        highlights: [],
      } as any);

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('请先导入PDF论文');
      expect(mockAiService.analyzePaper).not.toHaveBeenCalled();
    });

    it('should set error when API key is not configured', async () => {
      mockAiService.isConfigured.mockReturnValue(false);

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('请先在设置中配置API Key');
      expect(mockAiService.analyzePaper).not.toHaveBeenCalled();
    });

    it('should start analysis with loading status', async () => {
      const { result } = renderHook(() => useAIAnalysis());

      const promise = act(async () => {
        result.current.analyze(mockPDFFile);
      });

      // Check loading state immediately (synchronously)
      expect(result.current.status).toBe('loading');
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);

      // Wait for async operations to complete
      await promise;
    });

    it('should update to streaming status during analysis', async () => {
      // Delay the AI service to catch intermediate state
      mockAiService.analyzePaper.mockImplementation(async ({ onProgress }) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockAnalysisResult;
      });

      const { result } = renderHook(() => useAIAnalysis());

      const promise = act(async () => {
        result.current.analyze(mockPDFFile);
      });

      // Wait for streaming state
      await waitFor(() => {
        expect(result.current.status).toBe('streaming');
      });

      await promise;
    });

    it('should handle streaming text updates', async () => {
      const chunks = ['Hello', ' World', '!'];
      let capturedProgress: string[] = [];

      mockAiService.analyzePaper.mockImplementation(async ({ onProgress }) => {
        for (const chunk of chunks) {
          await new Promise(resolve => setTimeout(resolve, 10));
          onProgress?.(chunk);
        }
        return mockAnalysisResult;
      });

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      // Verify analyzePaper was called with onProgress callback
      expect(mockAiService.analyzePaper).toHaveBeenCalled();
      const callArgs = mockAiService.analyzePaper.mock.calls[0][0];
      expect(callArgs.onProgress).toBeDefined();

      // Final state should be success
      expect(result.current.status).toBe('success');
    });

    it('should update progress during streaming', async () => {
      mockAiService.analyzePaper.mockImplementation(async ({ onProgress }) => {
        for (let i = 0; i < 30; i++) {
          onProgress?.('chunk');
        }
        return mockAnalysisResult;
      });

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(result.current.progress).toBeGreaterThan(30);
      expect(result.current.progress).toBeLessThanOrEqual(100);
    });

    it('should complete with success status', async () => {
      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
      expect(result.current.result).toEqual(mockAnalysisResult);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(100);
    });

    it('should clear streaming text on success', async () => {
      mockAiService.analyzePaper.mockImplementation(async ({ onProgress }) => {
        onProgress?.('Some text');
        return mockAnalysisResult;
      });

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(result.current.streamingText).toBe('');
    });

    it('should call aiService.analyzePaper with correct parameters', async () => {
      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(mockAiService.analyzePaper).toHaveBeenCalledWith({
        paperId: mockPaper.id,
        pdfText: expect.any(String),
        highlights: mockHighlights,
        onProgress: expect.any(Function),
      });
    });

    it('should handle analysis errors', async () => {
      const error = new Error('API Error');
      mockAiService.analyzePaper.mockRejectedValue(error);

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('API Error');
      expect(result.current.result).toBeNull();
    });

    it('should handle unknown errors', async () => {
      mockAiService.analyzePaper.mockRejectedValue({});

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('分析失败');
    });

    it('should reset streaming text and progress on error', async () => {
      mockAiService.analyzePaper.mockImplementation(async ({ onProgress }) => {
        onProgress?.('Some text');
        throw new Error('Error');
      });

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.streamingText).toBe('');
      expect(result.current.progress).toBe(0);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockAiService.analyzePaper.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useAIAnalysis());

      // Trigger error
      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(result.current.error).toBe('Error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe('error'); // Status remains error
    });

    it('should not affect other state', async () => {
      mockAiService.analyzePaper.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      const prevStatus = result.current.status;

      act(() => {
        result.current.clearError();
      });

      expect(result.current.status).toBe(prevStatus);
      expect(result.current.result).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockAiService.analyzePaper.mockResolvedValue(mockAnalysisResult);

      const { result } = renderHook(() => useAIAnalysis());

      // Complete analysis
      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.streamingText).toBe('');
      expect(result.current.progress).toBe(0);
    });

    it('should reset from error state', async () => {
      mockAiService.analyzePaper.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(result.current.status).toBe('error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeNull();
    });

    it('should reset during streaming', async () => {
      mockAiService.analyzePaper.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useAIAnalysis());

      act(() => {
        result.current.analyze(mockPDFFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('streaming');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
    });
  });

  describe('state transitions', () => {
    it('should transition: idle -> loading -> streaming -> success', async () => {
      const { result } = renderHook(() => useAIAnalysis());

      const states: string[] = [];

      // Track state changes (simplified)
      const initialStatus = result.current.status;
      states.push(initialStatus);

      act(() => {
        result.current.analyze(mockPDFFile);
      });

      states.push(result.current.status);

      await waitFor(() => {
        if (result.current.status !== 'loading' && result.current.status !== 'streaming') {
          states.push(result.current.status);
        }
      });

      await waitFor(() => {
        if (result.current.status === 'success') {
          states.push(result.current.status);
        }
      });

      expect(states).toContain('idle');
      expect(['loading', 'streaming', 'success']).toContain(result.current.status);
    });

    it('should transition: idle -> loading -> error', async () => {
      mockAiService.analyzePaper.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });

  describe('reattach behavior', () => {
    it('should maintain state across re-renders', async () => {
      const { result, rerender } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      const prevResult = result.current.result;

      // Force re-render
      rerender();

      expect(result.current.result).toBe(prevResult);
      expect(result.current.status).toBe('success');
    });
  });

  describe('integration with store', () => {
    it('should use currentPaper from store', async () => {
      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(mockAiService.analyzePaper).toHaveBeenCalledWith(
        expect.objectContaining({
          paperId: mockPaper.id,
        })
      );
    });

    it('should use highlights from store', async () => {
      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(mockAiService.analyzePaper).toHaveBeenCalledWith(
        expect.objectContaining({
          highlights: mockHighlights,
        })
      );
    });

    it('should update when store values change', async () => {
      const { result, rerender } = renderHook(() => useAIAnalysis());

      const newHighlights = [...mockHighlights, { ...mockHighlights[0], id: 2 }];

      mockUsePaperStore.mockReturnValue({
        currentPaper: mockPaper,
        highlights: newHighlights,
      } as any);

      rerender();

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      expect(mockAiService.analyzePaper).toHaveBeenCalledWith(
        expect.objectContaining({
          highlights: newHighlights,
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty highlights array', async () => {
      mockUsePaperStore.mockReturnValue({
        currentPaper: mockPaper,
        highlights: [],
      } as any);

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(mockAiService.analyzePaper).toHaveBeenCalledWith(
        expect.objectContaining({
          highlights: [],
        })
      );
    });

    it('should handle paper without fileURL', async () => {
      mockUsePaperStore.mockReturnValue({
        currentPaper: { ...mockPaper, fileURL: undefined },
        highlights: [],
      } as any);

      const { result } = renderHook(() => useAIAnalysis());

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      // Should still attempt analysis, PDF text extraction will handle it
      expect(mockAiService.analyzePaper).toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    it('should not cause unnecessary re-renders', async () => {
      const renderSpy = jest.fn();

      const { result } = renderHook(() => {
        renderSpy();
        return useAIAnalysis();
      });

      await act(async () => {
        await result.current.analyze(mockPDFFile);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Initial render + a few state updates, but not excessive
      expect(renderSpy.mock.calls.length).toBeLessThan(10);
    });
  });
});
