import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Home from '@/app/page';
import { getAPIKey, getActiveProviderConfig } from '@/services/apiKeyManager';

const usePaperStoreMock = jest.fn();
const setInvestigationPhaseMock = jest.fn();
const setActiveTaskMock = jest.fn();
const setStateMock = jest.fn();

jest.mock('@/lib/store', () => ({
  usePaperStore: Object.assign(
    () => usePaperStoreMock(),
    { setState: (...args: unknown[]) => setStateMock(...args) }
  ),
}));

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

jest.mock('@/lib/pdf', () => ({
  extractPDFText: jest.fn(() => Promise.resolve('Mock PDF text')),
}));

jest.mock('@/services/apiKeyManager', () => ({
  getAPIKey: jest.fn(() => 'test-key'),
  getActiveProviderConfig: jest.fn(() => ({ id: 'bigmodel', model: 'glm-4.7-flash' })),
}));

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div>Header</div>,
}));

jest.mock('@/components/RealPDFViewer', () => ({
  __esModule: true,
  default: ({ onPdfFileChange }: { onPdfFileChange?: (file: File | null) => void }) => (
    <button
      onClick={() => {
        onPdfFileChange?.(new File(['pdf'], 'case.pdf', { type: 'application/pdf' }));
      }}
    >
      Load PDF
    </button>
  ),
}));

jest.mock('@/components/DetectiveNotebook', () => ({
  __esModule: true,
  default: () => <div>Notebook View</div>,
}));

jest.mock('@/components/brief/IntelligenceBriefViewer', () => ({
  IntelligenceBriefViewer: () => <div>Brief View</div>,
}));

const mockQuestion = {
  id: 'task-define-case',
  title: 'Lock the Core Claim',
  question: 'Find the exact problem statement and the main claim the authors want you to believe.',
  narrativeHook: 'Start in the Introduction. Your first job is to pin down the claim in the authors’ own words.',
  section: 'intro' as const,
  whereToLook: ['Introduction'],
  whatToFind: 'The exact problem statement and central claim.',
  submissionMode: 'evidence_only' as const,
  recommendedEvidenceCount: 1,
  evaluationFocus: 'Whether the evidence captures the exact claim wording.',
  linkedStructureKinds: ['intro'],
  requiredEvidenceTypes: ['claim'],
  minEvidenceCount: 1,
  unlocksTaskIds: ['task-real-innovation'],
  status: 'available' as const,
};

const mockCaseSetup = {
  paperId: 5,
  caseTitle: 'Mock Case',
  caseBackground: 'Mock Background',
  coreDispute: 'Mock Dispute',
  openingJudgment: 'Mock Judgment',
  investigationGoal: 'Mock Goal',
  structureNodes: [],
  tasks: [mockQuestion],
  generatedAt: '2026-03-18T00:00:00.000Z',
  model: 'glm-4.7-flash' as const,
  source: 'ai-generated' as const,
};

describe('Home page case setup stage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAPIKey as jest.MockedFunction<typeof getAPIKey>).mockReturnValue('test-key');
    (getActiveProviderConfig as jest.MockedFunction<typeof getActiveProviderConfig>).mockReturnValue({
      id: 'bigmodel',
      model: 'glm-4.7-flash',
      label: 'BigModel',
      apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      models: ['glm-4.7-flash', 'glm-4.6'],
      helpLink: 'https://open.bigmodel.cn/',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockCaseSetup,
      }),
    } as Response);

    usePaperStoreMock.mockReturnValue({
      currentPaper: { id: 5 },
      caseSetup: null,
      investigationPhase: 'setup',
      setActiveTask: setActiveTaskMock,
      setInvestigationPhase: setInvestigationPhaseMock,
      loadCaseSetup: jest.fn(),
    });
  });

  it('shows the setup panel after a PDF is available and no case setup exists', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: 'Welcome, Detective' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start Briefing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter Notebook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));

    expect(
      screen.getByRole('heading', { name: 'Preparing investigation setup' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Begin Investigation' })).toBeDisabled();
    expect(screen.queryByText('Notebook View')).not.toBeInTheDocument();
  });

  it('shows task guidance inside the setup panel', () => {
    usePaperStoreMock.mockReturnValue({
      currentPaper: { id: 5 },
      caseSetup: mockCaseSetup,
      investigationPhase: 'setup',
      setActiveTask: setActiveTaskMock,
      setInvestigationPhase: setInvestigationPhaseMock,
      loadCaseSetup: jest.fn(),
    });

    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Briefing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter Notebook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));

    expect(screen.getByText(/Where to look:/)).toBeInTheDocument();
    expect(screen.getByText(/What to collect:/)).toBeInTheDocument();
    expect(screen.getByText(/Completion rule:/)).toBeInTheDocument();
  });

  it('shows welcome and tutorial before investigation begins', () => {
    usePaperStoreMock.mockReturnValue({
      currentPaper: { id: 5 },
      caseSetup: mockCaseSetup,
      investigationPhase: 'setup',
      setActiveTask: setActiveTaskMock,
      setInvestigationPhase: setInvestigationPhaseMock,
      loadCaseSetup: jest.fn(),
    });

    render(<Home />);

    expect(screen.getByRole('heading', { name: 'Welcome, Detective' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Player name' }), {
      target: { value: 'Alex' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start Briefing' }));

    expect(screen.getByRole('heading', { name: 'Investigation Briefing' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(
      'Open a question and follow its section hints before collecting evidence.'
    );
  });

  it('shows a configure API key action after setup generation fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          message: '请先配置 BigModel API Key',
        },
      }),
      statusText: 'Internal Server Error',
    } as Response);

    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Briefing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter Notebook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '配置 API Key' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '重试生成' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Begin Investigation' })).toBeDisabled();
  });

  it('does not enter investigation mode until the user confirms setup completion', () => {
    usePaperStoreMock.mockReturnValue({
      currentPaper: { id: 5 },
      caseSetup: {
        ...mockCaseSetup,
        caseTitle: 'The Baseline Dispute',
      },
      investigationPhase: 'setup',
      setActiveTask: setActiveTaskMock,
      setInvestigationPhase: setInvestigationPhaseMock,
      loadCaseSetup: jest.fn(),
    });

    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Briefing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter Notebook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));

    expect(screen.getByRole('heading', { name: 'The Baseline Dispute' })).toBeInTheDocument();
    expect(screen.queryByText('Notebook View')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Begin Investigation' }));

    expect(setInvestigationPhaseMock).toHaveBeenCalledWith('investigate');
  });

  it('allows clicking an available task card to jump into investigation', () => {
    usePaperStoreMock.mockReturnValue({
      currentPaper: { id: 5 },
      caseSetup: mockCaseSetup,
      investigationPhase: 'setup',
      setActiveTask: setActiveTaskMock,
      setInvestigationPhase: setInvestigationPhaseMock,
      loadCaseSetup: jest.fn(),
    });

    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Briefing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter Notebook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));
    fireEvent.click(screen.getByRole('button', { name: /Lock the Core Claim/i }));

    expect(setActiveTaskMock).toHaveBeenCalledWith('task-define-case');
    expect(setInvestigationPhaseMock).toHaveBeenCalledWith('investigate');
  });
});
