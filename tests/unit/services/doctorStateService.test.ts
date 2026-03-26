import { deriveDoctorState } from '@/services/doctorStateService';
import type { QuestionNode, QuestionRelation } from '@/types';

describe('doctorStateService', () => {
  const baseQuestions: QuestionNode[] = [
    {
      id: 'question-task-claim',
      paperId: 1,
      title: 'What is the core claim?',
      prompt: 'Find the central claim.',
      type: 'claim',
      status: 'open',
      parentQuestionId: null,
      dependsOnQuestionIds: [],
      assignedEvidenceIds: [],
      position: { x: 100, y: 100 },
    },
    {
      id: 'question-task-result',
      paperId: 1,
      title: 'Which result best supports the claim?',
      prompt: 'Find the strongest result.',
      type: 'evidence',
      status: 'open',
      parentQuestionId: 'question-task-claim',
      dependsOnQuestionIds: ['question-task-claim'],
      assignedEvidenceIds: [],
      position: { x: 300, y: 100 },
    },
    {
      id: 'question-task-limitation',
      paperId: 1,
      title: 'What limits the claim?',
      prompt: 'Find the main limitation.',
      type: 'limitation',
      status: 'open',
      parentQuestionId: 'question-task-claim',
      dependsOnQuestionIds: ['question-task-claim'],
      assignedEvidenceIds: [],
      position: { x: 500, y: 100 },
    },
  ];

  it('stays skeptical when the claim question has no evidence', () => {
    const doctorState = deriveDoctorState({
      paperId: 1,
      questionNodes: baseQuestions,
      questionRelations: [],
    });

    expect(doctorState).toMatchObject({
      mode: 'skeptical',
      activeQuestionId: 'question-task-claim',
    });
    expect(doctorState?.message).toMatch(/still lacks direct evidence/i);
  });

  it('moves to partial confirmation when the claim has evidence but another question remains partial', () => {
    const doctorState = deriveDoctorState({
      paperId: 1,
      questionNodes: [
        {
          ...baseQuestions[0],
          status: 'supported',
          assignedEvidenceIds: [11],
        },
        {
          ...baseQuestions[1],
          status: 'partial',
          assignedEvidenceIds: [12],
        },
        baseQuestions[2],
      ],
      questionRelations: [],
    });

    expect(doctorState).toMatchObject({
      mode: 'partial-confirmation',
      activeQuestionId: 'question-task-result',
    });
  });

  it('surfaces limitation found when a limitation question is evidenced', () => {
    const doctorState = deriveDoctorState({
      paperId: 1,
      questionNodes: [
        {
          ...baseQuestions[0],
          status: 'supported',
          assignedEvidenceIds: [11],
        },
        {
          ...baseQuestions[1],
          status: 'supported',
          assignedEvidenceIds: [12],
        },
        {
          ...baseQuestions[2],
          status: 'limited',
          assignedEvidenceIds: [13],
        },
      ],
      questionRelations: [],
    });

    expect(doctorState).toMatchObject({
      mode: 'limitation-found',
      activeQuestionId: 'question-task-limitation',
    });
  });

  it('marks diagnosis complete when all questions are resolved and limitation relations exist', () => {
    const questionRelations: QuestionRelation[] = [
      {
        id: 'relation-1',
        paperId: 1,
        sourceQuestionId: 'question-task-limitation',
        targetQuestionId: 'question-task-claim',
        relationType: 'limitation-of',
        createdAt: '2026-03-26T00:00:00.000Z',
      },
    ];

    const doctorState = deriveDoctorState({
      paperId: 1,
      questionNodes: [
        {
          ...baseQuestions[0],
          status: 'supported',
          assignedEvidenceIds: [11],
        },
        {
          ...baseQuestions[1],
          status: 'supported',
          assignedEvidenceIds: [12],
        },
        {
          ...baseQuestions[2],
          status: 'limited',
          assignedEvidenceIds: [13],
        },
      ],
      questionRelations,
    });

    expect(doctorState).toMatchObject({
      mode: 'limitation-found',
      activeQuestionId: 'question-task-limitation',
    });
  });

  it('marks diagnosis complete when all questions are supported without active limitation pressure', () => {
    const doctorState = deriveDoctorState({
      paperId: 1,
      questionNodes: [
        {
          ...baseQuestions[0],
          status: 'supported',
          assignedEvidenceIds: [11],
        },
        {
          ...baseQuestions[1],
          status: 'supported',
          assignedEvidenceIds: [12],
        },
      ],
      questionRelations: [],
    });

    expect(doctorState).toMatchObject({
      mode: 'strong-support',
      activeQuestionId: 'question-task-claim',
    });
  });
});
