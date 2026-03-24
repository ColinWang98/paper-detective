import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Home from '@/app/page';
import { getAPIKey, getActiveProviderConfig } from '@/services/apiKeyManager';

const usePaperStoreMock = jest.fn();
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

jest.mock('@/components/RealPDFViewer', () => ({
  __esModule: true,
  default: ({ onPdfFileChange }: { onPdfFileChange?: (file: File | null) => void }) => (
    <button
      onClick={() => {
        onPdfFileChange?.(new File(['pdf'], 'paper.pdf', { type: 'application/pdf' }));
      }}
    >
      Load PDF
    </button>
  ),
}));

jest.mock('@/components/DetectiveNotebook', () => ({
  __esModule: true,
  default: ({ pdfFile }: { pdfFile?: File | null }) => (
    <div>Notebook:{pdfFile ? pdfFile.name : 'none'}</div>
  ),
}));

jest.mock('@/components/brief/IntelligenceBriefViewer', () => ({
  IntelligenceBriefViewer: ({ paperId }: { paperId: number }) => (
    <div>Brief:{paperId}</div>
  ),
}));

describe('Home page mode switching', () => {
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
        data: {
          paperId: 7,
          caseTitle: 'Mock Case',
          caseBackground: 'Mock Background',
          coreDispute: 'Mock Dispute',
          openingJudgment: 'Mock Judgment',
          investigationGoal: 'Mock Goal',
          structureNodes: [],
          tasks: [],
          generatedAt: '2026-03-18T00:00:00.000Z',
          model: 'glm-4.7-flash',
          source: 'ai-generated',
        },
      }),
    } as Response);

    usePaperStoreMock.mockReturnValue({
      undo: jest.fn().mockResolvedValue(undefined),
      redo: jest.fn().mockResolvedValue(undefined),
      canUndo: true,
      canRedo: true,
      setActiveTask: jest.fn(),
      setInvestigationPhase: jest.fn(),
      loadCaseSetup: jest.fn(),
      caseSetup: null,
      investigationPhase: 'investigate',
      currentPaper: {
        id: 7,
      },
    });
  });

  it('switches from notebook mode to brief mode and passes uploaded file to notebook', async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'Start Briefing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter Notebook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));

    await waitFor(() => {
      expect(screen.getByText('Notebook:paper.pdf')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'B 模式：AI 简报' }));

    expect(screen.getByText('Brief:7')).toBeInTheDocument();
  });
});
