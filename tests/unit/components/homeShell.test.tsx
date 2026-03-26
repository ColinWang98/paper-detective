import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import type { DoctorState, EvidenceSubmission, InvestigationTask, Paper, QuestionNode } from '@/types';

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
  questionNodes: [],
  questionRelations: [],
  doctorState: null,
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
    expect(screen.getByRole('heading', { name: 'Bird-Head Doctor' })).toBeInTheDocument();
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
      questionNodes: [
        {
          id: 'claim-q1',
          paperId: 1,
          title: 'What is the core claim?',
          prompt: 'Find the central claim.',
          type: 'claim',
          status: 'open',
          parentQuestionId: null,
          dependsOnQuestionIds: [],
          assignedEvidenceIds: [10],
          position: { x: 120, y: 120 },
        } satisfies QuestionNode,
        {
          id: 'evidence-q2',
          paperId: 1,
          title: 'Which result best supports the claim?',
          prompt: 'Find the strongest result evidence.',
          type: 'evidence',
          status: 'partial',
          parentQuestionId: 'claim-q1',
          dependsOnQuestionIds: ['claim-q1'],
          assignedEvidenceIds: [11],
          position: { x: 320, y: 220 },
        } satisfies QuestionNode,
      ] as QuestionNode[],
      doctorState: {
        paperId: 1,
        activeQuestionId: 'claim-q1',
        mode: 'checking',
        message: 'The claim is identified, but support is still incomplete.',
        updatedAt: '2026-03-26T00:00:00.000Z',
      } satisfies DoctorState,
    };

    render(<DetectiveNotebook />);

    const doctorPanel = screen.getByRole('heading', { name: 'Bird-Head Doctor' }).closest('section');
    expect(doctorPanel).toBeInTheDocument();
    expect(doctorPanel).toHaveTextContent('The claim is identified, but support is still incomplete.');
    expect(screen.getByRole('button', { name: /What is the core claim\?/i })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('2 questions available');
    expect(screen.getByRole('button', { name: /Which result best supports the claim\?/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(screen.getByRole('heading', { name: 'What is the core claim?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Question Evidence' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Evidence Archive' })).not.toBeInTheDocument();
    expect(document.body).toHaveTextContent('1 attached evidence');

    fireEvent.click(screen.getByRole('tab', { name: 'Progress' }));
    expect(screen.getByRole('heading', { name: /Completed questions/i })).toBeInTheDocument();
  });
});
