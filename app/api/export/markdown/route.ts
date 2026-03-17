/**
 * Export Intelligence Brief as Markdown
 * POST /api/export/markdown
 *
 * Generates markdown representation of intelligence brief
 * for download/export functionality
 *
 * Story 2.2.2: Intelligence Briefing - Markdown Export
 */

import { NextRequest } from 'next/server';

import {
  withErrorHandler,
  success,
  ValidationError,
} from '@/lib/api/response';
import type { IntelligenceBrief } from '@/types/ai.types';

/**
 * POST /api/export/markdown
 * Converts intelligence brief to markdown format
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse request body
  const body = await request.json();
  const { brief } = body;

  // Validate brief object
  if (!brief || typeof brief !== 'object') {
    throw ValidationError.forField('brief', 'Invalid brief: must provide IntelligenceBrief object');
  }

  // Validate required fields
  if (!brief.caseFile) {
    throw ValidationError.forField('brief.caseFile', 'Invalid brief: missing caseFile');
  }

  if (!brief.clipSummary) {
    throw ValidationError.forField('brief.clipSummary', 'Invalid brief: missing clipSummary');
  }

  if (!brief.structuredInfo) {
    throw ValidationError.forField('brief.structuredInfo', 'Invalid brief: missing structuredInfo');
  }

  // Generate markdown
  const markdown = generateMarkdown(brief as IntelligenceBrief);

  // Return markdown content
  return success({
    markdown,
    filename: `brief-${brief.caseFile.caseNumber}-${brief.paperId}.md`,
    contentType: 'text/markdown',
  });
});

/**
 * Generate markdown from intelligence brief
 */
