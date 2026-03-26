'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react';

import type {
  EvidenceSubmission,
  QuestionNode,
  QuestionRelation,
  QuestionRelationType,
} from '@/types';

interface GraphTabProps {
  paperId: number;
  questionNodes: QuestionNode[];
  questionRelations: QuestionRelation[];
  evidenceSubmissions: EvidenceSubmission[];
  activeQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  onSaveQuestionGraph: (questionNodes: QuestionNode[], questionRelations: QuestionRelation[]) => void;
}

interface QuestionBubbleData extends Record<string, unknown> {
  title: string;
  type: QuestionNode['type'];
  status: QuestionNode['status'];
  evidenceCount: number;
}

const RELATIONSHIP_OPTIONS: Array<{ value: QuestionRelationType; label: string }> = [
  { value: 'support', label: 'Support' },
  { value: 'contrast', label: 'Contrast' },
  { value: 'method-for', label: 'Method For' },
  { value: 'limitation-of', label: 'Limitation Of' },
];

const nodeTypes = {
  questionBubble: QuestionBubbleNode,
};

export function GraphTab({
  paperId,
  questionNodes,
  questionRelations,
  evidenceSubmissions,
  activeQuestionId,
  onSelectQuestion,
  onSaveQuestionGraph,
}: GraphTabProps) {
  if (questionNodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-newspaper-border bg-white/60 p-4 text-sm text-newspaper-faded">
        Generate a case setup first. The graph is built from structured investigation questions.
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <GraphWorkspace
        paperId={paperId}
        questionNodes={questionNodes}
        questionRelations={questionRelations}
        evidenceSubmissions={evidenceSubmissions}
        activeQuestionId={activeQuestionId}
        onSelectQuestion={onSelectQuestion}
        onSaveQuestionGraph={onSaveQuestionGraph}
      />
    </ReactFlowProvider>
  );
}

interface GraphWorkspaceProps extends GraphTabProps {}

