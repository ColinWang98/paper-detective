// useIntelligenceBrief Hook Types

import type { IntelligenceBrief } from '@/services/intelligenceBriefService';

/**
 * Intelligence Brief Hook State
 */
export interface IntelligenceBriefState {
  // Status tracking
  status: 'idle' | 'loading' | 'generating' | 'success' | 'error';

  // Data
  brief: IntelligenceBrief | null;

  // Error handling
  error: string | null;

  // Progress tracking
  currentStage: string;
  progress: number; // 0-100

  // Metadata
  lastGeneratedAt: string | null;
  isCached: boolean;
}

/**
 * Hook return value
 */
export interface UseIntelligenceBriefReturn {
  // State
  status: IntelligenceBriefState['status'];
  brief: IntelligenceBrief | null;
  error: string | null;
  currentStage: string;
  progress: number;

  // Computed flags
  isIdle: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  isSuccess: boolean;
  isError: boolean;
  hasBrief: boolean;

  // Actions
  generateBrief: (pdfFile?: File, forceRegenerate?: boolean) => Promise<void>;
  regenerateBrief: (pdfFile?: File) => Promise<void>;
  exportAsMarkdown: () => string | null;
  deleteBrief: () => Promise<void>;
  reset: () => void;

  // Quick access to brief data
  caseFile: IntelligenceBrief['caseFile'] | null;
  clipSummary: string;
  structuredInfo: IntelligenceBrief['structuredInfo'] | null;
  clueCards: IntelligenceBrief['clueCards'];
  userHighlights: IntelligenceBrief['userHighlights'] | null;
  completenessScore: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  duration: number;
}

/**
 * Hook options
 */
export interface UseIntelligenceBriefOptions {
  onProgress?: (stage: string, progress: number) => void;
  onBriefGenerated?: (brief: IntelligenceBrief) => void;
  onError?: (error: string) => void;
}

/**
 * Progress stage type
 */
export type BriefProgressStage =
  | '准备生成'
  | '提取PDF文本'
  | '生成Clip摘要'
  | '提取结构化信息'
  | '生成侦探卡片'
  | '整合情报'
  | '完成'
  | '从缓存加载'
  | '失败';

/**
 * Statistics derived from brief
 */
export interface BriefStatistics {
  totalCards: number;
  cardsByType: Record<string, number>;
  totalHighlights: number;
  highlightsByPriority: Record<string, number>;
  avgConfidence: number;
  completenessScore: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  duration: number;
}
