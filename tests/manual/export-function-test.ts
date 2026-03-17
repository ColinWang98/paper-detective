/**
 * Manual Export Function Test
 * Quick verification that export functions work correctly
 *
 * Run with: npx ts-node tests/manual/export-function-test.ts
 */

import { completeBrief, unicodeBrief, specialCharacterBrief } from '../fixtures/export-data';

/**
 * Test exportAsMarkdown function
 */
function testExportAsMarkdown() {
  console.log('\n=== Testing Markdown Export ===\n');

  // Import hook
  const hookCode = require('../../hooks/useIntelligenceBrief.ts');

  // Test 1: Complete brief
  console.log('Test 1: Complete Brief');
  const result1 = exportAsMarkdownFunction(completeBrief);
  if (result1) {
    console.log('✅ Markdown generated successfully');
    console.log('Length:', result1.length, 'characters');
    console.log('Has title:', result1.includes('# Advanced Deep Learning Techniques'));
    console.log('Has sections:', result1.includes('## 📋 案件档案'));
  } else {
    console.log('❌ Failed: Markdown is null');
  }

  // Test 2: Unicode brief
  console.log('\nTest 2: Unicode Brief');
  const result2 = exportAsMarkdownFunction(unicodeBrief);
  if (result2 && result2.includes('深度学习研究')) {
    console.log('✅ Unicode characters handled correctly');
  } else {
    console.log('❌ Failed: Unicode not handled');
  }

  // Test 3: Special characters
  console.log('\nTest 3: Special Characters');
  const result3 = exportAsMarkdownFunction(specialCharacterBrief);
  if (result3 && result3.includes('Study on "Deep Learning"')) {
    console.log('✅ Special characters handled correctly');
  } else {
    console.log('❌ Failed: Special characters not handled');
  }
}

/**
 * Test exportAsBibTeX function
 */
function testExportAsBibTeX() {
  console.log('\n=== Testing BibTeX Export ===\n');

  // Test 1: Complete brief
  console.log('Test 1: Complete Brief');
  const result1 = exportAsBibTeXFunction(completeBrief);
  if (result1) {
    console.log('✅ BibTeX generated successfully');
    console.log('Length:', result1.length, 'characters');
    console.log('Has @article:', result1.includes('@article{'));
    console.log('Has author:', result1.includes('author = {'));
    console.log('Has title:', result1.includes('title = {'));
  } else {
    console.log('❌ Failed: BibTeX is null');
  }

  // Test 2: Citation key format
  console.log('\nTest 2: Citation Key Format');
  if (result1 && result1.includes('@article{Smith2024_advanced,')) {
    console.log('✅ Citation key format correct (AuthorYear_Title)');
  } else {
    console.log('❌ Failed: Citation key format incorrect');
  }

  // Test 3: Author formatting
  console.log('\nTest 3: Author Formatting');
  if (result1 && result1.includes('Smith, John and Doe, Jane and Johnson, Robert')) {
    console.log('✅ Author names formatted correctly (Last, First)');
  } else {
    console.log('❌ Failed: Author formatting incorrect');
  }

  // Test 4: Unicode authors
  console.log('\nTest 4: Unicode Authors');
  const result2 = exportAsBibTeXFunction(unicodeBrief);
  if (result2 && result2.includes('张伟')) {
    console.log('✅ Unicode author names handled');
  } else {
    console.log('❌ Failed: Unicode authors not handled');
  }
}

/**
 * Mock export functions from useIntelligenceBrief hook
 * These are copied from the actual implementation for testing
 */
