// AI相关类型定义
import type { Highlight } from './index';

// Re-export Highlight for use in ai.types
export type { Highlight } from './index';

export type AIModel =
  | 'glm-4.7-flash'
  | 'glm-4.6'
  | 'minimax/minimax-m2.5:free'
  | 'deepseek-chat'
  | 'gpt-4o-mini';

export type AIErrorCode =
  | 'API_KEY_MISSING'
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR';

export type AIStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'error';

/**
 * AI分析结果
 */
export interface AIAnalysis {
  id?: number;
  paperId: number;
  summary: string;
  researchQuestion: string;
  methods: string[];
  findings: string[];
  limitations: string[];
  tokenUsage: TokenUsage;
  estimatedCost: number;
  createdAt: string;
  model: AIModel;
}

/**
 * Token使用统计
 */
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * AI分析状态
 */
export interface AIAnalysisState {
  status: AIStatus;
  result: AIAnalysis | null;
  error: string | null;
  streamingText: string;
  progress: number; // 0-100
}

/**
 * AI服务配置
 */
export interface AIConfig {
  model: AIModel;
  maxTokens: number;
  temperature?: number;
  topP?: number;
}

/**
 * AI聊天消息
 */
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * AI错误
 */
export class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}

// ============================================================================
// Brief Versioning - Sprint 5
// ============================================================================

/**
 * Brief Version Status
 */
export type BriefVersionStatus = 'draft' | 'published' | 'archived';

/**
 * Brief Version Creator Type
 */
export type BriefVersionCreator = 'ai' | 'user';

/**
 * Editor State for Draft Versions
 */
export interface BriefEditorState {
  selection?: {
    start: number;
    end: number;
  };
  scrollPosition?: number;
  unsavedChanges?: boolean;
}

/**
 * Brief Version - Single version of an intelligence brief
 *
 * Stores a specific version (draft or published) of a brief with full content
 */
export interface BriefVersion {
  id?: number;                          // Unique version ID
  briefId: number;                      // Parent brief ID
  versionNumber: number;                  // Sequential version (1, 2, 3...)
  status: BriefVersionStatus;             // Version status

  // Content (full brief content for this version)
  caseFile: CaseFileInfo;
  clipSummary: string;
  structuredInfo: StructuredInfo;
  clueCards: AIClueCard[];
  userHighlights: UserHighlightsAnalysis;

  // Metadata
  createdAt: string;                       // When this version was created
  createdBy: BriefVersionCreator;         // Who created this version
  editedAt?: string;                      // Last edit time (for user-created versions)
  editCount?: number;                     // Number of edits (for user versions)

  // Editor state (only for draft versions)
  editorState?: BriefEditorState;
}

/**
 * Brief Version Diff - Comparison between two versions
 *
 * Stores computed differences between two brief versions
 */
export interface BriefVersionDiff {
  id: number;
  briefId: number;
  fromVersionId: number;
  toVersionId: number;

  // Computed diff
  changes: VersionChange[];
  summary: string;                         // Human-readable summary
  changeCount: number;                     // Number of changed sections

  createdAt: string;
}

/**
 * Version Change Type
 */
export type VersionChangeType =
  | 'added'
  | 'deleted'
  | 'modified'
  | 'moved';

/**
 * Section Names for Version Tracking
 */
export type VersionSectionType =
  | 'caseFile'
  | 'clipSummary'
  | 'structuredInfo'
  | 'clueCards'
  | 'userHighlights';

/**
 * Single Version Change
 *
 * Represents one change in a version diff
 */
export interface VersionChange {
  type: VersionChangeType;
  section: VersionSectionType;
  fieldPath?: string;                      // For nested changes (e.g., 'clueCards.0.title')
  oldValue?: any;
  newValue?: any;
}

/**
 * Updated IntelligenceBrief - Enhanced with Version Tracking
 *
 * Extends the original IntelligenceBrief interface with version control capabilities
 */
