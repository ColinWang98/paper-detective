import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import Home from '@/app/page';

const usePaperStoreMock = jest.fn();
const setInvestigationPhaseMock = jest.fn();

jest.mock('@/lib/store', () => ({
  usePaperStore: () => usePaperStoreMock(),
}));

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
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

describe('Home page case setup stage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePaperStoreMock.mockReturnValue({
      currentPaper: { id: 5 },
      caseSetup: null,
      investigationPhase: 'setup',
      setInvestigationPhase: setInvestigationPhaseMock,
    });
  });

  it('shows the setup panel after a PDF is available and no case setup exists', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));

    expect(
      screen.getByRole('heading', { name: 'Preparing investigation setup' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Begin Investigation' })).toBeDisabled();
    expect(screen.queryByText('Notebook View')).not.toBeInTheDocument();
  });

  it('does not enter investigation mode until the user confirms setup completion', () => {
    usePaperStoreMock.mockReturnValue({
      currentPaper: { id: 5 },
      caseSetup: {
        paperId: 5,
        caseTitle: 'The Baseline Dispute',
        caseBackground: 'A paper claim needs verification.',
        coreDispute: 'Whether the contribution is real.',
        openingJudgment: 'The initial evidence is incomplete.',
        investigationGoal: 'Verify the paper using direct text evidence.',
        structureNodes: [],
        tasks: [],
        generatedAt: '2026-03-17T00:00:00.000Z',
        model: 'glm-4.7-flash',
        source: 'ai-generated',
      },
      investigationPhase: 'setup',
      setInvestigationPhase: setInvestigationPhaseMock,
    });

    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));

    expect(screen.getByRole('heading', { name: 'The Baseline Dispute' })).toBeInTheDocument();
    expect(screen.queryByText('Notebook View')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Begin Investigation' }));

    expect(setInvestigationPhaseMock).toHaveBeenCalledWith('investigate');
  });
});
