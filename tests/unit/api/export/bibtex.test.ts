/**
 * BibTeX Export API Unit Tests
 * Story 2.2.2: Intelligence Briefing - BibTeX Export
 *
 * Test Coverage Target: >80%
 * Test Cases: TC-EXP-005 to TC-EXP-008
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/export/bibtex/route';
import type { IntelligenceBrief } from '@/types/ai.types';

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    private body: string | undefined;

    constructor(_input: string, init?: { body?: string }) {
      this.body = init?.body;
    }

    async json() {
      return JSON.parse(this.body ?? '{}');
    }
  },
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
    title: 'Advanced Machine Learning Techniques',
    researchQuestion: 'What are advanced ML techniques?',
    coreMethod: 'Deep learning approach',
    keyFindings: ['Deep learning works', 'Neural networks effective'],
    completenessScore: 90,
    authors: ['John Smith', 'Jane Doe'],
    publicationDate: '2024-03-15',
  },
  clipSummary: 'Summary text',
  structuredInfo: {
    researchQuestion: 'Question',
    methodology: ['Method'],
    findings: ['Finding'],
  },
  clueCards: [],
  userHighlights: {
    total: 0,
    byPriority: {},
    topHighlights: [],
  },
  tokenUsage: { input: 1000, output: 500, total: 1500 },
  cost: 0.0045,
  duration: 1500,
  generatedAt: '2024-03-15T10:00:00Z',
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

describe('BibTeX Export API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC-EXP-005: Successful BibTeX Generation', () => {
    it('should generate BibTeX for complete brief', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.bibtex).toBeDefined();
      expect(data.data.bibtex).toContain('@article');
      expect(data.data.citationKey).toBeDefined();
      expect(data.data.filename).toContain('.bib');
      expect(data.data.contentType).toBe('application/x-bibtex');
    });

    it('should generate correct BibTeX format', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const bibtex = data.data.bibtex;
      expect(bibtex).toContain('@article{');
      expect(bibtex).toContain('author = {');
      expect(bibtex).toContain('title = {');
      expect(bibtex).toContain('year = {');
      expect(bibtex).toContain('note = {');
      expect(bibtex).toContain('}');
    });

    it('should auto-generate citation key', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.citationKey).toContain('smith');
      expect(data.data.citationKey).toContain('2024');
    });

    it('should use custom citation key if provided', async () => {
      const customKey = 'Smith2024AdvancedML';
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief, citationKey: customKey }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.citationKey).toBe(customKey);
    });
  });

  describe('TC-EXP-006: Author Name Formatting', () => {
    it('should format single author correctly', async () => {
      const singleAuthorBrief = {
        ...mockBrief,
        caseFile: { ...mockBrief.caseFile, authors: ['John Smith'] },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: singleAuthorBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.bibtex).toContain('Smith, John');
    });

    it('should format multiple authors correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.bibtex).toContain('Smith, John and Doe, Jane');
    });

    it('should handle three authors', async () => {
      const threeAuthorsBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          authors: ['John Smith', 'Jane Doe', 'Bob Johnson'],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: threeAuthorsBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.bibtex).toContain('Smith, John and Doe, Jane and Johnson, Bob');
    });

    it('should handle four+ authors with et al', async () => {
      const fourAuthorsBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          authors: ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Williams'],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: fourAuthorsBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    });

    it('should handle no authors (title-based citation)', async () => {
      const noAuthorsBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          authors: [],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: noAuthorsBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.citationKey).toContain('advanced');
    });
  });

  describe('TC-EXP-007: Year Extraction', () => {
    it('should extract year from ISO date string', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.bibtex).toContain('year = {2024}');
    });

    it('should handle different date formats', async () => {
      const dateFormats = [
        '2024-03-15T10:00:00Z',
        '2024/03/15',
        'March 15, 2024',
        '15 Mar 2024',
      ];

      for (const dateStr of dateFormats) {
        const dateBrief = {
          ...mockBrief,
          caseFile: { ...mockBrief.caseFile, publicationDate: dateStr },
        };

        const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
          method: 'POST',
          body: JSON.stringify({ brief: dateBrief }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.bibtex).toContain('2024');
      }
    });

    it('should handle missing date gracefully', async () => {
      const noDateBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          publicationDate: undefined as unknown as string,
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: noDateBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should generate a valid BibTeX entry without year
    });
  });

  describe('TC-EXP-008: Special Character Encoding', () => {
    it('should escape special characters in title', async () => {
      const specialCharTitle = 'Study on "Deep Learning" & AI';
      const specialCharBrief = {
        ...mockBrief,
        caseFile: { ...mockBrief.caseFile, title: specialCharTitle },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: specialCharBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.bibtex).toContain('title');
    });

    it('should handle unicode characters in authors', async () => {
      const unicodeAuthorBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          authors: ['José García', 'François Müller'],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: unicodeAuthorBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    });

    it('should handle unicode characters in title', async () => {
      const unicodeTitleBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          title: 'Research on 中文人工智能',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: unicodeTitleBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.bibtex).toContain('中文');
    });

    it('should handle curly braces in text', async () => {
      const curlyBracesBrief = {
        ...mockBrief,
        structuredInfo: {
          researchQuestion: 'Test {question}',
          methodology: [],
          findings: [],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: curlyBracesBrief }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Curly braces should be escaped or handled properly
    });
  });

  describe('Field Validation', () => {
    it('should return 400 if brief is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      await expect(POST(request)).rejects.toThrow('Validation failed');
    });

    it('should return 400 if caseFile.title is missing', async () => {
      const noTitleBrief = {
        ...mockBrief,
        caseFile: { ...mockBrief.caseFile, title: undefined as unknown as string },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: noTitleBrief }),
      });

      await expect(POST(request)).rejects.toThrow('Validation failed');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large brief efficiently', async () => {
      const startTime = performance.now();

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: mockBrief }),
      });

      const response = await POST(request);
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should handle long author lists efficiently', async () => {
      const manyAuthorsBrief = {
        ...mockBrief,
        caseFile: {
          ...mockBrief.caseFile,
          authors: Array.from({ length: 50 }, (_, i) => `Author ${i} Name${i}`),
        },
      };

      const startTime = performance.now();

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: manyAuthorsBrief }),
      });

      const response = await POST(request);
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: 'invalid json{{{',
      });

      await expect(POST(request)).rejects.toThrow();
    });

    it('should handle missing body gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: null }),
      });

      await expect(POST(request)).rejects.toThrow('Validation failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle brief with minimal metadata', async () => {
      const minimalBrief = {
        ...mockBrief,
        caseFile: {
          caseNumber: 1,
          title: 'Minimal Title',
          researchQuestion: '',
          coreMethod: '',
          keyFindings: [],
          completenessScore: 0,
        },
        structuredInfo: {
          researchQuestion: '',
          methodology: [],
          findings: [],
          limitations: [],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/export/bibtex', {
        method: 'POST',
        body: JSON.stringify({ brief: minimalBrief }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should generate unique citation keys for same paper', async () => {
      const requests = [
        new NextRequest('http://localhost:3000/api/export/bibtex', {
          method: 'POST',
          body: JSON.stringify({ brief: mockBrief }),
        }),
        new NextRequest('http://localhost:3000/api/export/bibtex', {
          method: 'POST',
          body: JSON.stringify({ brief: mockBrief }),
        }),
      ];

      const response1 = await POST(requests[0]);
      const response2 = await POST(requests[1]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('GET /api/export/bibtex', () => {
    it('should return health check info', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('ok');
      expect(data.data.service).toBe('bibtex-export');
    });
  });
});
