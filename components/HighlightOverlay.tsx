'use client';

import React, { useMemo } from 'react';

import type { Highlight, HighlightColor } from '@/types';

interface HighlightOverlayProps {
  highlights: Highlight[];
  currentPage: number;
  scale: number;
}

const colorClasses: Record<HighlightColor, string> = {
  red: 'bg-red-500/30 border-red-500',
  yellow: 'bg-yellow-500/30 border-yellow-500',
  orange: 'bg-orange-500/30 border-orange-500',
  gray: 'bg-gray-500/30 border-gray-400',
};

const priorityLabels: Record<HighlightColor, string> = {
  red: '🔴',
  yellow: '🟡',
  orange: '🟠',
  gray: '⚪',
};

export function HighlightOverlay({ highlights, currentPage, scale: _scale }: HighlightOverlayProps) {
  // Filter highlights for current page
  const currentPageHighlights = useMemo(
    () => highlights.filter(h => h.pageNumber === currentPage),
    [highlights, currentPage]
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      {currentPageHighlights.map((highlight) => {
        // Skip if no position data
        if (!highlight.position) {return null;}

        return (
          <div
            key={highlight.id}
            className={`absolute border-2 rounded ${colorClasses[highlight.color]} pointer-events-none transition-opacity duration-200`}
            style={{
              left: `${highlight.position.x}%`,
              top: `${highlight.position.y}%`,
              width: `${highlight.position.width}%`,
              height: `${highlight.position.height}%`,
            }}
            title={`${priorityLabels[highlight.color]} ${highlight.text?.slice(0, 50)}...`}
          />
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
        <span className="text-sm">{priorityLabels[highlight.color]}</span>
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
