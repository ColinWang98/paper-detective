import { renderHook, act, waitFor } from '@testing-library/react';

import { usePaperStore } from '@/lib/store';
import { dbHelpers } from '@/lib/db';
import type { Highlight, Group } from '@/types';
import type { HighlightPriority, HighlightColor } from '@/types';

jest.mock('@/lib/db');

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;

describe('Optimistic UI Updates Integration Tests', () => {
  const mockPaper = {
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

  const createMockHighlight = (overrides?: Partial<Highlight>): Highlight => ({
    id: Date.now(),
    paperId: 1,
    pageNumber: 1,
    text: 'Test highlight text',
    priority: 'important' as HighlightPriority,
    color: 'yellow' as HighlightColor,
    position: { x: 100, y: 100, width: 200, height: 20 },
    timestamp: '2026-02-10T10:00:00Z',
    createdAt: '2026-02-10T10:00:00Z',
    ...overrides,
  });

  const createMockGroup = (overrides?: Partial<Group>): Group => ({
    id: Date.now(),
    paperId: 1,
    name: 'Test Group',
    type: 'custom',
    position: 0,
    isSystem: false,
    createdAt: '2026-02-10T10:00:00Z',
    items: [],
    ...overrides,
  });

  const newHighlight: Omit<Highlight, 'id'> = {
    paperId: 1,
    pageNumber: 1,
    text: 'New highlight',
    priority: 'critical',
    color: 'red',
    position: { x: 100, y: 100, width: 200, height: 20 },
    timestamp: '2026-02-10T10:00:00Z',
    createdAt: '2026-02-10T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    act(() => {
      usePaperStore.setState({
        currentPaper: mockPaper,
        papers: [mockPaper],
        highlights: [],
        groups: [],
        selectedPriority: 'important',
        expandedGroups: new Set(),
        isLoading: false,
        error: null,
      });
    });

    mockDbHelpers.addHighlight.mockResolvedValue(1);
    mockDbHelpers.updateHighlight.mockResolvedValue(1);
    mockDbHelpers.deleteHighlight.mockResolvedValue(undefined);
    mockDbHelpers.getHighlights.mockResolvedValue([]);
    mockDbHelpers.getGroupsWithHighlights.mockResolvedValue([]);
  });

  it('optimistically adds a highlight and swaps the temporary id for the saved id', async () => {
    const { result } = renderHook(() => usePaperStore());
    const tempId = 999;

    jest.spyOn(Date, 'now').mockReturnValue(tempId);
    mockDbHelpers.addHighlight.mockResolvedValue(12345);
    mockDbHelpers.getHighlights.mockResolvedValue([
      createMockHighlight({ id: 12345, text: 'New highlight' }),
    ]);

    await act(async () => {
      await result.current.addHighlight(newHighlight);
    });

    expect(mockDbHelpers.addHighlight).toHaveBeenCalledWith(expect.objectContaining({
      text: 'New highlight',
    }));
    expect(result.current.highlights).toHaveLength(1);
    expect(result.current.highlights[0].id).toBe(12345);
    expect(result.current.highlights[0].text).toBe('New highlight');

    jest.restoreAllMocks();
  });

  it('rolls back a failed optimistic add and stores the error', async () => {
    const { result } = renderHook(() => usePaperStore());
    const tempId = 999;

    jest.spyOn(Date, 'now').mockReturnValue(tempId);
    mockDbHelpers.addHighlight.mockRejectedValue(new Error('Database error'));

    await expect(
      act(async () => {
        await result.current.addHighlight(newHighlight);
      })
    ).rejects.toThrow('Database error');

    await waitFor(() => {
      expect(result.current.highlights).toHaveLength(0);
      expect(result.current.error).toBe('Database error');
    });

    jest.restoreAllMocks();
  });

  it('optimistically updates a highlight and persists the change', async () => {
    act(() => {
      usePaperStore.setState({
        highlights: [createMockHighlight({ id: 1, text: 'Original text' })],
      });
    });
    const { result } = renderHook(() => usePaperStore());

    await act(async () => {
      await result.current.updateHighlight(1, { text: 'Updated text' });
    });

    expect(result.current.highlights[0].text).toBe('Updated text');
    expect(mockDbHelpers.updateHighlight).toHaveBeenCalledWith(1, { text: 'Updated text' });
  });

  it('rolls back a failed optimistic update to the previous highlight state', async () => {
    act(() => {
      usePaperStore.setState({
        highlights: [createMockHighlight({ id: 1, text: 'Original text' })],
      });
    });
    const { result } = renderHook(() => usePaperStore());

    mockDbHelpers.updateHighlight.mockRejectedValue(new Error('Update failed'));

    await expect(
      act(async () => {
        await result.current.updateHighlight(1, { text: 'Updated text' });
      })
    ).rejects.toThrow('Update failed');

    await waitFor(() => {
      expect(result.current.highlights[0].text).toBe('Original text');
      expect(result.current.error).toBe('Update failed');
    });
  });

  it('optimistically removes a highlight from state and all groups', async () => {
    const highlights = [
      createMockHighlight({ id: 1, text: 'Highlight 1' }),
      createMockHighlight({ id: 2, text: 'Highlight 2' }),
      createMockHighlight({ id: 3, text: 'Highlight 3' }),
    ];
    act(() => {
      usePaperStore.setState({
        highlights,
        groups: [createMockGroup({ id: 1, name: 'Group 1', items: highlights })],
      });
    });
    const { result } = renderHook(() => usePaperStore());

    await act(async () => {
      await result.current.deleteHighlight(2);
    });

    expect(result.current.highlights).toHaveLength(2);
    expect(result.current.highlights.find(h => h.id === 2)).toBeUndefined();
    expect(result.current.groups[0].items?.find(item => item.id === 2)).toBeUndefined();
    expect(mockDbHelpers.deleteHighlight).toHaveBeenCalledWith(2);
  });

  it('restores highlights and groups after a failed delete', async () => {
    const highlights = [
      createMockHighlight({ id: 1, text: 'Highlight 1' }),
      createMockHighlight({ id: 2, text: 'Highlight 2' }),
    ];
    const groups = [createMockGroup({ id: 1, name: 'Group 1', items: highlights })];
    act(() => {
      usePaperStore.setState({ highlights, groups });
    });
    const { result } = renderHook(() => usePaperStore());

    mockDbHelpers.deleteHighlight.mockRejectedValue(new Error('Delete failed'));

    await expect(
      act(async () => {
        await result.current.deleteHighlight(2);
      })
    ).rejects.toThrow('Delete failed');

    await waitFor(() => {
      expect(result.current.highlights).toHaveLength(2);
      expect(result.current.groups[0].items).toHaveLength(2);
      expect(result.current.error).toBe('Delete failed');
    });
  });

  it('clears a previous error on the next successful operation', async () => {
    const { result } = renderHook(() => usePaperStore());
    act(() => {
      usePaperStore.setState({ error: 'Old error' });
    });

    await act(async () => {
      await result.current.addHighlight(newHighlight);
    });

    expect(result.current.error).toBeNull();
  });

  it('surfaces timeout failures from addHighlight and rolls back the UI', async () => {
    const { result } = renderHook(() => usePaperStore());

    mockDbHelpers.addHighlight.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10);
        })
    );

    await expect(
      act(async () => {
        await result.current.addHighlight(newHighlight);
      })
    ).rejects.toThrow('Timeout');

    await waitFor(() => {
      expect(result.current.highlights).toHaveLength(0);
      expect(result.current.error).toBe('Timeout');
    });
  });

  it('keeps optimistic add/update/delete UI work within expected performance bounds', async () => {
    const { result } = renderHook(() => usePaperStore());

    act(() => {
      usePaperStore.setState({
        highlights: Array.from({ length: 100 }, (_, index) =>
          createMockHighlight({ id: index + 1, text: `Highlight ${index + 1}` })
        ),
      });
    });

    let start = performance.now();
    await act(async () => {
      await result.current.addHighlight(newHighlight);
    });
    expect(performance.now() - start).toBeLessThan(50);

    start = performance.now();
    await act(async () => {
      await result.current.updateHighlight(1, { text: 'Updated' });
    });
    expect(performance.now() - start).toBeLessThan(30);

    start = performance.now();
    await act(async () => {
      await result.current.deleteHighlight(1);
    });
    expect(performance.now() - start).toBeLessThan(30);
  });
});
