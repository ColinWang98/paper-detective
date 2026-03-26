import { fireEvent, render, screen } from '@testing-library/react';

import { QuestionsTab } from '@/components/case/QuestionsTab';
import type { QuestionNode } from '@/types';

describe('QuestionsTab', () => {
  const questionNodes: QuestionNode[] = [
    {
      id: 'question-task-1',
      paperId: 1,
      title: 'What is the core claim?',
      prompt: 'Lock the exact central claim first.',
      type: 'claim',
      status: 'open',
      parentQuestionId: null,
      dependsOnQuestionIds: [],
      assignedEvidenceIds: [],
      position: { x: 120, y: 120 },
    },
    {
      id: 'question-task-2',
      paperId: 1,
      title: 'What evidence supports the claim?',
      prompt: 'Find the strongest direct evidence.',
      type: 'evidence',
      status: 'partial',
      parentQuestionId: 'question-task-1',
      dependsOnQuestionIds: ['question-task-1'],
      assignedEvidenceIds: [1, 2],
      position: { x: 320, y: 240 },
    },
  ];

  it('renders question nodes with type, status, and dependency info', () => {
    render(
      <QuestionsTab
        questionNodes={questionNodes}
        activeQuestionId="question-task-1"
        onSelectQuestion={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /What is the core claim\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What evidence supports the claim\?/i })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('2 questions available');
    expect(document.body).toHaveTextContent('Claim');
    expect(document.body).toHaveTextContent('Evidence');
    expect(document.body).toHaveTextContent('Depends on 1 question');
    expect(document.body).toHaveTextContent('2 attached evidence');
  });

  it('calls onSelectQuestion when a question node is clicked', () => {
    const onSelectQuestion = jest.fn();

    render(
      <QuestionsTab
        questionNodes={questionNodes}
        activeQuestionId="question-task-1"
        onSelectQuestion={onSelectQuestion}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /What evidence supports the claim\?/i }));
    expect(onSelectQuestion).toHaveBeenCalledWith('question-task-2');
  });
});
