/**
 * AI Clue Card Service - Enhanced Version
 * Story 2.2.1 - Enhanced with confidence scoring, deduplication, and cost optimization
 *
 * 将论文分析为4种类型的侦探风格线索卡片:
 * - 🔴 question: 研究问题/假设（"案件起因"）
 * - 🔵 method: 方法步骤（"调查手段"）
 * - 🟢 finding: 关键发现（"证据"）
 * - 🟡 limitation: 局限性/未解决问题（"疑点"）
 *
 * Enhancements:
 * - Improved confidence scoring algorithm
 * - Card deduplication logic
 * - Cost optimization (target <$0.01/paper)
 * - Batch operations for better performance
 * - Enhanced error handling
 */

import { dbHelpers } from '@/lib/db';
import type { Highlight } from '@/types';
import type {
  AIClueCard,
  ClueCardType,
  ClueCardSource,
  GenerateClueCardsOptions,
  ClueCardsGenerationResult,
  ClueCardFilter,
  ClueCardSortBy,
} from '@/types/ai.types';

import { aiService } from './aiService';
import { cacheService } from './cacheService';

/**
 * Confidence scoring factors
 */
interface ConfidenceFactors {
  informationCompleteness: number; // 信息完整性 (0-1)
  textClarity: number;             // 文本清晰度 (0-1)
  sourceReliability: number;        // 来源可信度 (0-1)
  highlightCorrelation: number;     // 与高亮的相关性 (0-1)
}

/**
 * Card similarity metrics for deduplication
 */
interface CardSimilarity {
  card1: AIClueCard;
  card2: AIClueCard;
  similarity: number; // 0-1
}

/**
 * Enhanced AI Clue Card Service
 */
class AIClueCardServiceEnhanced {
  private readonly MAX_PDF_LENGTH = 8000;
  private readonly MAX_HIGHLIGHTS = 15;
  private readonly DEDUPLICATION_THRESHOLD = 0.85; // 相似度阈值
  private readonly TARGET_COST_PER_PAPER = 0.01; // $0.01 目标成本

  /**
   * Enhanced confidence scoring algorithm
   * 综合多个因素计算置信度分数
   */
  private calculateConfidence(
    card: Partial<AIClueCard>,
    highlights: Highlight[],
    pdfText: string
  ): number {
    const factors: ConfidenceFactors = {
      informationCompleteness: this.assessInformationCompleteness(card),
      textClarity: this.assessTextClarity(card.content || ''),
      sourceReliability: this.assessSourceReliability(card.source || 'ai-generated'),
      highlightCorrelation: this.assessHighlightCorrelation(card, highlights),
    };

    // Weighted average (weights can be tuned)
    const weights = {
      informationCompleteness: 0.3,
      textClarity: 0.25,
      sourceReliability: 0.2,
      highlightCorrelation: 0.25,
    };

    const rawScore = Object.entries(factors).reduce(
      (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
      0
    );

    // Normalize to 0-100 and clamp
    return Math.max(0, Math.min(100, Math.round(rawScore * 100)));
  }

  /**
   * Assess information completeness
   */
  private assessInformationCompleteness(card: Partial<AIClueCard>): number {
    let score = 0.5; // Base score

    // Has title
    if (card.title && card.title.length > 0) {
      score += 0.15;
    }

    // Title length is appropriate (10-30 chars)
    if (card.title && card.title.length >= 10 && card.title.length <= 30) {
      score += 0.1;
    }

    // Has content
    if (card.content && card.content.length > 0) {
      score += 0.15;
    }

    // Content length is appropriate (30-200 chars)
    if (card.content && card.content.length >= 30 && card.content.length <= 200) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Assess text clarity using simple heuristics
   */
  private assessTextClarity(text: string): number {
    let score = 0.5; // Base score

    if (!text || text.length === 0) {
      return 0;
    }

    // Check for proper sentence structure
    const sentences = text.split(/[.!?。！？]/);
    if (sentences.length >= 1 && sentences.length <= 3) {
      score += 0.2; // Appropriate number of sentences
    }

    // Check for technical terms (indicates specificity)
    const technicalTerms = /\b(data|model|algorithm|method|approach|performance|accuracy|experiment|analysis)\b/i;
    if (technicalTerms.test(text)) {
      score += 0.15;
    }

    // Check for quantitative data
    const quantitative = /\b\d+[%\w]\b/;
    if (quantitative.test(text)) {
      score += 0.15;
    }

    return Math.min(1, score);
  }

  /**
   * Assess source reliability
   */
  private assessSourceReliability(source: ClueCardSource): number {
    const reliabilityScores: Record<ClueCardSource, number> = {
      'structured-info': 0.95,    // Highest: structured extraction
      'clip-summary': 0.85,        // High: 3-sentence summary
      'ai-generated': 0.80,        // Good: direct AI generation
      'custom-insight': 0.70,      // Lower: user-generated
      'rule-based': 0.60,          // Low: pattern-based extraction
      'demo-data': 0.50,           // Lowest: demo/example data
    };

    return reliabilityScores[source] || 0.75;
  }

  /**
   * Assess correlation with user highlights
   */
  private assessHighlightCorrelation(card: Partial<AIClueCard>, highlights: Highlight[]): number {
    if (!card.content || highlights.length === 0) {
      return 0;
    }

    // Calculate word overlap with highlights
    const cardWords = new Set(
      card.content
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3) // Ignore short words
    );

    let maxOverlap = 0;
    for (const highlight of highlights) {
      const highlightWords = new Set(
        highlight.text
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 3)
      );

      const intersection = new Set([...cardWords].filter(x => highlightWords.has(x)));
      const union = new Set([...cardWords, ...highlightWords]);
      const jaccard = intersection.size / union.size;

      maxOverlap = Math.max(maxOverlap, jaccard);
    }

    return Math.min(1, maxOverlap * 2); // Amplify the signal
  }

