import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ClusterTab } from '@/components/case/ClusterTab';
import type { EvidenceSubmission, Highlight, InvestigationTask } from '@/types';

describe('ClusterTab', () => {
  const activeTask: InvestigationTask = {
    id: 'task-1',
    title: 'Check the Result Support',
    question: 'What experimental evidence supports the claim?',
    narrativeHook: 'Look at the results section.',
    section: 'result',
    whereToLook: ['Results'],
    whatToFind: 'Result evidence',
    submissionMode: 'evidence_plus_optional_judgment',
    recommendedEvidenceCount: 2,
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
      note: 'Table 2 shows the strongest gain.',
      clusterId: 'supports-claim',
      createdAt: '2026-03-21T00:00:00.000Z',
    },
    {
      id: 2,
      paperId: 1,
      taskId: 'task-1',
      highlightId: 11,
      evidenceType: 'limitation',
      note: 'The gain only appears on one benchmark.',
      createdAt: '2026-03-21T00:00:00.000Z',
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
      timestamp: '2026-03-21T00:00:00.000Z',
      createdAt: '2026-03-21T00:00:00.000Z',
    },
    {
      id: 11,
      paperId: 1,
      pageNumber: 5,
      text: 'The method does not generalize to larger datasets.',
      priority: 'important',
      color: 'yellow',
      timestamp: '2026-03-21T00:00:00.000Z',
      createdAt: '2026-03-21T00:00:00.000Z',
    },
  ];

  it('renders grouped evidence bubbles and exposes manual clustering controls', () => {
    const onAssignCluster = jest.fn();

    render(
      <ClusterTab
        activeTask={activeTask}
        evidenceSubmissions={evidenceSubmissions}
        highlights={highlights}
        onAssignCluster={onAssignCluster}
        onUpdateTags={jest.fn()}
        onAIAutoCluster={jest.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Check the Result Support' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Supports Claim' })).toHaveTextContent(
      'Table 2 shows the strongest gain.'
    );
    expect(document.body).toHaveTextContent('The gain only appears on one benchmark.');

    fireEvent.click(screen.getAllByRole('button', { name: 'Needs Skepticism' })[1]!);

    expect(onAssignCluster).toHaveBeenCalledWith(2, 'needs-skepticism');
  });

  it('auto-arranges unsorted evidence into heuristic clusters and can reset them', () => {
    const onAssignCluster = jest.fn();

    const { rerender } = render(
      <ClusterTab
        activeTask={activeTask}
        evidenceSubmissions={evidenceSubmissions}
        highlights={highlights}
        onAssignCluster={onAssignCluster}
        onUpdateTags={jest.fn()}
        onAIAutoCluster={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Auto Arrange' }));

    expect(onAssignCluster).toHaveBeenCalledWith(1, 'supports-claim');
    expect(onAssignCluster).toHaveBeenCalledWith(2, 'needs-skepticism');

    onAssignCluster.mockClear();

    rerender(
      <ClusterTab
        activeTask={activeTask}
        evidenceSubmissions={[
          { ...evidenceSubmissions[0]!, clusterId: 'supports-claim' },
          { ...evidenceSubmissions[1]!, clusterId: 'needs-skepticism' },
        ]}
        highlights={highlights}
        onAssignCluster={onAssignCluster}
        onUpdateTags={jest.fn()}
        onAIAutoCluster={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset Clusters' }));

    expect(onAssignCluster).toHaveBeenCalledWith(1, null);
    expect(onAssignCluster).toHaveBeenCalledWith(2, null);
  });

  it('exposes an AI auto-cluster action', () => {
    const onAIAutoCluster = jest.fn();

    render(
      <ClusterTab
        activeTask={activeTask}
        evidenceSubmissions={evidenceSubmissions}
        highlights={highlights}
        onAssignCluster={jest.fn()}
        onUpdateTags={jest.fn()}
        onAIAutoCluster={onAIAutoCluster}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'AI Auto Cluster' }));

    expect(onAIAutoCluster).toHaveBeenCalled();
  });

  it('shows editable tags as chips and saves the updated chip list for a bubble', () => {
    const onUpdateTags = jest.fn();

    render(
      <ClusterTab
        activeTask={activeTask}
        evidenceSubmissions={[
          {
            ...evidenceSubmissions[0]!,
            aiTags: ['result', 'gain'],
          },
        ]}
        highlights={highlights}
        onAssignCluster={jest.fn()}
        onAIAutoCluster={jest.fn()}
        onUpdateTags={onUpdateTags}
      />
    );

    expect(screen.getAllByText('result').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Remove tag gain from bubble 1' })).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Bubble tags 1' });

    fireEvent.change(input, {
      target: { value: 'benchmark' },
    });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    fireEvent.change(input, {
      target: { value: 'support' },
    });
    fireEvent.keyDown(input, { key: ',', code: 'Comma' });

    fireEvent.click(screen.getByRole('button', { name: 'Remove tag gain from bubble 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Tags 1' }));

    expect(onUpdateTags).toHaveBeenCalledWith(1, ['result', 'benchmark', 'support']);
  });
});
