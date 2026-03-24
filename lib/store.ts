import { create } from 'zustand';

import type {
  AIClueCard,
  CaseSetup,
  DeductionGraph,
  DeductionGraphEdge,
  DeductionGraphNode,
  EvidenceClusterId,
  EvidenceRelationship,
  EvidenceRelationshipType,
  EvidenceType,
  EvidenceSubmission,
  Group,
  Highlight,
  InvestigationTask,
  Paper,
} from '@/types';

import { dbHelpers } from './db';
import { evaluateTaskProgress, isFinalReportUnlocked } from './investigationRules';

// Undo/Redo types
export type ActionType = 'add' | 'update' | 'delete' | 'move';

export interface ActionTarget {
  type: 'highlight' | 'group' | 'clueCard';
  id: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  actionType: ActionType;
  target: ActionTarget;
  previousState: Record<string, any> | null;
  newState: Record<string, any>;
  description: string;
}

interface PaperState {
  // Current paper
  currentPaper: Paper | null;
  papers: Paper[];

  // Highlights and groups
  highlights: Highlight[];
  groups: Group[];

  // AI Clue Cards (Story 2.2.1)
  aiClueCards: AIClueCard[];
  caseSetup: CaseSetup | null;
  investigationTasks: InvestigationTask[];
  evidenceSubmissions: EvidenceSubmission[];
  evidenceRelationships: EvidenceRelationship[];
  deductionGraphs: DeductionGraph[];
  activeTaskId: string | null;
  investigationPhase: 'setup' | 'investigate' | 'report';

  // UI state (HCI-compliant colors)
  selectedPriority: 'critical' | 'important' | 'interesting' | 'archived';
  expandedGroups: Set<number>;

  // Undo/Redo history
  history: HistoryEntry[];
  redoStack: HistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentPaper: (paper: Paper | null) => void;
  loadPapers: () => Promise<void>;
  addPaper: (file: File) => Promise<number>;
  deletePaper: (id: number) => Promise<void>;

  // Highlight actions
  loadHighlights: (paperId: number) => Promise<void>;
  addHighlight: (highlight: Omit<Highlight, 'id'>) => Promise<number>;
  updateHighlight: (id: number, changes: Partial<Highlight>) => Promise<void>;
  deleteHighlight: (id: number) => Promise<void>;