  /**
   * Card deduplication using similarity metrics
   */
  private deduplicateCards(cards: AIClueCard[]): AIClueCard[] {
    const deduplicated: AIClueCard[] = [];
    const toRemove = new Set<number>();

    for (let i = 0; i < cards.length; i++) {
      if (toRemove.has(i)) {continue;}

      const card1 = cards[i];
      deduplicated.push(card1);

      for (let j = i + 1; j < cards.length; j++) {
        if (toRemove.has(j)) {continue;}

        const card2 = cards[j];
        const similarity = this.calculateCardSimilarity(card1, card2);

        if (similarity >= this.DEDUPLICATION_THRESHOLD) {
          // Keep the one with higher confidence
          if (card2.confidence > card1.confidence) {
            deduplicated.pop();
            deduplicated.push(card2);
            toRemove.add(i);
          } else {
            toRemove.add(j);
          }
        }
      }
    }

    return deduplicated;
  }

  /**
   * Calculate similarity between two cards
   */
  private calculateCardSimilarity(card1: AIClueCard, card2: AIClueCard): number {
    // Must be same type
    if (card1.type !== card2.type) {
      return 0;
    }

    let similarity = 0;

    // Title similarity (40% weight)
    const titleSimilarity = this.stringSimilarity(card1.title, card2.title);
    similarity += titleSimilarity * 0.4;

    // Content similarity (60% weight)
    const contentSimilarity = this.stringSimilarity(card1.content, card2.content);
    similarity += contentSimilarity * 0.6;

    return similarity;
  }

