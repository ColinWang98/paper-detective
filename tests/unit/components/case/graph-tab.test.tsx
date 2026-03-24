import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { GraphTab } from '@/components/case/GraphTab';
import type {
  DeductionGraph,
  EvidenceSubmission,
  Highlight,
  InvestigationTask,
} from '@/types';

jest.mock('@xyflow/react', () => {
  const React = require('react');

  return {
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ReactFlow: ({
      nodes,
      edges,
      onEdgeClick,
      onNodeClick,
      children,
    }: {
      nodes: Array<{ id: string; data: { title: string; summary: string } }>;
      edges: Array<{ id: string; source: string; target: string; label?: string }>;
      onEdgeClick?: (event: unknown, edge: any) => void;
      onNodeClick?: (event: unknown, node: any) => void;
      children: React.ReactNode;
    }) => (
      <div>
        <div data-testid="reactflow-nodes">{nodes.map((node) => node.data.title).join(' | ')}</div>
        <div>
          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              aria-label={`node-${node.id}`}
              onClick={() => onNodeClick?.({}, node)}
            >
              {node.data.title}
            </button>
          ))}
        </div>
        <div>
          {edges.map((edge) => (
            <button
              key={edge.id}
              type="button"
              aria-label={`edge-${edge.id}`}
              onClick={() => onEdgeClick?.({}, edge)}
            >
              {edge.label ?? edge.id}
            </button>
          ))}
        </div>
        {children}
      </div>
    ),
    Background: () => <div>Background</div>,
    Controls: () => <div>Controls</div>,
    MiniMap: () => <div>MiniMap</div>,
    Handle: () => <div>Handle</div>,
    Position: { Top: 'top', Bottom: 'bottom' },
    MarkerType: { ArrowClosed: 'arrowclosed' },
    addEdge: (edge: any, edges: any[]) => [...edges, edge],
    applyNodeChanges: (_changes: any, nodes: any[]) => nodes,
    applyEdgeChanges: (_changes: any, edges: any[]) => edges,
  };
});

describe('GraphTab', () => {
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

  const graph: DeductionGraph = {
    id: 1,
    paperId: 1,
    taskId: 'task-1',
    updatedAt: '2026-03-21T00:00:00.000Z',
    nodes: [
      {
        id: 'submission-1',
        paperId: 1,
        taskId: 'task-1',
        submissionId: 1,
        position: { x: 100, y: 100 },
        type: 'evidenceBubble',
        data: {
          title: 'Page 4',
          summary: 'Table 2 shows the strongest gain.',
          sourceText: 'Accuracy improves by 12%.',
          pageNumber: 4,
          evidenceType: 'result',
          tags: ['gain'],
        },
      },
      {
        id: 'submission-2',
        paperId: 1,
        taskId: 'task-1',
        submissionId: 2,
        position: { x: 300, y: 120 },
        type: 'evidenceBubble',
        data: {
          title: 'Page 5',
          summary: 'The gain only appears on one benchmark.',
          sourceText: 'The method does not generalize to larger datasets.',
          pageNumber: 5,
          evidenceType: 'limitation',
          tags: ['narrow'],
        },
      },
    ],
    edges: [
      {
        id: 'edge-submission-1-submission-2',
        source: 'submission-1',
        target: 'submission-2',
        relationType: 'contrast',
        note: 'Strong benchmark gain, but weak generalization.',
        createdAt: '2026-03-21T00:00:00.000Z',
      },
    ],
  };

  it('renders persisted evidence bubbles as compact ids', () => {
    render(
      <GraphTab
        activeTask={activeTask}
        evidenceSubmissions={evidenceSubmissions}
        highlights={highlights}
        graph={graph}
        onSaveGraph={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'node-submission-1' })).toHaveTextContent('E1');
    expect(screen.getByRole('button', { name: 'node-submission-2' })).toHaveTextContent('E2');
  });

  it('updates selected edge relation metadata and persists nodes + edges JSON', () => {
    const onSaveGraph = jest.fn();

    render(
      <GraphTab
        activeTask={activeTask}
        evidenceSubmissions={evidenceSubmissions}
        highlights={highlights}
        graph={graph}
        onSaveGraph={onSaveGraph}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'edge-edge-submission-1-submission-2' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Graph relation type' }), {
      target: { value: 'limitation' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Graph relation note' }), {
      target: { value: 'This limits how much we trust the result.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Link' }));

    expect(onSaveGraph).toHaveBeenCalledWith(
      'task-1',
      expect.arrayContaining([
        expect.objectContaining({
          submissionId: 1,
        }),
      ]),
      expect.arrayContaining([
        expect.objectContaining({
          id: 'edge-submission-1-submission-2',
          relationType: 'limitation',
          note: 'This limits how much we trust the result.',
        }),
      ])
    );
  });

  it('creates a graph edge from the selected bubble panel', () => {
    const onSaveGraph = jest.fn();

    render(
      <GraphTab
        activeTask={activeTask}
        evidenceSubmissions={evidenceSubmissions}
        highlights={highlights}
        graph={{ ...graph, edges: [] }}
        onSaveGraph={onSaveGraph}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'node-submission-1' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Graph target bubble' }), {
      target: { value: 'submission-2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Graph draft relation type' }), {
      target: { value: 'support' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Graph draft relation note' }), {
      target: { value: 'These two clues support the same claim.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Link' }));

    expect(onSaveGraph).toHaveBeenCalledWith(
      'task-1',
      expect.any(Array),
      expect.arrayContaining([
        expect.objectContaining({
          source: 'submission-1',
          target: 'submission-2',
          relationType: 'support',
          note: 'These two clues support the same claim.',
        }),
      ])
    );
  });
});
