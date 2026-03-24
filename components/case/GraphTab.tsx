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
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react';

import type {
  DeductionGraph,
  DeductionGraphEdge,
  DeductionGraphNode,
  DeductionRelationType,
  EvidenceSubmission,
  Highlight,
  InvestigationTask,
} from '@/types';

interface GraphTabProps {
  activeTask: InvestigationTask | null;
  evidenceSubmissions: EvidenceSubmission[];
  highlights: Highlight[];
  graph: DeductionGraph | null;
  onSaveGraph: (taskId: string, nodes: DeductionGraphNode[], edges: DeductionGraphEdge[]) => void;
}

const RELATIONSHIP_OPTIONS: Array<{ value: DeductionRelationType; label: string }> = [
  { value: 'support', label: 'Support' },
  { value: 'contrast', label: 'Contrast' },
  { value: 'method', label: 'Method' },
  { value: 'limitation', label: 'Limitation' },
];

const AUTO_LINK_DISTANCE = 160;

type EvidenceBubbleNodeData = DeductionGraphNode['data'];

const nodeTypes = {
  evidenceBubble: EvidenceBubbleNode,
};

export function GraphTab({
  activeTask,
  evidenceSubmissions,
  highlights,
  graph,
  onSaveGraph,
}: GraphTabProps) {
  if (!activeTask) {
    return (
      <div className="rounded-lg border border-dashed border-newspaper-border bg-white/60 p-4 text-sm text-newspaper-faded">
        Select a question to build its deduction graph.
      </div>
    );
  }

  const taskEvidence = useMemo(
    () => evidenceSubmissions.filter((submission) => submission.taskId === activeTask.id),
    [activeTask.id, evidenceSubmissions]
  );

  if (taskEvidence.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-newspaper-border bg-white/60 p-4 text-sm text-newspaper-faded">
        Submit evidence for this question first. The graph is built from submitted evidence only.
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <GraphWorkspace
        activeTask={activeTask}
        taskEvidence={taskEvidence}
        highlights={highlights}
        graph={graph}
        onSaveGraph={onSaveGraph}
      />
    </ReactFlowProvider>
  );
}

interface GraphWorkspaceProps {
  activeTask: InvestigationTask;
  taskEvidence: EvidenceSubmission[];
  highlights: Highlight[];
  graph: DeductionGraph | null;
  onSaveGraph: (taskId: string, nodes: DeductionGraphNode[], edges: DeductionGraphEdge[]) => void;
}

