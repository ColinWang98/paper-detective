// Intelligence Brief Service - Story 2.2.2
// Combines all AI features into comprehensive detective brief (B-mode)

import { dbHelpers } from '@/lib/db';
import type {
  AIClueCard,
  TokenUsage,
  ClueCardType,
 Highlight } from '@/types';

import { aiService } from './aiService';
import { cacheService } from './cacheService';
import { trackCost } from './costTracker';

/**
 * Intelligence Brief Types
 */
export interface IntelligenceBrief {
  id?: number;
  paperId: number;

  // Core sections
  caseFile: CaseFileInfo;           // 案件档案信息
  clipSummary: string;               // Clip 3-sentence summary
  structuredInfo: StructuredInfo;    // 结构化信息提取
  clueCards: AIClueCard[];           // AI侦探卡片集合

  // User data
  userHighlights: {
    total: number;
    byPriority: Record<string, number>;
    topHighlights: Highlight[];
    length?: number;
  };

  // Metadata
  tokenUsage: TokenUsage;
  cost: number;
  duration: number;
  generatedAt: string;
  model: string;
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

export interface CaseFileInfo {
  caseNumber: number;  // 案件编号（自动生成，如 #142）
  title: string;
  researchQuestion: string;
  coreMethod: string;
  keyFindings: string[];
  completenessScore: number;  // 0-100
  authors?: string[];  // 作者列表
  publicationDate?: string;  // 发布日期
  tags?: string[];  // 标签
}

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

export interface GenerateBriefOptions {
  paperId: number;
  pdfText: string;
  highlights: Highlight[];
  forceRegenerate?: boolean;  // Skip cache
  onProgress?: (stage: string, progress: number) => void;
}

export interface BriefGenerationResult {
  brief: IntelligenceBrief;
  stage: 'idle' | 'success' | 'error';
  error?: string;
}

/**
 * Intelligence Brief Service
 * Combines Clip summary, structured extraction, and AI clue cards
 * into comprehensive detective brief (B-mode)
 */
export class IntelligenceBriefService {
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_PDF_LENGTH = 12000; // First 12K chars
  private readonly MAX_HIGHLIGHTS = 15;

