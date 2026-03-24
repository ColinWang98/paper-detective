import { act, renderHook } from '@testing-library/react';

import { dbHelpers } from '@/lib/db';
import { usePaperStore } from '@/lib/store';
import type { Group, Highlight, Paper } from '@/types';

jest.mock('@/lib/db', () => ({
  dbHelpers: {
    addHighlight: jest.fn(),
    getHighlights: jest.fn(),
    updateHighlight: jest.fn(),
    deleteHighlight: jest.fn(),
    getGroupsWithHighlights: jest.fn(),
  },
}));

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockPaper: Paper = {
  id: 1,
  title: 'Test Paper',
  authors: [],
  year: 2026,
  uploadDate: '2026-02-10T10:00:00Z',
  pdfHash: 'hash123',
  fileSize: 1024,
  fileURL: 'blob:test',
  fileName: 'test.pdf',
};

const createHighlightInput = (overrides: Partial<Omit<Highlight, 'id'>> = {}): Omit<Highlight, 'id'> => ({
  paperId: 1,
  pageNumber: 1,
  text: 'Test highlight',
  priority: 'important',
  color: 'yellow',
  position: { x: 100, y: 100, width: 200, height: 20 },
  timestamp: '2026-02-10T10:00:00Z',
  createdAt: '2026-02-10T10:00:00Z',
  ...overrides,
});

const createStoredHighlight = (overrides: Partial<Highlight> = {}): Highlight => ({
  id: 1,
  ...createHighlightInput(),
  ...overrides,
});

const createInboxGroup = (): Group => ({
  id: 10,
  paperId: 1,
  name: 'Inbox',
  type: 'inbox',
  position: 0,
  isSystem: true,
  createdAt: '2026-02-10T10:00:00Z',
  items: [],
});

describe('usePaperStore optimistic highlight updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    act(() => {
      usePaperStore.setState({
        currentPaper: mockPaper,
        papers: [mockPaper],
        highlights: [],
        groups: [createInboxGroup()],
        history: [],
        redoStack: [],
        canUndo: false,
        canRedo: false,
        error: null,
        isLoading: false,
      });
    });

    mockDbHelpers.getHighlights.mockResolvedValue([]);
    mockDbHelpers.getGroupsWithHighlights.mockResolvedValue([]);
    mockDbHelpers.addHighlight.mockResolvedValue(1);
    mockDbHelpers.updateHighlight.mockResolvedValue(1);
    mockDbHelpers.deleteHighlight.mockResolvedValue(undefined);
  });

  it('adds a temporary highlight immediately and replaces it with the saved id', async () => {
    const deferred = createDeferred<number>();
    mockDbHelpers.addHighlight.mockReturnValue(deferred.promise);
    mockDbHelpers.getHighlights.mockResolvedValue([createStoredHighlight({ id: 42, text: 'Saved highlight' })]);

    const { result } = renderHook(() => usePaperStore());
    const input = createHighlightInput({ text: 'Saved highlight' });

    let pendingPromise!: Promise<number>;
    await act(async () => {
      pendingPromise = result.current.addHighlight(input);
      await Promise.resolve();
    });

    expect(result.current.highlights).toHaveLength(1);
    const tempHighlight = result.current.highlights[0];
    expect(tempHighlight.id).toBeGreaterThan(0);
    expect(tempHighlight.text).toBe('Saved highlight');

    await act(async () => {
      deferred.resolve(42);
      await pendingPromise;
    });

    expect(result.current.highlights).toHaveLength(1);
    expect(result.current.highlights[0].id).toBe(42);
    expect(result.current.groups[0].items).toHaveLength(1);
    expect(result.current.groups[0].items?.[0]?.id).toBe(42);
    expect(mockDbHelpers.addHighlight).toHaveBeenCalledWith(input);
    expect(mockDbHelpers.getHighlights).toHaveBeenCalledWith(1);
  });

  it('rolls back addHighlight and stores the error on persistence failure', async () => {
    const deferred = createDeferred<number>();
    mockDbHelpers.addHighlight.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => usePaperStore());
    const input = createHighlightInput({ text: 'Will fail' });

    let pendingPromise!: Promise<number>;
    await act(async () => {
      pendingPromise = result.current.addHighlight(input);
      await Promise.resolve();
    });

    expect(result.current.highlights).toHaveLength(1);

    await act(async () => {
      deferred.reject(new Error('Network timeout'));
      await expect(pendingPromise).rejects.toThrow('Network timeout');
    });

    expect(result.current.highlights).toHaveLength(0);
    expect(result.current.error).toBe('Network timeout');
  });

  it('updates a highlight optimistically and restores it on failure', async () => {
    act(() => {
      usePaperStore.setState({
        highlights: [createStoredHighlight({ id: 1, text: 'Original', priority: 'important' })],
      });
    });

    const deferred = createDeferred<number>();
    mockDbHelpers.updateHighlight.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => usePaperStore());

    let pendingPromise!: Promise<void>;
    await act(async () => {
      pendingPromise = result.current.updateHighlight(1, { text: 'Updated', priority: 'critical' });
      await Promise.resolve();
    });

    expect(result.current.highlights[0].text).toBe('Updated');
    expect(result.current.highlights[0].priority).toBe('critical');

    await act(async () => {
      deferred.reject(new Error('Update failed'));
      await expect(pendingPromise).rejects.toThrow('Update failed');
    });

    expect(result.current.highlights[0].text).toBe('Original');
    expect(result.current.highlights[0].priority).toBe('important');
    expect(result.current.error).toBe('Update failed');
  });

  it('removes a highlight optimistically and restores both highlights and groups on failure', async () => {
    const keep = createStoredHighlight({ id: 1, text: 'Keep' });
    const removed = createStoredHighlight({ id: 2, text: 'Remove me' });
    const groupWithItems = {
      ...createInboxGroup(),
      items: [keep, removed],
    };

    act(() => {
      usePaperStore.setState({
        highlights: [keep, removed],
        groups: [groupWithItems],
      });
    });

    const deferred = createDeferred<void>();
    mockDbHelpers.deleteHighlight.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => usePaperStore());

    let pendingPromise!: Promise<void>;
    await act(async () => {
      pendingPromise = result.current.deleteHighlight(2);
      await Promise.resolve();
    });

    expect(result.current.highlights.map((item) => item.id)).toEqual([1]);

    await act(async () => {
      deferred.reject(new Error('Delete failed'));
      await expect(pendingPromise).rejects.toThrow('Delete failed');
    });

    expect(result.current.highlights.map((item) => item.id).sort()).toEqual([1, 2]);
    expect(result.current.groups[0].items?.map((item) => item.id)).toEqual([1, 2]);
    expect(result.current.error).toBe('Delete failed');
  });

  it('does not mutate the original highlight object during optimistic update', async () => {
    const original = createStoredHighlight({ id: 1, text: 'Original' });
    act(() => {
      usePaperStore.setState({
        highlights: [original],
      });
    });

    const { result } = renderHook(() => usePaperStore());

    await act(async () => {
      await result.current.updateHighlight(1, { text: 'Changed' });
    });

    expect(original.text).toBe('Original');
    expect(result.current.highlights[0].text).toBe('Changed');
  });
});
