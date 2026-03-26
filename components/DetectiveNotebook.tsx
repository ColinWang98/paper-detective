'use client';

import React, { memo, useEffect, useState } from 'react';

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { FolderOpen, GripVertical, Plus } from 'lucide-react';

import { EvidenceSubmitModal } from '@/components/case/EvidenceSubmitModal';
import { DoctorPanel } from '@/components/case/DoctorPanel';
import { GraphTab } from '@/components/case/GraphTab';
import { NotesTab } from '@/components/case/NotesTab';
import { ProgressTab } from '@/components/case/ProgressTab';
import { QuestionsTab } from '@/components/case/QuestionsTab';
import Modal from '@/components/Modal';
import { getHighlightPriorityLabel } from '@/lib/highlightPriority';
import { usePaperStore } from '@/lib/store';
import { getAPIKey, getActiveProviderConfig } from '@/services/apiKeyManager';
import type {
  EvidenceClusterId,
  EvidenceRelationshipType,
  EvidenceSubmission,
  Highlight,
  HighlightColor,
} from '@/types';

interface DetectiveNotebookProps {
  pdfFile?: File | null;
  pendingEvidenceHighlight?: Highlight | null;
  onCloseEvidenceModal?: () => void;
}

type NotebookTab = 'questions' | 'notes' | 'graph' | 'progress';

