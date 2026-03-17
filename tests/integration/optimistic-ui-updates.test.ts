/**
 * Optimistic UI Updates Integration Tests
 * 测试乐观更新UI的完整流程和错误恢复
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaperStore } from '@/lib/store';
import { dbHelpers } from '@/lib/db';
import type { Highlight, Group } from '@/types';
import type { HighlightPriority, HighlightColor } from '@/types';

// Mock database helpers
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default store state
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

    // Mock successful database operations by default
    mockDbHelpers.addHighlight.mockResolvedValue(1);
    mockDbHelpers.updateHighlight.mockResolvedValue(1);
    mockDbHelpers.deleteHighlight.mockResolvedValue(undefined);
    mockDbHelpers.getHighlights.mockResolvedValue([]);
    mockDbHelpers.getGroupsWithHighlights.mockResolvedValue([]);
  });

  describe('addHighlight - Optimistic Update', () => {
    it('should immediately add highlight to UI with temporary ID', async () => {
      const { result } = renderHook(() => usePaperStore());

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

      const tempId = Date.now();

      act(() => {
        // Mock Date.now() to return predictable value
        jest.spyOn(Date, 'now').mockReturnValue(tempId);

        result.current.addHighlight(newHighlight);
      });

      // Should immediately appear in UI
      expect(result.current.highlights).toHaveLength(1);
      expect(result.current.highlights[0].id).toBe(tempId);
      expect(result.current.highlights[0].text).toBe('New highlight');

      jest.restoreAllMocks();
    });

    it('should replace temporary ID with real ID after successful save', async () => {
      const { result } = renderHook(() => usePaperStore());

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

      const tempId = Date.now();
      const realId = 12345;

      jest.spyOn(Date, 'now').mockReturnValue(tempId);
      mockDbHelpers.addHighlight.mockResolvedValue(realId);

      await act(async () => {
        await result.current.addHighlight(newHighlight);
      });

      // Should have real ID now
      expect(result.current.highlights[0].id).toBe(realId);
      expect(result.current.highlights[0].text).toBe('New highlight');

      jest.restoreAllMocks();
    });

    it('should rollback on database error', async () => {
      const { result } = renderHook(() => usePaperStore());

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

      const tempId = Date.now();
      const error = new Error('Database error');

      jest.spyOn(Date, 'now').mockReturnValue(tempId);
      mockDbHelpers.addHighlight.mockRejectedValue(error);

      // Initially added
      act(() => {
        result.current.addHighlight(newHighlight);
      });
      expect(result.current.highlights).toHaveLength(1);

      // Should rollback after error
      await waitFor(async () => {
        try {
          await result.current.addHighlight(newHighlight);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.highlights).toHaveLength(0);
      expect(result.current.error).toBe('Database error');

      jest.restoreAllMocks();
    });

    it('should incrementally update inbox group after successful add', async () => {
      const inboxGroup = createMockGroup({ name: '📥 收集箱', type: 'inbox', isSystem: true, items: [] });

      usePaperStore.setState({ groups: [inboxGroup] });

      const { result } = renderHook(() => usePaperStore());

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

      await act(async () => {
        await result.current.addHighlight(newHighlight);
      });

      // Should incrementally update inbox instead of full reload
      expect(mockDbHelpers.getGroupsWithHighlights).not.toHaveBeenCalled();
      expect(result.current.groups.find(group => group.type === 'inbox')?.items).toHaveLength(1);

      jest.restoreAllMocks();
    });

    it('should complete within 50ms for UI update', async () => {
      const { result } = renderHook(() => usePaperStore());

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

      const startTime = performance.now();

      act(() => {
        result.current.addHighlight(newHighlight);
      });

      const uiUpdateTime = performance.now() - startTime;

      expect(result.current.highlights).toHaveLength(1);
      expect(uiUpdateTime).toBeLessThan(50);

      jest.restoreAllMocks();
    });
  });

  describe('updateHighlight - Optimistic Update', () => {
    beforeEach(() => {
      const highlights = [createMockHighlight({ id: 1, text: 'Original text' })];
      usePaperStore.setState({ highlights });
    });

    it('should immediately update highlight in UI', async () => {
      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.updateHighlight(1, { text: 'Updated text' });
      });

      expect(result.current.highlights[0].text).toBe('Updated text');
      expect(mockDbHelpers.updateHighlight).not.toHaveBeenCalled();
    });

    it('should save to database in background', async () => {
      const { result } = renderHook(() => usePaperStore());

      await act(async () => {
        await result.current.updateHighlight(1, { text: 'Updated text' });
      });

      expect(mockDbHelpers.updateHighlight).toHaveBeenCalledWith(1, { text: 'Updated text' });
    });

    it('should rollback to old state on database error', async () => {
      const { result } = renderHook(() => usePaperStore());

      const error = new Error('Update failed');
      mockDbHelpers.updateHighlight.mockRejectedValue(error);

      // Optimistic update
      act(() => {
        result.current.updateHighlight(1, { text: 'Updated text' });
      });
      expect(result.current.highlights[0].text).toBe('Updated text');

      // Should rollback
      await act(async () => {
        try {
          await result.current.updateHighlight(1, { text: 'Updated text' });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.highlights[0].text).toBe('Original text');
      expect(result.current.error).toBe('Update failed');
    });

    it('should reload highlights if old highlight not found during rollback', async () => {
      const { result } = renderHook(() => usePaperStore());

      const error = new Error('Update failed');
      mockDbHelpers.updateHighlight.mockRejectedValue(error);
      mockDbHelpers.getHighlights.mockResolvedValue([createMockHighlight({ id: 1, text: 'Reloaded text' })]);

      // Update with non-existent ID (simulate edge case)
      await act(async () => {
        try {
          await result.current.updateHighlight(999, { text: 'Updated text' });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockDbHelpers.getHighlights).toHaveBeenCalledWith(1);
    });

    it('should handle multiple field updates', async () => {
      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.updateHighlight(1, {
          text: 'Updated text',
          priority: 'critical',
          color: 'red',
        });
      });

      expect(result.current.highlights[0].text).toBe('Updated text');
      expect(result.current.highlights[0].priority).toBe('critical');
      expect(result.current.highlights[0].color).toBe('red');
    });
  });

  describe('deleteHighlight - Optimistic Update', () => {
    beforeEach(() => {
      const highlights = [
        createMockHighlight({ id: 1, text: 'Highlight 1' }),
        createMockHighlight({ id: 2, text: 'Highlight 2' }),
        createMockHighlight({ id: 3, text: 'Highlight 3' }),
      ];
      const groups = [createMockGroup({ id: 1, name: 'Group 1', items: highlights })];
      usePaperStore.setState({ highlights, groups });
    });

    it('should immediately remove highlight from UI', async () => {
      const { result } = renderHook(() => usePaperStore());

      act(() => {
        result.current.deleteHighlight(2);
      });

      expect(result.current.highlights).toHaveLength(2);
      expect(result.current.highlights.find(h => h.id === 2)).toBeUndefined();
      expect(mockDbHelpers.deleteHighlight).not.toHaveBeenCalled();
    });

    it('should delete from database in background', async () => {
      const { result } = renderHook(() => usePaperStore());

      await act(async () => {
        await result.current.deleteHighlight(2);
      });

      expect(mockDbHelpers.deleteHighlight).toHaveBeenCalledWith(2);
    });

    it('should rollback highlight and groups on database error', async () => {
      const { result } = renderHook(() => usePaperStore());

      const error = new Error('Delete failed');
      mockDbHelpers.deleteHighlight.mockRejectedValue(error);
      mockDbHelpers.getGroupsWithHighlights.mockResolvedValue([
        createMockGroup({ id: 1, name: 'Group 1', items: result.current.highlights }),
      ]);

      // Optimistic delete
      act(() => {
        result.current.deleteHighlight(2);
      });
      expect(result.current.highlights).toHaveLength(2);

      // Should rollback
      await act(async () => {
        try {
          await result.current.deleteHighlight(2);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.highlights).toHaveLength(3);
      expect(result.current.error).toBe('Delete failed');
    });

    it('should incrementally remove highlight from all groups after delete', async () => {
      const { result } = renderHook(() => usePaperStore());

      await act(async () => {
        await result.current.deleteHighlight(2);
      });

      // Should NOT call getGroupsWithHighlights (incremental update)
      expect(mockDbHelpers.getGroupsWithHighlights).not.toHaveBeenCalled();

      // Verify highlight removed from groups in memory
      result.current.groups.forEach(group => {
        expect((group.items ?? []).find(h => h.id === 2)).toBeUndefined();
      });
    });

    it('should handle deleting non-existent highlight gracefully', async () => {
      const { result } = renderHook(() => usePaperStore());

      await act(async () => {
        await result.current.deleteHighlight(999);
      });

      expect(result.current.highlights).toHaveLength(3);
      expect(mockDbHelpers.deleteHighlight).toHaveBeenCalledWith(999);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple rapid adds', async () => {
      const { result } = renderHook(() => usePaperStore());

      mockDbHelpers.addHighlight
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      const highlights: Omit<Highlight, 'id'>[] = [
        createMockHighlight({ id: 0, text: 'Highlight 1' }),
        createMockHighlight({ id: 0, text: 'Highlight 2' }),
        createMockHighlight({ id: 0, text: 'Highlight 3' }),
      ];

      await act(async () => {
        await Promise.all(highlights.map(h => result.current.addHighlight(h)));
      });

      expect(result.current.highlights).toHaveLength(3);
    });

    it('should handle add and update in sequence', async () => {
      const { result } = renderHook(() => usePaperStore());

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0, text: 'New highlight' });

      await act(async () => {
        const id = await result.current.addHighlight(newHighlight);
        await result.current.updateHighlight(id, { text: 'Updated' });
      });

      expect(result.current.highlights[0].text).toBe('Updated');
    });

    it('should handle add and delete in sequence', async () => {
      const { result } = renderHook(() => usePaperStore());

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0, text: 'New highlight' });

      await act(async () => {
        const id = await result.current.addHighlight(newHighlight);
        await result.current.deleteHighlight(id);
      });

      expect(result.current.highlights).toHaveLength(0);
    });
  });

  describe('Error Recovery', () => {
    it('should clear error on next successful operation', async () => {
      const { result } = renderHook(() => usePaperStore());

      // Trigger error
      const error = new Error('First error');
      mockDbHelpers.addHighlight.mockRejectedValueOnce(error);

      await act(async () => {
        try {
          await result.current.addHighlight(createMockHighlight({ id: 0 }));
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Successful operation
      mockDbHelpers.addHighlight.mockResolvedValueOnce(1);

      await act(async () => {
        await result.current.addHighlight(createMockHighlight({ id: 0, text: 'Success' }));
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network timeouts', async () => {
      const { result } = renderHook(() => usePaperStore());

      mockDbHelpers.addHighlight.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0 });

      act(() => {
        result.current.addHighlight(newHighlight);
      });

      expect(result.current.highlights).toHaveLength(1);

      await waitFor(async () => {
        try {
          await result.current.addHighlight(newHighlight);
        } catch (e) {
          // Expected
        }
      }, { timeout: 200 });

      expect(result.current.highlights).toHaveLength(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should add highlight in less than 50ms', () => {
      const { result } = renderHook(() => usePaperStore());

      const newHighlight: Omit<Highlight, 'id'> = createMockHighlight({ id: 0 });

      const startTime = performance.now();

      act(() => {
        result.current.addHighlight(newHighlight);
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(result.current.highlights).toHaveLength(1);
    });

    it('should update highlight in less than 30ms', () => {
      usePaperStore.setState({ highlights: [createMockHighlight({ id: 1 })] });
      const { result } = renderHook(() => usePaperStore());

      const startTime = performance.now();

      act(() => {
        result.current.updateHighlight(1, { text: 'Updated' });
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(30);
      expect(result.current.highlights[0].text).toBe('Updated');
    });

    it('should delete highlight in less than 30ms', () => {
      usePaperStore.setState({ highlights: [createMockHighlight({ id: 1 })] });
      const { result } = renderHook(() => usePaperStore());

      const startTime = performance.now();

      act(() => {
        result.current.deleteHighlight(1);
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(30);
      expect(result.current.highlights).toHaveLength(0);
    });

    it('should handle 100 highlights efficiently', () => {
      const manyHighlights = Array.from({ length: 100 }, (_, i) =>
        createMockHighlight({ id: i, text: `Highlight ${i}` })
      );
      usePaperStore.setState({ highlights: manyHighlights });

      const { result } = renderHook(() => usePaperStore());

      const startTime = performance.now();

      act(() => {
        result.current.updateHighlight(50, { text: 'Updated highlight 50' });
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(result.current.highlights[50].text).toBe('Updated highlight 50');
    });
  });

  describe('Edge Cases', () => {
    it('should handle update with no changes', async () => {
      const { result } = renderHook(() => usePaperStore());
      const originalHighlights = [...result.current.highlights];

      await act(async () => {
        await result.current.updateHighlight(1, {});
      });

      expect(result.current.highlights).toEqual(originalHighlights);
    });

    it('should handle deleting already deleted highlight', async () => {
      const { result } = renderHook(() => usePaperStore());
      usePaperStore.setState({ highlights: [] });

      await act(async () => {
        await result.current.deleteHighlight(999);
      });

      expect(result.current.highlights).toHaveLength(0);
    });

    it('should handle adding highlight with paperId 0', async () => {
      const { result } = renderHook(() => usePaperStore());

      const newHighlight: Omit<Highlight, 'id'> = {
        ...createMockHighlight({ id: 0 }),
        paperId: 0,
      };

      await act(async () => {
        await result.current.addHighlight(newHighlight);
      });

      expect(result.current.highlights).toHaveLength(1);
    });
  });
});
