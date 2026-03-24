jest.mock('@/services/questionEvaluationService', () => ({
  questionEvaluationService: {
    evaluateQuestion: jest.fn(),
  },
}));

import { POST } from '@/app/api/ai/question-evaluate/route';
import { questionEvaluationService } from '@/services/questionEvaluationService';
import { NextRequest } from '@/tests/__mocks__/next';

const mockQuestionEvaluationService = questionEvaluationService as jest.Mocked<typeof questionEvaluationService>;

function makeRequest(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(url, init) as unknown as Parameters<typeof POST>[0];
}

describe('/api/ai/question-evaluate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns score, feedback, and missing evidence for a valid request', async () => {
    mockQuestionEvaluationService.evaluateQuestion.mockResolvedValue({
      score: 88,
      feedback: 'The evidence is strong.',
      missingEvidence: [],
    });

    const request = makeRequest('http://localhost:3000/api/ai/question-evaluate', {
      method: 'POST',
      body: JSON.stringify({
        task: {
          id: 'task-1',
          title: 'Lock the Core Claim',
          question: 'Find the central claim.',
          narrativeHook: 'Start from the introduction.',
          section: 'intro',
          whereToLook: ['Introduction'],
          whatToFind: 'Claim wording',
          submissionMode: 'evidence_only',
          recommendedEvidenceCount: 1,
          evaluationFocus: 'claim precision',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
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
            evidenceType: 'claim',
            note: 'Claim evidence',
            createdAt: '2026-03-19T00:00:00.000Z',
          },
        ],
        judgment: 'Optional note',
        apiKey: 'test-key',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      score: 88,
      feedback: 'The evidence is strong.',
      missingEvidence: [],
    });
  });

  it('returns 400 for invalid request payloads', async () => {
    const request = makeRequest('http://localhost:3000/api/ai/question-evaluate', {
      method: 'POST',
      body: JSON.stringify({
        evidence: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('maps rate limits to 429 responses', async () => {
    mockQuestionEvaluationService.evaluateQuestion.mockRejectedValue({
      code: 'RATE_LIMIT',
      message: 'Too many requests',
    });

    const request = makeRequest('http://localhost:3000/api/ai/question-evaluate', {
      method: 'POST',
      body: JSON.stringify({
        task: {
          id: 'task-1',
          title: 'Lock the Core Claim',
          question: 'Find the central claim.',
          narrativeHook: 'Start from the introduction.',
          section: 'intro',
          whereToLook: ['Introduction'],
          whatToFind: 'Claim wording',
          submissionMode: 'evidence_only',
          recommendedEvidenceCount: 1,
          evaluationFocus: 'claim precision',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
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
            evidenceType: 'claim',
            note: 'Claim evidence',
            createdAt: '2026-03-19T00:00:00.000Z',
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
