import { evaluateTaskProgress } from '@/lib/investigationRules';
import type { EvidenceSubmission, InvestigationTask } from '@/types';

describe('investigation rules', () => {
  const tasks: InvestigationTask[] = [
    {
      id: 'task-1',
      title: 'Define the Case',
      question: 'What problem does the paper claim to solve?',
      narrativeHook: 'Start with the opening claim.',
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
    {
      id: 'task-2',
      title: 'Identify the Real Innovation',
      question: 'What is genuinely new compared with prior work?',
      narrativeHook: 'Separate novelty from framing.',
      section: 'related-work',
      whereToLook: ['Related Work', 'Method'],
      whatToFind: 'Comparison evidence and a concrete new method detail.',
      submissionMode: 'evidence_plus_optional_judgment',
      recommendedEvidenceCount: 2,
      evaluationFocus: 'novelty vs reused framing',
      linkedStructureKinds: ['related-work', 'method'],
      requiredEvidenceTypes: ['comparison', 'method'],
      minEvidenceCount: 2,
      unlocksTaskIds: [],
      status: 'locked',
    },
  ];

  it('keeps a task incomplete when evidence count is insufficient', () => {
    const evidence: EvidenceSubmission[] = [
      {
        paperId: 1,
        taskId: 'task-2',
        highlightId: 1,
        evidenceType: 'comparison',
        note: 'Only one piece of evidence.',
        createdAt: '2026-03-17T00:00:00.000Z',
      },
    ];

    const updatedTasks = evaluateTaskProgress(tasks, evidence);

    expect(updatedTasks[1].status).toBe('locked');
  });

  it('keeps a task incomplete when a required evidence type is missing', () => {
    const evidence: EvidenceSubmission[] = [
      {
        paperId: 1,
        taskId: 'task-2',
        highlightId: 1,
        evidenceType: 'comparison',
        note: 'Comparison evidence.',
        createdAt: '2026-03-17T00:00:00.000Z',
      },
      {
        paperId: 1,
        taskId: 'task-2',
        highlightId: 2,
        evidenceType: 'comparison',
        note: 'Still no method evidence.',
        createdAt: '2026-03-17T00:01:00.000Z',
      },
    ];

    const updatedTasks = evaluateTaskProgress(tasks, evidence);

    expect(updatedTasks[1].status).toBe('locked');
  });

  it('completes a task and unlocks the next task when criteria are met', () => {
    const evidence: EvidenceSubmission[] = [
      {
        paperId: 1,
        taskId: 'task-1',
        highlightId: 1,
        evidenceType: 'claim',
        note: 'Problem statement evidence.',
        createdAt: '2026-03-17T00:00:00.000Z',
      },
    ];

    const updatedTasks = evaluateTaskProgress(tasks, evidence);

    expect(updatedTasks[0].status).toBe('completed');
    expect(updatedTasks[1].status).toBe('available');
  });
});