  /**
   * Generate complete Intelligence Brief
   * Combines all AI features with intelligent caching
   */
  async generateBrief(options: GenerateBriefOptions): Promise<BriefGenerationResult> {
    const startTime = performance.now();
    const { paperId, pdfText, highlights, forceRegenerate, onProgress } = options;

    try {
      // 1. Check cache (7-day TTL)
      if (!forceRegenerate) {
        const cached = await this.getCachedBrief(paperId);
        if (cached) {
          onProgress?.('从缓存加载', 100);
          return { brief: cached, stage: 'success' };
        }
      }

      // 2. Validate API configuration
      if (!aiService.isConfigured()) {
        throw new Error('请先在设置中配置API Key');
      }

      // 3. Prepare input data
      const truncatedText = this.truncatePDFText(pdfText);
      const topHighlights = this.selectTopHighlights(highlights);
      const caseNumber = await this.generateCaseNumber();

      onProgress?.('准备数据', 10);

      // 4. Generate sections in parallel (where possible)
      const [
        clipSummaryResult,
        structuredInfoResult,
        clueCardsResult,
      ] = await Promise.allSettled([
        this.generateClipSummary(paperId, truncatedText, onProgress),
        this.generateStructuredInfo(paperId, truncatedText, onProgress),
        this.generateClueCards(paperId, truncatedText, topHighlights, onProgress),
      ]);

      // 5. Extract results or throw errors
      const clipSummary = clipSummaryResult.status === 'fulfilled'
        ? clipSummaryResult.value
        : '暂无摘要';
      const structuredInfo = structuredInfoResult.status === 'fulfilled'
        ? structuredInfoResult.value
        : this.getDefaultStructuredInfo();
      const clueCards = clueCardsResult.status === 'fulfilled'
        ? clueCardsResult.value
        : [];

      onProgress?.('整合情报', 80);

      // 6. Calculate completeness score
      const completenessScore = this.calculateCompletenessScore(
        structuredInfo,
        highlights.length
      );

      // 7. Build case file info
      const caseFile: CaseFileInfo = {
        caseNumber,
        title: `案件档案 #${caseNumber}`,
        researchQuestion: structuredInfo.researchQuestion,
        coreMethod: structuredInfo.methods?.[0] || structuredInfo.methodology?.[0] || '未知方法',
        keyFindings: Array.isArray(structuredInfo.findings)
          ? structuredInfo.findings.slice(0, 3)
          : [],
        completenessScore,
      };

      // 8. Build user highlights summary
      const userHighlights = this.analyzeUserHighlights(highlights);

      // 9. Aggregate token usage and cost
      const tokenUsage = this.aggregateTokenUsage([
        clipSummaryResult as PromiseSettledResult<{ tokenUsage?: TokenUsage }>,
        structuredInfoResult as PromiseSettledResult<{ tokenUsage?: TokenUsage }>,
        clueCardsResult as PromiseSettledResult<{ tokenUsage?: TokenUsage }>,
      ]);
      const cost = this.calculateTotalCost([
        clipSummaryResult as PromiseSettledResult<{ cost?: number }>,
        structuredInfoResult as PromiseSettledResult<{ cost?: number }>,
        clueCardsResult as PromiseSettledResult<{ cost?: number }>,
      ]);

      // 10. Build final brief
      const brief: IntelligenceBrief = {
        paperId,
        caseFile,
        clipSummary,
        structuredInfo,
        clueCards,
        userHighlights,
        tokenUsage,
        cost,
        duration: performance.now() - startTime,
        generatedAt: new Date().toISOString(),
        model: 'glm-4.7-flash' as const,
        completeness: {
          clipSummary: clipSummaryResult.status === 'fulfilled',
          structuredInfo: structuredInfoResult.status === 'fulfilled',
          clueCards: clueCardsResult.status === 'fulfilled',
          userHighlights: highlights.length > 0,
          overall: completenessScore,
        },
      };

      // 11. Cache brief (7-day TTL)
      await this.cacheBrief(brief);

      onProgress?.('完成', 100);

      // 12. Track cost
      trackCost('glm-4.7-flash', tokenUsage, brief.paperId);

      return { brief, stage: 'success' };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '生成情报简报失败';
      return {
        brief: this.getDefaultBrief(paperId),
        stage: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Get cached brief if available and not expired
   */
  private async getCachedBrief(paperId: number): Promise<IntelligenceBrief | null> {
    try {
      const cacheKey = `intelligence-brief-${paperId}`;
      const cached = await cacheService.get(cacheKey);

      if (cached && typeof cached === 'object') {
        // Check TTL
        const cachedAt = new Date((cached as IntelligenceBrief).generatedAt).getTime();
        const now = Date.now();
        if (now - cachedAt < this.CACHE_TTL) {
          return cached as IntelligenceBrief;
        }
      }

      return null;
    } catch (error: unknown) {
      console.warn('Failed to get cached brief:', error);
      return null;
    }
  }

  /**
   * Cache brief with 7-day TTL
   */
  private async cacheBrief(brief: IntelligenceBrief): Promise<void> {
    try {
      const cacheKey = `intelligence-brief-${brief.paperId}`;
      await cacheService.set(cacheKey, brief, this.CACHE_TTL);
    } catch (error: unknown) {
      console.warn('Failed to cache brief:', error);
    }
  }

  /**
   * Generate Clip AI 3-sentence summary
   */
  private async generateClipSummary(
    paperId: number,
    pdfText: string,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<string> {
    onProgress?.('生成Clip摘要', 20);

    // Check cache first (24-hour TTL for clip summary)
    const cacheKey = `clip-summary-${paperId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached && typeof cached === 'string') {
      return cached;
    }

    // Prompt is handled by aiService.generateClipSummary
    const _prompt = `请用3句话总结这篇论文的核心发现、方法和意义。每句话不超过30字。

论文内容：
${pdfText}

请以JSON格式返回：
{
  "summary": "第1句。第2句。第3句。"
}`;

    void _prompt; // Mark as intentionally unused

    try {
      const result = await aiService.generateClipSummary({
        paperId,
        pdfText,
        highlights: [],
      });

      // Cache for 24 hours
      await cacheService.set(cacheKey, result.summary.join(' '), 24 * 60 * 60 * 1000);

      return result.summary.join(' ');
    } catch (error: unknown) {
      console.error('Failed to generate clip summary:', error);
      return '暂无摘要';
    }
  }

  /**
   * Generate structured information extraction
   */
  private async generateStructuredInfo(
    paperId: number,
    pdfText: string,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<StructuredInfo> {
    onProgress?.('提取结构化信息', 40);

    // Check cache first (7-day TTL)
    const cacheKey = `structured-info-${paperId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached && typeof cached === 'object') {
      return cached as StructuredInfo;
    }

    // Prompt is handled by aiService.extractStructuredInfo
    const _prompt = `请分析这篇论文，提取以下结构化信息：

1. 研究问题：论文试图解决的核心问题
2. 方法：使用的主要方法或技术（列出3-5个）
3. 关键发现：最重要的研究发现（列出3-5个）
4. 局限性：论文的局限性或未解决的问题（列出2-3个）

论文内容：
${pdfText}

请以JSON格式返回，并对每个字段给出置信度（0-100）：
{
  "researchQuestion": "研究问题",
  "questionConfidence": 95,
  "methods": ["方法1", "方法2", ...],
  "methodConfidence": 90,
  "findings": ["发现1", "发现2", ...],
  "findingConfidence": 85,
  "limitations": ["局限性1", "局限性2", ...],
  "limitationConfidence": 80
}`;

    void _prompt; // Mark as intentionally unused

    try {
      const result = await aiService.extractStructuredInfo({
        paperId,
        pdfText,
        highlights: [],
      });

      const structuredInfo: StructuredInfo = {
        researchQuestion: result.researchQuestion,
        methods: result.methodology,
        findings: result.findings,
        limitations: [], // Extract from conclusions if needed
        confidence: {
          question: result.confidence || 0,
          methods: result.confidence || 0,
          findings: result.confidence || 0,
          limitations: result.confidence || 0,
        },
      };

      // Cache for 7 days
      await cacheService.set(cacheKey, structuredInfo, 7 * 24 * 60 * 60 * 1000);

      return structuredInfo;
    } catch (error: unknown) {
      console.error('Failed to generate structured info:', error);
      return this.getDefaultStructuredInfo();
    }
  }

  /**
   * Generate AI clue cards
   */
  private async generateClueCards(
    paperId: number,
    pdfText: string,
    highlights: Highlight[],
    onProgress?: (stage: string, progress: number) => void
  ): Promise<AIClueCard[]> {
    onProgress?.('生成侦探卡片', 60);

    try {
      // Import aiClueCardService dynamically to avoid circular dependency
      const { aiClueCardService } = await import('./aiClueCardService');

      const result = await aiClueCardService.generateClueCards({
        paperId,
        pdfText,
        highlights,
        onProgress: (stage, progress) => {
          const adjustedProgress = 60 + (progress * 0.3); // Map to 60-90%
          onProgress?.(stage, adjustedProgress);
        },
      });

      return result.cards;
    } catch (error: unknown) {
      console.error('Failed to generate clue cards:', error);
      return [];
    }
  }

  /**
   * Truncate PDF text to max length
   */
  private truncatePDFText(pdfText: string): string {
    if (pdfText.length <= this.MAX_PDF_LENGTH) {
      return pdfText;
    }
    return `${pdfText.substring(0, this.MAX_PDF_LENGTH)  }\n\n[文本已截断...]`;
  }

  /**
   * Select top highlights by priority
   */
  private selectTopHighlights(highlights: Highlight[]): Highlight[] {
    const priorityOrder = { 'critical': 3, 'important': 2, 'interesting': 1, 'archived': 0 };

    return highlights
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, this.MAX_HIGHLIGHTS);
  }

  /**
   * Generate case number (sequential)
   */
  private async generateCaseNumber(): Promise<number> {
    try {
      // Get total paper count from database
      const papers = await dbHelpers.getAllPapers();
      return papers.length + 142; // Start from #142 (arbitrary start number)
    } catch {
      return 142; // Default case number
    }
  }

  /**
   * Calculate completeness score (0-100)
   */
  private calculateCompletenessScore(
    structuredInfo: StructuredInfo,
    highlightCount: number
  ): number {
    let score = 0;

    // Research question (25 points)
    if (structuredInfo.researchQuestion && structuredInfo.researchQuestion !== '未知') {
      score += 25;
    }

    // Methods (25 points)
    if (structuredInfo.methods && structuredInfo.methods.length > 0) {
      score += Math.min(25, structuredInfo.methods.length * 5);
    }

    // Findings (25 points)
    if (Array.isArray(structuredInfo.findings) && structuredInfo.findings.length > 0) {
      score += Math.min(25, structuredInfo.findings.length * 5);
    }

    // Limitations (15 points)
    if (structuredInfo.limitations && structuredInfo.limitations.length > 0) {
      score += Math.min(15, structuredInfo.limitations.length * 5);
    }

    // User highlights (10 points)
    if (highlightCount > 0) {
      score += Math.min(10, highlightCount);
    }

    return Math.min(100, score);
  }

  /**
   * Analyze user highlights
   */
  private analyzeUserHighlights(highlights: Highlight[]): {
    total: number;
    byPriority: Record<string, number>;
    topHighlights: Highlight[];
  } {
    const byPriority: Record<string, number> = {
      critical: 0,
      important: 0,
      interesting: 0,
      archived: 0,
    };

    highlights.forEach(h => {
      if (h.priority && byPriority[h.priority] !== undefined) {
        byPriority[h.priority]++;
      }
    });

    // Top 3 highlights by priority
    const priorityOrder = { 'critical': 3, 'important': 2, 'interesting': 1, 'archived': 0 };
    const topHighlights = highlights
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 3);

    return {
      total: highlights.length,
      byPriority,
      topHighlights,
    };
  }

  /**
   * Aggregate token usage from multiple results
   */
  private aggregateTokenUsage(results: PromiseSettledResult<{ tokenUsage?: TokenUsage }>[]): TokenUsage {
    const total: TokenUsage = {
      input: 0,
      output: 0,
      total: 0,
    };

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value?.tokenUsage) {
        total.input += result.value.tokenUsage.input || 0;
        total.output += result.value.tokenUsage.output || 0;
        total.total += result.value.tokenUsage.total || 0;
      }
    });

