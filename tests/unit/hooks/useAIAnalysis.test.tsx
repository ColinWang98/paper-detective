import { renderHook, act, waitFor } from '@testing-library/react';

import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { usePaperStore } from '@/lib/store';
import { aiService } from '@/services/aiService';
import { extractPDFText } from '@/lib/pdf';
import type { AnalysisResult } from '@/services/aiService';

jest.mock('@/lib/store');
jest.mock('@/services/aiService');
jest.mock('@/lib/pdf', () => ({
  extractPDFText: jest.fn(() => Promise.resolve('Mock PDF text content')),
}));

const mockUsePaperStore = usePaperStore as unknown as jest.Mock;
const mockAiService = aiService as jest.Mocked<typeof aiService>;
const mockExtractPDFText = extractPDFText as jest.MockedFunction<typeof extractPDFText>;

describe('useAIAnalysis', () => {
  const mockPaper = {
    id: 1,
    title: 'Test Paper',
    fileURL: 'blob:test-url',
  };

  const mockPDFFile = new File(['mock pdf content'], 'test-paper.pdf', {
    type: 'application/pdf',
  });

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
    mockUsePaperStore.mockReturnValue({
      currentPaper: mockPaper,
      highlights: mockHighlights,
    } as any);
    mockExtractPDFText.mockResolvedValue('Mock PDF text content');
    mockAiService.isConfigured.mockReturnValue(true);
    mockAiService.analyzePaper.mockResolvedValue(mockAnalysisResult);
  });

  it('returns the initial idle state', () => {
    const { result } = renderHook(() => useAIAnalysis());

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.streamingText).toBe('');
    expect(result.current.progress).toBe(0);
    expect(typeof result.current.analyze).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('sets an error when no paper is loaded', async () => {
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

  it('sets an error when the API key is not configured', async () => {
    mockAiService.isConfigured.mockReturnValue(false);

    const { result } = renderHook(() => useAIAnalysis());

    await act(async () => {
      await result.current.analyze(mockPDFFile);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('请先在设置中配置API Key');
    expect(mockAiService.analyzePaper).not.toHaveBeenCalled();
  });

  it('extracts PDF text and forwards paper context to aiService', async () => {
    const { result } = renderHook(() => useAIAnalysis());

    await act(async () => {
      await result.current.analyze(mockPDFFile);
    });

    expect(mockExtractPDFText).toHaveBeenCalledWith(mockPDFFile);
    expect(mockAiService.analyzePaper).toHaveBeenCalledWith({
      paperId: 1,
      pdfText: 'Mock PDF text content',
      highlights: mockHighlights,
      onProgress: expect.any(Function),
    });
  });

  it('transitions to success and stores the analysis result', async () => {
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
    expect(result.current.streamingText).toBe('');
  });

  it('updates streaming text and progress from onProgress callbacks', async () => {
    let capturedOnProgress: ((chunk: string) => void) | undefined;

    mockAiService.analyzePaper.mockImplementation(async ({ onProgress }) => {
      capturedOnProgress = onProgress;
      onProgress?.('Hello');
      onProgress?.(' World');
      return mockAnalysisResult;
    });

    const { result } = renderHook(() => useAIAnalysis());

    await act(async () => {
      await result.current.analyze(mockPDFFile);
    });

    expect(capturedOnProgress).toBeDefined();
    expect(result.current.status).toBe('success');
    expect(result.current.progress).toBe(100);
    expect(result.current.streamingText).toBe('');
  });

  it('handles analysis failures and supports clearError/reset', async () => {
    mockAiService.analyzePaper.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useAIAnalysis());

    await act(async () => {
      await result.current.analyze(mockPDFFile);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('API Error');
    expect(result.current.result).toBeNull();
    expect(result.current.progress).toBe(0);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.streamingText).toBe('');
    expect(result.current.progress).toBe(0);
  });

  it('handles unknown thrown values with the fallback message', async () => {
    mockAiService.analyzePaper.mockRejectedValue({});

    const { result } = renderHook(() => useAIAnalysis());

    await act(async () => {
      await result.current.analyze(mockPDFFile);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('分析失败');
  });

  it('uses updated store values on re-render', async () => {
    const { result, rerender } = renderHook(() => useAIAnalysis());

    mockUsePaperStore.mockReturnValue({
      currentPaper: { ...mockPaper, id: 2 },
      highlights: [],
    } as any);

    rerender();

    await act(async () => {
      await result.current.analyze(mockPDFFile);
    });

    expect(mockAiService.analyzePaper).toHaveBeenCalledWith({
      paperId: 2,
      pdfText: 'Mock PDF text content',
      highlights: [],
      onProgress: expect.any(Function),
    });
  });
});