export default function DetectiveNotebook({
  pdfFile = null,
  pendingEvidenceHighlight = null,
  onCloseEvidenceModal,
}: DetectiveNotebookProps) {
  const {
    currentPaper,
    groups,
    loadGroups,
    moveHighlightToGroup,
    addGroup,
    reorderGroups,
    investigationTasks,
    evidenceSubmissions,
    evidenceRelationships,
    deductionGraphs,
    questionNodes,
    questionRelations,
    doctorState,
    submitEvidence,
    assignEvidenceCluster,
    updateEvidenceTags,
    addEvidenceRelationship,
    deleteEvidenceRelationship,
    saveQuestionState,
    applyEvidenceClusterSuggestions,
    activeTaskId,
    setActiveTask,
    applyTaskEvaluation,
  } = usePaperStore();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [_activeType, _setActiveType] = useState<'highlight' | 'group' | null>(null);
  const [activeTab, setActiveTab] = useState<NotebookTab>('questions');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [_isSubmitting, _setIsSubmitting] = useState(false);
  const [questionJudgment, setQuestionJudgment] = useState('');
  const [isEvaluatingQuestion, setIsEvaluatingQuestion] = useState(false);
  const [questionEvaluationError, setQuestionEvaluationError] = useState<string | null>(null);
  const [isAIClustering, setIsAIClustering] = useState(false);
  const [aiClusterError, setAIClusterError] = useState<string | null>(null);

  useEffect(() => {
    if (currentPaper) {
      void loadGroups(currentPaper.id!);
    }
  }, [currentPaper, loadGroups]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
    const { groups: currentGroups } = usePaperStore.getState();
    const isGroup = currentGroups.some((group) => group.id === event.active.id);
    _setActiveType(isGroup ? 'group' : 'highlight');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    _setActiveType(null);

    if (!over) {
      return;
    }

    const activeIdNum = active.id as number;
    const overIdNum = over.id as number;

    if (activeIdNum === overIdNum) {
      return;
    }

    try {
      const { groups: currentGroups } = usePaperStore.getState();
      const isActiveGroup = currentGroups.some((group) => group.id === activeIdNum);
      const isOverGroup = currentGroups.some((group) => group.id === overIdNum);

      if (isActiveGroup && isOverGroup) {
        await reorderGroups(activeIdNum, overIdNum);
      } else {
        await moveHighlightToGroup(activeIdNum, overIdNum);
      }
    } catch (error) {
      console.error('Failed to handle drag end:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentPaper) {
      return;
    }

    _setIsSubmitting(true);
    try {
      await addGroup({
        paperId: currentPaper.id!,
        name: newGroupName.trim(),
        type: 'custom',
        position: groups.filter((group) => group.type === 'custom').length,
        createdAt: new Date().toISOString(),
      });
      setNewGroupName('');
      setIsCreateGroupModalOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      _setIsSubmitting(false);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={(event) => {
          void handleDragEnd(event);
        }}
      >
        <NotebookContent
          activeId={activeId}
          activeTab={activeTab}
          evidenceSubmissions={evidenceSubmissions}
          evidenceRelationships={evidenceRelationships}
          deductionGraphs={deductionGraphs}
          questionNodes={questionNodes}
          questionRelations={questionRelations}
          doctorState={doctorState}
          investigationTasks={investigationTasks}
          activeTaskId={activeTaskId}
          setActiveTab={setActiveTab}
          setActiveTask={setActiveTask}
          assignEvidenceCluster={assignEvidenceCluster}
          updateEvidenceTags={updateEvidenceTags}
          judgment={questionJudgment}
          evaluationError={questionEvaluationError}
          isEvaluatingQuestion={isEvaluatingQuestion}
          isAIClustering={isAIClustering}
          aiClusterError={aiClusterError}
          onJudgmentChange={setQuestionJudgment}
          onSubmitQuestion={async (taskId) => {
            const activeQuestion =
              investigationTasks.find((task) => task.id === taskId) ??
              investigationTasks.find((task) => task.id === activeTaskId) ??
              null;

            if (!activeQuestion) {
              return;
            }

            const taskEvidence = evidenceSubmissions.filter((submission) => submission.taskId === activeQuestion.id);
            const apiKey = getAPIKey();

            setQuestionEvaluationError(null);
            setIsEvaluatingQuestion(true);

            try {
              const response = await fetch('/api/ai/question-evaluate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  task: activeQuestion,
                  evidence: taskEvidence,
                  judgment: questionJudgment.trim() || undefined,
                  apiKey: apiKey || undefined,
                  model: getActiveProviderConfig().model,
                }),
              });

              const payload = await response.json().catch(() => null);

              if (!response.ok) {
                const message =
                  typeof payload?.error?.message === 'string'
                    ? payload.error.message
                    : 'Question scoring failed';
                throw new Error(message);
              }

              applyTaskEvaluation(activeQuestion.id, {
                score: payload.data.score,
                feedback: payload.data.feedback,
                submittedAt: new Date().toISOString(),
              });
            } catch (error) {
              setQuestionEvaluationError(
                error instanceof Error ? error.message : 'Question scoring failed'
              );
            } finally {
              setIsEvaluatingQuestion(false);
            }
          }}
          onAIAutoCluster={async (task) => {
            const taskEvidence = evidenceSubmissions.filter((submission) => submission.taskId === task.id);
            if (taskEvidence.length === 0) {
              return;
            }

            const apiKey = getAPIKey();
            setAIClusterError(null);
            setIsAIClustering(true);

            try {
              const response = await fetch('/api/ai/question-cluster', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  task,
                  evidence: taskEvidence,
                  apiKey: apiKey || undefined,
                  model: getActiveProviderConfig().model,
                }),
              });

              const payload = await response.json().catch(() => null);

              if (!response.ok) {
                const message =
                  typeof payload?.error?.message === 'string'
                    ? payload.error.message
                    : 'AI clustering failed';
                throw new Error(message);
              }

              const assignments = Array.isArray(payload?.data?.assignments)
                ? payload.data.assignments
                : [];

              await applyEvidenceClusterSuggestions(assignments);
            } catch (error) {
              setAIClusterError(error instanceof Error ? error.message : 'AI clustering failed');
            } finally {
              setIsAIClustering(false);
            }
          }}
          onCreateRelationship={async (taskId, fromSubmissionId, toSubmissionId, relationshipType, note) => {
            await addEvidenceRelationship(taskId, fromSubmissionId, toSubmissionId, relationshipType, note);
          }}
          onRemoveRelationship={async (relationshipId) => {
            await deleteEvidenceRelationship(relationshipId);
          }}
          saveQuestionState={saveQuestionState}
          onOpenCreateGroupModal={() => setIsCreateGroupModalOpen(true)}
        />
      </DndContext>

      <EvidenceSubmitModal
        highlight={pendingEvidenceHighlight}
        tasks={investigationTasks}
        activeTaskId={activeTaskId}
        isOpen={pendingEvidenceHighlight !== null}
        onClose={() => onCloseEvidenceModal?.()}
        onSubmit={async (taskId, evidenceType, note) => {
          if (!pendingEvidenceHighlight?.id) {
            return;
          }

          await submitEvidence(taskId, pendingEvidenceHighlight.id, evidenceType, note);
        }}
      />

      <Modal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        title="Create Group"
        confirmLabel="Create Group"
        onConfirm={() => {
          void handleCreateGroup();
        }}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="group-name" className="mb-2 block text-sm font-medium text-gray-700">
              Group name
            </label>
            <input
              id="group-name"
              type="text"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="For example: method clues, results, open questions"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              maxLength={50}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleCreateGroup();
                }
              }}
            />
            <p className="mt-2 text-xs text-gray-500">
              Use groups to organize evidence after it leaves the active question box.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface NotebookContentProps {
  activeId: number | null;
  activeTab: NotebookTab;
  evidenceSubmissions: EvidenceSubmission[];
  evidenceRelationships: ReturnType<typeof usePaperStore.getState>['evidenceRelationships'];
  deductionGraphs: ReturnType<typeof usePaperStore.getState>['deductionGraphs'];
  questionNodes: ReturnType<typeof usePaperStore.getState>['questionNodes'];
  questionRelations: ReturnType<typeof usePaperStore.getState>['questionRelations'];
  doctorState: ReturnType<typeof usePaperStore.getState>['doctorState'];
  investigationTasks: ReturnType<typeof usePaperStore.getState>['investigationTasks'];
  activeTaskId: string | null;
  setActiveTab: (tab: NotebookTab) => void;
  setActiveTask: (taskId: string | null) => void;
  assignEvidenceCluster: (submissionId: number, clusterId: EvidenceClusterId | null) => void | Promise<void>;
  updateEvidenceTags: (submissionId: number, aiTags: string[]) => void | Promise<void>;
  judgment: string;
  evaluationError: string | null;
  isEvaluatingQuestion: boolean;
  isAIClustering: boolean;
  aiClusterError: string | null;
  onJudgmentChange: (value: string) => void;
  onSubmitQuestion: (taskId: string) => void | Promise<void>;
  onAIAutoCluster: (task: ReturnType<typeof usePaperStore.getState>['investigationTasks'][number]) => void | Promise<void>;
  onCreateRelationship: (
    taskId: string,
    fromSubmissionId: number,
    toSubmissionId: number,
    relationshipType: EvidenceRelationshipType,
    note?: string
  ) => void | Promise<void>;
  onRemoveRelationship: (relationshipId: number) => void | Promise<void>;
  saveQuestionState: ReturnType<typeof usePaperStore.getState>['saveQuestionState'];
  onOpenCreateGroupModal: () => void;
}