  /**
   * Calculate string similarity using Jaccard index
   */
  private stringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Generate AI clue cards with enhancements
   */
  async generateClueCards(options: GenerateClueCardsOptions): Promise<ClueCardsGenerationResult> {
    const {
      paperId,
      pdfText,
      highlights,
      cardTypes = ['question', 'method', 'finding', 'limitation'],
      onProgress,
      onCardGenerated
    } = options;

    const startTime = performance.now();
    const generatedCards: AIClueCard[] = [];

    try {
      // 1. Check cache
      const cacheKey = `clue-cards-${paperId}-${cardTypes.join('-')}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        onProgress?.('从缓存加载', 100);
        return cached as ClueCardsGenerationResult;
      }

      // 2. Validate API configuration
      if (!aiService.isConfigured()) {
        throw new Error('请先在设置中配置API Key');
      }

      onProgress?.('准备生成线索卡片...', 5);

      // 3. Prepare input text with cost optimization
      const maxLength = this.MAX_PDF_LENGTH;
      const truncatedText = pdfText.length > maxLength
        ? `${pdfText.substring(0, maxLength)  }\n\n[文本已截断...]`
        : pdfText;

      // 4. Select top highlights (prioritize by priority)
      const priorityOrder = { 'critical': 3, 'important': 2, 'interesting': 1, 'archived': 0 };
      const topHighlights = highlights
        .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
        .slice(0, this.MAX_HIGHLIGHTS);

      onProgress?.('分析论文内容...', 10);

      // 5. Build optimized prompt
      const prompt = this.buildClueCardsPrompt(truncatedText, topHighlights, cardTypes);

      // 6. Call Claude API
      onProgress?.('AI生成线索卡片中...', 20);
      const rawCards = await this.callClaudeForCards(prompt, paperId, onProgress);

      // 7. Enhance confidence scores
      const enhancedCards = rawCards.map(card => ({
        ...card,
        confidence: this.calculateConfidence(card, topHighlights, truncatedText),
      }));

      // 8. Deduplicate cards
      const deduplicatedCards = this.deduplicateCards(enhancedCards);

      onProgress?.('保存线索卡片...', 90);

      // 9. Batch save to database
      const savedCards = await this.batchSaveCards(deduplicatedCards);
      generatedCards.push(...savedCards);

      // 10. Build result summary
      const summary = {
        total: generatedCards.length,
        byType: {
          'question': generatedCards.filter(c => c.type === 'question').length,
          'method': generatedCards.filter(c => c.type === 'method').length,
          'finding': generatedCards.filter(c => c.type === 'finding').length,
          'limitation': generatedCards.filter(c => c.type === 'limitation').length,
        },
        avgConfidence: generatedCards.reduce((sum, c) => sum + c.confidence, 0) / generatedCards.length,
      };

      // 11. Calculate token usage and cost with better accuracy
      const tokenUsage = this.estimateTokenUsage(prompt, generatedCards);
      const cost = this.calculateCost(tokenUsage);

      const result: ClueCardsGenerationResult = {
        cards: generatedCards,
        summary,
        tokenUsage,
        cost,
        duration: performance.now() - startTime,
      };

      // 12. Cache results
      await cacheService.set(cacheKey, result, 7 * 24 * 60 * 60 * 1000);

      // 13. Verify cost target
      if (cost > this.TARGET_COST_PER_PAPER) {
        console.warn(`⚠️ Cost exceeded target: $${cost.toFixed(4)} > $${this.TARGET_COST_PER_PAPER} for paper ${paperId}`);
      }

      onProgress?.('完成！', 100);

      // Notify for each card generated
      generatedCards.forEach(card => onCardGenerated?.(card));

      return result;
    } catch (error: any) {
      throw new Error(`AI线索卡片生成失败: ${error.message}`);
    }
  }

  /**
   * Batch save cards to database (better performance)
   */
  private async batchSaveCards(cards: Omit<AIClueCard, 'id'>[]): Promise<AIClueCard[]> {
    const savedCards: AIClueCard[] = [];

    try {
      // Use transaction for better performance
      for (const card of cards) {
        const cardId = await dbHelpers.addClueCard(card);
        savedCards.push({ ...card, id: cardId });
      }
    } catch (error) {
      console.error('Failed to batch save cards:', error);
      throw error;
    }

    return savedCards;
  }

  /**
   * Estimate token usage more accurately
   */
  private estimateTokenUsage(prompt: string, cards: AIClueCard[]): {
    input: number;
    output: number;
    total: number;
  } {
    // Input: prompt + system instructions
    const inputTokens = Math.ceil(prompt.length / 4);

    // Output: generated cards
    const outputText = cards.map(c => `${c.title}${c.content}`).join('');
    const outputTokens = Math.ceil(outputText.length / 4);

    return {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    };
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokenUsage: { input: number; output: number; total: number }): number {
    // Claude Sonnet 4.5 pricing (as of 2026-02)
    const INPUT_COST_PER_1M = 3.0; // $3.0 per million input tokens
    const OUTPUT_COST_PER_1M = 15.0; // $15.0 per million output tokens

    const inputCost = (tokenUsage.input / 1_000_000) * INPUT_COST_PER_1M;
    const outputCost = (tokenUsage.output / 1_000_000) * OUTPUT_COST_PER_1M;

    return inputCost + outputCost;
  }

  /**
   * Build optimized prompt for clue card generation
   */
  private buildClueCardsPrompt(
    pdfText: string,
    highlights: Highlight[],
    cardTypes: ClueCardType[]
  ): string {
    const typeInstructions: Record<ClueCardType, string> = {
      'question': '🔴 **研究问题卡片** (research-question): 提取论文的核心研究问题、假设或研究目标。每张卡片应包含：\n   - title: 简短的问题标题（≤20字符）\n   - content: 问题的详细描述（1-2句话）\n   - confidence: 问题明确度评分（0-100）',
      'method': '🔵 **方法卡片** (methodology): 提取研究的关键方法、实验设计或技术手段。每张卡片应包含：\n   - title: 方法名称（≤20字符）\n   - content: 方法的详细描述（1-2句话，包含技术细节）\n   - confidence: 方法清晰度评分（0-100）',
      'finding': '🟢 **发现卡片** (findings): 提取研究的关键发现、实验结果或数据洞察。每张卡片应包含：\n   - title: 发现的简短总结（≤20字符）\n   - content: 发现的详细描述（1-2句话，包含具体数据）\n   - confidence: 数据可信度评分（0-100）',
      'limitation': '🟡 **局限性卡片** (limitations): 提取研究的局限性、未解决问题或未来工作方向。每张卡片应包含：\n   - title: 局限性的简短标题（≤20字符）\n   - content: 局限性的详细描述（1-2句话）\n   - confidence: 问题严重度评分（0-100）',
    };

    const typesToGenerate = cardTypes.map(t => typeInstructions[t]).join('\n\n');

    return `你是一位学术侦探专家。请将以下论文拆解为"线索卡片"，帮助研究者快速理解论文的核心内容。

**论文全文（前8000字）:**
"""
${pdfText}
"""

**用户标记的重要证据（Top 15）:**
${highlights.map(h => `- [${h.priority}] Page ${h.pageNumber || '?'}: ${h.text.substring(0, 100)}...`).join('\n')}

**任务：**
请生成以下类型的线索卡片：
${typesToGenerate}

**输出格式（纯JSON数组）:**
\`\`\`json
[
  {
    "type": "question",
    "title": "简短标题",
    "content": "详细描述（1-2句话）",
    "confidence": 95,
    "pageNumber": 1
  },
  {
    "type": "method",
    "title": "方法名称",
    "content": "方法的详细描述（包含技术细节）",
    "confidence": 90,
    "pageNumber": 2
  }
]
\`\`\`

**要求：**
1. 每种类型生成3-5张卡片（选择最重要、最有价值的内容）
2. title必须简短（≤20字符），一语中的
3. content应该提供足够信息，让读者快速理解要点
4. confidence基于信息的明确性、完整性（0-100）
5. pageNumber如果能在原文中定位到，请标注页码
6. 优先选择用户高亮标记的内容作为卡片来源
7. 卡片应该有侦探风格：简洁、有力、直击要点
8. 避免生成重复或高度相似的卡片

**评判标准：**
- 问题卡片：研究边界是否清晰，问题是否具体
- 方法卡片：技术术语是否准确，实验细节是否完整
- 发现卡片：是否有数据支撑，结果是否明确
- 局限性卡片：是否指出作者未明说的问题，是否具有洞察力

请只输出JSON，不要其他解释性文字。`;
  }

  /**
   * Call Claude API for card generation
   */
  private async callClaudeForCards(
    prompt: string,
    paperId: number,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<Omit<AIClueCard, 'id'>[]> {
    try {
      const client = aiService['getClient']();

      const stream = await client.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: true,
      });

      let fullText = '';
      let lastProgress = 30;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;

          // Update progress (30-90%)
          const progress = Math.min(90, 30 + Math.floor(fullText.length / 50));
          if (progress > lastProgress) {
            onProgress?.('生成中...', progress);
            lastProgress = progress;
          }
        }
      }

