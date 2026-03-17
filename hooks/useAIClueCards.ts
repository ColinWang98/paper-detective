/**
 * React Hook for AI Clue Cards - Story 2.2.1
 *
 * 管理AI线索卡片的状态和操作
 */

import { useState, useCallback } from 'react';

import { extractPDFText } from '@/lib/pdf';
import { usePaperStore } from '@/lib/store';
import { aiClueCardServiceEnhanced } from '@/services/aiClueCardService.enhanced';
import type { Highlight } from '@/types';
import type {
  AIClueCard,
  ClueCardFilter,
  ClueCardSortBy,
  GenerateClueCardsOptions,
  ClueCardsGenerationResult,
} from '@/types/ai.types';

export interface UseAIClueCardsOptions {
  onProgress?: (stage: string, progress: number) => void;
  onCardGenerated?: (card: AIClueCard) => void;
  onComplete?: (result: ClueCardsGenerationResult) => void;
  onError?: (error: string) => void;
}

export interface AIClueCardsState {
  // 状态
  status: 'idle' | 'loading' | 'generating' | 'success' | 'error';
  cards: AIClueCard[];
  filteredCards: AIClueCard[];
  error: string | null;

  // 进度
  currentStage: string;
  progress: number; // 0-100

  // 统计
  stats: {
    total: number;
    byType: Record<string, number>;
    avgConfidence: number;
  };

  // Token和成本
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  duration: number;
}

/**
 * AI Clue Cards React Hook
 */
export function useAIClueCards(options?: UseAIClueCardsOptions) {
  const [state, setState] = useState<AIClueCardsState>({
    status: 'idle',
    cards: [],
    filteredCards: [],
    error: null,
    currentStage: '',
    progress: 0,
    stats: {
      total: 0,
      byType: {},
      avgConfidence: 0,
    },
    tokenUsage: { input: 0, output: 0, total: 0 },
    cost: 0,
    duration: 0,
  });

  // 从store获取当前论文和高亮
  const currentPaper = usePaperStore(state => state.currentPaper);
  const highlights = usePaperStore(state => state.highlights);
  const loadClueCards = useCallback(async (paperId: number) => {
    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const cards = await aiClueCardServiceEnhanced.getClueCards(paperId);
      const stats = await aiClueCardServiceEnhanced.getClueCardsStats(paperId);

      setState(prev => ({
        ...prev,
        status: 'success',
        cards,
        filteredCards: cards,
        stats,
        progress: 100,
      }));
    } catch (error: any) {
      const errorMessage = error.message || '加载线索卡片失败';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      options?.onError?.(errorMessage);
    }
  }, [options]);

  /**
   * 生成AI线索卡片
   */
  const generateCards = useCallback(async (pdfFile: File, cardTypes?: string[]) => {
    if (!currentPaper?.id) {
      const error = '请先导入论文';
      setState(prev => ({ ...prev, status: 'error', error }));
      options?.onError?.(error);
      return;
    }

    setState(prev => ({
      ...prev,
      status: 'generating',
      error: null,
      progress: 0,
      currentStage: '准备生成...',
    }));

    try {
      // 1. 提取PDF文本
      options?.onProgress?.('提取PDF文本...', 5);
      setState(prev => ({ ...prev, currentStage: '提取PDF文本...', progress: 5 }));

      const pdfText = await extractPDFText(pdfFile);

      // 2. 调用AI服务生成卡片
      const result = await aiClueCardServiceEnhanced.generateClueCards({
        paperId: currentPaper.id,
        pdfText,
        highlights,
        cardTypes: cardTypes as any,
        onProgress: (stage, progress) => {
          setState(prev => ({ ...prev, currentStage: stage, progress }));
          options?.onProgress?.(stage, progress);
        },
        onCardGenerated: (card) => {
          options?.onCardGenerated?.(card);
        },
      });

      // 3. 更新状态
      const stats = await aiClueCardServiceEnhanced.getClueCardsStats(currentPaper.id);

      setState(prev => ({
        ...prev,
        status: 'success',
        cards: result.cards,
        filteredCards: result.cards,
        stats,
        tokenUsage: result.tokenUsage,
        cost: result.cost,
        duration: result.duration,
        progress: 100,
        currentStage: '完成！',
      }));

      options?.onComplete?.(result);
    } catch (error: any) {
      const errorMessage = error.message || '生成线索卡片失败';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        currentStage: '失败',
      }));
      options?.onError?.(errorMessage);
    }
  }, [currentPaper, highlights, options]);

  /**
   * 筛选线索卡片
   */
  const filterCards = useCallback(async (filter: ClueCardFilter) => {
    if (!currentPaper?.id) {return;}

    const filtered = await aiClueCardServiceEnhanced.getClueCardsFiltered(currentPaper.id, filter);

    setState(prev => ({
      ...prev,
      filteredCards: filtered,
    }));
  }, [currentPaper]);

  /**
   * 排序线索卡片
   */
  const sortCards = useCallback((sortBy: ClueCardSortBy) => {
    setState(prev => {
      const sorted = aiClueCardServiceEnhanced.sortClueCards(prev.filteredCards, sortBy);
      return {
        ...prev,
        filteredCards: sorted,
      };
    });
  }, []);

  /**
   * 更新线索卡片
   */
  const updateCard = useCallback(async (id: number, changes: Partial<AIClueCard>) => {
    try {
      await aiClueCardServiceEnhanced.updateClueCard(id, changes);

      // 更新本地状态
      setState(prev => ({
        ...prev,
        cards: prev.cards.map(c =>
          c.id === id ? { ...c, ...changes } : c
        ),
        filteredCards: prev.filteredCards.map(c =>
          c.id === id ? { ...c, ...changes } : c
        ),
      }));
    } catch (error: any) {
      const errorMessage = error.message || '更新线索卡片失败';
      options?.onError?.(errorMessage);
    }
  }, [options]);

  /**
   * 删除线索卡片
   */
  const deleteCard = useCallback(async (id: number) => {
    try {
      await aiClueCardServiceEnhanced.deleteClueCard(id);

      // 更新本地状态
      setState(prev => ({
        ...prev,
        cards: prev.cards.filter(c => c.id !== id),
        filteredCards: prev.filteredCards.filter(c => c.id !== id),
        stats: {
          ...prev.stats,
          total: prev.stats.total - 1,
        },
      }));
    } catch (error: any) {
      const errorMessage = error.message || '删除线索卡片失败';
      options?.onError?.(errorMessage);
    }
  }, [options]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      cards: [],
      filteredCards: [],
      error: null,
      currentStage: '',
      progress: 0,
      stats: {
        total: 0,
        byType: {},
        avgConfidence: 0,
      },
      tokenUsage: { input: 0, output: 0, total: 0 },
      cost: 0,
      duration: 0,
    });
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // 状态
    ...state,

    // 方法
    loadClueCards,
    generateCards,
    filterCards,
    sortCards,
    updateCard,
    deleteCard,
    reset,
    clearError,
  };
}