function NotebookContent({
  activeId,
  activeTab,
  evidenceSubmissions,
  evidenceRelationships,
  deductionGraphs,
  questionNodes,
  questionRelations,
  doctorState,
  investigationTasks,
  activeTaskId,
  setActiveTab,
  setActiveTask,
  assignEvidenceCluster,
  updateEvidenceTags,
  judgment,
  evaluationError,
  isEvaluatingQuestion,
  isAIClustering,
  aiClusterError,
  onJudgmentChange,
  onSubmitQuestion,
  onAIAutoCluster,
  onCreateRelationship,
  onRemoveRelationship,
  saveQuestionState,
  onOpenCreateGroupModal,
}: NotebookContentProps) {
  const { currentPaper, groups, highlights } = usePaperStore();
  const activeQuestionId = doctorState?.activeQuestionId ?? questionNodes[0]?.id ?? null;
  const activeTask =
    investigationTasks.find((task) => task.id === activeTaskId) ??
    investigationTasks.find((task) => task.status === 'available' || task.status === 'in_progress') ??
    investigationTasks[0] ??
    null;

  return (
    <div className="flex h-full flex-col">
      <div className="bg-newspaper-accent p-4 text-white">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <h2 className="font-bold text-lg">Investigation Notebook</h2>
          </div>
          <button
            onClick={onOpenCreateGroupModal}
            className="flex items-center gap-1 rounded px-3 py-1 text-sm transition-colors bg-white/20 hover:bg-white/30"
          >
            <Plus className="h-4 w-4" />
            New Group
          </button>
        </div>

        <div className="flex gap-2" role="tablist" aria-label="Notebook tabs">
          <NotebookTabButton
            label="Questions"
            isActive={activeTab === 'questions'}
            onClick={() => setActiveTab('questions')}
          />
          <NotebookTabButton
            label="Notes"
            isActive={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
          />
          <NotebookTabButton
            label="Graph"
            isActive={activeTab === 'graph'}
            onClick={() => setActiveTab('graph')}
          />
          <NotebookTabButton
            label="Progress"
            isActive={activeTab === 'progress'}
            onClick={() => setActiveTab('progress')}
          />
        </div>

        <p className="mt-2 text-xs opacity-80">
          {currentPaper ? `Investigating: ${currentPaper.title}` : 'Import a PDF to begin'}
        </p>
      </div>

      <div className="flex-1 overflow-auto bg-newspaper-cream p-4">
        <DoctorPanel doctorState={doctorState} questionNodes={questionNodes} />

        {activeTab === 'questions' ? (
          <div className="mt-4">
            <QuestionsTab
              questionNodes={questionNodes}
              activeQuestionId={activeQuestionId}
              onSelectQuestion={(questionId) => {
                const nextTaskId = questionId.startsWith('question-')
                  ? questionId.replace(/^question-/, '')
                  : questionId;
                setActiveTask(nextTaskId);
              }}
            />
          </div>
        ) : null}

        {activeTab === 'notes' ? (
          <div className="mt-4 space-y-4">
            <NotesTab
              activeQuestion={
                questionNodes.find((question) => question.id === activeQuestionId) ??
                (activeTask ? questionNodes.find((question) => question.id === `question-${activeTask.id}`) ?? null : null)
              }
              activeTask={activeTask}
              evidenceSubmissions={evidenceSubmissions}
              highlights={highlights}
              evaluationError={evaluationError}
              isEvaluating={isEvaluatingQuestion}
              judgment={judgment}
              onJudgmentChange={onJudgmentChange}
              onSubmitQuestion={() => {
                if (activeTask) {
                  void onSubmitQuestion(activeTask.id);
                }
              }}
            />
          </div>
        ) : null}

        {activeTab === 'graph' ? (
          <div className="mt-4">
            <GraphTab
              paperId={currentPaper?.id ?? 0}
              questionNodes={questionNodes}
              questionRelations={questionRelations}
              evidenceSubmissions={evidenceSubmissions}
              activeQuestionId={activeQuestionId}
              onSelectQuestion={(questionId) => {
                const nextTaskId = questionId.startsWith('question-')
                  ? questionId.replace(/^question-/, '')
                  : questionId;
                setActiveTask(nextTaskId);
              }}
              onSaveQuestionGraph={(nextQuestionNodes, nextQuestionRelations) => {
                if (!currentPaper?.id) {
                  return;
                }
                void saveQuestionState(
                  currentPaper.id,
                  nextQuestionNodes,
                  nextQuestionRelations,
                  doctorState
                );
              }}
            />
          </div>
        ) : null}

        {activeTab === 'progress' ? (
          <div className="mt-4">
            <ProgressTab tasks={investigationTasks} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface NotebookTabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NotebookTabButton({ label, isActive, onClick }: NotebookTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        isActive ? 'bg-white text-newspaper-accent shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
      }`}
    >
      {label}
    </button>
  );
}

interface GroupFolderProps {
  group: any;
  activeId: number | null;
  isInbox?: boolean;
}

function DraggableGroupFolder({ group, activeId, isInbox = false }: GroupFolderProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: group.id!,
    data: { type: 'group', group },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={`transition-opacity ${isDragging ? 'opacity-50' : ''}`}>
      <GroupFolderContent
        group={group}
        activeId={activeId}
        isInbox={isInbox}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

interface GroupFolderContentProps {
  group: any;
  activeId: number | null;
  isInbox?: boolean;
  dragHandleProps?: any;
  isDragging?: boolean;
}

function GroupFolderContent({
  group,
  activeId,
  isInbox = false,
  dragHandleProps,
  isDragging,
}: GroupFolderContentProps) {
  const { expandedGroups, toggleGroupExpanded } = usePaperStore();
  const groupId = group.id as number;
  const { setNodeRef } = useDroppable({ id: groupId });

  const isExpanded = expandedGroups.has(groupId);

  return (
    <div
      className={`overflow-hidden rounded border-2 border-newspaper-border bg-white shadow-card ${
        isDragging ? 'ring-2 ring-newspaper-accent' : ''
      }`}
    >
      <div className="bg-newspaper-aged p-3 transition-colors hover:bg-newspaper-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isInbox && dragHandleProps ? (
              <button
                {...dragHandleProps}
                className="cursor-grab rounded p-1 text-newspaper-faxed hover:bg-white/50 active:cursor-grabbing"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            ) : null}
            <h3 className="flex items-center gap-2 text-sm font-bold">
              {group.name}
              <span className="rounded-full bg-newspaper-accent px-2 py-0.5 text-xs text-white">
                {group.items?.length || 0}
              </span>
            </h3>
          </div>
          <button
            onClick={() => toggleGroupExpanded(groupId)}
            className="text-newspaper-faxed hover:text-newspaper-accent"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div ref={setNodeRef} className="min-h-[60px] border-t border-newspaper-border p-3 transition-all">
          {!group.items || group.items.length === 0 ? (
            <div className="rounded border-2 border-dashed border-newspaper-border py-4 text-center text-sm text-newspaper-faxed">
              {isInbox ? 'Select text in the PDF to add evidence here.' : 'Drag evidence here.'}
            </div>
          ) : (
            <div className="space-y-2">
              {group.items.map((item: Highlight) => (
                <EvidenceCard key={item.id} item={item} isActive={activeId === item.id} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const GroupFolder = memo(DraggableGroupFolder);

interface EvidenceCardProps {
  item: Highlight;
  isActive?: boolean;
}

const EvidenceCard = memo(
  ({ item, isActive = false }: EvidenceCardProps) => {
    const colorClasses: Record<HighlightColor, string> = {
      red: 'bg-red-100 border-l-red-500',
      yellow: 'bg-yellow-100 border-l-yellow-500',
      orange: 'bg-orange-100 border-l-orange-500',
      gray: 'bg-gray-100 border-l-gray-400',
    };

    return (
      <div
        draggable
        onDragStart={(event) => event.dataTransfer.setData('text/plain', String(item.id))}
        className={`rounded border-l-4 p-2 shadow-sm transition-all hover:shadow-md ${
          colorClasses[item.color]
        } ${isActive ? 'ring-2 ring-newspaper-accent' : ''}`}
      >
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 text-xs">{getHighlightPriorityLabel(item)}</span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm text-newspaper-ink">{item.text}</p>
            <p className="mt-1 text-xs text-newspaper-faxed">
              {new Date(item.createdAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.text === nextProps.item.text &&
    prevProps.item.color === nextProps.item.color &&
    prevProps.item.createdAt === nextProps.item.createdAt &&
    prevProps.isActive === nextProps.isActive
);
