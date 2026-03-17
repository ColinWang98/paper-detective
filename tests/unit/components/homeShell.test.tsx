import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/store', () => ({
  usePaperStore: Object.assign(
    jest.fn(() => ({
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
    })),
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
  it('renders the primary shell labels with readable text', () => {
    render(
      <div>
        <Header caseNumber={142} activeMode="notes" />
        <DetectiveNotebook />
        <RealPDFViewer />
      </div>
    );

    expect(screen.getByRole('heading', { name: 'Paper Detective' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B 模式：AI 简报' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /证据分组/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI 线索/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '欢迎来到Paper Detective' })).toBeInTheDocument();
    expect(screen.getByText('选择PDF文件', { selector: 'label' })).toBeInTheDocument();
  });
});
