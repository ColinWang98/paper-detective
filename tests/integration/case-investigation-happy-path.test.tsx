import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Home from '@/app/page';
import { dbHelpers } from '@/lib/db';
import { extractPDFText } from '@/lib/pdf';
import { usePaperStore } from '@/lib/store';
import type { CaseSetup } from '@/types';

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

jest.mock('@/lib/pdf', () => ({
  extractPDFText: jest.fn(),
}));

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: ({ onToggleMode, toggleDisabled }: { onToggleMode?: () => void; toggleDisabled?: boolean }) => (
    <button type="button" onClick={onToggleMode} disabled={toggleDisabled}>
      Toggle Mode
    </button>
  ),
}));

jest.mock('@/components/RealPDFViewer', () => ({
  __esModule: true,
  default: ({ onPdfFileChange }: { onPdfFileChange?: (file: File | null) => void }) => (
    <button
      type="button"
      onClick={() => {
        const file = new File(['paper body'], 'paper.pdf', { type: 'application/pdf' });
        onPdfFileChange?.(file);
        usePaperStore.getState().setCurrentPaper({
          id: 1,
          title: 'Paper Detective Test Paper',
          authors: [],
          year: 2026,
          fileURL: '',
          fileName: 'paper.pdf',
          uploadDate: '2026-03-17T00:00:00.000Z',
        });
      }}
    >
      Upload PDF
    </button>
  ),
}));

jest.mock('@/components/DetectiveNotebook', () => ({
  __esModule: true,
  default: () => (
    <button
      type="button"
      onClick={async () => {
        const store = usePaperStore.getState();
        await store.submitEvidence('task-1', 101, 'claim', 'Problem claim evidence');
        await store.submitEvidence('task-2', 102, 'comparison', 'Comparison evidence');
        await store.submitEvidence('task-2', 103, 'method', 'Method evidence');
        await store.submitEvidence('task-3', 104, 'result', 'Result evidence');
        await store.submitEvidence('task-4', 105, 'limitation', 'Limitation evidence');
      }}
    >
      Submit Core Evidence
    </button>
  ),
}));

jest.mock('@/components/brief/IntelligenceBriefViewer', () => ({
  __esModule: true,
  IntelligenceBriefViewer: () => {
    const phase = usePaperStore((state) => state.investigationPhase);
    return <div>{phase === 'report' ? 'Final Report Ready' : 'Final Report Locked'}</div>;
  },
}));

jest.mock('@/lib/db');

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;
const mockExtractPDFText = extractPDFText as jest.MockedFunction<typeof extractPDFText>;

const caseSetup: CaseSetup = {
  paperId: 1,
  caseTitle: 'The Baseline Dispute',
  caseBackground: 'A paper claim needs verification.',
  coreDispute: 'Whether the contribution is real.',
  openingJudgment: 'Initial evidence is incomplete.',
  investigationGoal: 'Verify the paper using direct text evidence.',
  structureNodes: [],
  tasks: [
    {
      id: 'task-1',
      title: 'Define the Case',
      question: 'What problem does the paper claim to solve?',
      narrativeHook: 'Start with the opening claim.',
      linkedStructureKinds: ['intro'],
      requiredEvidenceTypes: ['claim'],
      minEvidenceCount: 1,
      unlocksTaskIds: ['task-2'],
      status: 'available',
    },
    {
      id: 'task-2',
      title: 'Identify the Real Innovation',
      question: 'What is genuinely new compared with prior work?',
      narrativeHook: 'Separate novelty from framing.',
      linkedStructureKinds: ['related-work', 'method'],
      requiredEvidenceTypes: ['comparison', 'method'],
      minEvidenceCount: 2,
      unlocksTaskIds: ['task-3'],
      status: 'locked',
    },
    {
      id: 'task-3',
      title: 'Check Whether the Results Hold Up',
      question: 'Do the experiments support the main claim?',
      narrativeHook: 'Follow the evidence into the experiments.',
      linkedStructureKinds: ['experiment', 'result'],
      requiredEvidenceTypes: ['result'],
      minEvidenceCount: 1,
      unlocksTaskIds: ['task-4'],
      status: 'locked',
    },
    {
      id: 'task-4',
      title: 'Find the Weak Point',
      question: 'What limitation or unresolved risk remains?',
      narrativeHook: 'Find the unresolved risk.',
      linkedStructureKinds: ['discussion', 'limitation'],
      requiredEvidenceTypes: ['limitation'],
      minEvidenceCount: 1,
      unlocksTaskIds: [],
      status: 'locked',
    },
  ],
  generatedAt: '2026-03-17T00:00:00.000Z',
  model: 'glm-4.7-flash',
  source: 'ai-generated',
};

describe('case investigation happy path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePaperStore.setState({
      currentPaper: null,
      caseSetup: null,
      investigationTasks: [],
      evidenceSubmissions: [],
      activeTaskId: null,
      investigationPhase: 'setup',
      highlights: [],
      groups: [],
      aiClueCards: [],
      papers: [],
      expandedGroups: new Set(),
      history: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      isLoading: false,
      error: null,
    });

    mockDbHelpers.getHighlights.mockResolvedValue([]);
    mockDbHelpers.getGroupsWithHighlights.mockResolvedValue([]);
    mockDbHelpers.getClueCards.mockResolvedValue([]);
    mockDbHelpers.getEvidenceSubmissions.mockResolvedValue([]);
    mockDbHelpers.getCaseSetup
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue(caseSetup);
    mockDbHelpers.addEvidenceSubmission
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5);
    mockExtractPDFText.mockResolvedValue('Paper body text');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: caseSetup }),
    } as Response);
  });

  it('uploads a paper, generates case setup, completes tasks, and unlocks the final report', async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'Upload PDF' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/case-setup',
        expect.objectContaining({ method: 'POST' })
      );
      expect(screen.getByRole('heading', { name: 'The Baseline Dispute' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Begin Investigation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Core Evidence' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Mode' }));

    await waitFor(() => {
      expect(screen.getByText('Final Report Ready')).toBeInTheDocument();
    });
  });
});
