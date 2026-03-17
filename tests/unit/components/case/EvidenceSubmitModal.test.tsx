import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { EvidenceSubmitModal } from '@/components/case/EvidenceSubmitModal';
import type { Highlight, InvestigationTask } from '@/types';

describe('EvidenceSubmitModal', () => {
  const highlight: Highlight = {
    id: 12,
    paperId: 1,
    pageNumber: 3,
    text: 'A highlighted sentence',
    priority: 'important',
    color: 'yellow',
    timestamp: '2026-03-17T00:00:00.000Z',
    createdAt: '2026-03-17T00:00:00.000Z',
  };

  const tasks: InvestigationTask[] = [
    {
      id: 'task-1',
      title: 'Define the Case',
      question: 'What problem does the paper claim to solve?',
      narrativeHook: 'Start with the opening claim.',
      linkedStructureKinds: ['intro'],
      requiredEvidenceTypes: ['claim'],
      minEvidenceCount: 1,
      unlocksTaskIds: [],
      status: 'available',
    },
  ];

  it('collects task, evidence type, and note before submitting', async () => {
    const onSubmit = jest.fn();

    render(
      <EvidenceSubmitModal
        highlight={highlight}
        tasks={tasks}
        isOpen
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    );

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Evidence Type' }), {
        target: { value: 'result' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), {
        target: { value: 'This sentence states the measured improvement.' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save Evidence' }));
    });

    expect(onSubmit).toHaveBeenCalledWith(
      'task-1',
      'result',
      'This sentence states the measured improvement.'
    );
  });
});
