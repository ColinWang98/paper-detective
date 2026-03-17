/**
 * Markdown Export API Unit Tests
 * Story 2.2.2: Intelligence Briefing - Markdown Export
 *
 * Test Coverage Target: >80%
 * Test Cases: TC-EXP-001 to TC-EXP-004
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/export/markdown/route';
import type { IntelligenceBrief } from '@/types/ai.types';

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: jest.fn().mockResolvedValue(data),
      status: init?.status || 200,
      ...data,
    })),
  },
}));

jest.mock('next/navigation', () => ({
  notFound: () => null,
  redirect: () => null,
}));

// Mock test data
const mockBrief: IntelligenceBrief = {
  id: 1,
  paperId: 142,
  caseFile: {
    caseNumber: 142,
    title: 'Test Paper Title',
    researchQuestion: 'What is the research question?',
    coreMethod: 'Experimental method',
    keyFindings: ['Finding 1', 'Finding 2', 'Finding 3'],
    completenessScore: 85,
    authors: ['John Doe', 'Jane Smith'],
    publicationDate: '2024-01-15',
  },
  clipSummary: 'This is a three sentence summary. It provides an overview. It highlights key findings.',
  structuredInfo: {
    researchQuestion: 'How does this work?',
    methodology: ['Method 1', 'Method 2'],
    findings: ['Result 1', 'Result 2'],
    limitations: ['Limitation 1'],
    conclusions: 'The conclusion is clear.',
  },
  clueCards: [],
  userHighlights: {
    total: 5,
    byPriority: { critical: 2, important: 2, interesting: 1 },
    topHighlights: [],
  },
  tokenUsage: {
    input: 1000,
    output: 500,
    total: 1500,
  },
  cost: 0.0045,
  duration: 1500,
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

describe('Markdown Export API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC-EXP-001: Successful Markdown Generation', () => {
    it('should generate markdown for complete brief', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.markdown).toBeDefined();
      expect(data.data.markdown).toContain('# 情报简报: Test Paper Title');
      expect(data.data.filename).toBe('brief-142-1.md');
      expect(data.data.contentType).toBe('text/markdown');
    });

    it('should include all major sections', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.markdown).toContain('## 研究问题');
      expect(data.data.markdown).toContain('## 核心方法');
      expect(data.data.markdown).toContain('## 📝 情报摘要');
      expect(data.data.markdown).toContain('## 🔍 结构化信息');
    });
  });

  describe('TC-EXP-002: Field Validation', () => {
    it('should return 400 if brief is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if brief is not an object', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: 'not an object' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 if caseFile is missing', async () => {
      const invalidBrief = { ...mockBrief, caseFile: undefined as unknown as typeof mockBrief.caseFile };
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: invalidBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 if clipSummary is missing', async () => {
      const invalidBrief = { ...mockBrief, clipSummary: undefined as unknown as string };
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: invalidBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 if structuredInfo is missing', async () => {
      const invalidBrief = { ...mockBrief, structuredInfo: undefined as unknown as typeof mockBrief.structuredInfo };
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: invalidBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('TC-EXP-003: Special Character Handling', () => {
    it('should handle special characters in title', async () => {
      const specialCharBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          title: 'Test <script>alert("xss")</script> Title',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: specialCharBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.markdown).toContain('Test');
    });

    it('should handle unicode characters', async () => {
      const unicodeBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          title: 'Test 中文 Title 🎯',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: unicodeBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.markdown).toContain('中文');
    });

    it('should handle newlines in text content', async () => {
      const multilineBrief = {
        ...mockBrief,
        clipSummary: 'Line 1\nLine 2\nLine 3',
      };

      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: multilineBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.markdown).toContain('Line 1');
      expect(data.data.markdown).toContain('Line 2');
    });
  });

  describe('TC-EXP-004: Empty Data Handling', () => {
    it('should handle empty clueCards array', async () => {
      const emptyCardsBrief = { ...mockBrief, clueCards: [] };
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: emptyCardsBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // When clueCards is empty, it shouldn't add the section
    });

    it('should handle empty userHighlights', async () => {
      const emptyHighlightsBrief = {
        ...mockBrief,
        userHighlights: { total: 0, byPriority: {}, topHighlights: [] },
      };

      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: emptyHighlightsBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // When highlights are empty, it shouldn't add the section
    });

    it('should handle empty arrays in structuredInfo', async () => {
      const emptyStructuredBrief = {
        ...mockBrief,
        structuredInfo: {
          researchQuestion: 'Test question',
          methodology: [],
          findings: [],
          limitations: [],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: emptyStructuredBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large brief with 500+ highlights efficiently', async () => {
      const largeHighlightsBrief = {
        ...mockBrief,
        userHighlights: {
          total: 500,
          byPriority: { critical: 100, important: 200, interesting: 200 },
          topHighlights: Array(500).fill(null).map((_, i) => ({
            id: i,
            paperId: 142,
            pageNumber: Math.floor(i / 20) + 1,
            text: `Highlight number ${i} with some text`,
            priority: i % 3 === 0 ? 'critical' : i % 3 === 1 ? 'important' : 'interesting',
            color: 'red',
            position: { x: 100, y: 100, width: 200, height: 20 },
            timestamp: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-15T10:00:00Z',
          })),
        },
      };

      const startTime = performance.now();

      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: largeHighlightsBrief }),
      });

      const response = await POST(request);
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1 second
    });

    it('should handle large clueCards array efficiently', async () => {
      const largeCardsBrief = {
        ...mockBrief,
        clueCards: Array(50).fill(null).map((_, i) => ({
          id: i,
          paperId: 142,
          type: i % 4 === 0 ? 'question' : i % 4 === 1 ? 'method' : i % 4 === 2 ? 'finding' : 'limitation',
          source: 'ai-generated',
          title: `Card ${i}`,
          content: `Content for card ${i}`,
          confidence: 85,
          isExpanded: false,
          createdAt: '2024-01-15T10:00:00Z',
        })),
      };

      const startTime = performance.now();

      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({ brief: largeCardsBrief }),
      });

      const response = await POST(request);
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in <500ms
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: 'invalid json{{{',
      });

      await expect(POST(request)).rejects.toThrow();
    });

    it('should handle missing body gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/markdown', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/export/markdown', () => {
    it('should return health check info', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('ok');
      expect(data.data.service).toBe('markdown-export');
    });
  });
});