export interface IntelligenceBriefWithVersions extends Omit<IntelligenceBrief, 'caseFile' | 'clipSummary' | 'structuredInfo' | 'clueCards' | 'userHighlights'> {
  // Version tracking
  currentVersionId?: number;               // Points to active version
  totalVersions: number;                   // Count of all versions
  latestPublishedVersionId?: number;          // Latest non-draft version

  // Quick access flags
  hasUnpublishedEdits: boolean;             // User has drafts not published

  // Original brief (first AI-generated version)
  originalBrief: {
    caseFile: CaseFileInfo;
    clipSummary: string;
    structuredInfo: StructuredInfo;
    clueCards: AIClueCard[];
    userHighlights: UserHighlightsAnalysis;
    createdAt: string;
  };
}

/**
 * Create Brief Version Options
 */
export interface CreateBriefVersionOptions {
  briefId: number;
  content: Partial<Omit<BriefVersion, 'id' | 'createdAt' | 'createdAt'>>;
  status: BriefVersionStatus;
}

/**
 * Version Filter Options
 */
export interface VersionFilterOptions {
  briefId: number;
  status?: BriefVersionStatus;              // Filter by status
  createdBy?: BriefVersionCreator;            // Filter by creator
  limit?: number;                          // Max results
  offset?: number;                         // Pagination offset
  sortBy?: 'created-desc' | 'created-asc' | 'version-desc';
}


/**
 * 成本追踪记录
 */
export interface CostRecord {
  date: string;
  usage: TokenUsage;
  cost: number;
  paperId?: number;
}

/**
 * AI Clue Cards - Story 2.2.1
 * 侦探风格的AI线索卡片系统
 */

// 线索卡片类型（4种）
export type ClueCardType =
  | 'question'           // 🔴 研究问题/假设（"案件起因"）
  | 'method'             // 🔵 方法步骤（"调查手段"）
  | 'finding'            // 🟢 关键发现（"证据"）
  | 'limitation';        // 🟡 局限性/未解决问题（"疑点"）

// 向后兼容的别名（废弃，请使用 ClueCardType）
/** @deprecated 使用 'question' 代替 */
export const RESEARCH_QUESTION = 'question' as const;
/** @deprecated 使用 'method' 代替 */
export const METHODOLOGY = 'method' as const;
/** @deprecated 使用 'finding' 代替 */
export const FINDINGS = 'finding' as const;
/** @deprecated 使用 'limitation' 代替 */
export const LIMITATIONS = 'limitation' as const;

// 卡片来源
export type ClueCardSource =
  | 'clip-summary'      // 来自Clip AI 3-sentence summary
  | 'structured-info'   // 来自结构化信息提取
  | 'custom-insight'    // 来自用户自定义洞察
  | 'ai-generated'      // 来自AI直接生成
  | 'demo-data'         // 来自演示数据
  | 'rule-based';       // 来自规则匹配

// 单条AI线索卡片
export interface AIClueCard {
  id?: number;
  paperId: number;
  type: ClueCardType;
  source: ClueCardSource;

  // 卡片内容
  title: string;           // 简短标题（≤30字符）
  content: string;         // 详细内容（1-3句话）
  pageNumber?: number;     // 对应PDF页码

  // 关联高亮（可多选）
  highlightIds?: number[]; // 关联的高亮ID列表

  // 置信度和元数据
  confidence: number;      // 0-100，AI生成卡片的可信度
  position?: number;       // 显示顺序
  isExpanded?: boolean;    // 是否展开（HCI：默认折叠）

  // 时间戳
  createdAt: string;
  updatedAt?: string;

  // Token使用和成本（可选，用于成本追踪）
  tokenUsage?: TokenUsage;
  cost?: number;           // USD
}

// AI线索卡片集合（用于批量操作）
export interface AIClueCardCollection {
  paperId: number;
  cards: AIClueCard[];
  totalCards: number;
  byType: Record<ClueCardType, AIClueCard[]>;
  totalCost: number;
  createdAt: string;
}

