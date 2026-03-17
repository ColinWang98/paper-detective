import React from 'react';
import { render, screen } from '@testing-library/react';

import { TaskBoard } from '@/components/case/TaskBoard';
import type { InvestigationTask } from '@/types';

describe('TaskBoard', () => {
  it('shows locked, available, and completed task states with linked sections', () => {
    const tasks: InvestigationTask[] = [
      {
        id: 'task-1',
        title: 'Define the Case',
        question: 'What problem does the paper claim to solve?',
        narrativeHook: 'Start with the opening claim.',
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
        linkedStructureKinds: ['related-work', 'method'],
        requiredEvidenceTypes: ['comparison', 'method'],
        minEvidenceCount: 2,
        unlocksTaskIds: ['task-3'],
        status: 'locked',
      },
      {
        id: 'task-3',
        title: 'Check Whether the Results Hold Up',
        question: 'Do the experiments support the main claim?',
        narrativeHook: 'Follow the evidence into the experiments.',
        linkedStructureKinds: ['experiment', 'result'],
        requiredEvidenceTypes: ['result'],
        minEvidenceCount: 1,
        unlocksTaskIds: ['task-4'],
        status: 'completed',
      },
    ];

    render(<TaskBoard tasks={tasks} activeTaskId="task-1" />);

    const taskOneCard = screen.getByRole('heading', { name: 'Define the Case' }).closest('article');
    const taskTwoCard = screen.getByRole('heading', { name: 'Identify the Real Innovation' }).closest('article');
    const taskThreeCard = screen
      .getByRole('heading', { name: 'Check Whether the Results Hold Up' })
      .closest('article');

    expect(taskOneCard).toHaveTextContent('Status: available');
    expect(taskOneCard).toHaveTextContent('Sections: intro');
    expect(taskTwoCard).toHaveTextContent('Status: locked');
    expect(taskTwoCard).toHaveTextContent('Sections: related-work, method');
    expect(taskThreeCard).toHaveTextContent('Status: completed');
  });
});
