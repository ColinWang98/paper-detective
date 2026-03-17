import { db, dbHelpers } from '@/lib/db';
import type { CaseSetup, EvidenceSubmission, InvestigationTask, PaperStructureNode } from '@/types';

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
});