// 生成AI线索卡片的选项
export interface GenerateClueCardsOptions {
  paperId: number;
  pdfText: string;
  highlights: Highlight[];
  apiKey?: string;
  model?: AIModel;
  cardTypes?: ClueCardType[];  // 指定生成哪些类型的卡片（默认全部4种）
  onProgress?: (stage: string, progress: number) => void;
  onCardGenerated?: (card: AIClueCard) => void;
}

// AI线索卡片生成结果
export interface ClueCardsGenerationResult {
  cards: AIClueCard[];
  summary: {
    total: number;
    byType: Record<ClueCardType, number>;
    avgConfidence: number;
  };
  tokenUsage: TokenUsage;
  cost: number;
  duration: number;  // milliseconds
}

// AI线索卡片过滤器
export interface ClueCardFilter {
  types?: ClueCardType[];
  sources?: ClueCardSource[];
  minConfidence?: number;
  pageNumbers?: number[];
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

// AI线索卡片排序选项
export type ClueCardSortBy =
  | 'created-desc'    // 最新优先
  | 'created-asc'     // 最旧优先
  | 'confidence-desc' // 置信度降序
  | 'confidence-asc'  // 置信度升序
  | 'type'            // 按类型分组
  | 'page';           // 按页码排序

/**
 * Intelligence Brief - Story 2.2.2
 * B-mode: Comprehensive detective brief combining all AI features
 */

// 案件档案信息
export interface CaseFileInfo {
  caseNumber: number;  // 案件编号（如 #142）
  title: string;
  researchQuestion: string;
  coreMethod: string;
  keyFindings: string[];
  completenessScore: number;  // 0-100
  authors?: string[];  // 作者列表
  publicationDate?: string;  // 发布日期
  tags?: string[];  // 标签
}

// 结构化信息
export interface StructuredInfo {
  researchQuestion: string;
  methodology?: string | string[];  // 支持字符串或字符串数组
  methods?: string[];  // 向后兼容
  findings: string[] | {
    question: number;
    methods: number;
    findings: number;
    limitations: number;
  };
  limitations?: string[];
  conclusions?: string | string[];  // 新增结论字段
  confidence?: {
    question: number;
    methods: number;
    findings: number;
    limitations: number;
  };
}

// 用户高亮分析
export interface UserHighlightsAnalysis {
  total: number;
  byPriority: Record<string, number>;
  topHighlights: import('./index').Highlight[];
  length?: number;  // 分析的高亮数量
}

// Clip摘要结果
export interface ClipSummary {
  summary: string;
  confidence?: number;
  tokenUsage?: TokenUsage;
  cost?: number;
}

// 完整情报简报
export interface IntelligenceBrief {
  id?: number;
  paperId: number;

  // Core sections
  caseFile: CaseFileInfo;              // 案件档案信息
  clipSummary: string;                  // Clip 3-sentence summary
  structuredInfo: StructuredInfo;       // 结构化信息提取
  clueCards: AIClueCard[];              // AI侦探卡片集合

  // User data
  userHighlights: UserHighlightsAnalysis;  // 用户高亮分析

  // Metadata
  tokenUsage: TokenUsage;
  cost: number;
  duration: number;
  generatedAt: string;
  model: AIModel;
  source?: 'ai-generated' | 'demo-data' | 'cache';  // 来源标识

  // Completeness tracking
  completeness: {
    clipSummary: boolean;
    structuredInfo: boolean;
    clueCards: boolean;
    userHighlights: boolean;
    overall: number;  // 0-100
  };
}

// 生成情报简报选项
export interface GenerateBriefOptions {
  paperId: number;
  pdfText: string;
  highlights: import('./index').Highlight[];
  apiKey?: string;
  model?: AIModel;
  forceRegenerate?: boolean;
  onProgress?: (stage: string, progress: number) => void;
}

// 情报简报生成结果
export interface BriefGenerationResult {
  brief: IntelligenceBrief;
  stage: 'idle' | 'success' | 'error';
  error?: string;
}
