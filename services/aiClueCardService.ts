/**
 * AI Clue Card Service - Story 2.2.1
 *
 * 将论文分析为4种类型的侦探风格线索卡片:
 * - 🔴 question: 研究问题/假设（"案件起因"）
 * - 🔵 method: 方法步骤（"调查手段"）
 * - 🟢 finding: 关键发现（"证据"）
 * - 🟡 limitation: 局限性/未解决问题（"疑点"）
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
import { calculateCost } from './costTracker';

/**
 * AI Clue Card Service
 */
export class AIClueCardService {
  /**
   * 生成AI线索卡片（核心方法）
   *
   * 从论文中生成4种类型的线索卡片
   */
  async generateClueCards(options: GenerateClueCardsOptions): Promise<ClueCardsGenerationResult> {
    const { paperId, pdfText, highlights, cardTypes = ['question', 'method', 'finding', 'limitation'], onProgress, onCardGenerated } = options;

    const startTime = performance.now();
    const generatedCards: AIClueCard[] = [];

    try {
      // 1. 检查缓存
      const cacheKey = `clue-cards-${paperId}-${cardTypes.join('-')}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        onProgress?.('从缓存加载', 100);
        return cached as ClueCardsGenerationResult;
      }

      // 2. 验证API配置
      if (!aiService.isConfigured()) {
        throw new Error('请先在设置中配置API Key');
      }

      onProgress?.('准备生成线索卡片...', 5);

      // 3. 准备输入文本（使用前8000字符以获取完整上下文）
      const maxLength = 8000;
      const truncatedText = pdfText.length > maxLength
        ? `${pdfText.substring(0, maxLength)  }\n\n[文本已截断...]`
        : pdfText;

      // 4. 选择top 15高亮（卡片生成需要更多上下文）
      const priorityOrder = { 'critical': 3, 'important': 2, 'interesting': 1, 'archived': 0 };
      const topHighlights = highlights
        .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
        .slice(0, 15);

      onProgress?.('分析论文内容...', 10);

      // 5. 构建Prompt（专门用于生成4种线索卡片）
      const prompt = this.buildClueCardsPrompt(truncatedText, topHighlights, cardTypes);

      // 6. 调用Claude API生成卡片
      onProgress?.('AI生成线索卡片中...', 20);
      const cards = await this.callClaudeForCards(prompt, paperId, onProgress);

      onProgress?.('保存线索卡片...', 90);

      // 7. 批量保存到数据库
      for (const card of cards) {
        const cardId = await dbHelpers.addClueCard(card);
        generatedCards.push({ ...card, id: cardId });
        onCardGenerated?.(generatedCards[generatedCards.length - 1]);
      }

      // 8. 构建结果摘要
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

      // 9. 计算Token使用和成本（估算）
      const tokenUsage = {
        input: Math.ceil((truncatedText.length + prompt.length) / 4),
        output: Math.ceil(generatedCards.reduce((sum, c) => sum + c.title.length + c.content.length, 0) / 4),
        total: 0,
      };
      tokenUsage.total = tokenUsage.input + tokenUsage.output;

      const cost = calculateCost('glm-4.7-flash', tokenUsage);

      const result: ClueCardsGenerationResult = {
        cards: generatedCards,
        summary,
        tokenUsage,
        cost,
        duration: performance.now() - startTime,
      };

      // 10. 缓存结果（7天）
      await cacheService.set(cacheKey, result, 7 * 24 * 60 * 60 * 1000);

      onProgress?.('完成！', 100);

      return result;
    } catch (error: any) {
      throw new Error(`AI线索卡片生成失败: ${error.message}`);
    }
  }

  /**
   * 构建用于生成线索卡片的Prompt
   */
  private buildClueCardsPrompt(pdfText: string, highlights: Highlight[], cardTypes: ClueCardType[]): string {
    const typeInstructions: Record<string, string> = {
      'question': '🔴 **研究问题卡片** (question): 提取论文的核心研究问题、假设或研究目标。每张卡片应包含：\n   - title: 简短的问题标题（≤20字符）\n   - content: 问题的详细描述（1-2句话）\n   - confidence: 问题明确度评分（0-100）',
      'method': '🔵 **方法卡片** (method): 提取研究的关键方法、实验设计或技术手段。每张卡片应包含：\n   - title: 方法名称（≤20字符）\n   - content: 方法的详细描述（1-2句话，包含技术细节）\n   - confidence: 方法清晰度评分（0-100）',
      'finding': '🟢 **发现卡片** (finding): 提取研究的关键发现、实验结果或数据洞察。每张卡片应包含：\n   - title: 发现的简短总结（≤20字符）\n   - content: 发现的详细描述（1-2句话，包含具体数据）\n   - confidence: 数据可信度评分（0-100）',
      'limitation': '🟡 **局限性卡片** (limitation): 提取研究的局限性、未解决问题或未来工作方向。每张卡片应包含：\n   - title: 局限性的简短标题（≤20字符）\n   - content: 局限性的详细描述（1-2句话）\n   - confidence: 问题严重度评分（0-100）',
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

**评判标准：**
- 问题卡片：研究边界是否清晰，问题是否具体
- 方法卡片：技术术语是否准确，实验细节是否完整
- 发现卡片：是否有数据支撑，结果是否明确
- 局限性卡片：是否指出作者未明说的问题，是否具有洞察力`;
  }

  /**
   * 调用Claude API生成卡片
   */
  private async callClaudeForCards(
    prompt: string,
    paperId: number,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<Omit<AIClueCard, 'id'>[]> {
    try {
      let fullText = '';
      let lastProgress = 30;

      fullText = await aiService.generateText({
        prompt,
        maxTokens: 3000,
        onProgress: (chunk) => {
          fullText += chunk;
          const progress = Math.min(90, 30 + Math.floor(fullText.length / 50));
          if (progress > lastProgress) {
            onProgress?.('生成中...', progress);
            lastProgress = progress;
          }
        },
      });

      // 解析JSON响应
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应中的JSON数组');
      }

      const cardsData = JSON.parse(jsonMatch[0]);

      // 转换为AIClueCard格式
      const cards: Omit<AIClueCard, 'id'>[] = cardsData.map((card: any) => ({
        paperId,
        type: card.type,
        source: 'ai-generated' as ClueCardSource,
        title: card.title,
        content: card.content,
        pageNumber: card.pageNumber,
        confidence: card.confidence || 80,
        isExpanded: false, // HCI：默认折叠
        createdAt: new Date().toISOString(),
      }));

      return cards;
    } catch (error: any) {
      throw new Error(`GLM API调用失败: ${error.message}`);
    }
  }

  /**
   * 获取论文的所有线索卡片
   */
  async getClueCards(paperId: number): Promise<AIClueCard[]> {
    return await dbHelpers.getClueCards(paperId);
  }

  /**
   * 根据筛选条件获取线索卡片
   */
  async getClueCardsFiltered(paperId: number, filter: ClueCardFilter): Promise<AIClueCard[]> {
    let cards = await dbHelpers.getClueCards(paperId);

    // 应用筛选条件
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
   * 排序线索卡片
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
   * 更新线索卡片
   */
  async updateClueCard(id: number, changes: Partial<AIClueCard>): Promise<number> {
    return await dbHelpers.updateClueCard(id, changes);
  }

  /**
   * 删除线索卡片
   */
  async deleteClueCard(id: number): Promise<void> {
    await dbHelpers.deleteClueCard(id);
  }

  /**
   * 删除论文的所有线索卡片
   */
  async deleteClueCardsByPaper(paperId: number): Promise<void> {
    await dbHelpers.deleteClueCardsByPaper(paperId);
  }

  /**
   * 获取线索卡片统计信息
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
        'question': cards.filter((c: AIClueCard) => c.type === 'question').length,
        'method': cards.filter((c: AIClueCard) => c.type === 'method').length,
        'finding': cards.filter((c: AIClueCard) => c.type === 'finding').length,
        'limitation': cards.filter((c: AIClueCard) => c.type === 'limitation').length,
      } as Record<ClueCardType, number>,
      bySource: {
        'clip-summary': cards.filter((c: AIClueCard) => c.source === 'clip-summary').length || 0,
        'structured-info': cards.filter((c: AIClueCard) => c.source === 'structured-info').length || 0,
        'custom-insight': cards.filter((c: AIClueCard) => c.source === 'custom-insight').length || 0,
        'ai-generated': cards.filter((c: AIClueCard) => c.source === 'ai-generated').length || 0,
        'rule-based': cards.filter((c: AIClueCard) => c.source === 'rule-based').length || 0,
        'demo-data': cards.filter((c: AIClueCard) => c.source === 'demo-data').length || 0,
      } as Record<ClueCardSource, number>,
      avgConfidence: cards.length > 0
        ? cards.reduce((sum: number, c: AIClueCard) => sum + c.confidence, 0) / cards.length
        : 0,
    };
  }

  /**
   * 从Clip Summary生成卡片
   */
  async generateCardsFromClipSummary(
    paperId: number,
    summary: string[],
    confidence: number
  ): Promise<AIClueCard[]> {
    const cards: Omit<AIClueCard, 'id'>[] = [];

    // 将3句话摘要转换为3张卡片
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
          confidence,
          isExpanded: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // 保存到数据库
    const savedCards: AIClueCard[] = [];
    for (const card of cards) {
      const cardId = await dbHelpers.addClueCard(card);
      savedCards.push({ ...card, id: cardId });
    }

    return savedCards;
  }

  /**
   * 从结构化信息生成卡片
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

    // 研究问题卡片
    cards.push({
      paperId,
      type: 'question',
      source: 'structured-info',
      title: '核心研究问题',
      content: structuredInfo.researchQuestion,
      confidence,
      isExpanded: false,
      createdAt: new Date().toISOString(),
    });

    // 方法卡片
    structuredInfo.methodology.forEach((method, index) => {
      cards.push({
        paperId,
        type: 'method',
        source: 'structured-info',
        title: `方法 ${index + 1}`,
        content: method,
        confidence,
        isExpanded: false,
        createdAt: new Date().toISOString(),
      });
    });

    // 发现卡片
    structuredInfo.findings.forEach((finding, index) => {
      cards.push({
        paperId,
        type: 'finding',
        source: 'structured-info',
        title: `发现 ${index + 1}`,
        content: finding,
        confidence,
        isExpanded: false,
        createdAt: new Date().toISOString(),
      });
    });

    // 局限性卡片（从结论中提取）
    cards.push({
      paperId,
      type: 'limitation',
      source: 'structured-info',
      title: '研究结论',
      content: structuredInfo.conclusions,
      confidence,
      isExpanded: false,
      createdAt: new Date().toISOString(),
    });

    // 保存到数据库
    const savedCards: AIClueCard[] = [];
    for (const card of cards) {
      const cardId = await dbHelpers.addClueCard(card);
      savedCards.push({ ...card, id: cardId });
    }

    return savedCards;
  }
}

// Export singleton instance
export const aiClueCardService = new AIClueCardService();
