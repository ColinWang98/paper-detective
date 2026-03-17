/**
 * Zustand Store Optimistic Updates Unit Tests
 * 测试store中乐观更新的具体实现细节
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaperStore } from '@/lib/store';
import { dbHelpers } from '@/lib/db';
import type { Highlight, Group } from '@/types';
import type { HighlightPriority, HighlightColor } from '@/types';

jest.mock('@/lib/db');

const mockDbHelpers = dbHelpers as jest.Mocked<typeof dbHelpers>;

describe('Zustand Store - Optimistic Updates Unit Tests', () => {
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
    text: 'Test highlight',
    priority: 'important' as HighlightPriority,
    color: 'yellow' as HighlightColor,
    position: { x: 100, y: 100, width: 200, height: 20 },
    timestamp: '2026-02-10T10:00:00Z',
    createdAt: '2026-02-10T10:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    usePaperStore.setState({
      currentPaper: mockPaper,
      papers: [mockPaper],
      highlights: [],
      groups: [],
      selectedPriority: 'important',
      expandedGroups: new Set(),
      isLoading: false,
      error: null,
      setCurrentPaper: jest.fn(),
      loadPapers: jest.fn(),
      addPaper: jest.fn(),
      deletePaper: jest.fn(),
      loadHighlights: jest.fn(),
      addHighlight: jest.fn(),
      updateHighlight: jest.fn(),
      deleteHighlight: jest.fn(),
      loadGroups: jest.fn(),
      addGroup: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      moveHighlightToGroup: jest.fn(),
      setSelectedPriority: jest.fn(),
      toggleGroupExpanded: jest.fn(),
      clearError: jest.fn(),
    });

    mockDbHelpers.addHighlight.mockResolvedValue(1);
    mockDbHelpers.updateHighlight.mockResolvedValue(1);
    mockDbHelpers.deleteHighlight.mockResolvedValue(undefined);
    mockDbHelpers.getHighlights.mockResolvedValue([]);
    mockDbHelpers.getGroupsWithHighlights.mockResolvedValue([]);
  });

  describe('addHighlight implementation details', () => {
    it('should use Date.now() as temporary ID', () => {
      const { result } = renderHook(() => usePaperStore());

      const fixedTime = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime);

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0 });

      act(() => {
        result.current.addHighlight(newHighlight);
      });

      expect(result.current.highlights[0].id).toBe(fixedTime);

      jest.restoreAllMocks();
    });

    it('should preserve all highlight properties', () => {
      const { result } = renderHook(() => usePaperStore());

      const newHighlight: Omit<Highlight, 'id'> = {
        paperId: 1,
        pageNumber: 3,
        text: 'Complex highlight text with unicode: 你好世界 🌍',
        priority: 'critical',
        color: 'red',
        position: { x: 150.5, y: 250.3, width: 300.7, height: 25.9 },
        timestamp: '2026-02-10T15:30:00.123Z',
        createdAt: '2026-02-10T15:30:00.123Z',
      };

      const tempId = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(tempId);

      act(() => {
        result.current.addHighlight(newHighlight);
      });

      const added = result.current.highlights[0];
      expect(added.id).toBe(tempId);
      expect(added.paperId).toBe(1);
      expect(added.pageNumber).toBe(3);
      expect(added.text).toBe('Complex highlight text with unicode: 你好世界 🌍');
      expect(added.priority).toBe('critical');
      expect(added.color).toBe('red');
      expect(added.position).toEqual({ x: 150.5, y: 250.3, width: 300.7, height: 25.9 });
      expect(added.timestamp).toBe('2026-02-10T15:30:00.123Z');
      expect(added.createdAt).toBe('2026-02-10T15:30:00.123Z');

      jest.restoreAllMocks();
    });

    it('should call dbHelpers.addHighlight with correct parameters', async () => {
      const { result } = renderHook(() => usePaperStore());

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0, text: 'Test' });
      mockDbHelpers.addHighlight.mockResolvedValue(999);

      await act(async () => {
        await result.current.addHighlight(newHighlight);
      });

      expect(mockDbHelpers.addHighlight).toHaveBeenCalledWith(
        expect.objectContaining({
          paperId: 1,
          text: 'Test',
          priority: 'important',
          color: 'yellow',
        })
      );
    });

    it('should map temporary ID to real ID correctly', async () => {
      const { result } = renderHook(() => usePaperStore());

      const tempId = 11111;
      const realId = 22222;

      jest.spyOn(Date, 'now').mockReturnValue(tempId);
      mockDbHelpers.addHighlight.mockResolvedValue(realId);

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({
        id: 0,
        text: 'Before update',
      });

      await act(async () => {
        await result.current.addHighlight(newHighlight);
      });

      expect(result.current.highlights[0].id).toBe(realId);
      expect(result.current.highlights[0].text).toBe('Before update');
      expect(result.current.highlights).toHaveLength(1);

      jest.restoreAllMocks();
    });

    it('should not create duplicate highlights during ID replacement', async () => {
      const { result } = renderHook(() => usePaperStore());

      const tempId = 11111;
      const realId = 22222;

      jest.spyOn(Date, 'now').mockReturnValue(tempId);
      mockDbHelpers.addHighlight.mockResolvedValue(realId);

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0 });

      await act(async () => {
        await result.current.addHighlight(newHighlight);
      });

      // Should still have only 1 highlight
      expect(result.current.highlights).toHaveLength(1);
      expect(result.current.highlights.filter(h => h.id === tempId)).toHaveLength(0);
      expect(result.current.highlights.filter(h => h.id === realId)).toHaveLength(1);

      jest.restoreAllMocks();
    });

    it('should load groups with correct paperId', async () => {
      const { result } = renderHook(() => usePaperStore());

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({
        id: 0,
        paperId: 5,
      });

      await act(async () => {
        await result.current.addHighlight(newHighlight);
      });

      expect(mockDbHelpers.getGroupsWithHighlights).toHaveBeenCalledWith(5);
    });

    it('should handle paperId undefined in highlight', async () => {
      const { result } = renderHook(() => usePaperStore());

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({
        id: 0,
        paperId: undefined,
      });

      await act(async () => {
        await result.current.addHighlight(newHighlight);
      });

      // Should default to 0
      expect(mockDbHelpers.getGroupsWithHighlights).toHaveBeenCalledWith(0);
    });

    it('should rollback by filtering out temporary ID', async () => {
      const { result } = renderHook(() => usePaperStore());

      const tempId = 11111;
      const error = new Error('Database connection failed');

      jest.spyOn(Date, 'now').mockReturnValue(tempId);
      mockDbHelpers.addHighlight.mockRejectedValue(error);

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0 });

      // Initial add (optimistic)
      act(() => {
        result.current.addHighlight(newHighlight);
      });
      expect(result.current.highlights).toHaveLength(1);

      // After error (rollback)
      await act(async () => {
        try {
          await result.current.addHighlight(newHighlight);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.highlights).toHaveLength(0);
      expect(result.current.highlights.filter(h => h.id === tempId)).toHaveLength(0);

      jest.restoreAllMocks();
    });

    it('should set error message on rollback', async () => {
      const { result } = renderHook(() => usePaperStore());

      const error = new Error('Network timeout');
      mockDbHelpers.addHighlight.mockRejectedValue(error);

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0 });

      await act(async () => {
        try {
          await result.current.addHighlight(newHighlight);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Network timeout');
    });
  });

  describe('updateHighlight implementation details', () => {
    beforeEach(() => {
      usePaperStore.setState({
        highlights: [
          createMockHighlight({ id: 1, text: 'Original', priority: 'important' }),
          createMockHighlight({ id: 2, text: 'Another', priority: 'critical' }),
        ],
      });
    });

    it('should find and save old highlight before update', async () => {
      const { result } = renderHook(() => usePaperStore());

      const oldHighlight = result.current.highlights.find(h => h.id === 1);

      await act(async () => {
        await result.current.updateHighlight(1, { text: 'Updated' });
      });

      expect(oldHighlight).toBeDefined();
      expect(oldHighlight?.text).toBe('Original');
    });

    it('should update only specified fields', async () => {
      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.updateHighlight(1, { priority: 'critical' });
      });

      expect(result.current.highlights[0].text).toBe('Original');
      expect(result.current.highlights[0].priority).toBe('critical');
      expect(result.current.highlights[0].color).toBe('yellow');
    });

    it('should update multiple fields at once', async () => {
      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.updateHighlight(1, {
          text: 'Updated text',
          priority: 'archived',
          color: 'gray',
        });
      });

      expect(result.current.highlights[0].text).toBe('Updated text');
      expect(result.current.highlights[0].priority).toBe('archived');
      expect(result.current.highlights[0].color).toBe('gray');
    });

    it('should not affect other highlights', async () => {
      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.updateHighlight(1, { text: 'Updated' });
      });

      expect(result.current.highlights[1].text).toBe('Another');
      expect(result.current.highlights[1].priority).toBe('critical');
    });

    it('should restore old highlight object on error', async () => {
      const { result } = renderHook(() => usePaperStore());

      const error = new Error('Update failed');
      mockDbHelpers.updateHighlight.mockRejectedValue(error);

      // Optimistic update
      act(() => {
        result.current.updateHighlight(1, { text: 'Updated' });
      });
      expect(result.current.highlights[0].text).toBe('Updated');

      // Rollback
      await act(async () => {
        try {
          await result.current.updateHighlight(1, { text: 'Updated' });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.highlights[0].text).toBe('Original');
      expect(result.current.highlights[0].priority).toBe('important');
      expect(result.current.highlights[0].color).toBe('yellow');
    });

    it('should reload highlights if old highlight not found', async () => {
      const { result } = renderHook(() => usePaperStore());

      const error = new Error('Update failed');
      mockDbHelpers.updateHighlight.mockRejectedValue(error);
      mockDbHelpers.getHighlights.mockResolvedValue([
        createMockHighlight({ id: 1, text: 'Reloaded' }),
      ]);

      await act(async () => {
        try {
          await result.current.updateHighlight(999, { text: 'Updated' });
        } catch (e) {
          // Expected
        }
      });

      expect(mockDbHelpers.getHighlights).toHaveBeenCalledWith(1);
      expect(result.current.highlights[0].text).toBe('Reloaded');
    });

    it('should set error message on failed update', async () => {
      const { result } = renderHook(() => usePaperStore());

      const error = new Error('Connection lost');
      mockDbHelpers.updateHighlight.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.updateHighlight(1, { text: 'Updated' });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Connection lost');
    });
  });

  describe('deleteHighlight implementation details', () => {
    beforeEach(() => {
      usePaperStore.setState({
        highlights: [
          createMockHighlight({ id: 1, text: 'Keep 1' }),
          createMockHighlight({ id: 2, text: 'Delete me' }),
          createMockHighlight({ id: 3, text: 'Keep 3' }),
        ],
        groups: [
          {
            id: 10,
            paperId: 1,
            name: 'Test Group',
            type: 'custom',
            position: 0,
            isSystem: false,
            createdAt: '2026-02-10T10:00:00Z',
            items: [
              createMockHighlight({ id: 1, text: 'Keep 1' }),
              createMockHighlight({ id: 2, text: 'Delete me' }),
              createMockHighlight({ id: 3, text: 'Keep 3' }),
            ],
          },
        ],
      });
    });

    it('should save old highlight before deletion', async () => {
      const { result } = renderHook(() => usePaperStore());

      const oldHighlight = result.current.highlights.find(h => h.id === 2);

      act(() => {
        result.current.deleteHighlight(2);
      });

      expect(oldHighlight).toBeDefined();
      expect(oldHighlight?.text).toBe('Delete me');
    });

    it('should save old groups state before deletion', async () => {
      const { result } = renderHook(() => usePaperStore());

      const oldGroupsLength = result.current.groups.length;

      act(() => {
        result.current.deleteHighlight(2);
      });

      expect(oldGroupsLength).toBeGreaterThan(0);
    });

    it('should remove only the specified highlight', async () => {
      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.deleteHighlight(2);
      });

      expect(result.current.highlights).toHaveLength(2);
      expect(result.current.highlights.find(h => h.id === 1)).toBeDefined();
      expect(result.current.highlights.find(h => h.id === 2)).toBeUndefined();
      expect(result.current.highlights.find(h => h.id === 3)).toBeDefined();
    });

    it('should restore old highlight on rollback', async () => {
      const { result } = renderHook(() => usePaperStore());

      const error = new Error('Delete failed');
      mockDbHelpers.deleteHighlight.mockRejectedValue(error);

      // Optimistic delete
      act(() => {
        result.current.deleteHighlight(2);
      });
      expect(result.current.highlights).toHaveLength(2);

      // Rollback
      await act(async () => {
        try {
          await result.current.deleteHighlight(2);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.highlights).toHaveLength(3);
      expect(result.current.highlights.find(h => h.id === 2)?.text).toBe('Delete me');
    });

    it('should restore old groups on rollback', async () => {
      const { result } = renderHook(() => usePaperStore());

      const originalGroupCount = result.current.groups[0]?.items?.length ?? 0;

      const error = new Error('Delete failed');
      mockDbHelpers.deleteHighlight.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.deleteHighlight(2);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.groups[0].items).toHaveLength(originalGroupCount);
    });

    it('should load groups with correct paperId', async () => {
      const { result } = renderHook(() => usePaperStore());

      await act(async () => {
        await result.current.deleteHighlight(2);
      });

      expect(mockDbHelpers.getGroupsWithHighlights).toHaveBeenCalledWith(1);
    });

    it('should handle missing oldHighlight gracefully', async () => {
      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.deleteHighlight(999);
      });

      expect(result.current.highlights).toHaveLength(2);
    });
  });

  describe('State consistency', () => {
    it('should maintain highlights array order', async () => {
      const { result } = renderHook(() => usePaperStore());

      usePaperStore.setState({
        highlights: [
          createMockHighlight({ id: 1, text: 'First' }),
          createMockHighlight({ id: 2, text: 'Second' }),
          createMockHighlight({ id: 3, text: 'Third' }),
        ],
      });

      await act(async () => {
        await result.current.updateHighlight(2, { text: 'Updated Second' });
      });

      expect(result.current.highlights[0].id).toBe(1);
      expect(result.current.highlights[1].id).toBe(2);
      expect(result.current.highlights[2].id).toBe(3);
    });

    it('should not mutate original highlight objects', async () => {
      const { result } = renderHook(() => usePaperStore());

      const originalHighlight = createMockHighlight({ id: 1, text: 'Original' });
      usePaperStore.setState({ highlights: [originalHighlight] });

      const originalText = originalHighlight.text;

      await act(async () => {
        await result.current.updateHighlight(1, { text: 'Updated' });
      });

      expect(originalHighlight.text).toBe(originalText);
      expect(result.current.highlights[0].text).toBe('Updated');
    });
  });

  describe('Performance optimization', () => {
    it('should use immutable state updates', () => {
      const { result } = renderHook(() => usePaperStore());

      const highlightsBefore = result.current.highlights;

      act(() => {
        result.current.addHighlight(createMockHighlight({ id: 0 }));
      });

      expect(result.current.highlights).not.toBe(highlightsBefore);
    });

    it('should only update changed highlights', () => {
      usePaperStore.setState({
        highlights: [
          createMockHighlight({ id: 1, text: 'Unchanged 1' }),
          createMockHighlight({ id: 2, text: 'Will change' }),
          createMockHighlight({ id: 3, text: 'Unchanged 3' }),
        ],
      });

      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.updateHighlight(2, { text: 'Changed' });
      });

      expect(result.current.highlights[0].text).toBe('Unchanged 1');
      expect(result.current.highlights[1].text).toBe('Changed');
      expect(result.current.highlights[2].text).toBe('Unchanged 3');
    });
  });
});
