jest.mock('@/services/questionClusterService', () => ({
  questionClusterService: {
    clusterEvidence: jest.fn(),
  },
}));

import { POST } from '@/app/api/ai/question-cluster/route';
import { questionClusterService } from '@/services/questionClusterService';
import { NextRequest } from '@/tests/__mocks__/next';

const mockQuestionClusterService = questionClusterService as jest.Mocked<typeof questionClusterService>;

function makeRequest(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(url, init) as unknown as Parameters<typeof POST>[0];
}

describe('/api/ai/question-cluster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cluster assignments for a valid request', async () => {
    mockQuestionClusterService.clusterEvidence.mockResolvedValue([
      { submissionId: 1, clusterId: 'supports-claim', aiTags: ['result'] },
      { submissionId: 2, clusterId: 'needs-skepticism', aiTags: ['limitation'] },
    ]);

    const request = makeRequest('http://localhost:3000/api/ai/question-cluster', {
      method: 'POST',
      body: JSON.stringify({
        task: {
          id: 'task-1',
          title: 'Check the Result Support',
          question: 'What experimental evidence supports the claim?',
          narrativeHook: 'Look at the results section.',
          section: 'result',
          whereToLook: ['Results'],
          whatToFind: 'Result evidence',
          submissionMode: 'evidence_plus_optional_judgment',
          recommendedEvidenceCount: 2,
          evaluationFocus: 'evidence coverage',
          linkedStructureKinds: ['result'],
          requiredEvidenceTypes: ['result'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: 'available',
        },
        evidence: [
          {
            id: 1,
            paperId: 1,
            taskId: 'task-1',
            highlightId: 10,
            evidenceType: 'result',
            note: 'Table 2 shows the strongest gain.',
            createdAt: '2026-03-21T00:00:00.000Z',
          },
        ],
        apiKey: 'test-key',
        model: 'glm-4.6',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.assignments).toEqual([
      { submissionId: 1, clusterId: 'supports-claim', aiTags: ['result'] },
      { submissionId: 2, clusterId: 'needs-skepticism', aiTags: ['limitation'] },
    ]);
  });

  it('returns 400 for invalid request payloads', async () => {
    const request = makeRequest('http://localhost:3000/api/ai/question-cluster', {
      method: 'POST',
      body: JSON.stringify({ evidence: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('maps rate limits to 429 responses', async () => {
    mockQuestionClusterService.clusterEvidence.mockRejectedValue({
      code: 'RATE_LIMIT',
      message: 'Too many requests',
    });

    const request = makeRequest('http://localhost:3000/api/ai/question-cluster', {
      method: 'POST',
      body: JSON.stringify({
        task: {
          id: 'task-1',
          title: 'Check the Result Support',
          question: 'What experimental evidence supports the claim?',
          narrativeHook: 'Look at the results section.',
          section: 'result',
          whereToLook: ['Results'],
          whatToFind: 'Result evidence',
          submissionMode: 'evidence_plus_optional_judgment',
          recommendedEvidenceCount: 2,
          evaluationFocus: 'evidence coverage',
          linkedStructureKinds: ['result'],
          requiredEvidenceTypes: ['result'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: 'available',
        },
        evidence: [
          {
            id: 1,
            paperId: 1,
            taskId: 'task-1',
            highlightId: 10,
            evidenceType: 'result',
            note: 'Table 2 shows the strongest gain.',
            createdAt: '2026-03-21T00:00:00.000Z',
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toEqual({
      code: 'RATE_LIMIT',
      message: 'Too many requests',
    });
  });
});
