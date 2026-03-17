import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import Home from '@/app/page';

const usePaperStoreMock = jest.fn();

jest.mock('@/lib/store', () => ({
  usePaperStore: () => usePaperStoreMock(),
}));

jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
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
    usePaperStoreMock.mockReturnValue({
      undo: jest.fn().mockResolvedValue(undefined),
      redo: jest.fn().mockResolvedValue(undefined),
      canUndo: true,
      canRedo: true,
      currentPaper: {
        id: 7,
      },
    });
  });

  it('switches from notebook mode to brief mode and passes uploaded file to notebook', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'Load PDF' }));

    expect(screen.getByText('Notebook:paper.pdf')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'B 模式：AI 简报' }));

    expect(screen.getByText('Brief:7')).toBeInTheDocument();
  });
});
