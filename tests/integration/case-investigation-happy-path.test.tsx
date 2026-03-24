import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Home from '@/app/page';
import { dbHelpers } from '@/lib/db';
import { extractPDFText } from '@/lib/pdf';
import { usePaperStore } from '@/lib/store';
import { getAPIKey, getActiveProviderConfig } from '@/services/apiKeyManager';
import type { CaseSetup } from '@/types';

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

jest.mock('@/lib/pdf', () => ({
  extractPDFText: jest.fn(),
}));

jest.mock('@/services/apiKeyManager', () => ({
  getAPIKey: jest.fn(),
  getActiveProviderConfig: jest.fn(() => ({
    id: 'deepseek',
    label: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    models: ['deepseek-chat'],
    helpLink: 'https://platform.deepseek.com/',
  })),
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
  default: () => <div>Notebook</div>,
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
const mockGetAPIKey = getAPIKey as jest.MockedFunction<typeof getAPIKey>;
const mockGetActiveProviderConfig =
  getActiveProviderConfig as jest.MockedFunction<typeof getActiveProviderConfig>;

const caseSetup: CaseSetup = {
  paperId: 1,
  caseTitle: 'The Baseline Dispute',
  caseBackground: 'A paper claim needs verification.',
  coreDispute: 'Whether the contribution is real.',
  openingJudgment: 'Initial evidence is incomplete.',
  investigationGoal: 'Verify the paper using direct text evidence.',
  structureNodes: [],
  tasks: Array.from({ length: 10 }, (_, index) => ({
    id: `task-${index + 1}`,
    title: `Investigation Task ${index + 1}`,
    question: `Question ${index + 1}?`,
    narrativeHook: `Hook ${index + 1}`,
    section: 'intro',
    whereToLook: ['Introduction'],
    whatToFind: `Evidence ${index + 1}`,
    submissionMode: 'evidence_only',
    recommendedEvidenceCount: 1,
    evaluationFocus: 'coverage',
    linkedStructureKinds: ['intro'],
    requiredEvidenceTypes: ['claim'],
    minEvidenceCount: 1,
    unlocksTaskIds: index < 9 ? [`task-${index + 2}`] : [],
    status: index === 0 ? 'available' : 'locked',
  })),
  generatedAt: '2026-03-17T00:00:00.000Z',
  model: 'glm-4.7-flash',
  source: 'ai-generated',
};

describe('case investigation happy path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePaperStore.setState({
      currentPaper: null,
      caseSetup,
      investigationTasks: caseSetup.tasks,
      evidenceSubmissions: [],
      activeTaskId: 'task-1',
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
    mockDbHelpers.addEvidenceSubmission.mockImplementation(async () => Date.now());
    mockExtractPDFText.mockResolvedValue('Paper body text');
    mockGetAPIKey.mockReturnValue('test-bigmodel-key');
    mockGetActiveProviderConfig.mockReturnValue({
      id: 'deepseek',
      label: 'DeepSeek',
      apiUrl: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat',
      models: ['deepseek-chat'],
      helpLink: 'https://platform.deepseek.com/',
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: caseSetup,
      }),
    } as Response);
  });

  it('uploads a paper, keeps the report locked below threshold, and unlocks it at threshold', async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'Upload PDF' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'The Baseline Dispute' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start Briefing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter Notebook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Begin Investigation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Mode' }));

    await waitFor(() => {
      expect(screen.getByText('Final Report Locked')).toBeInTheDocument();
    });

    await actCompleteThreshold();

    await waitFor(() => {
      expect(screen.getByText('Final Report Ready')).toBeInTheDocument();
    });
  });
});

async function actCompleteThreshold() {
  const store = usePaperStore.getState();

  for (let index = 1; index <= 10; index += 1) {
    const taskId = `task-${index}`;
    await store.submitEvidence(taskId, 100 + index, 'claim', `Evidence for ${taskId}`);
  }
}
