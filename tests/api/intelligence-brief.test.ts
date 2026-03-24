jest.mock('@/services/intelligenceBriefService', () => ({
  intelligenceBriefService: {
    generateBrief: jest.fn(),
    getBrief: jest.fn(),
    deleteBrief: jest.fn(),
  },
}));

import { DELETE, GET, POST } from '@/app/api/ai/intelligence-brief/route';
import type { IntelligenceBrief } from '@/services/intelligenceBriefService';
import { intelligenceBriefService } from '@/services/intelligenceBriefService';
import { NextRequest } from '@/tests/__mocks__/next';

const mockIntelligenceBriefService = intelligenceBriefService as jest.Mocked<
  typeof intelligenceBriefService
>;

function makeRequest(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(url, init) as unknown as Parameters<typeof POST>[0];
}

function createMockBrief(paperId: number): IntelligenceBrief {
  return {
    paperId,
    caseFile: {
      caseNumber: 142,
      title: 'Case File #142',
      researchQuestion: 'Test question',
      coreMethod: 'Test method',
      keyFindings: ['Test finding'],
      completenessScore: 85,
    },
    clipSummary: 'Three sentence summary.',
    structuredInfo: {
      researchQuestion: 'Test question',
      methods: ['Test method'],
      findings: ['Test finding'],
      limitations: [],
      confidence: { question: 90, methods: 90, findings: 90, limitations: 0 },
    },
    clueCards: [],
    userHighlights: {
      total: 1,
      byPriority: { critical: 1 },
      topHighlights: [],
    },
    tokenUsage: { input: 5000, output: 1000, total: 6000 },
    cost: 0.05,
    duration: 5000,
    generatedAt: '2026-02-10T10:00:00Z',
    model: 'claude-sonnet-4-5-20250514',
    completeness: {
      clipSummary: true,
      structuredInfo: true,
      clueCards: true,
      userHighlights: true,
      overall: 85,
    },
  };
}

describe('/api/ai/intelligence-brief', () => {
  const mockPaperId = 1;
  const mockPDFText = 'Sample academic paper text...';
  const mockHighlights = [
    {
      id: 1,
      text: 'Important finding',
      priority: 'critical' as const,
      color: 'red' as const,
      timestamp: '2026-02-10T10:00:00Z',
      createdAt: '2026-02-10T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('generates intelligence brief successfully', async () => {
      const mockBrief = createMockBrief(mockPaperId);
      mockIntelligenceBriefService.generateBrief.mockResolvedValue({
        brief: mockBrief,
        stage: 'success',
      });

      const request = makeRequest('http://localhost:3000/api/ai/intelligence-brief', {
        method: 'POST',
        body: JSON.stringify({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
          apiKey: 'test-key',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockBrief);
      expect(mockIntelligenceBriefService.generateBrief).toHaveBeenCalledWith({
        paperId: mockPaperId,
        pdfText: mockPDFText,
        highlights: mockHighlights,
        forceRegenerate: false,
        apiKey: 'test-key',
        onProgress: expect.any(Function),
      });
    });

    it('rejects invalid request bodies', async () => {
      const request = makeRequest('http://localhost:3000/api/ai/intelligence-brief', {
        method: 'POST',
        body: JSON.stringify({
          paperId: 'invalid',
          pdfText: '',
          highlights: 'invalid',
        }),
      });

      await expect(POST(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('passes through requests without an API key and returns service errors', async () => {
      mockIntelligenceBriefService.generateBrief.mockResolvedValue({
        brief: createMockBrief(mockPaperId),
        stage: 'error',
        error: '请先在设置中配置API Key',
      });

      const request = makeRequest('http://localhost:3000/api/ai/intelligence-brief', {
        method: 'POST',
        body: JSON.stringify({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        }),
      });

      await expect(POST(request)).rejects.toMatchObject({
        code: 'BRIEF_GENERATION_ERROR',
        message: '请先在设置中配置API Key',
      });
    });

    it('rejects when generation returns an error stage', async () => {
      mockIntelligenceBriefService.generateBrief.mockResolvedValue({
        brief: createMockBrief(mockPaperId),
        stage: 'error',
        error: 'Generation failed',
      });

      const request = makeRequest('http://localhost:3000/api/ai/intelligence-brief', {
        method: 'POST',
        body: JSON.stringify({
          paperId: mockPaperId,
          pdfText: mockPDFText,
          highlights: mockHighlights,
        }),
      });

      await expect(POST(request)).rejects.toMatchObject({
        code: 'BRIEF_GENERATION_ERROR',
        message: 'Generation failed',
      });
    });
  });

  describe('GET', () => {
    it('retrieves a cached brief successfully', async () => {
      const mockBrief = createMockBrief(mockPaperId);
      mockIntelligenceBriefService.getBrief.mockResolvedValue(mockBrief);

      const request = makeRequest(
        `http://localhost:3000/api/ai/intelligence-brief?paperId=${mockPaperId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockBrief);
      expect(mockIntelligenceBriefService.getBrief).toHaveBeenCalledWith(mockPaperId);
    });

    it('returns null when no cached brief exists', async () => {
      mockIntelligenceBriefService.getBrief.mockResolvedValue(null);

      const request = makeRequest(
        `http://localhost:3000/api/ai/intelligence-brief?paperId=${mockPaperId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeNull();
    });

    it('rejects invalid query parameters', async () => {
      const request = makeRequest(
        'http://localhost:3000/api/ai/intelligence-brief?paperId=invalid'
      );

      await expect(GET(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('loads cached briefs without requiring an API key', async () => {
      mockIntelligenceBriefService.getBrief.mockResolvedValue(null);
      const request = makeRequest(
        `http://localhost:3000/api/ai/intelligence-brief?paperId=${mockPaperId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeNull();
    });
  });

  describe('DELETE', () => {
    it('deletes a cached brief successfully', async () => {
      mockIntelligenceBriefService.deleteBrief.mockResolvedValue(undefined);

      const request = makeRequest(
        `http://localhost:3000/api/ai/intelligence-brief?paperId=${mockPaperId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.message).toContain('deleted successfully');
      expect(mockIntelligenceBriefService.deleteBrief).toHaveBeenCalledWith(mockPaperId);
    });

    it('rejects invalid delete requests', async () => {
      const request = makeRequest(
        'http://localhost:3000/api/ai/intelligence-brief?paperId=invalid',
        { method: 'DELETE' }
      );

      await expect(DELETE(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('wraps unexpected delete errors', async () => {
      mockIntelligenceBriefService.deleteBrief.mockRejectedValue(
        new Error('Cache deletion failed')
      );

      const request = makeRequest(
        `http://localhost:3000/api/ai/intelligence-brief?paperId=${mockPaperId}`,
        { method: 'DELETE' }
      );

      await expect(DELETE(request)).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
      });
    });
  });
});
