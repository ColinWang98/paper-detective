import { act, renderHook } from '@testing-library/react';

import { usePaperStore } from '@/lib/store';
import type { DoctorState, QuestionNode, QuestionRelation } from '@/types';

jest.mock('@/lib/db', () => ({
  dbHelpers: {
    getQuestionNodes: jest.fn(),
    getQuestionRelations: jest.fn(),
    getDoctorState: jest.fn(),
    saveQuestionNodes: jest.fn(),
    saveQuestionRelations: jest.fn(),
    saveDoctorState: jest.fn(),
  },
}));

const { dbHelpers } = jest.requireMock('@/lib/db') as {
  dbHelpers: {
    getQuestionNodes: jest.Mock;
    getQuestionRelations: jest.Mock;
    getDoctorState: jest.Mock;
    saveQuestionNodes: jest.Mock;
    saveQuestionRelations: jest.Mock;
    saveDoctorState: jest.Mock;
  };
};

describe('usePaperStore question-centered state', () => {
  beforeEach(() => {
    usePaperStore.setState({
      questionNodes: [],
      questionRelations: [],
      doctorState: null,
      error: null,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  it('loads question nodes, relations, and doctor state for a paper', async () => {
    const questionNodes: QuestionNode[] = [
      {
        id: 'claim-q1',
        paperId: 1,
        title: 'What is the core claim?',
        prompt: 'Lock the central claim.',
        type: 'claim',
        status: 'open',
        parentQuestionId: null,
        dependsOnQuestionIds: [],
        assignedEvidenceIds: [],
        position: { x: 100, y: 120 },
      },
    ];
    const questionRelations: QuestionRelation[] = [
      {
        id: 'rel-1',
        paperId: 1,
        sourceQuestionId: 'claim-q1',
        targetQuestionId: 'method-q2',
        relationType: 'method-for',
        createdAt: '2026-03-26T00:00:00.000Z',
      },
    ];
    const doctorState: DoctorState = {
      paperId: 1,
      activeQuestionId: 'claim-q1',
      mode: 'checking',
      message: 'Support is still incomplete.',
      updatedAt: '2026-03-26T00:00:00.000Z',
    };

    dbHelpers.getQuestionNodes.mockResolvedValue(questionNodes);
    dbHelpers.getQuestionRelations.mockResolvedValue(questionRelations);
    dbHelpers.getDoctorState.mockResolvedValue(doctorState);

    const { result } = renderHook(() => usePaperStore());

    await act(async () => {
      await result.current.loadQuestionState(1);
    });

    expect(result.current.questionNodes).toEqual(questionNodes);
    expect(result.current.questionRelations).toEqual(questionRelations);
    expect(result.current.doctorState).toEqual(doctorState);
  });

  it('saves question graph state back through the store', async () => {
    const { result } = renderHook(() => usePaperStore());
    const questionNodes: QuestionNode[] = [
      {
        id: 'claim-q1',
        paperId: 1,
        title: 'What is the core claim?',
        prompt: 'Lock the central claim.',
        type: 'claim',
        status: 'supported',
        parentQuestionId: null,
        dependsOnQuestionIds: [],
        assignedEvidenceIds: [1],
        position: { x: 100, y: 120 },
      },
    ];
    const questionRelations: QuestionRelation[] = [
      {
        id: 'rel-1',
        paperId: 1,
        sourceQuestionId: 'claim-q1',
        targetQuestionId: 'limit-q2',
        relationType: 'limitation-of',
        createdAt: '2026-03-26T00:00:00.000Z',
      },
    ];
    const doctorState: DoctorState = {
      paperId: 1,
      activeQuestionId: 'claim-q1',
      mode: 'partial-confirmation',
      message: 'The claim is supported, but one limitation remains.',
      updatedAt: '2026-03-26T00:00:00.000Z',
    };

    await act(async () => {
      await result.current.saveQuestionState(1, questionNodes, questionRelations, doctorState);
    });

    expect(dbHelpers.saveQuestionNodes).toHaveBeenCalledWith(1, questionNodes);
    expect(dbHelpers.saveQuestionRelations).toHaveBeenCalledWith(1, questionRelations);
    expect(dbHelpers.saveDoctorState).toHaveBeenCalledWith(
      expect.objectContaining({
        paperId: 1,
        activeQuestionId: 'claim-q1',
        mode: 'diagnosis-complete',
        message: expect.stringMatching(/main diagnostic questions are resolved/i),
      })
    );
    expect(result.current.questionNodes).toEqual(questionNodes);
    expect(result.current.questionRelations).toEqual(questionRelations);
    expect(result.current.doctorState).toEqual(
      expect.objectContaining({
        paperId: 1,
        activeQuestionId: 'claim-q1',
        mode: 'diagnosis-complete',
        message: expect.stringMatching(/main diagnostic questions are resolved/i),
      })
    );
  });
});
