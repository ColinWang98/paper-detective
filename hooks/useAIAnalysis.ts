/**
 * useAIAnalysis Hook
 * 封装AI分析的状态管理和副作用
 */

import { useState, useCallback } from 'react';

import { extractPDFText } from '@/lib/pdf';
import { usePaperStore } from '@/lib/store';
import { aiService } from '@/services/aiService';
import type { AnalysisResult } from '@/services/aiService';
import type { AIStatus } from '@/types/ai.types';

interface UseAIAnalysisState {
  status: AIStatus;
  result: AnalysisResult | null;
  error: string | null;
  streamingText: string;
  progress: number; // 0-100
}

export function useAIAnalysis() {
  const [state, setState] = useState<UseAIAnalysisState>({
    status: 'idle',
    result: null,
    error: null,
    streamingText: '',
    progress: 0,
  });

  const { currentPaper, highlights } = usePaperStore();

  /**
   * 开始AI分析
   * @param pdfFile PDF文件对象（可选，如果不提供则使用已缓存的文本）
   */
  const analyze = useCallback(async (pdfFile?: File) => {
    if (!currentPaper) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: '请先导入PDF论文',
      }));
      return;
    }

    // 检查API Key
    if (!aiService.isConfigured()) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: '请先在设置中配置API Key',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      status: 'loading',
      error: null,
      streamingText: '',
      progress: 0,
    }));

    try {
      // 1. 提取PDF文本
      setState(prev => ({ ...prev, status: 'streaming', progress: 10 }));

      let pdfText = '';
      if (pdfFile) {
        pdfText = await extractPDFText(pdfFile);
      } else {
        // TODO: 尝试从缓存获取PDF文本
        throw new Error('请提供PDF文件以进行分析');
      }

      // 2. 调用AI分析
      setState(prev => ({ ...prev, progress: 30 }));

      const result = await aiService.analyzePaper({
        paperId: currentPaper.id!,
        pdfText,
        highlights,
        onProgress: (chunk) => {
          // 实时更新流式文本
          setState(prev => ({
            ...prev,
            streamingText: prev.streamingText + chunk,
            progress: Math.min(prev.progress + 2, 90),
          }));
        },
      });

      // 3. 完成
      setState({
        status: 'success',
        result,
        error: null,
        streamingText: '',
        progress: 100,
      });
    } catch (error: any) {
      setState({
        status: 'error',
        result: null,
        error: error.message || '分析失败',
        streamingText: '',
        progress: 0,
      });
    }
  }, [currentPaper, highlights]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      result: null,
      error: null,
      streamingText: '',
      progress: 0,
    });
  }, []);

  return {
    ...state,
    analyze,
    clearError,
    reset,
  };
}