function GraphWorkspace({
  paperId,
  questionNodes,
  questionRelations,
  evidenceSubmissions,
  activeQuestionId,
  onSelectQuestion,
  onSaveQuestionGraph,
}: GraphWorkspaceProps) {
  const graphSignature = useMemo(
    () =>
      JSON.stringify({
        nodes: questionNodes.map((question) => ({
          id: question.id,
          position: question.position,
          status: question.status,
          type: question.type,
          assignedEvidenceIds: question.assignedEvidenceIds,
          score: question.score ?? null,
          feedback: question.feedback ?? null,
        })),
        edges: questionRelations.map((relation) => ({
          id: relation.id,
          sourceQuestionId: relation.sourceQuestionId,
          targetQuestionId: relation.targetQuestionId,
          relationType: relation.relationType,
          note: relation.note ?? '',
        })),
      }),
    [questionNodes, questionRelations]
  );

  const hydratedGraph = useMemo(
    () => buildGraphState(questionNodes),
    [graphSignature]
  );

  const [nodes, setNodes] = useState<Node<QuestionBubbleData>[]>(hydratedGraph.nodes);
  const [edges, setEdges] = useState<Edge[]>(() => questionRelations.map(deserializeRelation));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(activeQuestionId);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [draftTargetNodeId, setDraftTargetNodeId] = useState('');
  const [draftRelationType, setDraftRelationType] = useState<QuestionRelationType>('support');
  const [draftRelationNote, setDraftRelationNote] = useState('');
  const [edgeRelationType, setEdgeRelationType] = useState<QuestionRelationType>('support');
  const [edgeNote, setEdgeNote] = useState('');
  const skipPersistRef = useRef(true);
  const onSaveQuestionGraphRef = useRef(onSaveQuestionGraph);
  const lastPersistedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    onSaveQuestionGraphRef.current = onSaveQuestionGraph;
  }, [onSaveQuestionGraph]);

  useEffect(() => {
    skipPersistRef.current = true;
    setNodes(hydratedGraph.nodes);
    setEdges(questionRelations.map(deserializeRelation));
  }, [hydratedGraph, questionRelations]);

  useEffect(() => {
    if (activeQuestionId) {
      setSelectedNodeId(activeQuestionId);
    }
  }, [activeQuestionId]);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    const nextQuestionNodes = questionNodes.map((question) => {
      const matched = nodes.find((node) => node.id === question.id);
      if (!matched) {
        return question;
      }

      return {
        ...question,
        position: matched.position,
      };
    });

    const nextQuestionRelations = serializeRelations(paperId, edges, questionRelations);
    const persistSignature = JSON.stringify({
      nodes: nextQuestionNodes.map((question) => ({ id: question.id, position: question.position })),
      edges: nextQuestionRelations.map((relation) => ({
        id: relation.id,
        sourceQuestionId: relation.sourceQuestionId,
        targetQuestionId: relation.targetQuestionId,
        relationType: relation.relationType,
        note: relation.note ?? '',
      })),
    });

    if (persistSignature === lastPersistedSignatureRef.current) {
      return;
    }

    lastPersistedSignatureRef.current = persistSignature;
    onSaveQuestionGraphRef.current(nextQuestionNodes, nextQuestionRelations);
  }, [edges, nodes, paperId, questionNodes, questionRelations]);

  const onNodesChange: OnNodesChange<Node<QuestionBubbleData>> = (changes) => {
    skipPersistRef.current = false;
    setNodes((current) => applyNodeChanges(changes as any, current) as Node<QuestionBubbleData>[]);
  };

  const onEdgesChange: OnEdgesChange = (changes) => {
    skipPersistRef.current = false;
    setEdges((current) => applyEdgeChanges(changes, current));
  };

  const selectedQuestion = questionNodes.find((question) => question.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const evidenceCountByQuestion = new Map(
    questionNodes.map((question) => [
      question.id,
      evidenceSubmissions.filter((submission) => question.assignedEvidenceIds.includes(submission.id ?? -1)).length,
    ])
  );

  useEffect(() => {
    if (!selectedEdge) {
      return;
    }

    const relationType = (selectedEdge.data?.relationType as QuestionRelationType | undefined) ?? 'support';
    setEdgeRelationType(relationType);
    setEdgeNote((selectedEdge.data?.note as string | undefined) ?? '');
  }, [selectedEdge]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-newspaper-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
          Question Graph
        </p>
        <p className="mt-2 text-sm text-newspaper-faded">
          Drag question bubbles, connect the logic between them, and treat evidence as material attached to each question.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="h-[640px] overflow-hidden rounded-xl border border-newspaper-border bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_event, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
              onSelectQuestion(node.id);
            }}
            onEdgeClick={(_event, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            defaultEdgeOptions={{ animated: false }}
          >
            <Background gap={20} color="#e5dccf" />
            <MiniMap
              nodeStrokeColor="#5f4b32"
              nodeColor="#f6efdf"
              nodeBorderRadius={20}
              maskColor="rgba(250,245,235,0.75)"
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-newspaper-border bg-white p-4">
            <h4 className="text-sm font-semibold text-newspaper-ink">Graph Summary</h4>
            <div className="mt-3 space-y-2 text-sm text-newspaper-faded">
              <p>
                <span className="font-semibold text-newspaper-ink">{nodes.length}</span> question bubbles
              </p>
              <p>
                <span className="font-semibold text-newspaper-ink">{edges.length}</span> logical links
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-newspaper-border bg-white p-4">
            <h4 className="text-sm font-semibold text-newspaper-ink">Selected Question</h4>
            {!selectedQuestion ? (
              <p className="mt-3 text-sm text-newspaper-faded">
                Click a question bubble to inspect it and create a relation.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-newspaper-border bg-newspaper-cream p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                    {selectedQuestion.type}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-newspaper-ink">
                    {selectedQuestion.title}
                  </p>
                  <p className="mt-2 text-sm text-newspaper-faded">{selectedQuestion.prompt}</p>
                  <p className="mt-3 text-xs text-newspaper-faded">
                    {evidenceCountByQuestion.get(selectedQuestion.id) ?? 0} attached evidence
                  </p>
                </div>

                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                  Target question
                  <select
                    aria-label="Graph target question"
                    value={draftTargetNodeId}
                    onChange={(event) => setDraftTargetNodeId(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-newspaper-border bg-white px-3 py-2 text-sm text-newspaper-ink outline-none transition-colors focus:border-newspaper-accent"
                  >
                    <option value="">Select target</option>
                    {nodes
                      .filter((node) => node.id !== selectedQuestion.id)
                      .map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.data.title}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                  Relation type
                  <select
                    aria-label="Graph draft relation type"
                    value={draftRelationType}
                    onChange={(event) => setDraftRelationType(event.target.value as QuestionRelationType)}
                    className="mt-1 w-full rounded-lg border border-newspaper-border bg-white px-3 py-2 text-sm text-newspaper-ink outline-none transition-colors focus:border-newspaper-accent"
                  >
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                  Relation note
                  <textarea
                    aria-label="Graph draft relation note"
                    value={draftRelationNote}
                    onChange={(event) => setDraftRelationNote(event.target.value)}
                    className="mt-1 min-h-20 w-full rounded-lg border border-newspaper-border bg-white px-3 py-2 text-sm text-newspaper-ink outline-none transition-colors focus:border-newspaper-accent"
                    placeholder="Optional note about this question-to-question connection"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!draftTargetNodeId || draftTargetNodeId === selectedQuestion.id) {
                      return;
                    }

                    skipPersistRef.current = false;
                    setEdges((current) =>
                      ensureEdge(
                        current,
                        selectedQuestion.id,
                        draftTargetNodeId,
                        draftRelationType,
                        draftRelationNote.trim() || undefined
                      )
                    );
                    setDraftTargetNodeId('');
                    setDraftRelationNote('');
                  }}
                  className="rounded-full border border-newspaper-ink bg-newspaper-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-newspaper-accent"
                >
                  Create Relation
                </button>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-newspaper-border bg-white p-4">
            <h4 className="text-sm font-semibold text-newspaper-ink">Selected Relation</h4>
            {!selectedEdge ? (
              <p className="mt-3 text-sm text-newspaper-faded">
                Click a relation to edit its type or note.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-newspaper-faded">
                  {selectedEdge.source} {'->'} {selectedEdge.target}
                </p>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                  Relation type
                  <select
                    aria-label="Graph relation type"
                    value={edgeRelationType}
                    onChange={(event) => setEdgeRelationType(event.target.value as QuestionRelationType)}
                    className="mt-1 w-full rounded-lg border border-newspaper-border bg-white px-3 py-2 text-sm text-newspaper-ink outline-none transition-colors focus:border-newspaper-accent"
                  >
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                  Note
                  <textarea
                    aria-label="Graph relation note"
                    value={edgeNote}
                    onChange={(event) => setEdgeNote(event.target.value)}
                    className="mt-1 min-h-24 w-full rounded-lg border border-newspaper-border bg-white px-3 py-2 text-sm text-newspaper-ink outline-none transition-colors focus:border-newspaper-accent"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      skipPersistRef.current = false;
                      setEdges((current) =>
                        current.map((edge) =>
                          edge.id === selectedEdge.id
                            ? buildStyledEdge({
                                ...edge,
                                data: {
                                  ...(edge.data ?? {}),
                                  relationType: edgeRelationType,
                                  note: edgeNote.trim() || undefined,
                                },
                              })
                            : edge
                        )
                      );
                    }}
                    className="rounded-full border border-newspaper-ink bg-newspaper-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-newspaper-accent"
                  >
                    Save Relation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      skipPersistRef.current = false;
                      setEdges((current) => current.filter((edge) => edge.id !== selectedEdge.id));
                      setSelectedEdgeId(null);
                    }}
                    className="rounded-full border border-newspaper-border px-3 py-2 text-xs font-semibold text-newspaper-faded transition-colors hover:border-newspaper-accent hover:text-newspaper-accent"
                  >
                    Remove Relation
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function buildGraphState(questionNodes: QuestionNode[]) {
  const nodes: Node<QuestionBubbleData>[] = questionNodes.map((question) => ({
    id: question.id,
    type: 'questionBubble',
    position: question.position,
    data: {
      title: question.title,
      type: question.type,
      status: question.status,
      evidenceCount: question.assignedEvidenceIds.length,
    },
  }));

  return { nodes };
}

function serializeRelations(
  paperId: number,
  edges: Edge[],
  existingRelations: QuestionRelation[]
): QuestionRelation[] {
  return edges.map((edge) => {
    const existing = existingRelations.find((relation) => relation.id === edge.id);
    return {
      id: edge.id,
      paperId,
      sourceQuestionId: edge.source,
      targetQuestionId: edge.target,
      relationType: ((edge.data?.relationType as QuestionRelationType | undefined) ?? 'support'),
      note: (edge.data?.note as string | undefined) ?? undefined,
      createdAt: existing?.createdAt ?? (edge.data?.createdAt as string | undefined) ?? new Date().toISOString(),
    };
  });
}

function deserializeRelation(relation: QuestionRelation): Edge {
  return buildStyledEdge({
    id: relation.id,
    source: relation.sourceQuestionId,
    target: relation.targetQuestionId,
    data: {
      relationType: relation.relationType,
      note: relation.note,
      createdAt: relation.createdAt,
    },
  });
}

function buildStyledEdge(edge: Edge): Edge {
  const relationType = (edge.data?.relationType as QuestionRelationType | undefined) ?? 'support';
  return {
    ...edge,
    label: formatRelationType(relationType),
    style: getEdgeStyle(relationType),
    markerEnd:
      relationType === 'method-for'
        ? { type: MarkerType.ArrowClosed, color: '#2563eb' }
        : relationType === 'limitation-of'
          ? { type: MarkerType.ArrowClosed, color: '#b45309' }
          : undefined,
  };
}

function ensureEdge(
  current: Edge[],
  source: string,
  target: string,
  relationType: QuestionRelationType,
  note?: string
) {
  const existing = current.find((edge) => edge.source === source && edge.target === target);
  if (existing) {
    return current;
  }

  return addEdge(
    buildStyledEdge({
      id: `relation-${source}-${target}`,
      source,
      target,
      data: {
        relationType,
        note,
        createdAt: new Date().toISOString(),
      },
    }),
    current
  );
}

function formatRelationType(relationType: QuestionRelationType) {
  switch (relationType) {
    case 'support':
      return 'Support';
    case 'contrast':
      return 'Contrast';
    case 'method-for':
      return 'Method For';
    case 'limitation-of':
      return 'Limitation Of';
    default:
      return relationType;
  }
}

function getEdgeStyle(relationType: QuestionRelationType) {
  switch (relationType) {
    case 'support':
      return { stroke: '#15803d', strokeWidth: 2.5 };
    case 'contrast':
      return { stroke: '#b91c1c', strokeWidth: 2.5, strokeDasharray: '6 4' };
    case 'method-for':
      return { stroke: '#2563eb', strokeWidth: 2 };
    case 'limitation-of':
      return { stroke: '#b45309', strokeWidth: 2.5, strokeDasharray: '2 4' };
    default:
      return { stroke: '#64748b', strokeWidth: 2 };
  }
}

function QuestionBubbleNode({ data }: { data: QuestionBubbleData }) {
  return (
    <div className="min-w-[180px] rounded-2xl border border-newspaper-border bg-white px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-none !bg-newspaper-accent" />
      <p className="text-sm font-semibold text-newspaper-ink">{data.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-newspaper-faded">
        <span className="rounded-full border border-newspaper-border px-2 py-1">{data.type}</span>
        <span className="rounded-full bg-newspaper-aged px-2 py-1">{data.status}</span>
        <span>{data.evidenceCount} evidence</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-none !bg-newspaper-accent" />
    </div>
  );
}
