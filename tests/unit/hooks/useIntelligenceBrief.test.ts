/**
 * useIntelligenceBrief Hook Export Functionality Tests
 * Testing exportAsMarkdown and exportAsBibTeX functions
 * Story 2.2.2: Intelligence Briefing - Export Features
 *
 * Test Coverage Target: >85%
 */

import { renderHook, act } from '@testing-library/react';
import { usePaperStore } from '@/lib/store';
import {
  completeBrief,
  specialCharacterBrief,
  unicodeBrief,
  minimalBrief,
  manyAuthorsBrief,
  noAuthorsBrief,
} from '../../fixtures/export-data';

// Mock the paper store
jest.mock('@/lib/store');

// Mock PDF module
jest.mock('@/lib/pdf', () => ({
  extractPDFText: jest.fn(() => Promise.resolve('PDF text content')),
}));

// Mock fetch API
global.fetch = jest.fn();

// We need to dynamically import the hook after mocking dependencies
let useIntelligenceBrief: any;

describe('useIntelligenceBrief - Export Functionality', () => {
  beforeAll(async () => {
    // Import the hook after all mocks are set up
    const module = await import('@/hooks/useIntelligenceBrief');
    useIntelligenceBrief = module.useIntelligenceBrief;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (usePaperStore as unknown as jest.Mock).mockReturnValue({
      currentPaper: { id: 142 },
      highlights: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('exportAsMarkdown', () => {
    it('should generate markdown for complete brief', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      // Simulate having a brief
      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).not.toBeNull();
      expect(markdown).toContain('# Advanced Deep Learning Techniques for Computer Vision');
      expect(markdown).toContain('## 📋 案件档案');
      expect(markdown).toContain('## 📝 情报摘要');
      expect(markdown).toContain('## 🔍 结构化信息');
      expect(markdown).toContain('## 🃏 线索卡片');
      expect(markdown).toContain('## 📊 元数据');
    });

    it('should include case file metadata', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('**案件编号**: #142');
      expect(markdown).toContain('**作者**: John Smith, Jane Doe, Robert Johnson');
      expect(markdown).toContain('**发布日期**: 2024-01-15');
      expect(markdown).toContain('**完整度评分**: 92/100');
      expect(markdown).toContain('**标签**: deep learning, computer vision, CNN');
    });

    it('should include research question and core method', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('### 研究问题');
      expect(markdown).toContain('How can deep learning improve computer vision accuracy?');
      expect(markdown).toContain('### 核心方法');
      expect(markdown).toContain('Convolutional Neural Networks (CNNs) with attention mechanisms');
    });

    it('should include key findings as numbered list', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('### 关键发现');
      expect(markdown).toContain('1. CNNs achieve 95% accuracy on ImageNet benchmark');
      expect(markdown).toContain('2. Attention mechanisms improve interpretability');
      expect(markdown).toContain('3. Transfer learning reduces training time by 60%');
    });

    it('should include clip summary', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('## 📝 情报摘要');
      expect(markdown).toContain('This study explores advanced deep learning techniques');
    });

    it('should include structured information sections', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('### 研究方法');
      expect(markdown).toContain('1. Convolutional Neural Networks');
      expect(markdown).toContain('2. Attention Mechanisms');

      expect(markdown).toContain('### 研究发现');
      expect(markdown).toContain('1. ResNet-50 outperforms VGG16 by 15%');

      expect(markdown).toContain('### 研究限制');
      expect(markdown).toContain('1. Computational cost is high');
      expect(markdown).toContain('2. Requires large labeled datasets');
    });

    it('should include clue cards grouped by type', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('## 🃏 线索卡片');
      expect(markdown).toContain('### ❓ 问题卡片');
      expect(markdown).toContain('### 🔬 方法卡片');
      expect(markdown).toContain('### 💡 发现卡片');
      expect(markdown).toContain('#### 卡片 1');
      expect(markdown).toContain('**置信度**: 95%');
    });

    it('should include user highlights', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('## 🎯 用户高亮');
      expect(markdown).toContain('1. Key finding: Attention mechanisms improve interpretability');
      expect(markdown).toContain('2. Methodology uses transfer learning for efficiency');
    });

    it('should include metadata', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('## 📊 元数据');
      expect(markdown).toContain('**生成时间**: 2024-01-15T10:00:00Z');
      expect(markdown).toContain('**模型**: claude-sonnet-4-5-20250514');
      expect(markdown).toContain('**Token 使用**: 3700 (输入: 2500, 输出: 1200)');
      expect(markdown).toContain('**成本**: $1.11¢');
      expect(markdown).toContain('**耗时**: 2.50秒');
      expect(markdown).toContain('**来源**: AI生成');
    });

    it('should handle special characters in title', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = specialCharacterBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('Study on "Deep Learning" & Neural Networks <AI/ML>');
    });

    it('should handle unicode characters', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = unicodeBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toContain('深度学习研究：Advance Techniques in 中文人工智能 🎯');
      expect(markdown).toContain('张伟');
      expect(markdown).toContain('李娜');
      expect(markdown).toContain('王芳');
    });

    it('should handle empty clue cards', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = minimalBrief;
      });

      const markdown = result.current.exportAsMarkdown();

      // Should still generate markdown even with empty data
      expect(markdown).not.toBeNull();
      expect(markdown).toContain('# Minimal Study');
    });

    it('should return null when brief is null', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      const markdown = result.current.exportAsMarkdown();

      expect(markdown).toBeNull();
    });
  });

  describe('exportAsBibTeX', () => {
    it('should generate BibTeX for complete brief', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).not.toBeNull();
      expect(bibtex).toContain('@article{');
      expect(bibtex).toContain('author = {');
      expect(bibtex).toContain('title = {');
      expect(bibtex).toContain('year = {');
      expect(bibtex).toContain('}');
    });

    it('should format author names correctly', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('Smith, John and Doe, Jane and Johnson, Robert');
    });

    it('should generate citation key from first author, year, and first word', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('@article{Smith2024_advanced,');
    });

    it('should include title', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('title = {Advanced Deep Learning Techniques for Computer Vision}');
    });

    it('should extract year from publication date', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('year = {2024}');
    });

    it('should include keywords if tags are present', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('keywords = {deep learning, computer vision, CNN}');
    });

    it('should include abstract if research question is present', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('abstract = {How can deep learning improve computer vision accuracy?}');
    });

    it('should include model note if model is present', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('note = {Analyzed with claude-sonnet-4-5-20250514}');
    });

    it('should handle multiple authors', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = manyAuthorsBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('One, Author and Two, Author and Three, Author and Four, Author and Five, Author');
    });

    it('should handle no authors', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = noAuthorsBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('author = {Unknown Author}');
    });

    it('should handle unicode characters', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = unicodeBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('张伟');
      expect(bibtex).toContain('李娜');
      expect(bibtex).toContain('王芳');
    });

    it('should handle special characters in title', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = specialCharacterBrief;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('Study on "Deep Learning" & Neural Networks <AI/ML>');
    });

    it('should return null when brief is null', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toBeNull();
    });

    it('should handle missing publication date', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      const briefNoDate = { ...completeBrief, caseFile: { ...completeBrief.caseFile, publicationDate: undefined as any } };

      act(() => {
        result.current.brief = briefNoDate;
      });

      const bibtex = result.current.exportAsBibTeX();

      expect(bibtex).toContain('year = {n.d.}');
    });

    it('should handle missing tags', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      const briefNoTags = { ...completeBrief, caseFile: { ...completeBrief.caseFile, tags: undefined as any } };

      act(() => {
        result.current.brief = briefNoTags;
      });

      const bibtex = result.current.exportAsBibTeX();

      // Should not include keywords field
      expect(bibtex).not.toContain('keywords = ');
    });
  });

  describe('Performance - Export Functions', () => {
    it('should export markdown for large brief efficiently', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      const largeBrief = {
        ...completeBrief,
        userHighlights: {
          total: 500,
          byPriority: { critical: 100, important: 200, interesting: 200 },
          topHighlights: Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            paperId: 142,
            pageNumber: Math.floor(i / 3) + 1,
            text: `Highlight number ${i + 1} with some descriptive text`,
            priority: i % 3 === 0 ? 'critical' : i % 3 === 1 ? 'important' : 'interesting',
            color: i % 3 === 0 ? 'red' : i % 3 === 1 ? 'yellow' : 'green',
            position: { x: 100, y: 100 + i * 20, width: 200, height: 20 },
            timestamp: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-15T10:00:00Z',
          })),
        },
        clueCards: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          paperId: 142,
          type: i % 4 === 0 ? 'question' : i % 4 === 1 ? 'method' : i % 4 === 2 ? 'finding' : 'limitation',
          source: 'ai-generated',
          title: `Card ${i + 1}`,
          content: `Content for card ${i + 1}`,
          confidence: 70 + (i % 30),
          isExpanded: false,
          createdAt: '2024-01-15T10:00:00Z',
        })),
      };

      act(() => {
        result.current.brief = largeBrief;
      });

      const startTime = performance.now();
      const markdown = result.current.exportAsMarkdown();
      const endTime = performance.now();

      expect(markdown).not.toBeNull();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1 second
    });

    it('should export BibTeX for large brief efficiently', () => {
      const { result } = renderHook(() =>
        useIntelligenceBrief()
      );

      act(() => {
        result.current.brief = completeBrief;
      });

      const startTime = performance.now();
      const bibtex = result.current.exportAsBibTeX();
      const endTime = performance.now();

      expect(bibtex).not.toBeNull();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });
  });
});
