import { db, dbHelpers } from '@/lib/db';
import type {
  CaseSetup,
  DoctorState,
  EvidenceSubmission,
  InvestigationTask,
  PaperStructureNode,
  QuestionNode,
  QuestionRelation,
} from '@/types';

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
}

describe('dbHelpers case setup persistence', () => {
  const structureNodes: PaperStructureNode[] = [
    {
      id: 'intro-1',
      kind: 'intro',
      title: 'Introduction',
      summary: 'Frames the main problem.',
      pageHints: [1],
      importance: 'critical',
      status: 'unseen',
    },
  ];

  const tasks: InvestigationTask[] = [
    {
      id: 'task-1',
      title: 'Define the Case',
      question: 'What problem does the paper claim to solve?',
      narrativeHook: 'Start with the opening problem statement.',
      section: 'intro',
      whereToLook: ['Introduction'],
      whatToFind: 'The exact problem statement and central claim.',
      submissionMode: 'evidence_only',
      recommendedEvidenceCount: 1,
      evaluationFocus: 'claim precision',
      linkedStructureKinds: ['intro'],
      requiredEvidenceTypes: ['claim'],
      minEvidenceCount: 1,
      unlocksTaskIds: ['task-2'],
      status: 'available',
    },
  ];

  const caseSetup: CaseSetup = {
    paperId: 7,
    caseTitle: 'The Baseline Dispute',
    caseBackground: 'A paper claims a significant improvement.',
    coreDispute: 'Whether the contribution is actually novel.',
    openingJudgment: 'The claim is plausible but not yet proven.',
    investigationGoal: 'Verify each claim against the paper text.',
    structureNodes,
    tasks,
    questionNodes: [
      {
        id: 'question-task-1',
        paperId: 7,
        title: 'Define the Case',
        prompt: 'What problem does the paper claim to solve?',
        type: 'claim',
        status: 'open',
        parentQuestionId: null,
        dependsOnQuestionIds: [],
        assignedEvidenceIds: [],
        position: { x: 120, y: 120 },
      },
    ],
    questionRelations: [],
    doctorState: {
      paperId: 7,
      activeQuestionId: 'question-task-1',
      mode: 'skeptical',
      message: 'The core claim still needs direct evidence.',
      updatedAt: '2026-03-26T00:00:00.000Z',
    },
    generatedAt: '2026-03-17T00:00:00.000Z',
    model: 'glm-4.7-flash',
    source: 'ai-generated',
  };

  const evidenceSubmissions: EvidenceSubmission[] = [
    {
      paperId: 7,
      taskId: 'task-1',
      highlightId: 101,
      evidenceType: 'claim',
      note: 'The abstract names the exact problem.',
      createdAt: '2026-03-17T00:00:00.000Z',
    },
    {
      paperId: 7,
      taskId: 'task-2',
      highlightId: 102,
      evidenceType: 'method',
      note: 'The method section states the new component.',
      createdAt: '2026-03-17T00:01:00.000Z',
    },
  ];

  const questionNodes: QuestionNode[] = [
    {
      id: 'claim-q1',
      paperId: 7,
      title: 'What is the core claim?',
      prompt: 'Find the exact central claim.',
      type: 'claim',
      status: 'open',
      parentQuestionId: null,
      dependsOnQuestionIds: [],
      assignedEvidenceIds: [],
      position: { x: 80, y: 120 },
    },
    {
      id: 'method-q2',
      paperId: 7,
      title: 'How does the method produce the result?',
      prompt: 'Tie the method to the claimed gain.',
      type: 'method',
      status: 'partial',
      parentQuestionId: 'claim-q1',
      dependsOnQuestionIds: ['claim-q1'],
      assignedEvidenceIds: [1],
      position: { x: 280, y: 180 },
      score: 0.5,
      feedback: 'Method evidence is partial.',
    },
  ];

  const questionRelations: QuestionRelation[] = [
    {
      id: 'rel-1',
      paperId: 7,
      sourceQuestionId: 'method-q2',
      targetQuestionId: 'claim-q1',
      relationType: 'method-for',
      note: 'Method explains how the claim is achieved.',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
  ];

  const doctorState: DoctorState = {
    paperId: 7,
    activeQuestionId: 'claim-q1',
    mode: 'checking',
    message: 'The claim is identified, but support is still incomplete.',
    updatedAt: '2026-03-26T00:00:00.000Z',
  };

  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterAll(async () => {
    await db.delete();
  });

  it('saves and loads a case setup by paperId', async () => {
    await dbHelpers.saveCaseSetup(caseSetup);

    const loaded = await dbHelpers.getCaseSetup(7);

    expect(loaded).toMatchObject({
      paperId: 7,
      caseTitle: 'The Baseline Dispute',
      model: 'glm-4.7-flash',
    });
    expect(loaded?.structureNodes).toEqual(structureNodes);
    expect(loaded?.tasks).toEqual(tasks);
  });

  it('saves and loads evidence submissions scoped by paperId', async () => {
    for (const submission of evidenceSubmissions) {
      await dbHelpers.addEvidenceSubmission(submission);
    }

    await dbHelpers.addEvidenceSubmission({
      paperId: 99,
      taskId: 'task-x',
      highlightId: 999,
      evidenceType: 'result',
      note: 'Other paper evidence.',
      createdAt: '2026-03-17T00:02:00.000Z',
    });

    const loaded = await dbHelpers.getEvidenceSubmissions(7);

    expect(loaded).toHaveLength(2);
    expect(loaded.map((submission) => submission.taskId)).toEqual(['task-1', 'task-2']);
    expect(loaded.every((submission) => submission.paperId === 7)).toBe(true);
  });

  it('saves and loads question-centered investigation state by paperId', async () => {
    await dbHelpers.saveQuestionNodes(7, questionNodes);
    await dbHelpers.saveQuestionRelations(7, questionRelations);
    await dbHelpers.saveDoctorState(doctorState);

    const [loadedNodes, loadedRelations, loadedDoctorState] = await Promise.all([
      dbHelpers.getQuestionNodes(7),
      dbHelpers.getQuestionRelations(7),
      dbHelpers.getDoctorState(7),
    ]);

    expect(loadedNodes).toEqual(questionNodes);
    expect(loadedRelations).toEqual(questionRelations);
    expect(loadedDoctorState).toEqual(doctorState);
  });
});
