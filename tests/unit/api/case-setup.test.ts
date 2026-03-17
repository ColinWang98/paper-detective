jest.mock('@/services/caseSetupService', () => ({
  caseSetupService: {
    generateCaseSetup: jest.fn(),
    getCaseSetup: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/ai/case-setup/route';
import { caseSetupService } from '@/services/caseSetupService';
import { NextRequest } from '@/tests/__mocks__/next';

const mockCaseSetupService = caseSetupService as jest.Mocked<typeof caseSetupService>;

function makeRequest(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(url, init) as unknown as Parameters<typeof POST>[0];
}

describe('/api/ai/case-setup', () => {
  const mockCaseSetup = {
    paperId: 1,
    caseTitle: 'The Baseline Dispute',
    caseBackground: 'A paper claim needs verification.',
    coreDispute: 'Whether the contribution is real.',
    openingJudgment: 'The initial evidence is incomplete.',
    investigationGoal: 'Verify the paper using direct text evidence.',
    structureNodes: [],
    tasks: [],
    generatedAt: '2026-03-17T00:00:00.000Z',
    model: 'glm-4.7-flash' as const,
    source: 'ai-generated' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST generates case setup from paperId and pdfText', async () => {
    mockCaseSetupService.generateCaseSetup.mockResolvedValue(mockCaseSetup as any);

    const request = makeRequest('http://localhost:3000/api/ai/case-setup', {
      method: 'POST',
      body: JSON.stringify({
        paperId: 1,
        pdfText: 'Paper body',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockCaseSetup);
    expect(mockCaseSetupService.generateCaseSetup).toHaveBeenCalledWith({
      paperId: 1,
      pdfText: 'Paper body',
      forceRegenerate: false,
    });
  });

  it('GET returns cached case setup by paperId', async () => {
    mockCaseSetupService.getCaseSetup.mockResolvedValue(mockCaseSetup as any);

    const request = makeRequest('http://localhost:3000/api/ai/case-setup?paperId=1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockCaseSetup);
    expect(mockCaseSetupService.getCaseSetup).toHaveBeenCalledWith(1);
  });

  it('returns 400 for missing required params', async () => {
    const postRequest = makeRequest('http://localhost:3000/api/ai/case-setup', {
      method: 'POST',
      body: JSON.stringify({
        paperId: 1,
      }),
    });

    await expect(POST(postRequest)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });

    const getRequest = makeRequest('http://localhost:3000/api/ai/case-setup');

    await expect(GET(getRequest)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});
