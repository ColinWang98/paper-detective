import type {
  CaseSetup,
  EvidenceSubmission,
  InvestigationTask,
  PaperStructureNode,
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
});
