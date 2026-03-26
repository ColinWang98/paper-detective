import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockStoreState: any = {
  currentPaper: { id: 1, title: 'Test Paper' },
  addHighlight: jest.fn().mockResolvedValue(1),
  highlights: [],
  evidenceSubmissions: [],
  selectedPriority: 'important',
  setSelectedPriority: jest.fn(),
  addPaper: jest.fn().mockResolvedValue(1),
  papers: [{ id: 1, title: 'Test Paper' }],
  setCurrentPaper: jest.fn(),
  loadHighlights: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/store', () => ({
  usePaperStore: Object.assign(
    jest.fn(() => mockStoreState),
    {
      getState: jest.fn(() => mockStoreState),
    }
  ),
}));

jest.mock('@/lib/db', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-pdf', () => ({
  pdfjs: {
    version: 'test',
    GlobalWorkerOptions: {},
  },
  Document: ({
    children,
    onLoadSuccess,
  }: {
    children: React.ReactNode;
    onLoadSuccess?: ({ numPages }: { numPages: number }) => void;
  }) => {
    React.useEffect(() => {
      onLoadSuccess?.({ numPages: 5 });
    }, [onLoadSuccess]);

    return <div>{children}</div>;
  },
  Page: ({ width }: { width: number }) => <div data-testid="pdf-page-width">{width}</div>,
}));

import RealPDFViewer from '@/components/RealPDFViewer';

describe('RealPDFViewer', () => {
  beforeEach(() => {
    Object.assign(mockStoreState, {
      currentPaper: { id: 1, title: 'Test Paper' },
      addHighlight: jest.fn().mockResolvedValue(1),
      highlights: [],
      evidenceSubmissions: [],
      selectedPriority: 'important',
      setSelectedPriority: jest.fn(),
      addPaper: jest.fn().mockResolvedValue(1),
      papers: [{ id: 1, title: 'Test Paper' }],
      setCurrentPaper: jest.fn(),
      loadHighlights: jest.fn().mockResolvedValue(undefined),
    });

    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.URL.revokeObjectURL = jest.fn();

    class ResizeObserverMock {
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    (global as any).ResizeObserver = ResizeObserverMock;
  });

  it('updates page width when zooming in and out', async () => {
    const { container } = render(<RealPDFViewer />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pdf'], 'paper.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('320')).toBeInTheDocument();
    });

    const initialWidth = Number(screen.getByText('320').textContent);

    fireEvent.click(screen.getByRole('button', { name: '放大' }));

    await waitFor(() => {
      expect(Number(screen.getByText('352').textContent)).toBeGreaterThan(initialWidth);
    });

    fireEvent.click(screen.getByRole('button', { name: '缩小' }));

    await waitFor(() => {
      expect(Number(screen.getByText('320').textContent)).toBe(initialWidth);
    });
  });

  it('shows the selected priority and updates it from the toolbar', async () => {
    const { container, rerender } = render(<RealPDFViewer />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pdf'], 'paper.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/当前优先级/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /选择优先级: 关键 - 必须记住/i }));
    expect(mockStoreState.setSelectedPriority).toHaveBeenCalledWith('critical');

    mockStoreState.selectedPriority = 'critical';
    rerender(<RealPDFViewer />);

    expect(screen.getByText(/当前优先级：关键/i)).toBeInTheDocument();
  });
  it('renders a guided reading focus overlay and updates it on pointer move', async () => {
    const { container } = render(<RealPDFViewer />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pdf'], 'paper.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('reading-focus-overlay')).toBeInTheDocument();
    });

    const overlay = screen.getByTestId('reading-focus-overlay');
    const hotspot = screen.getByTestId('pdf-page-hotspot');
    Object.defineProperty(hotspot, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 320,
        height: 480,
        right: 320,
        bottom: 480,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    fireEvent.mouseMove(hotspot, {
      clientX: 120,
      clientY: 80,
    });

    await waitFor(() => {
      expect(overlay.getAttribute('style') ?? '').toContain('radial-gradient');
    });

    fireEvent.mouseLeave(hotspot);

    expect(overlay).toBeInTheDocument();
  });
});
