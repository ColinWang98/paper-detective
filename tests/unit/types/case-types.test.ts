import type {
  CaseSetup,
  DoctorState,
  EvidenceSubmission,
  InvestigationTask,
  PaperStructureNode,
  QuestionNode,
  QuestionRelation,
} from '@/types';

describe('case investigation domain types', () => {
  it('stores structure nodes and tasks in a case setup', () => {
    const structureNodes: PaperStructureNode[] = [
      {
        id: 'intro-1',
        kind: 'intro',
        title: 'Introduction',
        summary: 'Frames the core problem.',
        pageHints: [1],
        importance: 'critical',
        status: 'unseen',
      },
    ];

    const tasks: InvestigationTask[] = [
      {
        id: 'task-1',
        title: 'Lock the Core Claim',
        question: 'Find the exact problem statement and the main claim the authors want you to believe.',
        narrativeHook: 'Start with the paper opening claim.',
        section: 'intro',
        whereToLook: ['Introduction', 'Abstract'],
        whatToFind: 'The sentence that states the paper problem and the central claim.',
        submissionMode: 'evidence_only',
        recommendedEvidenceCount: 1,
        evaluationFocus: 'Did the player capture the exact claim wording?',
        linkedStructureKinds: ['intro'],
        requiredEvidenceTypes: ['claim'],
        minEvidenceCount: 1,
        unlocksTaskIds: ['task-2'],
        status: 'available',
      },
    ];

    const caseSetup: CaseSetup = {
      paperId: 1,
      caseTitle: 'The Missing Baseline',
      caseBackground: 'A new method needs scrutiny.',
      coreDispute: 'Whether the method is meaningfully novel.',
      openingJudgment: 'Initial signs are promising but incomplete.',
      investigationGoal: 'Verify the paper with direct text evidence.',
      structureNodes,
      tasks,
      questionNodes: [
        {
          id: 'question-task-1',
          paperId: 1,
          title: 'Lock the Core Claim',
          prompt: 'Find the exact problem statement and the main claim the authors want you to believe.',
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
        paperId: 1,
        activeQuestionId: 'question-task-1',
        mode: 'skeptical',
        message: 'The central claim still needs direct support.',
        updatedAt: '2026-03-26T00:00:00.000Z',
      },
      generatedAt: '2026-03-17T00:00:00.000Z',
      model: 'glm-4.7-flash',
      source: 'ai-generated',
    };

    expect(caseSetup.structureNodes).toHaveLength(1);
    expect(caseSetup.tasks[0]?.linkedStructureKinds).toEqual(['intro']);
    expect(caseSetup.tasks[0]?.submissionMode).toBe('evidence_only');
  });

  it('restricts investigation task status to allowed values', () => {
    const statuses: InvestigationTask['status'][] = [
      'locked',
      'available',
      'in_progress',
      'completed',
    ];

    expect(statuses).toEqual(['locked', 'available', 'in_progress', 'completed']);
  });

  it('requires taskId, highlightId, and note for evidence submissions', () => {
    const evidence: EvidenceSubmission = {
      paperId: 1,
      taskId: 'task-1',
      highlightId: 12,
      evidenceType: 'claim',
      note: 'The abstract states the exact problem scope.',
      sourceSection: 'intro',
      userInterpretation: 'This sentence is the core claim.',
      aiTags: ['claim', 'scope'],
      clusterId: 'supports-claim',
      scoreContribution: 0.2,
      createdAt: '2026-03-17T00:00:00.000Z',
    };

    expect(evidence.taskId).toBe('task-1');
    expect(evidence.highlightId).toBe(12);
    expect(evidence.note).toContain('problem scope');
    expect(evidence.sourceSection).toBe('intro');
    expect(evidence.aiTags).toContain('claim');
  });

  it('defines question nodes as the primary investigation unit', () => {
    const questionNode: QuestionNode = {
      id: 'claim-q1',
      paperId: 1,
      title: 'What is the core claim?',
      prompt: 'Lock the authors’ exact central claim before checking support.',
      type: 'claim',
      status: 'open',
      parentQuestionId: null,
      dependsOnQuestionIds: [],
      assignedEvidenceIds: [11, 12],
      position: { x: 120, y: 180 },
      score: 0,
      feedback: 'No evidence attached yet.',
    };

    expect(questionNode.type).toBe('claim');
    expect(questionNode.assignedEvidenceIds).toEqual([11, 12]);
    expect(questionNode.parentQuestionId).toBeNull();
  });

  it('defines question relations separately from evidence relationships', () => {
    const relation: QuestionRelation = {
      id: 'rel-1',
      paperId: 1,
      sourceQuestionId: 'claim-q1',
      targetQuestionId: 'method-q2',
      relationType: 'method-for',
      note: 'The method question explains how the claim is achieved.',
      createdAt: '2026-03-26T00:00:00.000Z',
    };

    expect(relation.relationType).toBe('method-for');
    expect(relation.sourceQuestionId).toBe('claim-q1');
  });

  it('tracks doctor state as a persistent diagnostic summary', () => {
    const doctorState: DoctorState = {
      paperId: 1,
      activeQuestionId: 'claim-q1',
      mode: 'checking',
      message: 'The core claim is identified, but support is still incomplete.',
      updatedAt: '2026-03-26T00:00:00.000Z',
    };

    expect(doctorState.mode).toBe('checking');
    expect(doctorState.activeQuestionId).toBe('claim-q1');
  });
});
