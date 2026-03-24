import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { EvidenceBoxTab } from '@/components/case/EvidenceBoxTab';
import type { EvidenceSubmission, Highlight, InvestigationTask } from '@/types';

describe('EvidenceBoxTab', () => {
  const activeTask: InvestigationTask = {
    id: 'task-1',
    title: 'Check the Result Support',
    question: 'What experimental evidence supports the claim?',
    narrativeHook: 'Look at the results section.',
    section: 'result',
    whereToLook: ['Results'],
    whatToFind: 'Result evidence',
    submissionMode: 'evidence_plus_optional_judgment',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'evidence coverage',
    linkedStructureKinds: ['result'],
    requiredEvidenceTypes: ['result'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
    status: 'available',
  };

  const evidenceSubmissions: EvidenceSubmission[] = [
    {
      id: 1,
      paperId: 1,
      taskId: 'task-1',
      highlightId: 10,
      evidenceType: 'result',
      note: 'This table supports the result claim.',
      createdAt: '2026-03-19T00:00:00.000Z',
    },
  ];

  const highlights: Highlight[] = [
    {
      id: 10,
      paperId: 1,
      pageNumber: 4,
      text: 'Accuracy improves by 12%.',
      priority: 'important',
      color: 'yellow',
      timestamp: '2026-03-19T00:00:00.000Z',
      createdAt: '2026-03-19T00:00:00.000Z',
    },
  ];

  it('renders optional judgment input and submits the current question', () => {
    const onJudgmentChange = jest.fn();
    const onSubmitQuestion = jest.fn();

    render(
      <EvidenceBoxTab
        activeTask={activeTask}
        evidenceSubmissions={evidenceSubmissions}
        highlights={highlights}
        judgment="The result seems convincing."
        onJudgmentChange={onJudgmentChange}
        onSubmitQuestion={onSubmitQuestion}
      />
    );

    expect(screen.getByRole('button', { name: 'Submit Question' })).toBeEnabled();
    expect(screen.getByRole('textbox', { name: 'Optional judgment' })).toHaveValue(
      'The result seems convincing.'
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Optional judgment' }), {
      target: { value: 'Need one more baseline.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Question' }));

    expect(onJudgmentChange).toHaveBeenCalled();
    expect(onSubmitQuestion).toHaveBeenCalled();
  });

  it('shows score and feedback when the task has already been evaluated', () => {
    render(
      <EvidenceBoxTab
        activeTask={{
          ...activeTask,
          score: 87,
          feedback: 'The evidence is good but still needs one stronger comparison.',
        }}
        evidenceSubmissions={evidenceSubmissions}
        highlights={highlights}
        judgment=""
        onJudgmentChange={jest.fn()}
        onSubmitQuestion={jest.fn()}
      />
    );

    expect(document.body).toHaveTextContent('Score: 87/100');
    expect(document.body).toHaveTextContent('The evidence is good but still needs one stronger comparison.');
  });
});