function GraphWorkspace({
  activeTask,
  taskEvidence,
  highlights,
  graph,
  onSaveGraph,
}: GraphWorkspaceProps) {
  const initialGraph = useMemo(
    () => buildGraphState(activeTask, taskEvidence, highlights, graph),
    [activeTask, taskEvidence, highlights, graph]
  );

  const [nodes, setNodes] = useState<Node<EvidenceBubbleNodeData>[]>(initialGraph.nodes);
  const [edges, setEdges] = useState<Edge[]>(initialGraph.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeRelationType, setEdgeRelationType] = useState<DeductionRelationType>('support');
  const [edgeNote, setEdgeNote] = useState('');
  const [draftTargetNodeId, setDraftTargetNodeId] = useState('');
  const [draftRelationType, setDraftRelationType] = useState<DeductionRelationType>('support');
  const [draftRelationNote, setDraftRelationNote] = useState('');
  const skipPersistRef = useRef(true);
  const onSaveGraphRef = useRef(onSaveGraph);
  const paperId = taskEvidence[0]?.paperId ?? 0;

  useEffect(() => {
    onSaveGraphRef.current = onSaveGraph;
  }, [onSaveGraph]);

  useEffect(() => {
    skipPersistRef.current = true;
    setNodes(initialGraph.nodes);
    setEdges(initialGraph.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEdgeRelationType('support');
    setEdgeNote('');
    setDraftTargetNodeId('');
    setDraftRelationType('support');
    setDraftRelationNote('');
  }, [initialGraph]);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    onSaveGraphRef.current(
      activeTask.id,
      serializeNodes(paperId, activeTask.id, nodes),
      serializeEdges(edges)
    );
  }, [activeTask.id, edges, nodes, paperId]);

  const onNodesChange: OnNodesChange<Node<EvidenceBubbleNodeData>> = (changes) => {
    skipPersistRef.current = false;
    setNodes((current) => applyNodeChanges(changes as any, current) as Node<EvidenceBubbleNodeData>[]);
  };

  const onEdgesChange: OnEdgesChange = (changes) => {
    skipPersistRef.current = false;
    setEdges((current) => applyEdgeChanges(changes, current));
  };

  const onConnect: OnConnect = (connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) {
      return;
    }

    skipPersistRef.current = false;
    setEdges((current) => ensureEdge(current, connection.source!, connection.target!, 'support', undefined));
  };

  const onNodeDragStop = (_event: any, node: Node<EvidenceBubbleNodeData>) => {
    skipPersistRef.current = false;
    const nearbyNode = findNearbyNode(node, nodes);
    if (!nearbyNode) {
      return;
    }

    setEdges((current) => ensureEdge(current, node.id, nearbyNode.id, 'support', undefined));
  };

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;

  useEffect(() => {
    if (!selectedEdge) {
      return;
    }

    const relationType = (selectedEdge.data?.relationType as DeductionRelationType | undefined) ?? 'support';
    setEdgeRelationType(relationType);
    setEdgeNote((selectedEdge.data?.note as string | undefined) ?? '');
  }, [selectedEdge]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-newspaper-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-newspaper-faded">
          Deduction Graph
        </p>
        <h3 className="mt-2 text-base font-semibold text-newspaper-ink">{activeTask.title}</h3>
        <p className="mt-1 text-sm text-newspaper-faded">
          Drag evidence bubbles freely. When two bubbles move into connection range, the graph creates a draft edge automatically.
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
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_event, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_event, edge) => setSelectedEdgeId(edge.id)}
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
                <span className="font-semibold text-newspaper-ink">{nodes.length}</span> evidence bubbles
              </p>
              <p>
                <span className="font-semibold text-newspaper-ink">{edges.length}</span> active links
              </p>
              <p>Support = solid green, Contrast = dashed red, Method = blue arrow, Limitation = amber marked line.</p>
            </div>
          </section>

          <section className="rounded-lg border border-newspaper-border bg-white p-4">
            <h4 className="text-sm font-semibold text-newspaper-ink">Selected Bubble</h4>
            {!selectedNode ? (
              <p className="mt-3 text-sm text-newspaper-faded">
                Click a bubble to inspect its evidence and create a link.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-newspaper-border bg-newspaper-cream p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                    {selectedNode.id}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-newspaper-ink">
                    {selectedNode.data.title}
                  </p>
                  <p className="mt-2 text-sm text-newspaper-ink">{selectedNode.data.summary}</p>
                  {selectedNode.data.sourceText ? (
                    <p className="mt-2 text-xs text-newspaper-faded">{selectedNode.data.sourceText}</p>
                  ) : null}
                </div>

                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                  Target bubble
                  <select
                    aria-label="Graph target bubble"
                    value={draftTargetNodeId}
                    onChange={(event) => setDraftTargetNodeId(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-newspaper-border bg-white px-3 py-2 text-sm text-newspaper-ink outline-none transition-colors focus:border-newspaper-accent"
                  >
                    <option value="">Select target</option>
                    {nodes
                      .filter((node) => node.id !== selectedNode.id)
                      .map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.id}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                  Relation type
                  <select
                    aria-label="Graph draft relation type"
                    value={draftRelationType}
                    onChange={(event) => setDraftRelationType(event.target.value as DeductionRelationType)}
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
                  Link note
                  <textarea
                    aria-label="Graph draft relation note"
                    value={draftRelationNote}
                    onChange={(event) => setDraftRelationNote(event.target.value)}
                    className="mt-1 min-h-20 w-full rounded-lg border border-newspaper-border bg-white px-3 py-2 text-sm text-newspaper-ink outline-none transition-colors focus:border-newspaper-accent"
                    placeholder="Optional note about this connection"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!draftTargetNodeId || draftTargetNodeId === selectedNode.id) {
                      return;
                    }
                    skipPersistRef.current = false;
                    setEdges((current) =>
                      ensureEdge(
                        current,
                        selectedNode.id,
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
                  Create Link
                </button>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-newspaper-border bg-white p-4">
            <h4 className="text-sm font-semibold text-newspaper-ink">Selected Link</h4>
            {!selectedEdge ? (
              <p className="mt-3 text-sm text-newspaper-faded">
                Click an edge to edit its semantic relationship.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-newspaper-faded">
                  {selectedEdge.source} → {selectedEdge.target}
                </p>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-newspaper-faded">
                  Relation type
                  <select
                    aria-label="Graph relation type"
                    value={edgeRelationType}
                    onChange={(event) => setEdgeRelationType(event.target.value as DeductionRelationType)}
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
                    placeholder="Why do these two pieces of evidence connect?"
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
                    Save Link
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
                    Remove Link
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

function buildGraphState(
  activeTask: InvestigationTask,
  taskEvidence: EvidenceSubmission[],
  highlights: Highlight[],
  graph: DeductionGraph | null
): {
  nodes: Node<EvidenceBubbleNodeData>[];
  edges: Edge[];
} {
  const persistedNodes = new Map((graph?.nodes ?? []).map((node) => [node.submissionId, node]));
  const highlightMap = new Map(highlights.map((highlight) => [highlight.id, highlight]));

  const nodes = taskEvidence.map((submission, index) => {
    const persisted = persistedNodes.get(submission.id!);
    const sourceHighlight = highlightMap.get(submission.highlightId);

    const graphNode: DeductionGraphNode = persisted ?? {
      id: `submission-${submission.id}`,
      paperId: submission.paperId,
      taskId: activeTask.id,
      submissionId: submission.id!,
      position: defaultNodePosition(index),
      type: 'evidenceBubble',
      data: {
        title: `E${submission.id}`,
        summary: submission.note,
        sourceText: sourceHighlight?.text ?? null,
        pageNumber: sourceHighlight?.pageNumber ?? null,
        evidenceType: submission.evidenceType,
        tags: submission.aiTags ?? [],
      },
    };

    return {
      id: graphNode.id,
      type: graphNode.type,
      position: graphNode.position,
      data: {
        ...graphNode.data,
        title: `E${submission.id}`,
        summary: submission.note,
        sourceText: sourceHighlight?.text ?? graphNode.data.sourceText ?? null,
        pageNumber: sourceHighlight?.pageNumber ?? graphNode.data.pageNumber ?? null,
        evidenceType: submission.evidenceType,
        tags: submission.aiTags ?? graphNode.data.tags ?? [],
      },
    } satisfies Node<EvidenceBubbleNodeData>;
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = (graph?.edges ?? [])
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map(deserializeEdge);

  return { nodes, edges };
}

function defaultNodePosition(index: number) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: 70 + column * 280,
    y: 60 + row * 180,
  };
}

function serializeNodes(
  paperId: number,
  taskId: string,
  nodes: Node<EvidenceBubbleNodeData>[]
): DeductionGraphNode[] {
  return nodes.map((node) => ({
    id: node.id,
    paperId,
    taskId,
    submissionId: Number(node.id.replace('submission-', '')),
    position: node.position,
    type: 'evidenceBubble',
    data: {
      title: node.data.title,
      summary: node.data.summary,
      sourceText: node.data.sourceText ?? null,
      pageNumber: node.data.pageNumber ?? null,
      evidenceType: node.data.evidenceType,
      tags: node.data.tags ?? [],
    },
  }));
}

function serializeEdges(edges: Edge[]): DeductionGraphEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    relationType: ((edge.data?.relationType as DeductionRelationType | undefined) ?? 'support'),
    note: (edge.data?.note as string | undefined) ?? undefined,
    createdAt: (edge.data?.createdAt as string | undefined) ?? new Date().toISOString(),
  }));
}

function deserializeEdge(edge: DeductionGraphEdge): Edge {
  return buildStyledEdge({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    data: {
      relationType: edge.relationType,
      note: edge.note,
      createdAt: edge.createdAt,
    },
  });
}

function buildStyledEdge(edge: Edge): Edge {
  const relationType = (edge.data?.relationType as DeductionRelationType | undefined) ?? 'support';

  return {
    ...edge,
    label: formatRelationType(relationType),
    style: getEdgeStyle(relationType),
    markerEnd: relationType === 'method' ? { type: MarkerType.ArrowClosed, color: '#2563eb' } : undefined,
  };
}

function ensureEdge(
  current: Edge[],
  source: string,
  target: string,
  relationType: DeductionRelationType,
  note?: string
) {
  const existing = current.find(
    (edge) =>
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)
  );

  if (existing) {
    return current;
  }

  const next = addEdge(
    buildStyledEdge({
      id: `edge-${source}-${target}`,
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

  return next;
}

function findNearbyNode(
  draggedNode: Node<EvidenceBubbleNodeData>,
  nodes: Node<EvidenceBubbleNodeData>[]
) {
  let nearest: Node<EvidenceBubbleNodeData> | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const node of nodes) {
    if (node.id === draggedNode.id) {
      continue;
    }

    const dx = node.position.x - draggedNode.position.x;
    const dy = node.position.y - draggedNode.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < AUTO_LINK_DISTANCE && distance < nearestDistance) {
      nearest = node;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function formatRelationType(relationType: DeductionRelationType) {
  switch (relationType) {
    case 'support':
      return 'Support';
    case 'contrast':
      return 'Contrast';
    case 'method':
      return 'Method';
    case 'limitation':
      return 'Limitation';
    default:
      return relationType;
  }
}

function getEdgeStyle(relationType: DeductionRelationType) {
  switch (relationType) {
    case 'support':
      return { stroke: '#15803d', strokeWidth: 2.5 };
    case 'contrast':
      return { stroke: '#b91c1c', strokeWidth: 2.5, strokeDasharray: '6 4' };
    case 'method':
      return { stroke: '#2563eb', strokeWidth: 2 };
    case 'limitation':
      return { stroke: '#b45309', strokeWidth: 2.5, strokeDasharray: '2 4' };
    default:
      return { stroke: '#64748b', strokeWidth: 2 };
  }
}

function EvidenceBubbleNode({ data }: { data: EvidenceBubbleNodeData }) {
  return (
    <div className="min-w-[96px] rounded-full border border-newspaper-border bg-white px-4 py-3 text-center shadow-sm">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-none !bg-newspaper-accent" />
      <span className="text-sm font-semibold text-newspaper-ink">{data.title}</span>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-none !bg-newspaper-accent" />
    </div>
  );
}
