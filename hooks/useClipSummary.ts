/**
 * useClipSummary Hook - Story 2.1.3
 * 快速生成3句话论文摘要，用于侦探卡片显示
 */

import { useState, useCallback } from 'react';

import { extractPDFText } from '@/lib/pdf';
import { aiService } from '@/services/aiService';
import type { Highlight } from '@/types';

export interface ClipSummaryState {
  status: 'idle' | 'loading' | 'streaming' | 'success' | 'error';
  summary: string[]; // 3句话
  confidence: number; // 0-100
  streamingText: string; // 实时流式文本
  progress: number; // 0-100
  error: string | null;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

export interface UseClipSummaryOptions {
  onProgress?: (text: string) => void;
  onComplete?: (summary: string[]) => void;
  onError?: (error: string) => void;
}

export function useClipSummary(
  paperId: number,
  pdfFile: File | null,
  highlights: Highlight[],
  options?: UseClipSummaryOptions
) {
  const [state, setState] = useState<ClipSummaryState>({
    status: 'idle',
    summary: [],
    confidence: 0,
    streamingText: '',
    progress: 0,
    error: null,
    tokenUsage: { input: 0, output: 0, total: 0 },
    cost: 0,
  });

  const generateSummary = useCallback(async () => {
    if (!pdfFile) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: '请先上传PDF文件',
      }));
      options?.onError?.('请先上传PDF文件');
      return;
    }

    // 1. 检查API配置
    if (!aiService.isConfigured()) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: '请先配置API Key',
      }));
      options?.onError?.('请先配置API Key');
      return;
    }

    // 2. 开始提取PDF文本
    setState(prev => ({
      ...prev,
      status: 'loading',
      error: null,
      progress: 10,
    }));

    try {
      // 3. 提取PDF文本
      const pdfText = await extractPDFText(pdfFile);
      setState(prev => ({ ...prev, progress: 30 }));

      // 4. 开始AI分析
      setState(prev => ({ ...prev, status: 'streaming', progress: 50 }));

      // 5. 调用AI生成摘要
      const result = await aiService.generateClipSummary({
        paperId,
        pdfText,
        highlights,
        onProgress: (chunk) => {
          // 实时更新streaming文本
          setState(prev => ({
            ...prev,
            streamingText: prev.streamingText + chunk,
            progress: Math.min(90, prev.progress + 2),
          }));
          options?.onProgress?.(chunk);
        },
      });

      // 6. 完成生成
      setState({
        status: 'success',
        summary: result.summary,
        confidence: result.confidence,
        streamingText: '',
        progress: 100,
        error: null,
        tokenUsage: result.tokenUsage,
        cost: result.cost,
      });

      options?.onComplete?.(result.summary);
    } catch (error: any) {
      const errorMessage = error.message || '生成摘要失败';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        progress: 0,
      }));
      options?.onError?.(errorMessage);
    }
  }, [paperId, pdfFile, highlights, options]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      summary: [],
      confidence: 0,
      streamingText: '',
      progress: 0,
      error: null,
      tokenUsage: { input: 0, output: 0, total: 0 },
      cost: 0,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, status: 'idle', error: null }));
  }, []);

  return {
    ...state,
    generateSummary,
    reset,
    clearError,
  };
}
