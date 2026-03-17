/**
 * useStructuredExtraction Hook - Story 2.1.4
 * 提取论文结构化信息：研究问题、方法、结果、结论
 */

import { useState, useCallback } from 'react';

import { extractPDFText } from '@/lib/pdf';
import { aiService } from '@/services/aiService';
import type { Highlight } from '@/types';

export interface StructuredInfoState {
  status: 'idle' | 'loading' | 'streaming' | 'success' | 'error';
  researchQuestion: string;
  methodology: string[];
  findings: string[];
  conclusions: string;
  confidence: number; // 0-100
  streamingText: string;
  progress: number;
  error: string | null;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

export interface UseStructuredExtractionOptions {
  onProgress?: (text: string) => void;
  onComplete?: (info: StructuredInfoState) => void;
  onError?: (error: string) => void;
}

export function useStructuredExtraction(
  paperId: number,
  pdfFile: File | null,
  highlights: Highlight[],
  options?: UseStructuredExtractionOptions
) {
  const [state, setState] = useState<StructuredInfoState>({
    status: 'idle',
    researchQuestion: '',
    methodology: [],
    findings: [],
    conclusions: '',
    confidence: 0,
    streamingText: '',
    progress: 0,
    error: null,
    tokenUsage: { input: 0, output: 0, total: 0 },
    cost: 0,
  });

  const extractInfo = useCallback(async () => {
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

      // 4. 开始AI结构化提取
      setState(prev => ({ ...prev, status: 'streaming', progress: 50 }));

      // 5. 调用AI提取结构化信息
      const result = await aiService.extractStructuredInfo({
        paperId,
        pdfText,
        highlights,
        onProgress: (chunk) => {
          // 实时更新streaming文本
          setState(prev => ({
            ...prev,
            streamingText: prev.streamingText + chunk,
            progress: Math.min(90, prev.progress + 1),
          }));
          options?.onProgress?.(chunk);
        },
      });

      // 6. 完成提取
      const finalState = {
        status: 'success' as const,
        researchQuestion: result.researchQuestion,
        methodology: result.methodology,
        findings: result.findings,
        conclusions: result.conclusions,
        confidence: result.confidence,
        streamingText: '',
        progress: 100,
        error: null,
        tokenUsage: result.tokenUsage,
        cost: result.cost,
      };

      setState(finalState);
      options?.onComplete?.(finalState);
    } catch (error: any) {
      const errorMessage = error.message || '提取信息失败';
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
      researchQuestion: '',
      methodology: [],
      findings: [],
      conclusions: '',
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
    extractInfo,
    reset,
    clearError,
  };
}
