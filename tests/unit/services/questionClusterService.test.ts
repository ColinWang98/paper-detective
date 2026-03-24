jest.mock('@/services/aiService', () => ({
  aiService: {
    generateStructuredData: jest.fn(),
  },
}));

import { aiService } from '@/services/aiService';
import { QuestionClusterService, questionClusterService } from '@/services/questionClusterService';
import type { EvidenceSubmission, InvestigationTask } from '@/types';

const mockAIService = aiService as jest.Mocked<typeof aiService>;

describe('QuestionClusterService', () => {
  const task: InvestigationTask = {
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
  };

  const evidence: EvidenceSubmission[] = [
    {
      id: 1,
      paperId: 1,
      taskId: 'task-1',
      highlightId: 10,
      evidenceType: 'result',
      note: 'Table 2 shows the strongest gain.',
      createdAt: '2026-03-21T00:00:00.000Z',
    },
    {
      id: 2,
      paperId: 1,
      taskId: 'task-1',
      highlightId: 11,
      evidenceType: 'limitation',
      note: 'The gain only appears on one benchmark.',
      createdAt: '2026-03-21T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns validated cluster assignments for the current question evidence', async () => {
    mockAIService.generateStructuredData.mockResolvedValue({
      assignments: [
        { submissionId: 1, clusterId: 'supports-claim', aiTags: ['result', 'gain'] },
        { submissionId: 2, clusterId: 'needs-skepticism', aiTags: ['limitation'] },
      ],
    });

    const result = await questionClusterService.clusterEvidence({
      task,
      evidence,
      apiKey: 'test-key',
      model: 'glm-4.6',
    });

    expect(result).toEqual([
      { submissionId: 1, clusterId: 'supports-claim', aiTags: ['result', 'gain'] },
      { submissionId: 2, clusterId: 'needs-skepticism', aiTags: ['limitation'] },
    ]);
    expect(mockAIService.generateStructuredData).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        model: 'glm-4.6',
        maxTokens: 900,
      })
    );
  });

  it('filters out assignments for unknown evidence ids and invalid clusters', async () => {
    mockAIService.generateStructuredData.mockResolvedValue({
      assignments: [
        { submissionId: 1, clusterId: 'supports-claim' },
        { submissionId: 99, clusterId: 'supports-claim' },
        { submissionId: 2, clusterId: 'invalid-cluster' },
      ],
    });

    const result = await questionClusterService.clusterEvidence({
      task,
      evidence,
      apiKey: 'test-key',
    });

    expect(result).toEqual([{ submissionId: 1, clusterId: 'supports-claim', aiTags: [] }]);
  });

  it('exports a singleton instance', () => {
    expect(questionClusterService).toBeInstanceOf(QuestionClusterService);
  });
});
