import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import type { EvidenceSubmission, InvestigationTask, Paper } from '@/types';

const setActiveTaskMock = jest.fn();
const baseStoreState: any = {
  undo: jest.fn().mockResolvedValue(undefined),
  redo: jest.fn().mockResolvedValue(undefined),
  canUndo: true,
  canRedo: false,
  currentPaper: null,
  groups: [],
  aiClueCards: [],
  loadGroups: jest.fn().mockResolvedValue(undefined),
  moveHighlightToGroup: jest.fn().mockResolvedValue(undefined),
  addGroup: jest.fn().mockResolvedValue(1),
  reorderGroups: jest.fn().mockResolvedValue(undefined),
  deleteAIClueCard: jest.fn().mockResolvedValue(undefined),
  updateAIClueCard: jest.fn().mockResolvedValue(undefined),
  expandedGroups: new Set<number>(),
  toggleGroupExpanded: jest.fn(),
  addHighlight: jest.fn().mockResolvedValue(1),
  highlights: [],
  selectedPriority: 'important' as const,
  setSelectedPriority: jest.fn(),
  addPaper: jest.fn().mockResolvedValue(1),
  papers: [],
  setCurrentPaper: jest.fn(),
  loadHighlights: jest.fn().mockResolvedValue(undefined),
  investigationTasks: [],
  evidenceSubmissions: [],
  evidenceRelationships: [],
  deductionGraphs: [],
  submitEvidence: jest.fn().mockResolvedValue(undefined),
  assignEvidenceCluster: jest.fn().mockResolvedValue(undefined),
  updateEvidenceTags: jest.fn().mockResolvedValue(undefined),
  addEvidenceRelationship: jest.fn().mockResolvedValue(1),
  deleteEvidenceRelationship: jest.fn().mockResolvedValue(undefined),
  saveDeductionGraph: jest.fn().mockResolvedValue(undefined),
  applyEvidenceClusterSuggestions: jest.fn().mockResolvedValue(undefined),
  activeTaskId: 'task-1',
  setActiveTask: setActiveTaskMock,
};
let mockStoreState = { ...baseStoreState };

jest.mock('@/lib/store', () => ({
  usePaperStore: Object.assign(
    jest.fn(() => mockStoreState),
    {
      getState: jest.fn(() => ({
        currentPaper: null,
        loadHighlights: jest.fn().mockResolvedValue(undefined),
      })),
    }
  ),
}));

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: jest.fn(),
  PointerSensor: function PointerSensor() { return null; },
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn((...sensors: unknown[]) => sensors),
  useDroppable: jest.fn(() => ({ setNodeRef: jest.fn() })),
  useDraggable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  })),
}));

jest.mock('@/components/AIClueCardGenerator', () => () => <div>AI Clue Card Generator</div>);
jest.mock('@/components/AIClueCardList', () => () => <div>AI Clue Card List</div>);
jest.mock('@/components/Modal', () => ({
  __esModule: true,
  default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => (
    isOpen ? <div>{children}</div> : null
  ),
}));
jest.mock('@/components/PriorityLegend', () => () => <div>Priority Legend</div>);
jest.mock('@/components/HighlightOverlay', () => ({
  HighlightOverlay: () => <div>Highlight Overlay</div>,
}));
jest.mock('@/lib/db', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-pdf', () => ({
  pdfjs: {
    version: 'test',
    GlobalWorkerOptions: {},
  },
  Document: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Page: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import DetectiveNotebook from '@/components/DetectiveNotebook';
import Header from '@/components/Header';
import RealPDFViewer from '@/components/RealPDFViewer';

describe('Home shell copy', () => {
  beforeEach(() => {
    mockStoreState = { ...baseStoreState };
  });

  it('renders notebook tabs for questions, notes, graph, and progress', () => {
    render(
      <div>
        <Header caseNumber={142} activeMode="notes" />
        <DetectiveNotebook />
        <RealPDFViewer />
      </div>
    );

    expect(screen.getByRole('heading', { name: 'Paper Detective' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Questions' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Graph' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Progress' })).toBeInTheDocument();
  });

  it('shows clickable questions and current-question evidence flow', () => {
    mockStoreState = {
      ...baseStoreState,
      currentPaper: { id: 1, title: 'Case Paper' } as Partial<Paper>,
      investigationTasks: [
        {
          id: 'task-1',
          title: 'Lock the Core Claim',
          question: 'Find the central claim.',
          narrativeHook: 'Start with the introduction.',
          section: 'intro',
          whereToLook: ['Introduction'],
          whatToFind: 'Claim wording',
          submissionMode: 'evidence_only',
          recommendedEvidenceCount: 1,
          evaluationFocus: 'claim precision',
          linkedStructureKinds: ['intro'],
          requiredEvidenceTypes: ['claim'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: 'available',
        } satisfies InvestigationTask,
        {
          id: 'task-2',
          title: 'Check the Result Support',
          question: 'Find the strongest result evidence.',
          narrativeHook: 'Move to the result section.',
          section: 'result',
          whereToLook: ['Result'],
          whatToFind: 'Result sentence',
          submissionMode: 'evidence_only',
          recommendedEvidenceCount: 1,
          evaluationFocus: 'result grounding',
          linkedStructureKinds: ['result'],
          requiredEvidenceTypes: ['result'],
          minEvidenceCount: 1,
          unlocksTaskIds: [],
          status: 'available',
        } satisfies InvestigationTask,
      ] as InvestigationTask[],
      evidenceSubmissions: [
        {
          id: 10,
          paperId: 1,
          taskId: 'task-1',
          highlightId: 100,
          evidenceType: 'claim',
          note: 'This sentence states the claim.',
          createdAt: '2026-03-19T00:00:00.000Z',
        } satisfies EvidenceSubmission,
        {
          id: 11,
          paperId: 1,
          taskId: 'task-2',
          highlightId: 101,
          evidenceType: 'result',
          note: 'This sentence states the benchmark result.',
          createdAt: '2026-03-19T00:00:00.000Z',
        } satisfies EvidenceSubmission,
      ] as EvidenceSubmission[],
    };

    render(<DetectiveNotebook />);

    expect(screen.getByRole('button', { name: /Lock the Core Claim/i })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('2 questions available');
    expect(screen.getByRole('button', { name: /Check the Result Support/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(screen.getByRole('heading', { name: 'Lock the Core Claim' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Evidence Archive' })).toBeInTheDocument();
    expect(screen.getByText(/2 total/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Progress' }));
    expect(screen.getByRole('heading', { name: /Completed questions/i })).toBeInTheDocument();
  });
});
