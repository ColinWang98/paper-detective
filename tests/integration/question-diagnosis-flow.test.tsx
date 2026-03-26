import { act, renderHook } from '@testing-library/react';

import { dbHelpers } from '@/lib/db';
import { usePaperStore } from '@/lib/store';
import type { DoctorState, Highlight, InvestigationTask, QuestionNode, QuestionRelation } from '@/types';

jest.mock('@/lib/db');

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;

describe('question diagnosis flow', () => {
  const highlight: Highlight = {
    id: 77,
    paperId: 1,
    pageNumber: 3,
    text: 'The method improves accuracy by 12%.',
    priority: 'important',
    color: 'yellow',
    timestamp: '2026-03-26T00:00:00.000Z',
    createdAt: '2026-03-26T00:00:00.000Z',
  };

  const tasks: InvestigationTask[] = [
    {
      id: 'task-claim',
      title: 'Lock the Core Claim',
      question: 'What is the core claim?',
      narrativeHook: 'Start with the authors’ own claim.',
      linkedStructureKinds: ['intro'],
      section: 'intro',
      whereToLook: ['Introduction'],
      whatToFind: 'Core claim',
      submissionMode: 'evidence_only',
      recommendedEvidenceCount: 1,
      evaluationFocus: 'claim precision',
      requiredEvidenceTypes: ['claim'],
      minEvidenceCount: 1,
      unlocksTaskIds: [],
      status: 'available',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbHelpers.addEvidenceSubmission.mockResolvedValue(10);
    mockDbHelpers.updateEvidenceSubmission.mockResolvedValue(1);
    mockDbHelpers.saveQuestionNodes.mockResolvedValue(undefined);
    mockDbHelpers.saveQuestionRelations.mockResolvedValue(undefined);
    mockDbHelpers.saveDoctorState.mockResolvedValue(1);

    usePaperStore.setState({
      currentPaper: {
        id: 1,
        title: 'Test Paper',
        authors: [],
        year: 2026,
        fileURL: '',
        fileName: 'paper.pdf',
        uploadDate: '2026-03-26T00:00:00.000Z',
      },
      highlights: [highlight],
      groups: [],
      investigationTasks: tasks,
      evidenceSubmissions: [],
      questionNodes: [
        {
          id: 'question-task-claim',
          paperId: 1,
          title: 'What is the core claim?',
          prompt: 'Lock the central claim.',
          type: 'claim',
          status: 'open',
          parentQuestionId: null,
          dependsOnQuestionIds: [],
          assignedEvidenceIds: [],
          position: { x: 100, y: 120 },
        } satisfies QuestionNode,
      ],
      questionRelations: [],
      doctorState: {
        paperId: 1,
        activeQuestionId: 'question-task-claim',
        mode: 'skeptical',
        message: 'The core claim still lacks direct evidence.',
        updatedAt: '2026-03-26T00:00:00.000Z',
      } satisfies DoctorState,
      activeTaskId: 'task-claim',
      isLoading: false,
      error: null,
    });
  });

  it('moves the doctor from skeptical to partial-confirmation after evidence is attached to the claim question', async () => {
    const { result } = renderHook(() => usePaperStore());

    await act(async () => {
      await result.current.submitEvidence('task-claim', 77, 'claim', '');
    });

    expect(result.current.questionNodes[0]).toEqual(
      expect.objectContaining({
        assignedEvidenceIds: [10],
        status: 'partial',
      })
    );
    expect(result.current.doctorState).toEqual(
      expect.objectContaining({
        mode: 'partial-confirmation',
        activeQuestionId: 'question-task-claim',
      })
    );
  });

  it('recomputes doctor state from saved question relations instead of trusting the passed-in doctor snapshot', async () => {
    const { result } = renderHook(() => usePaperStore());
    const questionNodes: QuestionNode[] = [
      {
        id: 'question-task-claim',
        paperId: 1,
        title: 'What is the core claim?',
        prompt: 'Lock the central claim.',
        type: 'claim',
        status: 'supported',
        parentQuestionId: null,
        dependsOnQuestionIds: [],
        assignedEvidenceIds: [10],
        position: { x: 100, y: 120 },
      },
      {
        id: 'question-task-limit',
        paperId: 1,
        title: 'What limits the claim?',
        prompt: 'Find the main limitation.',
        type: 'limitation',
        status: 'limited',
        parentQuestionId: 'question-task-claim',
        dependsOnQuestionIds: ['question-task-claim'],
        assignedEvidenceIds: [11],
        position: { x: 320, y: 120 },
      },
    ];
    const questionRelations: QuestionRelation[] = [
      {
        id: 'relation-1',
        paperId: 1,
        sourceQuestionId: 'question-task-limit',
        targetQuestionId: 'question-task-claim',
        relationType: 'limitation-of',
        createdAt: '2026-03-26T00:00:00.000Z',
      },
    ];

    await act(async () => {
      await result.current.saveQuestionState(1, questionNodes, questionRelations, {
        paperId: 1,
        activeQuestionId: 'question-task-claim',
        mode: 'checking',
        message: 'outdated snapshot',
        updatedAt: '2026-03-26T00:00:00.000Z',
      });
    });

    expect(result.current.doctorState).toEqual(
      expect.objectContaining({
        mode: 'limitation-found',
        activeQuestionId: 'question-task-limit',
      })
    );
    expect(mockDbHelpers.saveDoctorState).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'limitation-found',
      })
    );
  });
});
