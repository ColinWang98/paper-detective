import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { GraphTab } from '@/components/case/GraphTab';
import type {
  EvidenceSubmission,
  QuestionNode,
  QuestionRelation,
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
      nodes: Array<{ id: string; data: { title: string } }>;
      edges: Array<{ id: string; label?: string }>;
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
  const questionNodes: QuestionNode[] = [
    {
      id: 'question-task-claim',
      paperId: 1,
      title: 'What is the core claim?',
      prompt: 'Find the central claim in the authors’ own words.',
      type: 'claim',
      status: 'partial',
      parentQuestionId: null,
      dependsOnQuestionIds: [],
      assignedEvidenceIds: [1],
      position: { x: 100, y: 100 },
    },
    {
      id: 'question-task-result',
      paperId: 1,
      title: 'Which result best supports the claim?',
      prompt: 'Locate the strongest result evidence.',
      type: 'evidence',
      status: 'open',
      parentQuestionId: 'question-task-claim',
      dependsOnQuestionIds: ['question-task-claim'],
      assignedEvidenceIds: [2],
      position: { x: 320, y: 140 },
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
      note: 'This sentence states the central claim.',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
    {
      id: 2,
      paperId: 1,
      taskId: 'task-result',
      highlightId: 11,
      evidenceType: 'result',
      note: 'This sentence gives the strongest result.',
      createdAt: '2026-03-26T00:00:00.000Z',
    },
  ];

  it('renders question bubbles instead of evidence ids', () => {
    render(
      <GraphTab
        paperId={1}
        questionNodes={questionNodes}
        questionRelations={questionRelations}
        evidenceSubmissions={evidenceSubmissions}
        activeQuestionId="question-task-claim"
        onSelectQuestion={jest.fn()}
        onSaveQuestionGraph={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'node-question-task-claim' })).toHaveTextContent(
      'What is the core claim?'
    );
    expect(screen.getByRole('button', { name: 'node-question-task-result' })).toHaveTextContent(
      'Which result best supports the claim?'
    );
  });

  it('selects a question bubble and exposes relation creation controls', () => {
    const onSelectQuestion = jest.fn();

    render(
      <GraphTab
        paperId={1}
        questionNodes={questionNodes}
        questionRelations={questionRelations}
        evidenceSubmissions={evidenceSubmissions}
        activeQuestionId="question-task-claim"
        onSelectQuestion={onSelectQuestion}
        onSaveQuestionGraph={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'node-question-task-claim' }));

    expect(onSelectQuestion).toHaveBeenCalledWith('question-task-claim');
    expect(screen.getByRole('combobox', { name: 'Graph target question' })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('1 attached evidence');
  });

  it('creates and persists a question relation from the selected question panel', () => {
    const onSaveQuestionGraph = jest.fn();

    render(
      <GraphTab
        paperId={1}
        questionNodes={questionNodes}
        questionRelations={[]}
        evidenceSubmissions={evidenceSubmissions}
        activeQuestionId="question-task-claim"
        onSelectQuestion={jest.fn()}
        onSaveQuestionGraph={onSaveQuestionGraph}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Graph target question' }), {
      target: { value: 'question-task-result' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Graph draft relation type' }), {
      target: { value: 'support' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Graph draft relation note' }), {
      target: { value: 'This result question supports the core claim.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Relation' }));

    expect(onSaveQuestionGraph).toHaveBeenCalledWith(
      expect.any(Array),
      expect.arrayContaining([
        expect.objectContaining({
          sourceQuestionId: 'question-task-claim',
          targetQuestionId: 'question-task-result',
          relationType: 'support',
          note: 'This result question supports the core claim.',
        }),
      ])
    );
  });
});
