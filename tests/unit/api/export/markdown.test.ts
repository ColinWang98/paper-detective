import { NextRequest } from 'next/server';

import { GET, POST } from '@/app/api/export/markdown/route';
import type { IntelligenceBrief } from '@/types/ai.types';

const mockBrief: IntelligenceBrief = {
  id: 1,
  paperId: 142,
  caseFile: {
    caseNumber: 142,
    title: 'Test Paper Title',
    researchQuestion: 'What is the research question?',
    coreMethod: 'Experimental method',
    keyFindings: ['Finding 1', 'Finding 2'],
    completenessScore: 85,
    authors: ['John Doe', 'Jane Smith'],
    publicationDate: '2024-01-15',
  },
  clipSummary: 'This is a summary.',
  structuredInfo: {
    researchQuestion: 'How does this work?',
    methodology: ['Method 1', 'Method 2'],
    findings: ['Result 1', 'Result 2'],
    limitations: ['Limitation 1'],
    conclusions: 'The conclusion is clear.',
  },
  clueCards: [],
  userHighlights: {
    total: 0,
    byPriority: {},
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
    userHighlights: false,
    overall: 80,
  },
};

describe('Markdown Export API', () => {
  it('generates markdown for a valid brief', async () => {
    const request = new NextRequest('http://localhost:3000/api/export/markdown', {
      method: 'POST',
      body: JSON.stringify({ brief: mockBrief }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.markdown).toContain('Test Paper Title');
    expect(data.data.filename).toBe('brief-142-142.md');
    expect(data.data.contentType).toBe('text/markdown');
  });

  it('includes the major markdown sections for a valid brief', async () => {
    const request = new NextRequest('http://localhost:3000/api/export/markdown', {
      method: 'POST',
      body: JSON.stringify({ brief: mockBrief }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.markdown).toContain('What is the research question?');
    expect(data.data.markdown).toContain('Experimental method');
    expect(data.data.markdown).toContain('This is a summary.');
  });

  it('throws a validation error when brief is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/export/markdown', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    await expect(POST(request)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  });

  it('throws on malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/export/markdown', {
      method: 'POST',
      body: 'invalid json{{{',
    });

    await expect(POST(request)).rejects.toBeTruthy();
  });

  it('returns health check info from GET', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.service).toBe('markdown-export');
  });
});