function generateMarkdown(brief: IntelligenceBrief): string {
  const sections: string[] = [];

  // Header
  sections.push(`# 情报简报: ${brief.caseFile.title}\n`);
  sections.push(`**案件编号**: #${brief.caseFile.caseNumber}\n`);

  // Optional metadata
  if (brief.caseFile.authors && brief.caseFile.authors.length > 0) {
    sections.push(`**作者**: ${brief.caseFile.authors.join(', ')}\n`);
  }
  if (brief.caseFile.publicationDate) {
    sections.push(`**发布日期**: ${brief.caseFile.publicationDate}\n`);
  }
  if (brief.caseFile.tags && brief.caseFile.tags.length > 0) {
    sections.push(`**标签**: ${brief.caseFile.tags.join(', ')}\n`);
  }
  sections.push(`**完整度评分**: ${brief.caseFile.completenessScore}/100\n`);
  sections.push(`**生成时间**: ${brief.generatedAt}\n\n`);

  // Research question
  sections.push(`## 研究问题\n\n${brief.caseFile.researchQuestion}\n\n`);

  // Core method
  sections.push(`## 核心方法\n\n${brief.caseFile.coreMethod}\n\n`);

  // Key findings
  if (brief.caseFile.keyFindings && brief.caseFile.keyFindings.length > 0) {
    sections.push(`## 关键发现\n\n`);
    brief.caseFile.keyFindings.forEach((finding, index) => {
      sections.push(`${index + 1}. ${finding}\n`);
    });
    sections.push('\n');
  }

  // Clip summary
  sections.push(`## 📝 情报摘要\n\n${brief.clipSummary}\n\n`);

  // Structured information
  sections.push(`## 🔍 结构化信息\n\n`);

  if (brief.structuredInfo.researchQuestion) {
    sections.push(`### 研究问题\n\n${brief.structuredInfo.researchQuestion}\n\n`);
  }

  // Methodology (can be string or array)
  if (brief.structuredInfo.methodology) {
    sections.push(`### 研究方法\n\n`);
    if (Array.isArray(brief.structuredInfo.methodology)) {
      brief.structuredInfo.methodology.forEach((method, index) => {
        sections.push(`${index + 1}. ${method}\n`);
      });
    } else {
      sections.push(`${brief.structuredInfo.methodology}\n`);
    }
    sections.push('\n');
  }

  // Methods (alternative field)
  if (brief.structuredInfo.methods) {
    sections.push(`### 研究方法\n\n`);
    if (Array.isArray(brief.structuredInfo.methods)) {
      brief.structuredInfo.methods.forEach((method, index) => {
        sections.push(`${index + 1}. ${method}\n`);
      });
    } else {
      sections.push(`${String(brief.structuredInfo.methods)}\n`);
    }
    sections.push('\n');
  }

  // Findings
  if (brief.structuredInfo.findings) {
    sections.push(`### 研究发现\n\n`);
    if (Array.isArray(brief.structuredInfo.findings)) {
      brief.structuredInfo.findings.forEach((finding, index) => {
        sections.push(`${index + 1}. ${finding}\n`);
      });
    } else if (typeof brief.structuredInfo.findings === 'object') {
      // Handle confidence object format
      const findings = brief.structuredInfo.findings as Record<string, number>;
      sections.push(`- 研究问题数: ${findings.question || 0}\n`);
      sections.push(`- 方法数: ${findings.methods || 0}\n`);
      sections.push(`- 发现数: ${findings.findings || 0}\n`);
      sections.push(`- 限制数: ${findings.limitations || 0}\n`);
    }
    sections.push('\n');
  }

  // Limitations
  if (brief.structuredInfo.limitations && brief.structuredInfo.limitations.length > 0) {
    sections.push(`### 研究限制\n\n`);
    brief.structuredInfo.limitations.forEach((limitation, index) => {
      sections.push(`${index + 1}. ${limitation}\n`);
    });
    sections.push('\n');
  }

  // Conclusions (if available)
  if (brief.structuredInfo.conclusions) {
    sections.push(`### 结论\n\n`);
    if (Array.isArray(brief.structuredInfo.conclusions)) {
      brief.structuredInfo.conclusions.forEach((conclusion, index) => {
        sections.push(`${index + 1}. ${conclusion}\n`);
      });
    } else {
      sections.push(`${brief.structuredInfo.conclusions}\n`);
    }
    sections.push('\n');
  }

  // Clue cards
  if (brief.clueCards && brief.clueCards.length > 0) {
    sections.push(`## 🃏 线索卡片\n\n`);

    // Group cards by type
    const groupedCards = brief.clueCards.reduce((acc, card) => {
      if (!acc[card.type]) {
        acc[card.type] = [];
      }
      acc[card.type].push(card);
      return acc;
    }, {} as Record<string, typeof brief.clueCards>);

    // Type labels
    const typeLabels: Record<string, string> = {
      question: '🔴 问题卡片',
      method: '🔵 方法卡片',
      finding: '💡 发现卡片',
      limitation: '⚠️ 限制卡片',
    };

    // Output cards by type
    Object.entries(groupedCards).forEach(([type, cards]) => {
      sections.push(`### ${typeLabels[type] || type}\n\n`);

      cards.forEach((card, index) => {
        sections.push(`#### 卡片 ${index + 1}\n\n`);
        sections.push(`**标题**: ${card.title}\n\n`);
        sections.push(`${card.content}\n\n`);
        sections.push(`**置信度**: ${card.confidence}%\n`);
        if (card.pageNumber) {
          sections.push(`**页码**: ${card.pageNumber}\n`);
        }
        sections.push('\n');
      });
    });
  }

  // User highlights (if available)
  if (brief.userHighlights && brief.userHighlights.topHighlights && brief.userHighlights.topHighlights.length > 0) {
    sections.push(`## 📌 用户高亮\n\n`);

    brief.userHighlights.topHighlights.forEach((highlight, index) => {
      sections.push(`### 高亮 ${index + 1}\n\n`);
      sections.push(`> ${highlight.text}\n\n`);
      if (highlight.note) {
        sections.push(`**笔记**: ${highlight.note}\n\n`);
      }
      if (highlight.pageNumber) {
        sections.push(`**页码**: ${highlight.pageNumber}\n`);
      }
      sections.push(`**优先级**: ${highlight.priority}\n\n`);
    });

    sections.push(`**总高亮数**: ${brief.userHighlights.total}\n\n`);
  }

  // Metadata footer
  sections.push(`---\n\n`);
  sections.push(`## 📊 生成元数据\n\n`);
  sections.push(`- **模型**: ${brief.model}\n`);
  sections.push(`- **Token使用**: ${brief.tokenUsage.total}\n`);
  sections.push(`- **输入Token**: ${brief.tokenUsage.input}\n`);
  sections.push(`- **输出Token**: ${brief.tokenUsage.output}\n`);
  sections.push(`- **生成成本**: $${(brief.cost * 100).toFixed(2)}¢\n`);
  sections.push(`- **耗时**: ${brief.duration}ms\n`);
  if (brief.source) {
    const sourceLabel = {
      'ai-generated': 'AI生成',
      'demo-data': '演示数据',
      'cache': '缓存',
    }[brief.source] || brief.source;
    sections.push(`- **来源**: ${sourceLabel}\n`);
  }

  // Completeness breakdown
  if (brief.completeness) {
    sections.push(`\n### 完整度详情\n\n`);
    sections.push(`- **Clip摘要**: ${brief.completeness.clipSummary ? '✅' : '❌'}\n`);
    sections.push(`- **结构化信息**: ${brief.completeness.structuredInfo ? '✅' : '❌'}\n`);
    sections.push(`- **线索卡片**: ${brief.completeness.clueCards ? '✅' : '❌'}\n`);
    sections.push(`- **用户高亮**: ${brief.completeness.userHighlights ? '✅' : '❌'}\n`);
    sections.push(`- **总体评分**: ${brief.completeness.overall}%\n`);
  }

  return sections.join('');
}

/**
 * GET /api/export/markdown (health check)
 */
export const GET = withErrorHandler(async () => {
  return success({
    status: 'ok',
    service: 'markdown-export',
    version: '1.0.0',
  });
});
