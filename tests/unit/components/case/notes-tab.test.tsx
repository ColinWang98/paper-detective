import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { NotesTab } from '@/components/case/NotesTab';
import type { EvidenceSubmission, Highlight, InvestigationTask, QuestionNode } from '@/types';

describe('NotesTab', () => {
  const activeTask: InvestigationTask = {
    id: 'task-claim',
    title: 'Lock the Core Claim',
    question: 'Find the central claim in the authors’ own words.',
    narrativeHook: 'Start with the introduction.',
    section: 'intro',
    whereToLook: ['Introduction'],
    whatToFind: 'The core claim sentence.',
    submissionMode: 'evidence_plus_optional_judgment',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'claim precision',
    linkedStructureKinds: ['intro'],
    requiredEvidenceTypes: ['claim'],
    minEvidenceCount: 1,
    unlocksTaskIds: [],
    status: 'available',
  };

  const activeQuestion: QuestionNode = {
    id: 'question-task-claim',
    paperId: 1,
    title: 'What is the core claim?',
    prompt: 'Find the central claim in the authors’ own words.',
    type: 'claim',
    status: 'partial',
    parentQuestionId: null,
    dependsOnQuestionIds: [],
    assignedEvidenceIds: [12],
    position: { x: 120, y: 140 },
    score: 84,
    feedback: 'The claim is mostly identified, but the wording can be tighter.',
  };

  const submissions: EvidenceSubmission[] = [
    {
      id: 12,
      paperId: 1,
      taskId: 'task-claim',
      highlightId: 44,
      evidenceType: 'claim',
      note: 'This sentence states the central claim.',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
    {
      id: 13,
      paperId: 1,
      taskId: 'task-other',
      highlightId: 45,
      evidenceType: 'result',
      note: 'A result from another question.',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
  ];

  const highlights: Highlight[] = [
    {
      id: 44,
      paperId: 1,
      pageNumber: 1,
      text: 'We argue that resting-state brooding narrows conceptual scope.',
      priority: 'critical',
      color: 'yellow',
      timestamp: '2026-03-26T00:00:00.000Z',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
    {
      id: 45,
      paperId: 1,
      pageNumber: 2,
      text: 'Another sentence from a different task.',
      priority: 'important',
      color: 'yellow',
      timestamp: '2026-03-26T00:00:00.000Z',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
  ];

  it('renders a question-centered notes workspace and only shows evidence attached to the active question', () => {
    render(
      <NotesTab
        activeQuestion={activeQuestion}
        activeTask={activeTask}
        evidenceSubmissions={submissions}
        highlights={highlights}
        judgment=""
        onJudgmentChange={jest.fn()}
        onSubmitQuestion={jest.fn()}
      />
    );

    expect(document.body).toHaveTextContent('Question Workspace');
    expect(screen.getByRole('heading', { name: 'What is the core claim?' })).toBeInTheDocument();
    expect(screen.getByText(/Claim question/i)).toBeInTheDocument();
    expect(document.body).toHaveTextContent('1 attached evidence');
    expect(document.body).toHaveTextContent('This sentence states the central claim.');
    expect(screen.queryByText('A result from another question.')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Evidence Archive' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bubble Notes Board' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Optional answer' })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('Score: 84/100');
  });

  it('submits the active question and updates the optional answer', () => {
    const handleJudgmentChange = jest.fn();
    const handleSubmitQuestion = jest.fn();

    render(
      <NotesTab
        activeQuestion={activeQuestion}
        activeTask={activeTask}
        evidenceSubmissions={submissions}
        highlights={highlights}
        judgment="Initial reading."
        onJudgmentChange={handleJudgmentChange}
        onSubmitQuestion={handleSubmitQuestion}
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Optional answer' }), {
      target: { value: 'The authors claim brooding narrows conceptual scope.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Question' }));

    expect(handleJudgmentChange).toHaveBeenCalledWith(
      'The authors claim brooding narrows conceptual scope.'
    );
    expect(handleSubmitQuestion).toHaveBeenCalled();
  });
});
