// Highlight types based on HCI research (Updated 2026-02-10)
export type HighlightPriority = 'critical' | 'important' | 'interesting' | 'archived';
export type HighlightColor = 'red' | 'yellow' | 'orange' | 'gray';

// Re-export AI types from ai.types.ts
export type {
  AIClueCard,
  ClueCardType,
  ClueCardSource,
  GenerateClueCardsOptions,
  ClueCardsGenerationResult,
  ClueCardFilter,
  ClueCardSortBy,
  AIModel,
  AIStatus,
  AIAnalysis,
  TokenUsage,
  AIAnalysisState,
  AIConfig,
  AIMessage,
  CostRecord,
  IntelligenceBrief,
  CaseFileInfo,
  StructuredInfo,
  UserHighlightsAnalysis,
  GenerateBriefOptions,
  BriefGenerationResult,
  // Brief Versioning (Sprint 5)
  BriefVersion,
  BriefVersionStatus,
  BriefVersionCreator,
  BriefEditorState,
  BriefVersionDiff,
  VersionChangeType,
  VersionSectionType,
  VersionChange,
  IntelligenceBriefWithVersions,
  CreateBriefVersionOptions,
  VersionFilterOptions,
} from './ai.types';

export type {
  CaseSetup,
  DoctorMode,
  DoctorState,
  DeductionGraph,
  DeductionGraphEdge,
  DeductionGraphNode,
  DeductionRelationType,
  CaseProgressSnapshot,
  EvidenceRelationship,
  EvidenceRelationshipType,
  EvidenceSubmission,
  EvidenceClusterId,
  EvidenceType,
  InvestigationTask,
  InvestigationTaskStatus,
  PaperStructureImportance,
  PaperStructureKind,
  PaperStructureNode,
  PaperStructureStatus,
  QuestionNode,
  QuestionNodeStatus,
  QuestionNodeType,
  QuestionRelation,
  QuestionRelationType,
  QuestionSection,
  TaskSubmissionMode,
  TaskProgress,
} from './case.types';

// Understanding status for Phase 2 (预留字段)
export type UnderstandingStatus = 'new' | 'reviewing' | 'understood' | 'questioned';

export interface Highlight {
  id?: number;
  text: string;
  color: HighlightColor;
  priority: HighlightPriority;
  timestamp: string;
  createdAt: string;
  pageNumber?: number;
  position?: {
    x: number;      // 相对坐标(%) - 支持缩放后正确定位
    y: number;      // 相对坐标(%)
    width: number;  // 相对宽度(%)
    height: number; // 相对高度(%)
  };
  rects?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  // 扁平化的坐标属性（用于兼容旧代码和测试）
  x?: number;       // 绝对坐标或相对坐标
  y?: number;       // 绝对坐标或相对坐标
  width?: number;   // 宽度
  height?: number;  // 高度
  paperId?: number | string;  // 支持数字和字符串ID
  // Phase 2字段：理解状态
  understandingStatus?: UnderstandingStatus;
  // Intelligence Brief字段
  note?: string;  // 用户笔记
}

export interface Paper {
  id?: number;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  doi?: string;
  arxivId?: string;
  fileURL: string;
  fileName: string;
  uploadDate: string;
  totalPages?: number;
  pdfHash?: string;  // PDF文件哈希值，用于去重和验证
  fileSize?: number; // 文件大小（字节）
}

export interface Group {
  id?: number;
  name: string;
  paperId: number;
  type: 'inbox' | 'custom'; // HCI更新：inbox为特殊类型（收集箱）
  color?: string;
  icon?: string; // 分组图标（如 🔬, 📊, 💡）
  createdAt: string;
  position: number; // 顺序
  order?: number; // 顺序（与position同义，用于兼容不同接口）
  isSystem?: boolean; // 系统分组（如收集箱）
  items?: Highlight[]; // 该分组包含的高亮
}

export interface GroupHighlight {
  id?: number;
  groupId: number;
  highlightId: number;
  position: number;
  addedAt: string;
}

// Priority to color mapping (HCI-compliant - Updated 2026-02-10)
export const PRIORITY_COLOR_MAP: Record<HighlightPriority, HighlightColor> = {
  critical: 'red',        // 🔴 关键（必须记住）
  important: 'yellow',    // 🟡 重要（值得记录）
  interesting: 'orange',  // 🟠 有趣（可能相关）
  archived: 'gray',       // ⚪ 存档（备用）
};

// Priority labels (HCI更新)
export const PRIORITY_LABELS: Record<HighlightPriority, string> = {
  critical: '🔴 关键',
  important: '🟡 重要',
  interesting: '🟠 有趣',
  archived: '⚪ 存档',
};

// Color classes for UI
export const COLOR_CLASSES: Record<HighlightColor, string> = {
  red: 'bg-red-100 border-l-red-500',
  yellow: 'bg-yellow-100 border-l-yellow-500',
  orange: 'bg-orange-100 border-l-orange-500',
  gray: 'bg-gray-100 border-l-gray-400',
};
