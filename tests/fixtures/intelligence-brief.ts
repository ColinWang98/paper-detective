/**
 * Mock Intelligence Brief Data for Testing
 *
 * Provides realistic test data for Intelligence Brief components
 */

import type { IntelligenceBrief } from '@/types';

export const mockCaseFile = {
  caseNumber: 142,
  title: 'AI-Powered Academic Reading Assistant',
  authors: ['Smith, J.', 'Doe, J.'],
  publicationDate: '2024-01-15',
  completenessScore: 85,
  researchQuestion: 'How can AI improve academic reading efficiency?',
  coreMethod: 'Gamified detective-themed platform',
  keyFindings: ['AI improves comprehension', 'Gamification increases engagement', 'Users prefer interactive analysis'],
};

export const mockClipSummary = 'This paper introduces Paper Detective, an AI-powered gamified platform for academic literature reading that helps researchers quickly understand papers through interactive detective-themed analysis tools. The system combines Claude 3.5 Sonnet API with a four-level fallback strategy to ensure 100% reliability while maintaining costs below $0.01 per paper through intelligent caching and prompt optimization. User testing with 12 participants showed a 40% improvement in cross-disciplinary reading efficiency and high satisfaction with the detective-themed UI, validating the effectiveness of gamification for academic tools.';

export const mockStructuredInfo = {
  researchQuestion: 'How can AI assist cross-disciplinary researchers in quickly understanding academic papers?',
  methodology: [
    'User study with 12 graduate students from diverse disciplines',
    'Iterative design process with 3 prototype versions',
    'Integration of Claude API for natural language processing',
    'Four-level fallback system for reliability',
  ],
  findings: [
    '40% improvement in reading efficiency for cross-disciplinary papers',
    '85% user satisfaction with detective-themed UI',
    '92% accuracy in AI-generated summaries compared to manual analysis',
    'Significant reduction in time spent on paper preprocessing',
  ],
  limitations: [
    'Small sample size (n=12) may not generalize to all populations',
    'Currently limited to English-language papers',
    'Dependence on Claude API availability and pricing',
    'Learning curve for non-technical users',
  ],
};

export const mockClueCards = [
  {
    id: 1,
    paperId: 142,
    type: 'question' as const,
    source: 'ai-generated' as const,
    title: 'Core Research Question',
    content: 'How can gamification and AI assistance improve academic literature reading efficiency for cross-disciplinary researchers?',
    pageNumber: 1,
    highlightIds: [1, 2],
    confidence: 92,
    createdAt: new Date('2026-02-10T10:30:00Z').toISOString(),
  },
  {
    id: 2,
    paperId: 142,
    type: 'method' as const,
    source: 'ai-generated' as const,
    title: 'Novel Method: 4-Level Fallback',
    content: 'Implements Claude API with automatic retry (3x), rule-based extraction, and demo data fallback to ensure 100% system reliability',
    pageNumber: 3,
    highlightIds: [3],
    confidence: 88,
    createdAt: new Date('2026-02-10T10:30:00Z').toISOString(),
  },
  {
    id: 3,
    paperId: 142,
    type: 'finding' as const,
    source: 'ai-generated' as const,
    title: 'Key Finding: 40% Efficiency Gain',
    content: 'Cross-disciplinary participants showed 40% improvement in reading efficiency when using AI-powered detective tools compared to traditional methods',
    pageNumber: 7,
    highlightIds: [4, 5],
    confidence: 90,
    createdAt: new Date('2026-02-10T10:30:00Z').toISOString(),
  },
  {
    id: 4,
    paperId: 142,
    type: 'limitation' as const,
    source: 'ai-generated' as const,
    title: 'Limitation: Small Sample Size',
    content: 'Study limited to 12 participants, primarily from computer science background, may not represent all researcher demographics',
    pageNumber: 9,
    highlightIds: [],
    confidence: 75,
    createdAt: new Date('2026-02-10T10:30:00Z').toISOString(),
  },
];

export const mockUserHighlights = {
  total: 15,
  byPriority: {
    critical: 5,
    important: 7,
    interesting: 2,
    archived: 1,
  },
  topHighlights: [
    {
      id: 1,
      text: 'Paper Detective combines AI analysis with detective-themed gamification',
      pageNumber: 1,
      color: 'red' as const,
      priority: 'critical' as const,
      timestamp: new Date('2026-02-10T10:15:00Z').toISOString(),
      createdAt: new Date('2026-02-10T10:15:00Z').toISOString(),
    },
    {
      id: 2,
      text: '40% improvement in cross-disciplinary reading efficiency',
      pageNumber: 7,
      color: 'yellow' as const,
      priority: 'important' as const,
      timestamp: new Date('2026-02-10T10:20:00Z').toISOString(),
      createdAt: new Date('2026-02-10T10:20:00Z').toISOString(),
    },
    {
      id: 3,
      text: 'Four-level fallback system ensures 100% reliability',
      pageNumber: 3,
      color: 'orange' as const,
      priority: 'interesting' as const,
      timestamp: new Date('2026-02-10T10:18:00Z').toISOString(),
      createdAt: new Date('2026-02-10T10:18:00Z').toISOString(),
    },
  ],
  length: 3,
};

export const mockTokenUsage = {
  input: 8192,
  output: 4153,
  total: 12345,
};

export const mockIntelligenceBrief: IntelligenceBrief = {
  id: 142,
  paperId: 142,
  caseFile: mockCaseFile,
  clipSummary: mockClipSummary,
  structuredInfo: mockStructuredInfo,
  clueCards: mockClueCards,
  userHighlights: mockUserHighlights,
  tokenUsage: mockTokenUsage,
  cost: 0.012345,
  duration: 3.45,
  generatedAt: new Date('2026-02-10T10:30:00Z').toISOString(),
  model: 'glm-4.7-flash' as const,
  source: 'demo-data' as const,
  completeness: {
    clipSummary: true,
    structuredInfo: true,
    clueCards: true,
    userHighlights: true,
    overall: 100,
  },
};

export default mockIntelligenceBrief;
