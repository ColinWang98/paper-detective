'use client';

import React, { memo, useCallback } from 'react';

import { X } from 'lucide-react';

import type { Highlight } from '@/types';

// Color constants for highlight rendering
const HIGHLIGHT_COLORS = {
  yellow: 'rgba(255, 217, 61, 0.4)',
  orange: 'rgba(255, 159, 28, 0.4)',
  green: 'rgba(107, 207, 127, 0.4)',
  blue: 'rgba(78, 205, 196, 0.4)',
  red: 'rgba(255, 99, 99, 0.4)',
  gray: 'rgba(156, 163, 175, 0.4)',
} as const;

// Border colors (darker version)
const BORDER_COLORS = {
  yellow: 'rgba(255, 217, 61, 0.8)',
  orange: 'rgba(255, 159, 28, 0.8)',
  green: 'rgba(107, 207, 127, 0.8)',
  blue: 'rgba(78, 205, 196, 0.8)',
  red: 'rgba(255, 99, 99, 0.8)',
  gray: 'rgba(156, 163, 175, 0.8)',
} as const;

type HighlightColor = keyof typeof HIGHLIGHT_COLORS;

interface HighlightManagerProps {
  highlights: Highlight[];
  onDelete?: (id: string | number) => void;
  onHighlightClick?: (highlight: Highlight) => void;
}

function HighlightManagerComponent({
  highlights,
  onDelete,
  onHighlightClick,
}: HighlightManagerProps) {
  const handleHighlightClick = useCallback(
    (highlight: Highlight) => {
      console.log('Highlight clicked:', highlight);
      onHighlightClick?.(highlight);
    },
    [onHighlightClick]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, id: string | number | undefined) => {
      e.stopPropagation();
      if (id !== undefined && onDelete) {
        onDelete(id);
      }
    },
    [onDelete]
  );

  // Return null if no highlights
  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <>
      {highlights.map((highlight) => {
        const color = (highlight.color as HighlightColor) || 'yellow';
        const bgColor = HIGHLIGHT_COLORS[color] || HIGHLIGHT_COLORS.yellow;
        const borderColor = BORDER_COLORS[color] || BORDER_COLORS.yellow;

        // Use position if available, otherwise use x/y/width/height
        const left = highlight.position?.x ?? highlight.x ?? 0;
        const top = highlight.position?.y ?? highlight.y ?? 0;
        const width = highlight.position?.width ?? highlight.width ?? 100;
        const height = highlight.position?.height ?? highlight.height ?? 20;

        return (
          <div
            key={highlight.id ?? `highlight-${Math.random()}`}
            className="absolute cursor-pointer group"
            style={{
              left: typeof left === 'number' ? `${left}px` : left,
              top: typeof top === 'number' ? `${top}px` : top,
              width: typeof width === 'number' ? `${width}px` : width,
              height: typeof height === 'number' ? `${height}px` : height,
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              borderRadius: '2px',
            }}
            title={highlight.text}
            onClick={() => handleHighlightClick(highlight)}
            data-testid={`highlight-${highlight.id}`}
          >
            {/* Delete button - appears on hover */}
            {onDelete && (
              <button
                onClick={(e) => handleDeleteClick(e, highlight.id)}
                className="
                  absolute -top-2 -right-2 w-5 h-5
                  bg-red-500 text-white rounded-full
                  flex items-center justify-center
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  hover:bg-red-600
                  shadow-sm
                  z-10
                "
                aria-label="删除高亮"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

// Memo comparison for performance optimization
const areEqual = (
  prevProps: HighlightManagerProps,
  nextProps: HighlightManagerProps
) => {
  // Check if highlights array length changed
  if (prevProps.highlights.length !== nextProps.highlights.length) {
    return false;
  }

  // Check if each highlight is deeply equal
  for (let i = 0; i < prevProps.highlights.length; i++) {
    const prev = prevProps.highlights[i];
    const next = nextProps.highlights[i];

    if (
      prev.id !== next.id ||
      prev.text !== next.text ||
      prev.color !== next.color ||
      prev.createdAt !== next.createdAt ||
      prev.x !== next.x ||
      prev.y !== next.y ||
      prev.width !== next.width ||
      prev.height !== next.height
    ) {
      return false;
    }
  }

  // Check if callback references changed
  if (prevProps.onDelete !== nextProps.onDelete) {
    return false;
  }

  if (prevProps.onHighlightClick !== nextProps.onHighlightClick) {
    return false;
  }

  return true;
};

export default memo(HighlightManagerComponent, areEqual);
