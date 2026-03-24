import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IntelligenceBriefViewer } from '@/components/brief/IntelligenceBriefViewer';
import { completeBrief } from '@/tests/fixtures/export-data';

jest.mock('@/hooks/useIntelligenceBrief', () => ({
  useIntelligenceBrief: jest.fn(),
}));
jest.mock('@/components/brief/BriefClipSummary', () => ({ BriefClipSummary: () => <div /> }));
jest.mock('@/components/brief/BriefClueCards', () => ({ BriefClueCards: () => <div /> }));
jest.mock('@/components/brief/BriefHeader', () => ({ BriefHeader: () => <div /> }));
jest.mock('@/components/brief/BriefMetadataFooter', () => ({ BriefMetadataFooter: () => <div /> }));
jest.mock('@/components/brief/BriefStructuredInfo', () => ({ BriefStructuredInfo: () => <div /> }));
jest.mock('@/components/brief/BriefUserHighlights', () => ({ BriefUserHighlights: () => <div /> }));
jest.mock('@/components/APIKeyManager', () => ({
  __esModule: true,
  default: () => <div>BigModel API Key</div>,
}));
jest.mock('@/components/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));
jest.mock('@/components/Toast', () => ({
  __esModule: true,
  default: () => <div />,
  useToast: () => ({ toasts: [], showToast: jest.fn(), dismissToast: jest.fn() }),
}));

const mockUseIntelligenceBrief = require('@/hooks/useIntelligenceBrief').useIntelligenceBrief as jest.Mock;

describe('IntelligenceBriefViewer', () => {
  let createElementSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let createdAnchor: HTMLAnchorElement;

  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();

    const originalCreateElement = document.createElement.bind(document);
    createdAnchor = originalCreateElement('a');
    createdAnchor.click = jest.fn();

    createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return createdAnchor;
      }

      return originalCreateElement(tagName);
    });
    appendChildSpy = jest.spyOn(document.body, 'appendChild');
    removeChildSpy = jest.spyOn(document.body, 'removeChild');
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('downloads markdown using an anchor element', async () => {
    mockUseIntelligenceBrief.mockReturnValue({
      status: 'success',
      brief: completeBrief,
      error: null,
      progress: 100,
      exportAsMarkdown: jest.fn(() => '# Test Markdown'),
      exportAsBibTeX: jest.fn(() => '@article{test}'),
      deleteBrief: jest.fn(),
      generateBrief: jest.fn(),
      regenerateBrief: jest.fn(),
    });

    render(<IntelligenceBriefViewer paperId={142} mode="direct-brief" />);

    await userEvent.click(screen.getByRole('button', { name: '导出为 Markdown' }));

    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalledWith(createdAnchor);
      expect(createdAnchor.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(createdAnchor);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
  });

  it('shows a direct API key action in the empty state', async () => {
    mockUseIntelligenceBrief.mockReturnValue({
      status: 'idle',
      brief: null,
      error: null,
      progress: 0,
      exportAsMarkdown: jest.fn(() => null),
      exportAsBibTeX: jest.fn(() => null),
      deleteBrief: jest.fn(),
      generateBrief: jest.fn(),
      regenerateBrief: jest.fn(),
    });

    render(<IntelligenceBriefViewer paperId={142} mode="direct-brief" />);

    await userEvent.click(screen.getByRole('button', { name: '配置 API Key' }));

    expect(screen.getByText('BigModel API Key')).toBeInTheDocument();
  });

  it('shows a direct API key action when brief generation fails', async () => {
    mockUseIntelligenceBrief.mockReturnValue({
      status: 'error',
      brief: null,
      error: 'PDF text extraction failed',
      progress: 0,
      exportAsMarkdown: jest.fn(() => null),
      exportAsBibTeX: jest.fn(() => null),
      deleteBrief: jest.fn(),
      generateBrief: jest.fn(),
      regenerateBrief: jest.fn(),
    });

    render(<IntelligenceBriefViewer paperId={142} mode="direct-brief" />);

    await userEvent.click(screen.getByRole('button', { name: '配置 API Key' }));

    expect(screen.getByText('BigModel API Key')).toBeInTheDocument();
  });

  it('keeps the final case report locked until all core tasks are complete', () => {
    mockUseIntelligenceBrief.mockReturnValue({
      status: 'success',
      brief: null,
      error: null,
      progress: 100,
      isReportLocked: true,
      exportAsMarkdown: jest.fn(() => null),
      exportAsBibTeX: jest.fn(() => null),
      deleteBrief: jest.fn(),
      generateBrief: jest.fn(),
      regenerateBrief: jest.fn(),
    });

    render(<IntelligenceBriefViewer paperId={142} mode="final-report" />);

    expect(screen.getByRole('heading', { name: 'Final Case Report Locked' })).toBeInTheDocument();
  });
});
