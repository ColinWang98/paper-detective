/**
 * Export Feature Test Fixtures
 * Test data for validating Markdown and BibTeX export functionality
 */

import type { IntelligenceBrief } from '@/types/ai.types';

/**
 * Complete brief with all fields populated
 */
export const completeBrief: IntelligenceBrief = {
  id: 1,
  paperId: 142,
  caseFile: {
    caseNumber: 142,
    title: 'Advanced Deep Learning Techniques for Computer Vision',
    researchQuestion: 'How can deep learning improve computer vision accuracy?',
    coreMethod: 'Convolutional Neural Networks (CNNs) with attention mechanisms',
    keyFindings: [
      'CNNs achieve 95% accuracy on ImageNet benchmark',
      'Attention mechanisms improve interpretability',
      'Transfer learning reduces training time by 60%',
    ],
    completenessScore: 92,
    authors: ['John Smith', 'Jane Doe', 'Robert Johnson'],
    publicationDate: '2024-01-15',
    tags: ['deep learning', 'computer vision', 'CNN'],
  },
  clipSummary: 'This study explores advanced deep learning techniques. We found that CNNs with attention achieve state-of-the-art results. Transfer learning significantly reduces training requirements.',
  structuredInfo: {
    researchQuestion: 'What are the most effective deep learning architectures for computer vision?',
    methodology: [
      'Convolutional Neural Networks',
      'Attention Mechanisms',
      'Transfer Learning',
      'Data Augmentation',
    ],
    findings: [
      'ResNet-50 outperforms VGG16 by 15%',
      'Self-attention improves feature extraction',
      'Fine-tuning reduces convergence time',
    ],
    limitations: [
      'Computational cost is high',
      'Requires large labeled datasets',
      'Black box nature limits interpretability',
    ],
    conclusions: 'Deep learning with attention mechanisms represents the current state-of-the-art for computer vision tasks.',
  },
  clueCards: [
    {
      id: 1,
      paperId: 142,
      type: 'question',
      source: 'ai-generated',
      title: 'Core Research Question',
      content: 'How can deep learning improve computer vision accuracy?',
      confidence: 95,
      isExpanded: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      paperId: 142,
      type: 'method',
      source: 'ai-generated',
      title: 'CNN Architecture',
      content: 'ResNet-50 with 50 layers and skip connections',
      confidence: 90,
      isExpanded: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 3,
      paperId: 142,
      type: 'finding',
      source: 'ai-generated',
      title: '95% Accuracy Achieved',
      content: 'CNNs achieved 95% accuracy on ImageNet benchmark dataset',
      confidence: 98,
      isExpanded: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
  ],
  userHighlights: {
    total: 15,
    byPriority: { critical: 5, important: 7, interesting: 3 },
    topHighlights: [
      {
        id: 1,
        paperId: 142,
        pageNumber: 3,
        text: 'Key finding: Attention mechanisms improve interpretability',
        priority: 'critical',
        color: 'red',
        position: { x: 100, y: 200, width: 250, height: 20 },
        timestamp: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 2,
        paperId: 142,
        pageNumber: 5,
        text: 'Methodology uses transfer learning for efficiency',
        priority: 'important',
        color: 'yellow',
        position: { x: 100, y: 300, width: 300, height: 20 },
        timestamp: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ],
  },
  tokenUsage: {
    input: 2500,
    output: 1200,
    total: 3700,
  },
  cost: 0.0111,
  duration: 2500,
  generatedAt: '2024-01-15T10:00:00Z',
  model: 'glm-4.7-flash' as const,
  source: 'ai-generated',
  completeness: {
    clipSummary: true,
    structuredInfo: true,
    clueCards: true,
    userHighlights: true,
    overall: 100,
  },
};

/**
 * Brief with special characters for encoding tests
 */
export const specialCharacterBrief: IntelligenceBrief = {
  ...completeBrief,
  caseFile: {
    ...completeBrief.caseFile,
    title: 'Study on "Deep Learning" & Neural Networks <AI/ML>',
  },
};

/**
 * Brief with unicode characters
 */
export const unicodeBrief: IntelligenceBrief = {
  ...completeBrief,
  caseFile: {
    ...completeBrief.caseFile,
    title: '深度学习研究：Advance Techniques in 中文人工智能 🎯',
    authors: ['张伟', '李娜', '王芳'],
  },
};

/**
 * Brief with empty/minimal data
 */
export const minimalBrief: IntelligenceBrief = {
  id: 2,
  paperId: 143,
  caseFile: {
    caseNumber: 143,
    title: 'Minimal Study',
    researchQuestion: '',
    coreMethod: '',
    keyFindings: [],
    completenessScore: 0,
  },
  clipSummary: '',
  structuredInfo: {
    researchQuestion: '',
    methodology: [],
    findings: [],
    limitations: [],
  },
  clueCards: [],
  userHighlights: {
    total: 0,
    byPriority: {},
    topHighlights: [],
  },
  tokenUsage: { input: 0, output: 0, total: 0 },
  cost: 0,
  duration: 0,
  generatedAt: '2024-01-15T10:00:00Z',
  model: 'glm-4.7-flash' as const,
  source: 'ai-generated',
  completeness: {
    clipSummary: false,
    structuredInfo: false,
    clueCards: false,
    userHighlights: false,
    overall: 0,
  },
};

/**
 * Brief with many authors (for "et al" formatting)
 */
export const manyAuthorsBrief: IntelligenceBrief = {
  ...completeBrief,
  caseFile: {
    ...completeBrief.caseFile,
    authors: [
      'Author One',
      'Author Two',
      'Author Three',
      'Author Four',
      'Author Five',
    ],
  },
};

/**
 * Brief with no authors (for title-based citation)
 */
export const noAuthorsBrief: IntelligenceBrief = {
  ...completeBrief,
  caseFile: {
    ...completeBrief.caseFile,
    authors: [],
  },
};

/**
 * Brief with large user highlights (performance testing)
 */
export const largeHighlightsBrief: IntelligenceBrief = {
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
      color: i % 3 === 0 ? 'red' : i % 3 === 1 ? 'yellow' : 'orange',
      position: { x: 100, y: 100 + i * 20, width: 200, height: 20 },
      timestamp: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-15T10:00:00Z',
    })),
  },
};

/**
 * Brief with many clue cards (performance testing)
 */
export const manyClueCardsBrief: IntelligenceBrief = {
  ...completeBrief,
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
