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
      requiredEvidenceTypes: ['claim'],
      minEvidenceCount: 1,
      unlocksTaskIds: [],
      status: 'available',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbHelpers.addEvidenceSubmission.mockResolvedValue(1);

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
    });
  });

  it('opens evidence submission flow and persists evidence under the task', async () => {
    render(
      <DetectiveNotebook
        pendingEvidenceHighlight={highlight}
        onCloseEvidenceModal={jest.fn()}
      />
    );

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), {
        target: { value: 'This line contains the measurable improvement claim.' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save Evidence' }));
    });

    await waitFor(() => {
      expect(mockDbHelpers.addEvidenceSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          highlightId: 77,
          note: 'This line contains the measurable improvement claim.',
        })
      );
    });

    const taskEvidenceCard = screen.getAllByText('Define the Case')[0]?.closest('div');
    expect(taskEvidenceCard).toHaveTextContent(
      'claim: This line contains the measurable improvement claim.'
    );
  });
});
