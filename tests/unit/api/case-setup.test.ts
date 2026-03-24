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
      apiKey: undefined,
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

    const postResponse = await POST(postRequest);
    const postData = await postResponse.json();

    expect(postResponse.status).toBe(400);
    expect(postData.success).toBe(false);
    expect(postData.error.code).toBe('VALIDATION_ERROR');

    const getRequest = makeRequest('http://localhost:3000/api/ai/case-setup');

    const getResponse = await GET(getRequest);
    const getData = await getResponse.json();

    expect(getResponse.status).toBe(400);
    expect(getData.success).toBe(false);
    expect(getData.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 503 for network errors from the AI layer', async () => {
    mockCaseSetupService.generateCaseSetup.mockRejectedValue({
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络',
    });

    const request = makeRequest('http://localhost:3000/api/ai/case-setup', {
      method: 'POST',
      body: JSON.stringify({
        paperId: 1,
        pdfText: 'Paper body',
        apiKey: 'test-key',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.error).toEqual({
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络',
    });
  });
});
