import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { GraphTab } from '@/components/case/GraphTab';
import type { EvidenceSubmission, QuestionNode, QuestionRelation } from '@/types';

jest.mock('@xyflow/react', () => {
  const React = require('react');

  return {
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ReactFlow: ({
      nodes,
      edges,
      onNodeClick,
      children,
    }: {
      nodes: Array<{ id: string; data: { title: string } }>;
      edges: Array<{ id: string }>;
      onNodeClick?: (event: unknown, node: any) => void;
      children: React.ReactNode;
    }) => (
      <div>
        {nodes.map((node) => (
          <button key={node.id} type="button" onClick={() => onNodeClick?.({}, node)}>
            {node.data.title}
          </button>
        ))}
        <div data-testid="edge-count">{edges.length}</div>
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

describe('GraphTab hydration stability', () => {
  const questionNodes: QuestionNode[] = [
    {
      id: 'question-task-claim',
      paperId: 1,
      title: 'What is the core claim?',
      prompt: 'Find the central claim.',
      type: 'claim',
      status: 'open',
      parentQuestionId: null,
      dependsOnQuestionIds: [],
      assignedEvidenceIds: [1],
      position: { x: 100, y: 100 },
    },
    {
      id: 'question-task-result',
      paperId: 1,
      title: 'Which result best supports the claim?',
      prompt: 'Inspect the strongest evidence.',
      type: 'evidence',
      status: 'partial',
      parentQuestionId: 'question-task-claim',
      dependsOnQuestionIds: ['question-task-claim'],
      assignedEvidenceIds: [2],
      position: { x: 260, y: 200 },
    },
  ];

  const questionRelations: QuestionRelation[] = [
    {
      id: 'relation-question-task-claim-question-task-result',
      paperId: 1,
      sourceQuestionId: 'question-task-claim',
      targetQuestionId: 'question-task-result',
      relationType: 'support',
      note: 'The result question supports the central claim.',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
  ];

  const evidenceSubmissions: EvidenceSubmission[] = [
    {
      id: 1,
      paperId: 1,
      taskId: 'task-claim',
      highlightId: 10,
      evidenceType: 'claim',
      note: 'Claim note',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
    {
      id: 2,
      paperId: 1,
      taskId: 'task-result',
      highlightId: 11,
      evidenceType: 'result',
      note: 'Result note',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
  ];

  it('does not reset the selected question when parent rerenders with equivalent graph data', () => {
    const onSaveQuestionGraph = jest.fn();
    const { rerender } = render(
      <GraphTab
        paperId={1}
        questionNodes={questionNodes}
        questionRelations={questionRelations}
        evidenceSubmissions={evidenceSubmissions}
        activeQuestionId="question-task-claim"
        onSelectQuestion={jest.fn()}
        onSaveQuestionGraph={onSaveQuestionGraph}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'What is the core claim?' }));
    expect(screen.getByRole('combobox', { name: 'Graph target question' })).toBeInTheDocument();
    onSaveQuestionGraph.mockClear();

    rerender(
      <GraphTab
        paperId={1}
        questionNodes={[...questionNodes]}
        questionRelations={[...questionRelations]}
        evidenceSubmissions={[...evidenceSubmissions]}
        activeQuestionId="question-task-claim"
        onSelectQuestion={jest.fn()}
        onSaveQuestionGraph={onSaveQuestionGraph}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Graph target question' })).toBeInTheDocument();
    expect(onSaveQuestionGraph).not.toHaveBeenCalled();
  });
});