      // Parse JSON response
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应中的JSON数组');
      }

      const cardsData = JSON.parse(jsonMatch[0]);

      // Transform to AIClueCard format
      const cards: Omit<AIClueCard, 'id'>[] = cardsData.map((card: any) => ({
        paperId,
        type: card.type,
        source: 'ai-generated' as ClueCardSource,
        title: card.title,
        content: card.content,
        pageNumber: card.pageNumber,
        confidence: this.normalizeConfidence(card.confidence || 80),
        isExpanded: false, // HCI：默认折叠
        createdAt: new Date().toISOString(),
      }));

      return cards;
    } catch (error: any) {
      throw new Error(`Claude API调用失败: ${error.message}`);
    }
  }

  /**
   * Normalize confidence score to 0-100 range
   */
  private normalizeConfidence(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get clue cards for a paper
   */
  async getClueCards(paperId: number): Promise<AIClueCard[]> {
    return await dbHelpers.getClueCards(paperId);
  }

  /**
   * Get filtered clue cards
   */
  async getClueCardsFiltered(paperId: number, filter: ClueCardFilter): Promise<AIClueCard[]> {
    let cards = await dbHelpers.getClueCards(paperId);

    // Apply filters
    if (filter.types && filter.types.length > 0) {
      cards = cards.filter(c => filter.types!.includes(c.type));
    }

    if (filter.sources && filter.sources.length > 0) {
      cards = cards.filter(c => filter.sources!.includes(c.source));
    }

    if (filter.minConfidence !== undefined) {
      cards = cards.filter(c => c.confidence >= filter.minConfidence!);
    }

    if (filter.pageNumbers && filter.pageNumbers.length > 0) {
      cards = cards.filter(c => c.pageNumber && filter.pageNumbers!.includes(c.pageNumber));
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      cards = cards.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.content.toLowerCase().includes(query)
      );
    }

    if (filter.dateFrom) {
      cards = cards.filter(c => c.createdAt >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      cards = cards.filter(c => c.createdAt <= filter.dateTo!);
    }

    return cards;
  }

  /**
   * Sort clue cards
   */
  sortClueCards(cards: AIClueCard[], sortBy: ClueCardSortBy): AIClueCard[] {
    const sorted = [...cards];

    switch (sortBy) {
      case 'created-desc':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'created-asc':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'confidence-desc':
        return sorted.sort((a, b) => b.confidence - a.confidence);
      case 'confidence-asc':
        return sorted.sort((a, b) => a.confidence - b.confidence);
      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      case 'page':
        return sorted.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
      default:
        return sorted;
    }
  }

  /**
   * Update clue card
   */
  async updateClueCard(id: number, changes: Partial<AIClueCard>): Promise<number> {
    return await dbHelpers.updateClueCard(id, changes);
  }

  /**
   * Delete clue card
   */
  async deleteClueCard(id: number): Promise<void> {
    await dbHelpers.deleteClueCard(id);
  }

  /**
   * Delete all clue cards for a paper
   */
  async deleteClueCardsByPaper(paperId: number): Promise<void> {
    await dbHelpers.deleteClueCardsByPaper(paperId);
  }

  /**
   * Get clue cards statistics
   */
  async getClueCardsStats(paperId: number): Promise<{
    total: number;
    byType: Record<ClueCardType, number>;
    bySource: Record<ClueCardSource, number>;
    avgConfidence: number;
  }> {
    const cards = await dbHelpers.getClueCards(paperId);

    return {
      total: cards.length,
      byType: {
        'question': cards.filter(c => c.type === 'question').length,
        'method': cards.filter(c => c.type === 'method').length,
        'finding': cards.filter(c => c.type === 'finding').length,
        'limitation': cards.filter(c => c.type === 'limitation').length,
      },
      bySource: {
        'clip-summary': cards.filter(c => c.source === 'clip-summary').length,
        'structured-info': cards.filter(c => c.source === 'structured-info').length,
        'custom-insight': cards.filter(c => c.source === 'custom-insight').length,
        'ai-generated': cards.filter(c => c.source === 'ai-generated').length,
        'rule-based': cards.filter(c => c.source === 'rule-based').length,
        'demo-data': cards.filter(c => c.source === 'demo-data').length,
      },
      avgConfidence: cards.length > 0
        ? cards.reduce((sum, c) => sum + c.confidence, 0) / cards.length
        : 0,
    };
  }

  /**
   * Generate cards from Clip Summary
   */
  async generateCardsFromClipSummary(
    paperId: number,
    summary: string[],
    confidence: number
  ): Promise<AIClueCard[]> {
    const cards: Omit<AIClueCard, 'id'>[] = [];

    // Map 3-sentence summary to 3 cards
    const typeMapping: ClueCardType[] = ['question', 'method', 'finding'];
    const titleMapping = ['研究背景', '核心方法', '主要发现'];

    summary.forEach((sentence, index) => {
      if (index < 3) {
        cards.push({
          paperId,
          type: typeMapping[index],
          source: 'clip-summary',
          title: titleMapping[index],
          content: sentence,
          confidence: this.normalizeConfidence(confidence),
          isExpanded: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Save to database
    const savedCards: AIClueCard[] = [];
    for (const card of cards) {
      const cardId = await dbHelpers.addClueCard(card);
      savedCards.push({ ...card, id: cardId });
    }

    return savedCards;
  }

  /**
   * Generate cards from structured info
   */
  async generateCardsFromStructuredInfo(
    paperId: number,
    structuredInfo: {
      researchQuestion: string;
      methodology: string[];
      findings: string[];
      conclusions: string;
    },
    confidence: number
  ): Promise<AIClueCard[]> {
    const cards: Omit<AIClueCard, 'id'>[] = [];

    // Research question card
    cards.push({
      paperId,
      type: 'question',
      source: 'structured-info',
      title: '核心研究问题',
      content: structuredInfo.researchQuestion,
      confidence: this.normalizeConfidence(confidence),
      isExpanded: false,
      createdAt: new Date().toISOString(),
    });

    // Method cards
    structuredInfo.methodology.forEach((method: string, index: number) => {
      cards.push({
        paperId,
        type: 'method',
        source: 'structured-info',
        title: `方法 ${index + 1}`,
        content: method,
        confidence: this.normalizeConfidence(confidence),
        isExpanded: false,
        createdAt: new Date().toISOString(),
      });
    });

    // Finding cards
    structuredInfo.findings.forEach((finding: string, index: number) => {
      cards.push({
        paperId,
        type: 'finding',
        source: 'structured-info',
        title: `发现 ${index + 1}`,
        content: finding,
        confidence: this.normalizeConfidence(confidence),
        isExpanded: false,
        createdAt: new Date().toISOString(),
      });
    });

    // Limitation card (from conclusions)
    cards.push({
      paperId,
      type: 'limitation',
      source: 'structured-info',
      title: '研究结论',
      content: typeof structuredInfo.conclusions === 'string' ? structuredInfo.conclusions : JSON.stringify(structuredInfo.conclusions),
      confidence: this.normalizeConfidence(confidence),
      isExpanded: false,
      createdAt: new Date().toISOString(),
    });

    // Save to database
    const savedCards: AIClueCard[] = [];
    for (const card of cards) {
      const cardId = await dbHelpers.addClueCard(card);
      savedCards.push({ ...card, id: cardId });
    }

    return savedCards;
  }
}

// Export singleton instance
export const aiClueCardServiceEnhanced = new AIClueCardServiceEnhanced();
