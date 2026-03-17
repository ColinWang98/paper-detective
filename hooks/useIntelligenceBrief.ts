// useIntelligenceBrief Hook - Story 2.2.2
// React hook for Intelligence Brief state management

import { useState, useCallback, useEffect } from 'react';

import { extractPDFText } from '@/lib/pdf';
import { usePaperStore } from '@/lib/store';
import type { IntelligenceBrief, GenerateBriefOptions } from '@/types/ai.types';

/**
 * Hook options
 */
export interface UseIntelligenceBriefOptions {
  onProgress?: (stage: string, progress: number) => void;
  onBriefGenerated?: (brief: IntelligenceBrief) => void;
  onError?: (error: string) => void;
}

/**
 * Intelligence Brief state interface
 */
export interface IntelligenceBriefStateValue {
  status: 'idle' | 'loading' | 'generating' | 'success' | 'error';
  brief: IntelligenceBrief | null;
  error: string | null;
  currentStage: string;
  progress: number; // 0-100
}

/**
 * React hook for Intelligence Brief management
 * Combines Clip summary, structured info, and AI clue cards
 */
export function useIntelligenceBrief(options: UseIntelligenceBriefOptions = {}) {
  const { onProgress, onBriefGenerated, onError } = options;

  // Zustand store
  const { currentPaper, highlights } = usePaperStore();

  // State
  const [state, setState] = useState<IntelligenceBriefStateValue>({
    status: 'idle',
    brief: null,
    error: null,
    currentStage: '',
    progress: 0,
  });

  // Load cached brief on mount
  useEffect(() => {
    if (currentPaper?.id) {
      loadCachedBrief(currentPaper.id);
    }
  }, [currentPaper?.id]);

  /**
   * Load cached brief from API
   */
  const loadCachedBrief = async (paperId: number) => {
    try {
      const response = await fetch(`/api/ai/intelligence-brief?paperId=${paperId}`);

      if (!response.ok) {
        throw new Error(`Failed to load cached brief: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          status: 'success',
          brief: result.data,
          progress: 100,
          currentStage: '从缓存加载',
        }));
      }
    } catch (error) {
      console.error('Failed to load cached brief:', error);
    }
  };

  /**
   * Generate complete Intelligence Brief via API
   * Automatically extracts PDF text and calls backend API
   */
  const generateBrief = useCallback(async (
    pdfFile?: File,
    forceRegenerate = false
  ) => {
    if (!currentPaper?.id) {
      const error = '请先选择论文';
      setState(prev => ({
        ...prev,
        status: 'error',
        error,
      }));
      onError?.(error);
      return;
    }

    setState(prev => ({
      ...prev,
      status: 'generating',
      error: null,
      currentStage: '准备生成',
      progress: 0,
    }));

    try {
      const paperId = currentPaper.id;

      // 1. Extract PDF text if file provided, otherwise use cached
      let pdfText = '';
      if (pdfFile) {
        onProgress?.('提取PDF文本', 5);
        pdfText = await extractPDFText(pdfFile);
      } else {
        // Try to get PDF text from paper metadata
        // This assumes you have a way to retrieve the PDF file or text
        onProgress?.('等待PDF文本', 5);
        // For now, we'll throw an error if no PDF file is provided
        throw new Error('请提供PDF文件以生成情报简报');
      }

      // 2. Call backend API to generate Intelligence Brief
      setState(prev => ({
        ...prev,
        currentStage: '生成情报简报',
        progress: 10,
      }));

      const response = await fetch('/api/ai/intelligence-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperId,
          pdfText,
          highlights,
          forceRegenerate,
        }),
      });

      // 3. Handle API response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          status: 'success',
          brief: result.data,
          progress: 100,
          currentStage: '完成',
          error: null,
        }));
        onBriefGenerated?.(result.data);
      } else {
        throw new Error('生成情报简报失败');
      }

    } catch (error) {
      let errorMessage = '生成情报简报失败';

      if (error instanceof Error) {
        // Handle specific API error codes
        if (error.message.includes('API_KEY_MISSING')) {
          errorMessage = '请先在设置中配置API Key';
        } else if (error.message.includes('INVALID_API_KEY')) {
          errorMessage = 'API Key无效，请检查设置';
        } else if (error.message.includes('RATE_LIMIT')) {
          errorMessage = 'API请求频率限制，请稍后再试';
        } else if (error.message.includes('NETWORK_ERROR')) {
          errorMessage = '网络错误，请检查连接';
        } else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        currentStage: '失败',
      }));
      onError?.(errorMessage);
    }
  }, [currentPaper?.id, highlights, onProgress, onBriefGenerated, onError]);

  /**
   * Regenerate brief (skip cache)
   */
  const regenerateBrief = useCallback(async (pdfFile?: File) => {
    return await generateBrief(pdfFile, true);
  }, [generateBrief]);

  /**
   * Export brief as markdown
   */
  const exportAsMarkdown = useCallback(() => {
    if (!state.brief) {
      return null;
    }

    const { brief } = state;

    // Format brief as markdown
    let markdown = `# ${brief.caseFile.title}\n\n`;

    // Case file metadata
    markdown += `## 📋 案件档案\n\n`;
    markdown += `- **案件编号**: #${brief.caseFile.caseNumber}\n`;
    if (brief.caseFile.authors && brief.caseFile.authors.length > 0) {
      markdown += `- **作者**: ${brief.caseFile.authors.join(', ')}\n`;
    }
    if (brief.caseFile.publicationDate) {
      markdown += `- **发布日期**: ${brief.caseFile.publicationDate}\n`;
    }
    if (brief.caseFile.tags && brief.caseFile.tags.length > 0) {
      markdown += `- **标签**: ${brief.caseFile.tags.join(', ')}\n`;
    }
    markdown += `- **完整度评分**: ${brief.caseFile.completenessScore}/100\n\n`;

    // Research question
    markdown += `### 研究问题\n\n${brief.caseFile.researchQuestion}\n\n`;

    // Core method
    markdown += `### 核心方法\n\n${brief.caseFile.coreMethod}\n\n`;

    // Key findings
    if (brief.caseFile.keyFindings && brief.caseFile.keyFindings.length > 0) {
      markdown += `### 关键发现\n\n`;
      brief.caseFile.keyFindings.forEach((finding, index) => {
        markdown += `${index + 1}. ${finding}\n`;
      });
      markdown += '\n';
    }

    // Clip summary
    markdown += `## 📝 情报摘要\n\n${brief.clipSummary}\n\n`;

    // Structured information
    markdown += `## 🔍 结构化信息\n\n`;

    if (brief.structuredInfo.researchQuestion) {
      markdown += `### 研究问题\n\n${brief.structuredInfo.researchQuestion}\n\n`;
    }

    if (brief.structuredInfo.methodology) {
      markdown += `### 研究方法\n\n`;
      if (Array.isArray(brief.structuredInfo.methodology)) {
        brief.structuredInfo.methodology.forEach((method, index) => {
          markdown += `${index + 1}. ${method}\n`;
        });
      } else {
        markdown += `${brief.structuredInfo.methodology}\n`;
      }
      markdown += '\n';
    }

    if (brief.structuredInfo.findings) {
      markdown += `### 研究发现\n\n`;
      if (Array.isArray(brief.structuredInfo.findings)) {
        brief.structuredInfo.findings.forEach((finding, index) => {
          markdown += `${index + 1}. ${finding}\n`;
        });
      } else {
        markdown += `- 问题数: ${brief.structuredInfo.findings.question}\n`;
        markdown += `- 方法数: ${brief.structuredInfo.findings.methods}\n`;
        markdown += `- 发现数: ${brief.structuredInfo.findings.findings}\n`;
        markdown += `- 限制数: ${brief.structuredInfo.findings.limitations}\n`;
      }
      markdown += '\n';
    }

    if (brief.structuredInfo.limitations && brief.structuredInfo.limitations.length > 0) {
      markdown += `### 研究限制\n\n`;
      brief.structuredInfo.limitations.forEach((limitation, index) => {
        markdown += `${index + 1}. ${limitation}\n`;
      });
      markdown += '\n';
    }

    // Clue cards
    if (brief.clueCards && brief.clueCards.length > 0) {
      markdown += `## 🃏 线索卡片\n\n`;

      const groupedCards = brief.clueCards.reduce((acc, card) => {
        if (!acc[card.type]) {
          acc[card.type] = [];
        }
        acc[card.type].push(card);
        return acc;
      }, {} as Record<string, typeof brief.clueCards>);

      const typeLabels: Record<string, string> = {
        question: '❓ 问题卡片',
        method: '🔬 方法卡片',
        finding: '💡 发现卡片',
        limitation: '⚠️ 限制卡片',
      };

      Object.entries(groupedCards).forEach(([type, cards]) => {
        markdown += `### ${typeLabels[type] || type}\n\n`;
        cards.forEach((card, index) => {
          markdown += `#### 卡片 ${index + 1}\n\n`;
          markdown += `${card.content}\n\n`;
          markdown += `- **置信度**: ${card.confidence}%\n`;
          // Note: evidence field not in AIClueCard type, skipping for now
          markdown += '\n';
        });
      });
    }

    // User highlights
    if (brief.userHighlights && brief.userHighlights.topHighlights && brief.userHighlights.topHighlights.length > 0) {
      markdown += `## 🎯 用户高亮\n\n`;
      brief.userHighlights.topHighlights.forEach((highlight, index) => {
        markdown += `${index + 1}. ${highlight.text}\n`;
        if (highlight.note) {
          markdown += `   _笔记: ${highlight.note}_\n`;
        }
      });
      markdown += '\n';
    }

    // Metadata
    markdown += `---\n\n`;
    markdown += `## 📊 元数据\n\n`;
    markdown += `- **生成时间**: ${brief.generatedAt}\n`;
    markdown += `- **模型**: ${brief.model}\n`;
    markdown += `- **Token 使用**: ${brief.tokenUsage.total} (输入: ${brief.tokenUsage.input}, 输出: ${brief.tokenUsage.output})\n`;
    markdown += `- **成本**: $${(brief.cost * 100).toFixed(2)}¢\n`;
    markdown += `- **耗时**: ${(brief.duration / 1000).toFixed(2)}秒\n`;
    if (brief.source) {
      markdown += `- **来源**: ${brief.source === 'ai-generated' ? 'AI生成' : brief.source === 'demo-data' ? '演示数据' : '缓存'}\n`;
    }

    return markdown;
  }, [state.brief]);

  /**
   * Delete cached brief via API
   */
  const deleteBrief = useCallback(async () => {
    if (!currentPaper?.id) {
      return;
    }

    try {
      const response = await fetch(`/api/ai/intelligence-brief?paperId=${currentPaper.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete brief: ${response.statusText}`);
      }

      setState(prev => ({
        ...prev,
        status: 'idle',
        brief: null,
        progress: 0,
        currentStage: '',
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除情报简报失败';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  }, [currentPaper?.id, onError]);

  /**
   * Export brief as BibTeX
   */
  const exportAsBibTeX = useCallback(() => {
    if (!state.brief) {
      return null;
    }

    const { brief } = state;

    // Generate BibTeX citation from case file metadata
    const authors = brief.caseFile.authors || ['Unknown Author'];
    const year = brief.caseFile.publicationDate
      ? new Date(brief.caseFile.publicationDate).getFullYear().toString()
      : 'n.d.';
    const title = brief.caseFile.title;

    // Generate a citation key from first author + year + first word of title
    const firstAuthor = authors[0].split(' ').pop() || 'unknown';
    const titleFirstWord = title.split(' ')[0].toLowerCase();
    const citationKey = `${firstAuthor}${year}_${titleFirstWord}`;

    // Format authors for BibTeX
    const formattedAuthors = authors.map(author => {
      const parts = author.split(' ');
      if (parts.length === 2) {
        return `${parts[1]}, ${parts[0]}`;
      }
      return author;
    }).join(' and ');

    let bibtex = `@article{${citationKey},\n`;
    bibtex += `  author = {${formattedAuthors}},\n`;
    bibtex += `  title = {${title}},\n`;
    bibtex += `  year = {${year}},\n`;

    // Add optional fields
    if (brief.caseFile.tags && brief.caseFile.tags.length > 0) {
      bibtex += `  keywords = {${brief.caseFile.tags.join(', ')}},\n`;
    }

    if (brief.caseFile.researchQuestion) {
      bibtex += `  abstract = {${brief.caseFile.researchQuestion}},\n`;
    }

    if (brief.model) {
      bibtex += `  note = {Analyzed with ${brief.model}},\n`;
    }

    bibtex += `}\n`;

    return bibtex;
  }, [state.brief]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      brief: null,
      error: null,
      currentStage: '',
      progress: 0,
    });
  }, []);

  return {
    // State
    status: state.status,
    brief: state.brief,
    error: state.error,
    currentStage: state.currentStage,
    progress: state.progress,

    // Computed values
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isGenerating: state.status === 'generating',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    hasBrief: state.brief !== null,

    // Actions
    generateBrief,
    regenerateBrief,
    exportAsMarkdown,
    exportAsBibTeX,
    deleteBrief,
    reset,

    // Quick access to brief data
    caseFile: state.brief?.caseFile || null,
    clipSummary: state.brief?.clipSummary || '',
    structuredInfo: state.brief?.structuredInfo || null,
    clueCards: state.brief?.clueCards || [],
    userHighlights: state.brief?.userHighlights || null,
    completenessScore: state.brief?.caseFile?.completenessScore || 0,
    tokenUsage: state.brief?.tokenUsage || { input: 0, output: 0, total: 0 },
    cost: state.brief?.cost || 0,
    duration: state.brief?.duration || 0,
  };
}

/**
 * Type exports
 */
export type { IntelligenceBrief };