    return total;
  }

  /**
   * Calculate total cost from multiple results
   */
  private calculateTotalCost(results: PromiseSettledResult<{ cost?: number }>[]): number {
    let total = 0;

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value?.cost) {
        total += result.value.cost || 0;
      }
    });

    return Number(total.toFixed(6));
  }

  /**
   * Extract JSON from AI response
   */
  private extractJSON<T>(response: string): T | null {
    try {
      // Try to find JSON in response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {return null;}

      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      console.error('Failed to extract JSON:', error);
      return null;
    }
  }

  /**
   * Get default structured info
   */
  private getDefaultStructuredInfo(): StructuredInfo {
    return {
      researchQuestion: '未知',
      methods: [],
      findings: [],
      limitations: [],
      confidence: {
        question: 0,
        methods: 0,
        findings: 0,
        limitations: 0,
      },
    };
  }

  /**
   * Get default brief
   */
  private getDefaultBrief(paperId: number): IntelligenceBrief {
    return {
      paperId,
      caseFile: {
        caseNumber: 142,
        title: '案件档案 #142',
        researchQuestion: '未知',
        coreMethod: '未知方法',
        keyFindings: [],
        completenessScore: 0,
      },
      clipSummary: '暂无摘要',
      structuredInfo: this.getDefaultStructuredInfo(),
      clueCards: [],
      userHighlights: {
        total: 0,
        byPriority: {},
        topHighlights: [],
      },
      tokenUsage: { input: 0, output: 0, total: 0 },
      cost: 0,
      duration: 0,
      generatedAt: new Date().toISOString(),
      model: 'glm-4.7-flash' as const,
      completeness: {
        clipSummary: false,
        structuredInfo: false,
        clueCards: false,
        userHighlights: false,
        overall: 0,
      },
    };
  }

  /**
   * Get cached brief by paper ID
   */
  async getBrief(paperId: number): Promise<IntelligenceBrief | null> {
    return await this.getCachedBrief(paperId);
  }

  /**
   * Delete cached brief by paper ID
   */
  async deleteBrief(paperId: number): Promise<void> {
    try {
      const cacheKey = `intelligence-brief-${paperId}`;
      await cacheService.delete(cacheKey);
    } catch (error: unknown) {
      console.error('Failed to delete brief:', error);
    }
  }

  /**
   * Export brief as markdown (for user viewing)
   */
  exportBriefAsMarkdown(brief: IntelligenceBrief): string {
    const lines: string[] = [];

    // Header
    lines.push(`## ${brief.caseFile.title}`);
    lines.push(`**生成时间**: ${new Date(brief.generatedAt).toLocaleString('zh-CN')}`);
    lines.push('');

    // Research Question
    lines.push('### 🔍 研究问题');
    lines.push(brief.caseFile.researchQuestion);
    lines.push('');

    // Core Method
    lines.push('### 🔧 核心方法');
    lines.push(brief.caseFile.coreMethod);
    lines.push('');

    // Clip Summary
    lines.push('### 📋 Clip摘要（3句话）');
    lines.push(brief.clipSummary);
    lines.push('');

    // Key Findings
    lines.push('### 🎯 关键发现');
    brief.caseFile.keyFindings.forEach((finding, i) => {
      lines.push(`${i + 1}. ${finding}`);
    });
    lines.push('');

    // Structured Info
    lines.push('### 📊 结构化信息');
    lines.push('**方法**');
    if (brief.structuredInfo.methods) {
      brief.structuredInfo.methods.forEach((method) => {
        lines.push(`- ${method}`);
      });
    }
    lines.push('');
    lines.push('**关键发现**');
    if (Array.isArray(brief.structuredInfo.findings)) {
      brief.structuredInfo.findings.forEach((finding: string) => {
        lines.push(`- ${finding}`);
      });
    }
    lines.push('');
    lines.push('**局限性**');
    if (brief.structuredInfo.limitations) {
      brief.structuredInfo.limitations.forEach((limitation) => {
        lines.push(`- ${limitation}`);
      });
    }
    lines.push('');

    // AI Clue Cards
    lines.push('### 🕵️ AI侦探卡片');
    const cardsByType: Record<ClueCardType, AIClueCard[]> = {
      question: [],
      method: [],
      finding: [],
      limitation: [],
    };
    brief.clueCards.forEach(card => {
      if (cardsByType[card.type]) {
        cardsByType[card.type].push(card);
      }
    });

    Object.entries(cardsByType).forEach(([type, cards]) => {
      if (cards.length > 0) {
        const icon = type === 'question' ? '🔴' : type === 'method' ? '🔵' : type === 'finding' ? '🟢' : '🟡';
        lines.push(`#### ${icon} ${type.toUpperCase()} (${cards.length})`);
        cards.forEach(card => {
          lines.push(`- **${card.title}**: ${card.content}`);
        });
        lines.push('');
      }
    });

    // User Highlights
    if (brief.userHighlights.total > 0) {
      lines.push('### 📝 你的证据');
      lines.push(`**总计**: ${brief.userHighlights.total}条高亮`);
      lines.push('');
      lines.push('**优先级分布**');
      Object.entries(brief.userHighlights.byPriority).forEach(([priority, count]) => {
        if (count > 0) {
          const icon = priority === 'critical' ? '🔴' : priority === 'important' ? '🟡' : priority === 'interesting' ? '🟠' : '⚪';
          lines.push(`- ${icon} ${priority}: ${count}`);
        }
      });
      lines.push('');
    }

    // Completeness Score
    lines.push('### 📈 完整性评分');
    const score = brief.caseFile.completenessScore;
    const stars = '⭐'.repeat(Math.floor(score / 20)) + '☆'.repeat(5 - Math.floor(score / 20));
    lines.push(`**评分**: ${stars} (${score}/100)`);
    lines.push('');

    // Metadata
    lines.push('---');
    lines.push(`**Token使用**: ${brief.tokenUsage.total} (输入: ${brief.tokenUsage.input}, 输出: ${brief.tokenUsage.output})`);
    lines.push(`**成本**: $${brief.cost.toFixed(6)}`);
    lines.push(`**生成耗时**: ${(brief.duration / 1000).toFixed(2)}秒`);
    lines.push(`**模型**: ${brief.model}`);

    return lines.join('\n');
  }
}

// Export singleton instance
export const intelligenceBriefService = new IntelligenceBriefService();
