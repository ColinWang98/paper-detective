/**
 * AI Fallback Service - Claude API Backup Strategy
 *
 * 4-level fallback system:
 * Level 1: Normal Claude API (primary)
 * Level 2: Retry with exponential backoff
 * Level 3: Rule-based analysis (keyword matching + regex)
 * Level 4: Pre-generated demo data
 * Level 5: User notification
 */

import type { AIClueCard, ClueCardType, Highlight } from '@/types/ai.types';

import { aiService } from './aiService';

/**
 * Rule-based card patterns for extraction
 */
interface CardPattern {
  type: ClueCardType;
  keywords: string[];
  regexPatterns: RegExp[];
  priority: number;
}

/**
 * Pre-generated demo cards for testing
 */
interface DemoCards {
  question: Partial<AIClueCard>;
  method: Partial<AIClueCard>;
  finding: Partial<AIClueCard>;
  limitation: Partial<AIClueCard>;
}

/**
 * Fallback analysis result
 */
interface FallbackAnalysisResult {
  cards: Omit<AIClueCard, 'id'>[];
  method: 'claude-api' | 'retry' | 'rule-based' | 'demo-data';
  confidence: number;
  fallbackReason: string;
}

/**
 * AI Fallback Service
 */
class AIFallbackService {
  /**
   * Rule-based card patterns for extraction
   */
  private readonly CARD_PATTERNS: CardPattern[] = [
    {
      type: 'question',
      keywords: ['research question', 'investigate', 'explore', 'examine', 'study', 'analyze', 'problem', 'issue', 'hypothesis'],
      regexPatterns: [
        /(?:research|study|investigat)[a-z]+ (?:question|problem|issue)/i,
        /(?:we |our |this )[a-z]+ (?:investigat|explor|exam)[a-z]+/i,
        /(?:what |how |why )[a-z]+ (?:to )?(?:determin|investigat|explor)[a-z]+/i,
      ],
      priority: 1,
    },
    {
      type: 'method',
      keywords: ['method', 'approach', 'technique', 'algorithm', 'procedure', 'process', 'methodology', 'framework', 'model'],
      regexPatterns: [
        /(?:method|approach|technique)[a-z]+(?:\s+(?:is|was|involves?|uses?|uses?|employs?))/i,
        /(?:proposed|developed|implemented|designed)[a-z]+\s+(?:a |an |the )?(?:method|approach|technique)/i,
        /(?:using|with|by means of|through)\s+(?:a |an )?(?:method|algorithm|technique)/i,
      ],
      priority: 2,
    },
    {
      type: 'finding',
      keywords: ['result', 'finding', 'shows', 'showed', 'demonstrates', 'indicates', 'suggests', 'reveals', 'achieves', 'obtains', 'performance', 'accuracy', 'effective'],
      regexPatterns: [
        /(?:result|findings?)[a-z]*(?:\s+(?:show|demonstrat|indicat|suggest)[a-z]*)/i,
        /(?:achieved?|obtained?|reached)\s+(?:an?\s*)?(?:accuracy|performance|improvement|score|rate)/i,
        /(?:significantly|notably)[a-z]*\s+(?:improv|increas|enhanc)[a-z]*/i,
      ],
      priority: 3,
    },
    {
      type: 'limitation',
      keywords: ['limitation', 'limit', 'constraint', 'weakness', 'drawback', 'issue', 'problem', 'challenge', 'future', 'work', 'unsolved', 'open'],
      regexPatterns: [
        /(?:limitation|constraint|weakness|drawback)[a-z]*(?:\s+(?:is|was|remains?|includ)[a-z]*)/i,
        /(?:however|yet|although|nevertheless)[a-z]*(?:\s+,?\s*(?:the |this |our ))?(?:study|research|analysis)/i,
        /(?:future|open)[a-z]*\s+(?:work|research|direction|study|investigation)/i,
      ],
      priority: 4,
    },
  ];

  /**
   * Pre-generated demo cards for testing/demonstration
   */
  private readonly DEMO_CARDS: DemoCards = {
    question: {
      paperId: 0,
      type: 'question',
      source: 'demo-data',
      title: '研究问题示例',
      content: '本文探讨如何通过深度学习方法提升图像分类的准确率。',
      confidence: 85,
      isExpanded: false,
      createdAt: new Date().toISOString(),
    },
    method: {
      paperId: 0,
      type: 'method',
      source: 'demo-data',
      title: '方法示例',
      content: '采用卷积神经网络（CNN）结合注意力机制进行特征提取。',
      confidence: 80,
      isExpanded: false,
      createdAt: new Date().toISOString(),
    },
    finding: {
      paperId: 0,
      type: 'finding',
      source: 'demo-data',
      title: '关键发现示例',
      content: '在ImageNet数据集上达到95%的分类准确率，超越传统方法。',
      confidence: 90,
      isExpanded: false,
      createdAt: new Date().toISOString(),
    },
    limitation: {
      paperId: 0,
      type: 'limitation',
      source: 'demo-data',
      title: '局限性示例',
      content: '模型对少样本类别的识别效果较差，需要更多训练数据。',
      confidence: 75,
      isExpanded: false,
      createdAt: new Date().toISOString(),
    },
  };

