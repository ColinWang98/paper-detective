'use client';

import React, { useMemo } from 'react';

import { getHighlightPriorityLabel } from '@/lib/highlightPriority';
import type { Highlight, HighlightColor } from '@/types';

interface HighlightOverlayProps {
  highlights: Highlight[];
  currentPage: number;
  submittedHighlightIds?: Set<number>;
}

const colorClasses: Record<HighlightColor, string> = {
  red: 'bg-red-400/28',
  yellow: 'bg-yellow-300/45',
  orange: 'bg-orange-300/38',
  gray: 'bg-gray-300/32',
};

const priorityLabels: Record<HighlightColor, string> = {
  red: '🔴',
  yellow: '🟡',
  orange: '🟠',
  gray: '⚪',
};

export function HighlightOverlay({
  highlights,
  currentPage,
  submittedHighlightIds = new Set<number>(),
}: HighlightOverlayProps) {
  // Filter highlights for current page
  const currentPageHighlights = useMemo(
    () => highlights.filter(h => h.pageNumber === currentPage),
    [highlights, currentPage]
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      {currentPageHighlights.map((highlight) => {
        const highlightRects =
          highlight.rects && highlight.rects.length > 0
            ? highlight.rects
            : highlight.position
              ? [highlight.position]
              : [];

        if (highlightRects.length === 0) {return null;}

        return (
          <React.Fragment key={highlight.id}>
            {highlightRects.map((rect, index) => (
              <div
                key={`${highlight.id}-${index}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${rect.x}%`,
                  top: `${rect.y}%`,
                  width: `${rect.width}%`,
                  height: `${Math.max(rect.height, 1.6)}%`,
                }}
              >
                <div
                  className={`h-full w-full rounded-[3px] ${colorClasses[highlight.color]} transition-opacity duration-200 mix-blend-multiply shadow-[0_0_0_1px_rgba(255,255,255,0.12)] ${
                    submittedHighlightIds.has(highlight.id ?? -1)
                      ? 'ring-2 ring-newspaper-accent/70 shadow-[0_0_0_1px_rgba(95,75,50,0.5),0_0_0_4px_rgba(95,75,50,0.12)]'
                      : ''
                  }`}
                  style={{
                    filter: 'saturate(1.05)',
                  }}
                  title={`${getHighlightPriorityLabel(highlight)} ${highlight.text?.slice(0, 50)}...`}
                />
                {submittedHighlightIds.has(highlight.id ?? -1) ? (
                  <div className="absolute -top-5 left-0 rounded-full border border-newspaper-ink/20 bg-white/95 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-newspaper-ink shadow-sm">
                    E{highlight.id}
                  </div>
                ) : null}
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Highlight tooltip component for showing full text on hover
export function HighlightTooltip({ highlight }: { highlight: Highlight }) {
  return (
    <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 max-w-md">
      <div className="flex items-start gap-2">
        <span className="text-sm font-semibold text-gray-700">{getHighlightPriorityLabel(highlight)}</span>
        <div>
          <p className="text-sm text-gray-800">{highlight.text}</p>
          {highlight.pageNumber && (
            <p className="text-xs text-gray-500 mt-1">第 {highlight.pageNumber} 页</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HighlightOverlay;
