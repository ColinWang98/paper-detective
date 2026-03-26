import React from 'react';
import { render, screen } from '@testing-library/react';

import { HighlightOverlay } from '@/components/HighlightOverlay';
import type { Highlight } from '@/types';

describe('HighlightOverlay', () => {
  const highlights: Highlight[] = [
    {
      id: 1,
      paperId: 1,
      pageNumber: 2,
      text: 'Important evidence sentence',
      priority: 'critical',
      color: 'red',
      timestamp: '2026-03-26T00:00:00.000Z',
      createdAt: '2026-03-26T00:00:00.000Z',
      rects: [{ x: 10, y: 20, width: 30, height: 5 }],
    },
    {
      id: 2,
      paperId: 1,
      pageNumber: 2,
      text: 'Background sentence',
      priority: 'important',
      color: 'yellow',
      timestamp: '2026-03-26T00:00:00.000Z',
      createdAt: '2026-03-26T00:00:00.000Z',
      rects: [{ x: 40, y: 60, width: 20, height: 5 }],
    },
  ];

  it('adds a stronger submitted-evidence marker for submitted highlights', () => {
    render(
      <HighlightOverlay
        highlights={highlights}
        currentPage={2}
        submittedHighlightIds={new Set([1])}
      />
    );

    expect(screen.getByText('E1')).toBeInTheDocument();
    expect(screen.queryByText('E2')).not.toBeInTheDocument();
  });
});
