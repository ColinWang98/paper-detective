import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import DetectiveNotebook from '@/components/DetectiveNotebook';
import { dbHelpers } from '@/lib/db';
import { usePaperStore } from '@/lib/store';
import type { Highlight, InvestigationTask } from '@/types';

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

jest.mock('@/lib/db');

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;

describe('evidence submission flow', () => {
  const highlight: Highlight = {
    id: 77,
    paperId: 1,
    pageNumber: 3,
    text: 'The method improves accuracy by 12%.',
    priority: 'important',
    color: 'yellow',
    timestamp: '2026-03-17T00:00:00.000Z',
    createdAt: '2026-03-17T00:00:00.000Z',
  };

  const tasks: InvestigationTask[] = [
    {
      id: 'task-1',
      title: 'Define the Case',
      question: 'What problem does the paper claim to solve?',
      narrativeHook: 'Start with the opening claim.',
      linkedStructureKinds: ['intro'],
      section: 'intro',
      whereToLook: ['Introduction'],
      whatToFind: 'Problem statement',
      submissionMode: 'evidence_only',
      recommendedEvidenceCount: 1,
      evaluationFocus: 'claim precision',
      requiredEvidenceTypes: ['claim'],
      minEvidenceCount: 1,
      unlocksTaskIds: ['task-2'],
      status: 'available',
    },
    {
      id: 'task-2',
      title: 'Check the Result Support',
      question: 'What experimental evidence supports the claim?',
      narrativeHook: 'Go to the results section.',
      linkedStructureKinds: ['result'],
      section: 'result',
      whereToLook: ['Results'],
      whatToFind: 'Result evidence',
      submissionMode: 'evidence_plus_optional_judgment',
      recommendedEvidenceCount: 1,
      evaluationFocus: 'evidence coverage',
      requiredEvidenceTypes: ['result'],
      minEvidenceCount: 1,
      unlocksTaskIds: [],
      status: 'available',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbHelpers.addEvidenceSubmission.mockResolvedValue(1);
    mockDbHelpers.updateEvidenceSubmission.mockResolvedValue(1);

    usePaperStore.setState({
      currentPaper: {
        id: 1,
        title: 'Test Paper',
        authors: [],
        year: 2026,
        fileURL: '',
        fileName: 'paper.pdf',
        uploadDate: '2026-03-17T00:00:00.000Z',
      },
      groups: [
        {
          id: 1,
          paperId: 1,
          name: 'Inbox',
          type: 'inbox',
          position: 0,
          isSystem: true,
          createdAt: '2026-03-17T00:00:00.000Z',
          items: [highlight],
        },
      ],
      expandedGroups: new Set([1]),
      investigationTasks: tasks,
      evidenceSubmissions: [],
      deductionGraphs: [],
      activeTaskId: 'task-2',
    });
  });

  it('defaults evidence submission to the active task and shows current-task evidence in notes', async () => {
    render(
      <DetectiveNotebook
        pendingEvidenceHighlight={highlight}
        onCloseEvidenceModal={jest.fn()}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Task' })).toHaveValue('task-2');

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Evidence Type' }), {
        target: { value: 'result' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), {
        target: { value: 'This line contains the measurable improvement result.' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save Evidence' }));
    });

    await waitFor(() => {
      expect(mockDbHelpers.addEvidenceSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-2',
          highlightId: 77,
          note: 'This line contains the measurable improvement result.',
        })
      );
    });

    expect(usePaperStore.getState().groups[0]?.items).toEqual([]);

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));

    expect(screen.getByRole('heading', { name: 'Check the Result Support' })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('This line contains the measurable improvement result.');
    expect(screen.queryByRole('heading', { name: 'Define the Case' })).not.toBeInTheDocument();
    expect(screen.queryByText('Collection Bin')).not.toBeInTheDocument();
  });

  it('assigns the current question evidence into a cluster from the notes tab', async () => {
    usePaperStore.setState({
      currentPaper: {
        id: 1,
        title: 'Test Paper',
        authors: [],
        year: 2026,
        fileURL: '',
        fileName: 'paper.pdf',
        uploadDate: '2026-03-17T00:00:00.000Z',
      },
      groups: [],
      expandedGroups: new Set<number>(),
      investigationTasks: tasks,
      evidenceSubmissions: [
        {
          id: 2,
          paperId: 1,
          taskId: 'task-2',
          highlightId: 77,
          evidenceType: 'result',
          note: 'This line contains the measurable improvement result.',
          createdAt: '2026-03-17T00:00:00.000Z',
        },
      ],
      deductionGraphs: [],
      highlights: [highlight],
      activeTaskId: 'task-2',
    });

    render(<DetectiveNotebook />);

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supports Claim' }));

    await waitFor(() => {
      expect(mockDbHelpers.updateEvidenceSubmission).toHaveBeenCalledWith(2, {
        clusterId: 'supports-claim',
      });
    });

    expect(usePaperStore.getState().evidenceSubmissions[0]?.clusterId).toBe('supports-claim');
  });

  it('updates bubble tags from the clusters tab', async () => {
    mockDbHelpers.updateEvidenceSubmission.mockResolvedValue(1);

    usePaperStore.setState({
      currentPaper: {
        id: 1,
        title: 'Test Paper',
        authors: [],
        year: 2026,
        fileURL: '',
        fileName: 'paper.pdf',
        uploadDate: '2026-03-17T00:00:00.000Z',
      },
      groups: [],
      expandedGroups: new Set<number>(),
      investigationTasks: tasks,
      evidenceSubmissions: [
        {
          id: 3,
          paperId: 1,
          taskId: 'task-2',
          highlightId: 77,
          evidenceType: 'result',
          note: 'This line contains the measurable improvement result.',
          aiTags: ['result'],
          createdAt: '2026-03-17T00:00:00.000Z',
        },
      ],
      deductionGraphs: [],
      highlights: [highlight],
      activeTaskId: 'task-2',
    });

    render(<DetectiveNotebook />);

    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));
    const input = screen.getByRole('textbox', { name: 'Bubble tags 3' });
    fireEvent.change(input, {
      target: { value: 'benchmark' },
    });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.change(input, {
      target: { value: 'support' },
    });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Save Tags 3' }));

    await waitFor(() => {
      expect(mockDbHelpers.updateEvidenceSubmission).toHaveBeenCalledWith(3, {
        aiTags: ['result', 'benchmark', 'support'],
      });
    });

    expect(usePaperStore.getState().evidenceSubmissions[0]?.aiTags).toEqual([
      'result',
      'benchmark',
      'support',
    ]);
  });
});
