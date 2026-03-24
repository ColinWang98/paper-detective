jest.mock('@/services/aiService', () => ({
  aiService: {
    generateStructuredData: jest.fn(),
  },
}));

import { aiService } from '@/services/aiService';
import { QuestionEvaluationService, questionEvaluationService } from '@/services/questionEvaluationService';
import type { EvidenceSubmission, InvestigationTask } from '@/types';

const mockAIService = aiService as jest.Mocked<typeof aiService>;

describe('QuestionEvaluationService', () => {
  const baseTask: InvestigationTask = {
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
  };

  const baseEvidence: EvidenceSubmission[] = [
    {
      id: 1,
      paperId: 1,
      taskId: 'task-1',
      highlightId: 101,
      evidenceType: 'claim',
      note: 'This sentence states the core claim.',
      createdAt: '2026-03-19T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scores evidence_only submissions and returns missing evidence hints', async () => {
    mockAIService.generateStructuredData.mockResolvedValue({
      score: 84,
      feedback: 'The evidence captures the claim clearly.',
      missingEvidence: [],
    });

    const result = await questionEvaluationService.evaluateQuestion({
      task: baseTask,
      evidence: baseEvidence,
      apiKey: 'test-key',
    });

    expect(result).toEqual({
      score: 84,
      feedback: 'The evidence captures the claim clearly.',
      missingEvidence: [],
    });
    expect(mockAIService.generateStructuredData).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        maxTokens: 900,
      })
    );
  });

  it('scores evidence_plus_optional_judgment submissions with the provided judgment', async () => {
    mockAIService.generateStructuredData.mockResolvedValue({
      score: 91,
      feedback: 'The evidence and judgment align well.',
      missingEvidence: ['Add one stronger comparison point.'],
    });

    const result = await questionEvaluationService.evaluateQuestion({
      task: {
        ...baseTask,
        id: 'task-2',
        submissionMode: 'evidence_plus_optional_judgment',
        requiredEvidenceTypes: ['comparison', 'method'],
      },
      evidence: [
        {
          ...baseEvidence[0],
          taskId: 'task-2',
          evidenceType: 'comparison',
        },
        {
          ...baseEvidence[0],
          id: 2,
          taskId: 'task-2',
          evidenceType: 'method',
          note: 'This paragraph explains the new training step.',
        },
      ],
      judgment: 'The paper seems novel, but the claim still needs a stronger baseline comparison.',
      apiKey: 'test-key',
    });

    expect(result.score).toBe(91);
    expect(result.feedback).toContain('align');
    expect(result.missingEvidence).toEqual(['Add one stronger comparison point.']);
    expect(mockAIService.generateStructuredData).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Player judgment'),
      })
    );
  });

  it('returns heuristic missing-evidence feedback without calling AI when required evidence is absent', async () => {
    const result = await questionEvaluationService.evaluateQuestion({
      task: {
        ...baseTask,
        requiredEvidenceTypes: ['claim', 'result'],
        minEvidenceCount: 2,
      },
      evidence: baseEvidence,
      apiKey: 'test-key',
    });

    expect(result.score).toBeLessThan(60);
    expect(result.missingEvidence).toContain('Missing evidence type: result');
    expect(mockAIService.generateStructuredData).not.toHaveBeenCalled();
  });

  it('exports a singleton instance', () => {
    expect(questionEvaluationService).toBeInstanceOf(QuestionEvaluationService);
  });
});
