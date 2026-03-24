import {
  getHighlightPriority,
  getHighlightPriorityLabel,
  getHighlightPriorityOrder,
} from '@/lib/highlightPriority';
import type { Highlight } from '@/types';

describe('highlightPriority helpers', () => {
  it('prefers explicit priority over color-derived fallback', () => {
    const highlight: Highlight = {
      id: 1,
      paperId: 1,
      pageNumber: 1,
      text: 'Core claim',
      priority: 'critical',
      color: 'yellow',
      timestamp: '2026-03-21T00:00:00.000Z',
      createdAt: '2026-03-21T00:00:00.000Z',
    };

    expect(getHighlightPriority(highlight)).toBe('critical');
    expect(getHighlightPriorityLabel(highlight)).toBe('Critical');
    expect(getHighlightPriorityOrder(highlight)).toBe(0);
  });

  it('falls back to color when priority is missing', () => {
    const highlight = {
      id: 2,
      paperId: 1,
      pageNumber: 2,
      text: 'Secondary note',
      color: 'orange',
      timestamp: '2026-03-21T00:00:00.000Z',
      createdAt: '2026-03-21T00:00:00.000Z',
    } as Highlight;

    expect(getHighlightPriority(highlight)).toBe('interesting');
    expect(getHighlightPriorityLabel(highlight)).toBe('Interesting');
    expect(getHighlightPriorityOrder(highlight)).toBe(2);
  });
});