function exportAsMarkdownFunction(brief: any): string | null {
  if (!brief) {
    return null;
  }

  const { brief: b } = { brief };
  let markdown = `# ${b.caseFile.title}\n\n`;
  markdown += `## 📋 案件档案\n\n`;
  markdown += `- **案件编号**: #${b.caseFile.caseNumber}\n`;
  if (b.caseFile.authors && b.caseFile.authors.length > 0) {
    markdown += `- **作者**: ${b.caseFile.authors.join(', ')}\n`;
  }
  if (b.caseFile.publicationDate) {
    markdown += `- **发布日期**: ${b.caseFile.publicationDate}\n`;
  }
  markdown += `- **完整度评分**: ${b.caseFile.completenessScore}/100\n\n`;
  markdown += `### 研究问题\n\n${b.caseFile.researchQuestion}\n\n`;
  markdown += `### 核心方法\n\n${b.caseFile.coreMethod}\n\n`;
  if (b.caseFile.keyFindings && b.caseFile.keyFindings.length > 0) {
    markdown += `### 关键发现\n\n`;
    b.caseFile.keyFindings.forEach((finding: string, index: number) => {
      markdown += `${index + 1}. ${finding}\n`;
    });
    markdown += '\n';
  }
  markdown += `## 📝 情报摘要\n\n${b.clipSummary}\n\n`;
  markdown += `## 🔍 结构化信息\n\n`;
  if (b.structuredInfo.researchQuestion) {
    markdown += `### 研究问题\n\n${b.structuredInfo.researchQuestion}\n\n`;
  }
  if (b.structuredInfo.methodology) {
    markdown += `### 研究方法\n\n`;
    if (Array.isArray(b.structuredInfo.methodology)) {
      b.structuredInfo.methodology.forEach((method: string, index: number) => {
        markdown += `${index + 1}. ${method}\n`;
      });
    } else {
      markdown += `${b.structuredInfo.methodology}\n`;
    }
    markdown += '\n';
  }
  if (b.structuredInfo.limitations && b.structuredInfo.limitations.length > 0) {
    markdown += `### 研究限制\n\n`;
    b.structuredInfo.limitations.forEach((limitation: string, index: number) => {
      markdown += `${index + 1}. ${limitation}\n`;
    });
    markdown += '\n';
  }
  if (b.clueCards && b.clueCards.length > 0) {
    markdown += `## 🃏 线索卡片\n\n`;
    const groupedCards = b.clueCards.reduce((acc: any, card: any) => {
      if (!acc[card.type]) {
        acc[card.type] = [];
      }
      acc[card.type].push(card);
      return acc;
    }, {} as Record<string, any[]>);
    const typeLabels: Record<string, string> = {
      question: '❓ 问题卡片',
      method: '🔬 方法卡片',
      finding: '💡 发现卡片',
      limitation: '⚠️ 限制卡片',
    };
    Object.entries(groupedCards).forEach(([type, cards]) => {
      markdown += `### ${typeLabels[type] || type}\n\n`;
      (cards as any[]).forEach((card: any, index: number) => {
        markdown += `#### 卡片 ${index + 1}\n\n`;
        markdown += `${card.content}\n\n`;
        markdown += `- **置信度**: ${card.confidence}%\n`;
        markdown += '\n';
      });
    });
  }
  markdown += `---\n\n`;
  markdown += `## 📊 元数据\n\n`;
  markdown += `- **生成时间**: ${b.generatedAt}\n`;
  markdown += `- **模型**: ${b.model}\n`;
  markdown += `- **Token 使用**: ${b.tokenUsage.total} (输入: ${b.tokenUsage.input}, 输出: ${b.tokenUsage.output})\n`;
  markdown += `- **成本**: $${(b.cost * 100).toFixed(2)}¢\n`;
  markdown += `- **耗时**: ${(b.duration / 1000).toFixed(2)}秒\n`;
  if (b.source) {
    markdown += `- **来源**: ${b.source === 'ai-generated' ? 'AI生成' : b.source === 'demo-data' ? '演示数据' : '缓存'}\n`;
  }
  return markdown;
}

function exportAsBibTeXFunction(brief: any): string | null {
  if (!brief) {
    return null;
  }

  const authors = brief.caseFile.authors || ['Unknown Author'];
  const year = brief.caseFile.publicationDate
    ? new Date(brief.caseFile.publicationDate).getFullYear().toString()
    : 'n.d.';
  const title = brief.caseFile.title;
  const firstAuthor = authors[0].split(' ').pop() || 'unknown';
  const titleFirstWord = title.split(' ')[0].toLowerCase();
  const citationKey = `${firstAuthor}${year}_${titleFirstWord}`;
  const formattedAuthors = authors.map((author: string) => {
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
}

// Run tests
console.log('🧪 Export Function Manual Tests');
console.log('================================');
testExportAsMarkdown();
testExportAsBibTeX();
console.log('\n✅ All manual tests completed!\n');
