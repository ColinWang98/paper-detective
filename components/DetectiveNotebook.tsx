'use client';

import React, { useState, useEffect, memo } from 'react';

import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  useDraggable,
} from '@dnd-kit/core';
import { FolderOpen, Plus, Lightbulb, Sparkles, GripVertical } from 'lucide-react';

import { EvidenceSubmitModal } from '@/components/case/EvidenceSubmitModal';
import { usePaperStore } from '@/lib/store';
import type {
  AIClueCard,
  EvidenceSubmission,
  Highlight,
  HighlightColor,
  InvestigationTask,
} from '@/types';

import AIClueCardGenerator from './AIClueCardGenerator';
import AIClueCardList from './AIClueCardList';
import Modal from './Modal';

interface DetectiveNotebookProps {
  pdfFile?: File | null;
  pendingEvidenceHighlight?: Highlight | null;
  onCloseEvidenceModal?: () => void;
}

export default function DetectiveNotebook({
  pdfFile = null,
  pendingEvidenceHighlight = null,
  onCloseEvidenceModal,
}: DetectiveNotebookProps) {
  // Zustand store
  const {
    currentPaper,
    groups,
    loadGroups,
    moveHighlightToGroup,
    addGroup,
    reorderGroups,
    investigationTasks,
    evidenceSubmissions,
    submitEvidence,
  } = usePaperStore();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [_activeType, _setActiveType] = useState<'highlight' | 'group' | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'ai'>('evidence');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [_isSubmitting, _setIsSubmitting] = useState(false);

  // Load groups when paper changes
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
    // Determine if dragging a highlight or a group
    const { groups } = usePaperStore.getState();
    const isGroup = groups.some(g => g.id === event.active.id);
    _setActiveType(isGroup ? 'group' : 'highlight');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    _setActiveType(null);

    if (!over) {return;}

    const activeIdNum = active.id as number;
    const overIdNum = over.id as number;

    if (activeIdNum === overIdNum) {return;}

    try {
      // Check if dragging a group (reorder groups)
      const { groups } = usePaperStore.getState();
      const isActiveGroup = groups.some(g => g.id === activeIdNum);
      const isOverGroup = groups.some(g => g.id === overIdNum);

      if (isActiveGroup && isOverGroup) {
        // Reorder groups
        await reorderGroups(activeIdNum, overIdNum);
      } else {
        // Move highlight to group
        await moveHighlightToGroup(activeIdNum, overIdNum);
      }
    } catch (error) {
      console.error('Failed to handle drag end:', error);
    }
  };

  // Create new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentPaper) {return;}

    _setIsSubmitting(true);
    try {
      await addGroup({
        paperId: currentPaper.id!,
        name: newGroupName.trim(),
        type: 'custom',
        position: groups.filter(g => g.type === 'custom').length,
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
        onDragEnd={(event) => { void handleDragEnd(event); }}
      >
        <NotebookContent
          activeId={activeId}
          activeTab={activeTab}
          evidenceSubmissions={evidenceSubmissions}
          investigationTasks={investigationTasks}
          pdfFile={pdfFile}
          setActiveTab={setActiveTab}
          onOpenCreateGroupModal={() => setIsCreateGroupModalOpen(true)}
        />
      </DndContext>

      <EvidenceSubmitModal
        highlight={pendingEvidenceHighlight}
        tasks={investigationTasks}
        isOpen={pendingEvidenceHighlight !== null}
        onClose={() => onCloseEvidenceModal?.()}
        onSubmit={async (taskId, evidenceType, note) => {
          if (!pendingEvidenceHighlight?.id) {
            return;
          }

          await submitEvidence(taskId, pendingEvidenceHighlight.id, evidenceType, note);
        }}
      />

      {/* Create Group Modal */}
      <Modal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        title="新建分组"
        confirmLabel="创建分组"
        onConfirm={() => { void handleCreateGroup(); }}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-2">
              分组名称
            </label>
            <input
              id="group-name"
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="例如：方法论、实验结果、讨论"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleCreateGroup();
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-2">
              创建分组后，可以将证据拖拽到此处进行分类整理。
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface NotebookContentProps {
  activeId: number | null;
  activeTab: 'evidence' | 'ai';
  evidenceSubmissions: EvidenceSubmission[];
  investigationTasks: InvestigationTask[];
  pdfFile: File | null;
  setActiveTab: (tab: 'evidence' | 'ai') => void;
  onOpenCreateGroupModal: () => void;
}

function NotebookContent({
  activeId,
  activeTab,
  evidenceSubmissions,
  investigationTasks,
  pdfFile,
  setActiveTab,
  onOpenCreateGroupModal,
}: NotebookContentProps) {
  const { currentPaper, groups, aiClueCards, deleteAIClueCard, updateAIClueCard } = usePaperStore();

  // Handle card edit
  const handleCardEdit = async (card: AIClueCard) => {
    if (card.id) {
      await updateAIClueCard(card.id, { title: card.title, content: card.content });
    }
  };

  // Handle card click (navigate to PDF page)
  const handleCardClick = (card: AIClueCard) => {
    console.log('Clicked card:', card);
    // TODO: Implement PDF navigation to card.pageNumber
  };

  // Handle highlight click (navigate to PDF highlight)
  const handleHighlightClick = (highlightId: number) => {
    console.log('Clicked highlight:', highlightId);
    // TODO: Implement PDF navigation to highlight
  };

  // Get inbox and custom groups
  const inboxGroup = groups.find(g => g.type === 'inbox');
  const customGroups = groups.filter(g => g.type === 'custom');

  return (
    <div className="h-full flex flex-col">
      {/* Notebook Header */}
      <div className="bg-newspaper-accent text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            <h2 className="font-bold text-lg">📓 侦探笔记本</h2>
          </div>
          <button
            onClick={onOpenCreateGroupModal}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建分组
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'evidence'
                ? 'bg-white text-newspaper-accent shadow-md'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>证据分组</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-black/10">
              {inboxGroup?.items?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-white text-newspaper-accent shadow-md'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI 线索</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-black/10">
              {aiClueCards.length}
            </span>
          </button>
        </div>

        <p className="text-xs opacity-80 mt-2">
          {currentPaper ? `正在分析: ${currentPaper.title}` : '请先导入PDF'}
        </p>
      </div>

      {/* Notebook Content */}
      <div className="flex-1 overflow-auto bg-newspaper-cream">
        {activeTab === 'evidence' ? (
          <div className="p-4">
            <div className="mb-4 rounded-lg border border-newspaper-border bg-white p-4">
              <h3 className="text-sm font-semibold text-newspaper-ink">Task Evidence</h3>
              <div className="mt-3 space-y-3">
                {investigationTasks.map((task) => {
                  const taskEvidence = evidenceSubmissions.filter(
                    (submission: EvidenceSubmission) => submission.taskId === task.id
                  );
                  return (
                    <div key={task.id} className="rounded border border-newspaper-border p-3">
                      <p className="text-sm font-medium text-newspaper-ink">{task.title}</p>
                      {taskEvidence.length === 0 ? (
                        <p className="mt-1 text-xs text-newspaper-faxed">No evidence submitted yet.</p>
                      ) : (
                        taskEvidence.map((submission: EvidenceSubmission) => (
                          <p key={submission.id ?? `${submission.taskId}-${submission.highlightId}`} className="mt-1 text-xs text-newspaper-faded">
                            {submission.evidenceType}: {submission.note}
                          </p>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inbox (Collection Bin) - HCI: Always at top for "collect first, organize later" workflow */}
            {inboxGroup && (
              <GroupFolder key={inboxGroup.id} group={inboxGroup} activeId={activeId} isInbox />
            )}

            {/* Custom Groups */}
            <div className="space-y-3 mt-6">
              {customGroups.map((group) => (
                <GroupFolder key={group.id} group={group} activeId={activeId} />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <AIClueCardList
              onDelete={(cardId) => { void deleteAIClueCard(cardId); }}
              onCardClick={handleCardClick}
              onCardEdit={(card) => { void handleCardEdit(card); }}
              onHighlightClick={handleHighlightClick}
            />
          </div>
        )}
      </div>

      {/* Bottom Panel - Context-aware AI Panel */}
      <div className="border-t border-newspaper-border bg-newspaper-aged p-3">
        {activeTab === 'evidence' ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">🤖 Clip助手</h3>
              <span className="text-xs text-newspaper-faxed">B模式</span>
            </div>

            <AIClueCardGenerator
              pdfFile={pdfFile}
              onComplete={() => {
                // Refresh card list after generation
              }}
            />
          </>
        ) : (
          <div className="space-y-3">
            <AIClueCardList
              onDelete={(cardId) => { void deleteAIClueCard(cardId); }}
              onCardClick={handleCardClick}
              onCardEdit={(card) => { void handleCardEdit(card); }}
              onHighlightClick={handleHighlightClick}
            />
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="bg-white border border-newspaper-border rounded p-3 text-sm mt-3">
            <p className="text-newspaper-ink">
              {inboxGroup ? (
                <>
                  收集箱中有 <span className="font-bold">{inboxGroup.items?.length || 0}</span> 条证据。
                  {(inboxGroup.items?.length || 0) >= 3
                    ? ' 已有足够线索，建议切换到 AI 线索标签生成摘要。'
                    : ' 继续收集更多证据以获得完整分析。'}
                </>
              ) : (
                '请先导入一篇PDF论文'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface GroupFolderProps {
  group: any;
  activeId: number | null;
  isInbox?: boolean;
}

// Draggable Group Folder Component
function DraggableGroupFolder({ group, activeId, isInbox = false }: GroupFolderProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: group.id!,
    data: { type: 'group', group },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-opacity ${isDragging ? 'opacity-50' : ''}`}
    >
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

function GroupFolderContent({ group, activeId, isInbox = false, dragHandleProps, isDragging }: GroupFolderContentProps) {
  const { expandedGroups, toggleGroupExpanded } = usePaperStore();
  const groupId = group.id as number;
  const { setNodeRef } = useDroppable({ id: groupId });

  const isExpanded = expandedGroups.has(groupId);

  return (
    <div className={`bg-white border-2 border-newspaper-border rounded overflow-hidden shadow-card ${isDragging ? 'ring-2 ring-newspaper-accent' : ''}`}>
      <div
        className="bg-newspaper-aged p-3 hover:bg-newspaper-border transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Drag Handle - Only for custom groups */}
            {!isInbox && dragHandleProps && (
              <button
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/50 rounded text-newspaper-faxed"
                title="拖拽排序"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <h3 className="font-bold text-sm flex items-center gap-2">
              {group.name}
              <span className="bg-newspaper-accent text-white text-xs px-2 py-0.5 rounded-full">
                {group.items?.length || 0}
              </span>
            </h3>
          </div>
          <button
            onClick={() => toggleGroupExpanded(groupId)}
            className="text-newspaper-faxed hover:text-newspaper-accent"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div
          ref={setNodeRef}
          className="p-3 min-h-[60px] border-t border-newspaper-border transition-all"
        >
          {!group.items || group.items.length === 0 ? (
            <div className="text-center text-newspaper-faxed text-sm py-4 border-2 border-dashed border-newspaper-border rounded">
              {isInbox ? '在左侧PDF中选择文本，自动添加到此收集箱' : '拖拽证据至此'}
            </div>
          ) : (
            <div className="space-y-2">
              {group.items.map((item: Highlight) => (
                <EvidenceCard key={item.id} item={item} isActive={activeId === item.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const GroupFolder = memo(DraggableGroupFolder);

interface EvidenceCardProps {
  item: Highlight;
  isActive?: boolean;
}

const EvidenceCard = memo(({ item, isActive = false }: EvidenceCardProps) => {
  // HCI-compliant: priority-based colors
  const colorClasses: Record<HighlightColor, string> = {
    red: 'bg-red-100 border-l-red-500',
    yellow: 'bg-yellow-100 border-l-yellow-500',
    orange: 'bg-orange-100 border-l-orange-500',
    gray: 'bg-gray-100 border-l-gray-400',
  };

  const priorityLabels: Record<HighlightColor, string> = {
    red: '🔴 关键',
    yellow: '🟡 重要',
    orange: '🟠 有趣',
    gray: '⚪ 存档',
  };

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(item.id))}
      className={`p-2 rounded border-l-4 ${colorClasses[item.color]} shadow-sm hover:shadow-md transition-all ${
        isActive ? 'ring-2 ring-newspaper-accent' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs flex-shrink-0">{priorityLabels[item.color]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-newspaper-ink line-clamp-2">{item.text}</p>
          <p className="text-xs text-newspaper-faxed mt-1">
            {new Date(item.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for EvidenceCard
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.text === nextProps.item.text &&
    prevProps.item.color === nextProps.item.color &&
    prevProps.item.createdAt === nextProps.item.createdAt &&
    prevProps.isActive === nextProps.isActive
  );
});