  // Group actions
  loadGroups: (paperId: number) => Promise<void>;
  addGroup: (group: Omit<Group, 'id'>) => Promise<number>;
  updateGroup: (id: number, changes: Partial<Group>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  moveHighlightToGroup: (highlightId: number, toGroupId: number) => Promise<void>;
  reorderGroups: (activeId: number, overId: number) => Promise<void>;

  // AI Clue Card actions (Story 2.2.1)
  loadAIClueCards: (paperId: number) => Promise<void>;
  addAIClueCard: (clueCard: Omit<AIClueCard, 'id'>) => Promise<number>;
  updateAIClueCard: (id: number, changes: Partial<AIClueCard>) => Promise<void>;
  deleteAIClueCard: (id: number) => Promise<void>;

  // Case investigation actions
  loadCaseSetup: (paperId: number) => Promise<void>;
  loadEvidenceSubmissions: (paperId: number) => Promise<void>;
  loadEvidenceRelationships: (paperId: number) => Promise<void>;
  loadDeductionGraphs: (paperId: number) => Promise<void>;
  submitEvidence: (taskId: string, highlightId: number, evidenceType: EvidenceType, note: string) => Promise<number>;
  assignEvidenceCluster: (submissionId: number, clusterId: EvidenceClusterId | null) => Promise<void>;
  updateEvidenceTags: (submissionId: number, aiTags: string[]) => Promise<void>;
  addEvidenceRelationship: (
    taskId: string,
    fromSubmissionId: number,
    toSubmissionId: number,
    relationshipType: EvidenceRelationshipType,
    note?: string
  ) => Promise<number>;
  deleteEvidenceRelationship: (relationshipId: number) => Promise<void>;
  saveDeductionGraph: (taskId: string, nodes: DeductionGraphNode[], edges: DeductionGraphEdge[]) => Promise<void>;
  applyEvidenceClusterSuggestions: (
    updates: Array<{ submissionId: number; clusterId: EvidenceClusterId; aiTags?: string[] }>
  ) => Promise<void>;
  applyTaskEvaluation: (taskId: string, evaluation: { score: number; feedback: string; submittedAt?: string }) => void;
  setActiveTask: (taskId: string | null) => void;
  setInvestigationPhase: (phase: 'setup' | 'investigate' | 'report') => void;

  // UI actions
  setSelectedPriority: (priority: 'critical' | 'important' | 'interesting' | 'archived') => void;
  toggleGroupExpanded: (groupId: number) => void;
  clearError: () => void;

  // Undo/Redo actions
  pushToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clearHistory: () => void;
}

export const usePaperStore = create<PaperState>((set, get) => ({
  // Initial state
  currentPaper: null,
  papers: [],
  highlights: [],
  groups: [],
  aiClueCards: [],
  caseSetup: null,
  investigationTasks: [],
  evidenceSubmissions: [],
  evidenceRelationships: [],
  deductionGraphs: [],
  activeTaskId: null,
  investigationPhase: 'setup',
  selectedPriority: 'important',
  expandedGroups: new Set(),
  history: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  isLoading: false,
  error: null,

  // Undo/Redo actions
  pushToHistory: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    set((state) => ({
      history: [...state.history, newEntry],
      canUndo: true,
      canRedo: false,
      redoStack: [], // Clear redo stack on new action
    }));
  },

  undo: async () => {
    const { history, redoStack } = get();

    if (history.length === 0) {return;}

    const lastEntry = history[history.length - 1];

    try {
      // Apply inverse operation
      switch (lastEntry.actionType) {
        case 'add':
          // Inverse of add is delete
          if (lastEntry.target.type === 'highlight') {
            await dbHelpers.deleteHighlight(lastEntry.target.id);
          } else if (lastEntry.target.type === 'group') {
            await dbHelpers.deleteGroup(lastEntry.target.id);
          } else if (lastEntry.target.type === 'clueCard') {
            await dbHelpers.deleteClueCard(lastEntry.target.id);
          }
          break;

        case 'delete':
          // Inverse of delete is add (restore from previousState)
          if (lastEntry.target.type === 'highlight') {
            await dbHelpers.addHighlight(lastEntry.previousState as Highlight);
          } else if (lastEntry.target.type === 'group') {
            await dbHelpers.addGroup(lastEntry.previousState as Group);
          } else if (lastEntry.target.type === 'clueCard') {
            await dbHelpers.addClueCard(lastEntry.previousState as AIClueCard);
          }
          break;

        case 'update':
          // Inverse of update is restore previousState
          if (lastEntry.target.type === 'highlight') {
            await dbHelpers.updateHighlight(lastEntry.target.id, lastEntry.previousState as Partial<Highlight>);
          } else if (lastEntry.target.type === 'group') {
            await dbHelpers.updateGroup(lastEntry.target.id, lastEntry.previousState as Partial<Group>);
          } else if (lastEntry.target.type === 'clueCard') {
            await dbHelpers.updateClueCard(lastEntry.target.id, lastEntry.previousState as Partial<AIClueCard>);
          }
          break;

        case 'move': {
          // Inverse of move is move back to previous position
          const { previousState } = lastEntry;
          if (previousState && previousState.fromGroupId !== undefined && previousState.toGroupId !== undefined) {
            await dbHelpers.moveHighlightToGroup(
              lastEntry.target.id,
              previousState.fromGroupId as number
            );
          }
          break;
        }
      }

      // Reload data to reflect changes
      const { currentPaper } = get();
      if (currentPaper) {
        await get().loadHighlights(currentPaper.id!);
        await get().loadGroups(currentPaper.id!);
        await get().loadAIClueCards(currentPaper.id!);
      }

      // Move to redo stack
      set((state) => ({
        history: state.history.slice(0, -1),
        redoStack: [...redoStack, lastEntry],
        canUndo: state.history.length > 1,
        canRedo: true,
      }));
    } catch (error) {
      console.error('Undo failed:', error);
    }
  },

  redo: async () => {
    const { redoStack } = get();

    if (redoStack.length === 0) {return;}

    const nextEntry = redoStack[redoStack.length - 1];

    try {
      // Apply original operation
      switch (nextEntry.actionType) {
        case 'add':
          // Redo add is add again
          if (nextEntry.target.type === 'highlight') {
            await dbHelpers.addHighlight(nextEntry.newState as Highlight);
          } else if (nextEntry.target.type === 'group') {
            await dbHelpers.addGroup(nextEntry.newState as Group);
          } else if (nextEntry.target.type === 'clueCard') {
            await dbHelpers.addClueCard(nextEntry.newState as AIClueCard);
          }
          break;

        case 'delete':
          // Redo delete is delete again
          await dbHelpers.deleteHighlight(nextEntry.target.id);
          break;

        case 'update':
          // Redo update is apply newState
          if (nextEntry.target.type === 'highlight') {
            await dbHelpers.updateHighlight(nextEntry.target.id, nextEntry.newState as Partial<Highlight>);
          } else if (nextEntry.target.type === 'group') {
            await dbHelpers.updateGroup(nextEntry.target.id, nextEntry.newState as Partial<Group>);
          } else if (nextEntry.target.type === 'clueCard') {
            await dbHelpers.updateClueCard(nextEntry.target.id, nextEntry.newState as Partial<AIClueCard>);
          }
          break;

        case 'move': {
          // Redo move is move to original position
          const { newState } = nextEntry;
          if (newState.fromGroupId !== undefined && newState.toGroupId !== undefined) {
            await dbHelpers.moveHighlightToGroup(
              nextEntry.target.id,
              newState.toGroupId as number
            );
          }
          break;
        }
      }

      // Reload data to reflect changes
      const { currentPaper } = get();
      if (currentPaper) {
        await get().loadHighlights(currentPaper.id!);
        await get().loadGroups(currentPaper.id!);
        await get().loadAIClueCards(currentPaper.id!);
      }

      // Move back to history
      set((state) => ({
        history: [...state.history, nextEntry],
        redoStack: state.redoStack.slice(0, -1),
        canUndo: true,
        canRedo: redoStack.length > 1,
      }));
    } catch (error) {
      console.error('Redo failed:', error);
    }
  },

  clearHistory: () => {
    set({ history: [], redoStack: [], canUndo: false, canRedo: false });
  },

  // Paper actions
  setCurrentPaper: (paper) => {
    set({ currentPaper: paper });
    if (paper) {
      void get().loadHighlights(paper.id!);
      void get().loadGroups(paper.id!);
      void get().loadAIClueCards(paper.id!);
      void get().loadCaseSetup(paper.id!);
      void get().loadEvidenceSubmissions(paper.id!);
      void get().loadEvidenceRelationships(paper.id!);
      void get().loadDeductionGraphs(paper.id!);
    }
  },

  loadPapers: async () => {
    set({ isLoading: true, error: null });
    try {
      const papers = await dbHelpers.getAllPapers();
      set({ papers, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addPaper: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const paperId = await dbHelpers.addPaper(file);
      await get().loadPapers();
      set({ isLoading: false });
      return paperId;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deletePaper: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dbHelpers.deletePaper(id);
      await get().loadPapers();
      if (get().currentPaper?.id === id) {
        set({
          currentPaper: null,
          highlights: [],
          groups: [],
          caseSetup: null,
          investigationTasks: [],
          evidenceSubmissions: [],
          evidenceRelationships: [],
          deductionGraphs: [],
          activeTaskId: null,
          investigationPhase: 'setup',
        });
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // Highlight actions
  loadHighlights: async (paperId) => {
    set({ isLoading: true, error: null });
    try {
      const highlights = await dbHelpers.getHighlights(paperId);
      set({ highlights, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addHighlight: async (highlight) => {
    // 乐观更新：立即更新UI
    const tempId = Date.now();
    const newHighlight = { ...highlight, id: tempId };

    set(state => ({
      highlights: [...state.highlights, newHighlight],
      error: null,
    }));

    try {
      // 后台保存
      const id = await dbHelpers.addHighlight(highlight as Highlight);

      // 确认更新：替换临时ID
      set(state => ({
        highlights: state.highlights.map(h =>
          h.id === tempId ? { ...h, id } : h
        ),
      }));

      // 获取完整的高亮数据用于历史记录
      const savedHighlight = await dbHelpers.getHighlights(Number(highlight.paperId))
        .then(highlights => highlights.find(h => h.id === id));

      if (savedHighlight) {
        // 记录到历史
        get().pushToHistory({
          actionType: 'add',
          target: { type: 'highlight', id },
          previousState: null,
          newState: savedHighlight,
          description: `添加高亮: "${savedHighlight.text.slice(0, 30)}..."`,
        });
      }

      // 增量更新：将新高亮添加到inbox组
      const finalHighlight = { ...newHighlight, id };
      set(state => ({
        groups: state.groups.map(g => {
          // Inbox组type为'inbox'，自动添加新高亮
          if (g.type === 'inbox') {
            return { ...g, items: [...(g.items || []), finalHighlight] };
          }
          return g;
        }),
      }));

      return id;
    } catch (error) {
      // 回滚：移除临时添加的高亮
      set(state => ({
        highlights: state.highlights.filter(h => h.id !== tempId),
        error: (error as Error).message,
      }));
      throw error;
    }
  },

  updateHighlight: async (id, changes) => {
    // 保存旧状态用于回滚
    const oldHighlight = get().highlights.find(h => h.id === id);

    // 乐观更新：立即更新UI
    set(state => ({
      highlights: state.highlights.map(h =>
        h.id === id ? { ...h, ...changes } : h
      ),
      error: null,
    }));

    try {
      // 后台保存
      await dbHelpers.updateHighlight(id, changes);
    } catch (error) {
      // 回滚：恢复旧状态
      if (oldHighlight) {
        set(state => ({
          highlights: state.highlights.map(h =>
            h.id === id ? oldHighlight : h
          ),
          error: (error as Error).message,
        }));
      } else {
        // 如果找不到旧高亮，重新加载
        await get().loadHighlights(get().currentPaper?.id || 0);
      }
      throw error;
    }
  },

  deleteHighlight: async (id) => {
    // 保存旧状态用于回滚
    const oldHighlight = get().highlights.find(h => h.id === id);
    const oldGroups = get().groups;

    // 乐观更新：立即从UI移除
    set(state => ({
      highlights: state.highlights.filter(h => h.id !== id),
      error: null,
    }));

    try {
      // 后台删除
      await dbHelpers.deleteHighlight(id);

      // 增量更新：从所有分组中移除该高亮
      set(state => ({
        groups: state.groups.map(g => ({
          ...g,
          items: (g.items || []).filter(item => item.id !== id),
        })),
      }));
    } catch (error) {
      // 回滚：恢复高亮和分组
      set(state => ({
        highlights: oldHighlight ? [...state.highlights, oldHighlight] : state.highlights,
        groups: oldGroups,
        error: (error as Error).message,
      }));
      throw error;
    }
  },

  // Group actions
  loadGroups: async (paperId) => {
    set({ isLoading: true, error: null });
    try {
      // Load groups with their attached highlights
      const groups = await dbHelpers.getGroupsWithHighlights(paperId);
      const sortedGroups = groups.sort((a, b) => a.position - b.position);
      set({ groups: sortedGroups, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addGroup: async (group) => {
    set({ isLoading: true, error: null });
    try {
      const id = await dbHelpers.addGroup(group as Group);
      await get().loadGroups(group.paperId);
      set({ isLoading: false });
      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateGroup: async (id, changes) => {
    set({ isLoading: true, error: null });
    try {
      await dbHelpers.updateGroup(id, changes);
      await get().loadGroups(get().currentPaper?.id || 0);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dbHelpers.deleteGroup(id);
      await get().loadGroups(get().currentPaper?.id || 0);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  moveHighlightToGroup: async (highlightId, toGroupId) => {
    set({ isLoading: true, error: null });
    try {
      await dbHelpers.moveHighlightToGroup(highlightId, toGroupId);
      await get().loadGroups(get().currentPaper?.id || 0);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // Reorder groups (drag and drop sorting)
  reorderGroups: async (activeId: number, overId: number) => {
    set({ isLoading: true, error: null });
    try {
      const { groups } = get();
      const activeGroup = groups.find(g => g.id === activeId);
      const overGroup = groups.find(g => g.id === overId);

      if (!activeGroup || !overGroup) {
        set({ isLoading: false });
        return;
      }

      // Calculate new positions
      const activePosition = activeGroup.position;
      const overPosition = overGroup.position;

      // Swap positions
      await dbHelpers.updateGroup(activeId, { position: overPosition });
      await dbHelpers.updateGroup(overId, { position: activePosition });

      await get().loadGroups(get().currentPaper?.id || 0);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // AI Clue Card actions (Story 2.2.1)
  loadAIClueCards: async (paperId) => {
    set({ isLoading: true, error: null });
    try {
      const clueCards = await dbHelpers.getClueCards(paperId);
      set({ aiClueCards: clueCards, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addAIClueCard: async (clueCard) => {
    set({ isLoading: true, error: null });
    try {
      const id = await dbHelpers.addClueCard(clueCard);
      await get().loadAIClueCards(clueCard.paperId);
      set({ isLoading: false });
      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateAIClueCard: async (id, changes) => {
    set({ isLoading: true, error: null });
    try {
      await dbHelpers.updateClueCard(id, changes);
      // Update in state
      set(state => ({
        aiClueCards: state.aiClueCards.map(card =>
          card.id === id ? { ...card, ...changes, updatedAt: new Date().toISOString() } : card
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteAIClueCard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dbHelpers.deleteClueCard(id);
      // Remove from state
      set(state => ({
        aiClueCards: state.aiClueCards.filter(card => card.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  loadCaseSetup: async (paperId) => {
    set({ isLoading: true, error: null });
    try {
      const caseSetup = await dbHelpers.getCaseSetup(paperId);
      set({
        caseSetup: caseSetup ?? null,
        investigationTasks: caseSetup?.tasks ?? [],
        activeTaskId: caseSetup?.tasks.find((task) => task.status === 'available')?.id ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadEvidenceSubmissions: async (paperId) => {
    set({ isLoading: true, error: null });
    try {
      const evidenceSubmissions = await dbHelpers.getEvidenceSubmissions(paperId);
      set({ evidenceSubmissions, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadEvidenceRelationships: async (paperId) => {
    set({ isLoading: true, error: null });
    try {
      const evidenceRelationships = await dbHelpers.getEvidenceRelationships(paperId);
      set({ evidenceRelationships, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadDeductionGraphs: async (paperId) => {
    set({ isLoading: true, error: null });
    try {
      const deductionGraphs = await dbHelpers.getDeductionGraphs(paperId);
      set({ deductionGraphs, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  submitEvidence: async (taskId, highlightId, evidenceType, note) => {
    const { currentPaper } = get();
    if (!currentPaper?.id) {
      throw new Error('No active paper selected');
    }

    set({ isLoading: true, error: null });

    try {
      const createdAt = new Date().toISOString();
      const id = await dbHelpers.addEvidenceSubmission({
        paperId: currentPaper.id,
        taskId,
        highlightId,
        evidenceType,
        note,
        createdAt,
      });

      set((state) => {
        const nextEvidenceSubmissions = [
          ...state.evidenceSubmissions,
          {
            id,
            paperId: currentPaper.id!,
            taskId,
            highlightId,
            evidenceType,
            note,
            createdAt,
          },
        ];
        const nextTasks = evaluateTaskProgress(state.investigationTasks, nextEvidenceSubmissions);
        const isReportUnlocked = isFinalReportUnlocked(nextTasks);
        const preservedActiveTask =
          nextTasks.find((task) => task.id === taskId) ??
          nextTasks.find((task) => task.id === state.activeTaskId) ??
          null;
        const nextActiveTask = nextTasks.find((task) => task.status === 'available' || task.status === 'in_progress');
        const nextGroups = state.groups.map((group) => {
          if (group.type !== 'inbox') {
            return group;
          }

          return {
            ...group,
            items: (group.items || []).filter((item) => item.id !== highlightId),
          };
        });

        return {
          evidenceSubmissions: nextEvidenceSubmissions,
          groups: nextGroups,
          investigationTasks: nextTasks,
          activeTaskId: preservedActiveTask?.id ?? nextActiveTask?.id ?? null,
          investigationPhase: isReportUnlocked ? 'report' : state.investigationPhase,
          isLoading: false,
        };
      });

      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  assignEvidenceCluster: async (submissionId, clusterId) => {
    set({ isLoading: true, error: null });

    try {
      const nextClusterId = clusterId ?? undefined;
      await dbHelpers.updateEvidenceSubmission(submissionId, { clusterId: nextClusterId });
      set((state) => ({
        evidenceSubmissions: state.evidenceSubmissions.map((submission) =>
          submission.id === submissionId ? { ...submission, clusterId: nextClusterId } : submission
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateEvidenceTags: async (submissionId, aiTags) => {
    set({ isLoading: true, error: null });

    try {
      await dbHelpers.updateEvidenceSubmission(submissionId, { aiTags });
      set((state) => ({
        evidenceSubmissions: state.evidenceSubmissions.map((submission) =>
          submission.id === submissionId ? { ...submission, aiTags } : submission
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  addEvidenceRelationship: async (taskId, fromSubmissionId, toSubmissionId, relationshipType, note) => {
    const { currentPaper } = get();
    if (!currentPaper?.id) {
      throw new Error('No active paper selected');
    }

    set({ isLoading: true, error: null });

    try {
      const createdAt = new Date().toISOString();
      const id = await dbHelpers.addEvidenceRelationship({
        paperId: currentPaper.id,
        taskId,
        fromSubmissionId,
        toSubmissionId,
        relationshipType,
        note,
        createdAt,
      });

      set((state) => ({
        evidenceRelationships: [
          ...state.evidenceRelationships,
          {
            id,
            paperId: currentPaper.id!,
            taskId,
            fromSubmissionId,
            toSubmissionId,
            relationshipType,
            note,
            createdAt,
          },
        ],
        isLoading: false,
      }));

      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteEvidenceRelationship: async (relationshipId) => {
    set({ isLoading: true, error: null });

    try {
      await dbHelpers.deleteEvidenceRelationship(relationshipId);
      set((state) => ({
        evidenceRelationships: state.evidenceRelationships.filter(
          (relationship) => relationship.id !== relationshipId
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  saveDeductionGraph: async (taskId, nodes, edges) => {
    const { currentPaper } = get();
    if (!currentPaper?.id) {
      throw new Error('No active paper selected');
    }

    set({ isLoading: true, error: null });

    try {
      const updatedAt = new Date().toISOString();
      const graph = {
        paperId: currentPaper.id,
        taskId,
        nodes,
        edges,
        updatedAt,
      };
      const id = await dbHelpers.saveDeductionGraph(graph);

      set((state) => ({
        deductionGraphs: [
          ...state.deductionGraphs.filter((item) => item.taskId !== taskId),
          { ...graph, id },
        ],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  applyEvidenceClusterSuggestions: async (updates) => {
    set({ isLoading: true, error: null });

    try {
      await Promise.all(
        updates.map((update) =>
          dbHelpers.updateEvidenceSubmission(update.submissionId, {
            clusterId: update.clusterId,
            aiTags: update.aiTags,
          })
        )
      );

      set((state) => ({
        evidenceSubmissions: state.evidenceSubmissions.map((submission) => {
          const matched = updates.find((update) => update.submissionId === submission.id);
          if (!matched) {
            return submission;
          }

          return {
            ...submission,
            clusterId: matched.clusterId,
            aiTags: matched.aiTags,
          };
        }),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  applyTaskEvaluation: (taskId, evaluation) =>
    set((state) => ({
      investigationTasks: state.investigationTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              score: evaluation.score,
              feedback: evaluation.feedback,
              submittedAt: evaluation.submittedAt ?? new Date().toISOString(),
            }
          : task
      ),
    })),

  setActiveTask: (taskId) => set({ activeTaskId: taskId }),

  setInvestigationPhase: (phase) => set({ investigationPhase: phase }),

  // UI actions
  setSelectedPriority: (priority) => set({ selectedPriority: priority }),

  toggleGroupExpanded: (groupId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedGroups);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return { expandedGroups: newExpanded };
    }),

  clearError: () => set({ error: null }),
}));