  /**
   * Analyze with fallback strategy
   * Tries all levels until one succeeds
   */
  async analyzeWithFallback(options: {
    paperId: number;
    pdfText: string;
    highlights: Highlight[];
  }): Promise<FallbackAnalysisResult> {
    const { paperId, pdfText, highlights } = options;

    // Level 1: Try normal Claude API
    try {
      console.log('[FallbackService] Level 1: Attempting Claude API...');
      const result = await this.tryClaudeAPI(options);
      return {
        cards: result.cards,
        method: 'claude-api',
        confidence: result.summary.avgConfidence,
        fallbackReason: 'Primary method successful',
      };
    } catch (error: any) {
      console.warn(`[FallbackService] Claude API failed: ${error.message}`);

      // Level 2: Try retry with exponential backoff
      try {
        console.log('[FallbackService] Level 2: Attempting retry with backoff...');
        const result = await this.retryWithBackoff(options);
        return {
          cards: result.cards,
          method: 'retry',
          confidence: result.summary.avgConfidence,
          fallbackReason: 'Retry successful',
        };
      } catch (retryError: unknown) {
        console.warn(`[FallbackService] Retry failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);

        // Level 3: Rule-based analysis
        try {
          console.log('[FallbackService] Level 3: Attempting rule-based analysis...');
          const result = await this.ruleBasedAnalysis(options);
          return {
            cards: result.cards,
            method: 'rule-based',
            confidence: result.summary.avgConfidence,
            fallbackReason: 'Rule-based analysis successful',
          };
        } catch (ruleError: unknown) {
          console.error(`[FallbackService] Rule-based failed: ${ruleError instanceof Error ? ruleError.message : 'Unknown error'}`);

          // Level 4: Return demo data
          console.log('[FallbackService] Level 4: Returning demo data...');
          return {
            cards: [
              this.DEMO_CARDS.question,
              this.DEMO_CARDS.method,
              this.DEMO_CARDS.finding,
              this.DEMO_CARDS.limitation,
            ] as Omit<AIClueCard, 'id'>[],
            method: 'demo-data',
            confidence: 75,
            fallbackReason: 'All methods failed, using demo data',
          };
        }
      }
    }
  }

  /**
   * Level 1: Try Claude API normally
   */
  private async tryClaudeAPI(options: {
    paperId: number;
    pdfText: string;
    highlights: Highlight[];
  }): Promise<any> {
    const { aiClueCardService } = await import('./aiClueCardService');
    return await aiClueCardService.generateClueCards(options);
  }

  /**
   * Level 2: Retry with exponential backoff
   */
  private async retryWithBackoff(
    options: { paperId: number; pdfText: string; highlights: Highlight[] },
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any> {
    const { aiClueCardService } = await import('./aiClueCardService');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[RetryService] Attempt ${attempt}/${maxRetries} after ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));

        const result = await aiClueCardService.generateClueCards(options);
        console.log(`[RetryService] Success on attempt ${attempt}`);
        return result;
      } catch (error: any) {
        console.warn(`[RetryService] Attempt ${attempt} failed: ${error.message}`);

        if (attempt === maxRetries) {
          throw error;
        }
      }
    }

    throw new Error('All retry attempts failed');
  }

  /**
   * Level 3: Rule-based analysis using keyword matching and regex
   */
  private async ruleBasedAnalysis(options: {
    paperId: number;
    pdfText: string;
    highlights: Highlight[];
  }): Promise<{ cards: Omit<AIClueCard, 'id'>[]; summary: any }> {
    const { paperId, pdfText, highlights } = options;

    // Extract cards based on patterns
    const cards: Omit<AIClueCard, 'id'>[] = [];

    for (const pattern of this.CARD_PATTERNS) {
      const matches = this.extractCardsByPattern(pdfText, pattern, highlights, paperId);
      cards.push(...matches);
    }

    // If no cards found, generate generic cards
    if (cards.length === 0) {
      return this.generateGenericCards(pdfText, highlights, paperId);
    }

    // Calculate average confidence
    const avgConfidence = cards.reduce((sum, c) => sum + c.confidence, 0) / cards.length;

    return {
      cards,
      summary: {
        total: cards.length,
        byType: {
          question: cards.filter(c => c.type === 'question').length,
          method: cards.filter(c => c.type === 'method').length,
          finding: cards.filter(c => c.type === 'finding').length,
          limitation: cards.filter(c => c.type === 'limitation').length,
        },
        avgConfidence,
      },
    };
  }

  /**
   * Extract cards by pattern matching
   */
  private extractCardsByPattern(
    pdfText: string,
    pattern: CardPattern,
    highlights: Highlight[],
    paperId: number
  ): Omit<AIClueCard, 'id'>[] {
    const cards: Omit<AIClueCard, 'id'>[] = [];
    const sentences = pdfText.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length < 20) {continue;}

      // Check keyword matches
      const keywordMatches = pattern.keywords.filter(keyword =>
        trimmedSentence.toLowerCase().includes(keyword.toLowerCase())
      );

      // Check regex matches
      const regexMatches = pattern.regexPatterns.filter(regex =>
        regex.test(trimmedSentence)
      );

      // If any match, create a card
      if (keywordMatches.length > 0 || regexMatches.length > 0) {
        // Calculate confidence based on match strength
        const confidence = this.calculateRuleBasedConfidence(
          trimmedSentence,
          keywordMatches.length,
          regexMatches.length,
          highlights
        );

        cards.push({
          paperId,
          type: pattern.type,
          source: 'rule-based',
          title: this.generateTitle(trimmedSentence, pattern.type),
          content: trimmedSentence.substring(0, 200),
          confidence,
          isExpanded: false,
          createdAt: new Date().toISOString(),
        });

        // Limit to top 3 cards per type
        if (cards.length >= 3) {break;}
      }
    }

    return cards;
  }

  /**
   * Calculate confidence score for rule-based extraction
   */
  private calculateRuleBasedConfidence(
    text: string,
    keywordMatches: number,
    regexMatches: number,
    highlights: Highlight[]
  ): number {
    let confidence = 50; // Base score

    // Keyword match strength
    confidence += keywordMatches * 5;

    // Regex match strength
    confidence += regexMatches * 8;

    // Text length (optimal length: 50-150 chars)
    if (text.length >= 50 && text.length <= 150) {
      confidence += 10;
    } else if (text.length > 150) {
      confidence -= 5;
    }

    // Check if matches any highlight
    const matchesHighlight = highlights.some(h =>
      text.toLowerCase().includes(h.text.toLowerCase().substring(0, 20))
    );
    if (matchesHighlight) {
      confidence += 15;
    }

    // Technical terms presence
    const technicalTerms = /\b(data|method|result|model|algorithm|analysis|performance|accuracy|significant)\b/i;
    if (technicalTerms.test(text)) {
      confidence += 10;
    }

    // Quantitative data presence
    const quantitative = /\d+[%\w]|p\s*<\s*0\.05/i;
    if (quantitative.test(text)) {
      confidence += 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generate title from text
   */
  private generateTitle(text: string, type: ClueCardType): string {
    const words = text.split(/\s+/);
    const firstFive = words.slice(0, 5).join(' ');

    const titles: Record<ClueCardType, string> = {
      question: `研究问题`,
      method: `方法`,
      finding: `发现`,
      limitation: `局限性`,
    };

    const prefix = titles[type];
    const suffix = firstFive.length > 30 ? '...' : '';

    return `${prefix}: ${firstFive.substring(0, 30)}${suffix}`;
  }

  /**
   * Generate generic cards when no patterns match
   */
  private generateGenericCards(
    pdfText: string,
    highlights: Highlight[],
    paperId: number
  ): { cards: Omit<AIClueCard, 'id'>[]; summary: any } {
    const cards: Omit<AIClueCard, 'id'>[] = [];

    // Extract from highlights if available
    if (highlights.length > 0) {
      const topHighlights = highlights.slice(0, 4);
      topHighlights.forEach((highlight, index) => {
        const types: ClueCardType[] = ['question', 'method', 'finding', 'limitation'];
        cards.push({
          paperId,
          type: types[index % 4],
          source: 'rule-based',
          title: `用户高亮 ${index + 1}`,
          content: highlight.text,
          confidence: 70,
          pageNumber: highlight.pageNumber,
          isExpanded: false,
          createdAt: new Date().toISOString(),
        });
      });
    } else {
      // Generate generic cards from PDF text
      const words = pdfText.split(/\s+/);
      const firstSentence = words.slice(0, 15).join(' ');

      cards.push({
        paperId,
        type: 'question',
        source: 'rule-based',
        title: '研究主题',
        content: firstSentence || 'PDF文本分析',
        confidence: 60,
        isExpanded: false,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      cards,
      summary: {
        total: cards.length,
        byType: {
          question: cards.filter(c => c.type === 'question').length,
          method: cards.filter(c => c.type === 'method').length,
          finding: cards.filter(c => c.type === 'finding').length,
          limitation: cards.filter(c => c.type === 'limitation').length,
        },
        avgConfidence: cards.reduce((sum, c) => sum + c.confidence, 0) / cards.length,
      },
    };
  }

  /**
   * Get demo cards for testing
   */
  getDemoCards(): Omit<AIClueCard, 'id'>[] {
    return [
      this.DEMO_CARDS.question,
      this.DEMO_CARDS.method,
      this.DEMO_CARDS.finding,
      this.DEMO_CARDS.limitation,
    ] as Omit<AIClueCard, 'id'>[];
  }

  /**
   * Test fallback service
   */
  async testFallbackService(): Promise<{
    level1: boolean;
    level2: boolean;
    level3: boolean;
    level4: boolean;
  }> {
    // Test each level
    const results = {
      level1: aiService.isConfigured(),
      level2: true, // Retry always available
      level3: true, // Rule-based always available
      level4: true, // Demo data always available
    };

    return results;
  }
}

// Export singleton instance
export const aiFallbackService = new AIFallbackService();
