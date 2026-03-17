'use client';

import React, { memo } from 'react';

import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

import type { Highlight, HighlightColor } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

export interface HighlightCardProps {
  highlight: Highlight;
  isDragging?: boolean;
  onClick?: () => void;
}

// Color classes for highlight cards - updated for dark mode compatibility
const colorClasses: Record<HighlightColor, string> = {
  red: 'bg-red-100/80 dark:bg-red-900/30 border-l-red-500 dark:border-l-red-400',
  yellow: 'bg-yellow-100/80 dark:bg-yellow-900/30 border-l-yellow-500 dark:border-l-yellow-400',
  orange: 'bg-orange-100/80 dark:bg-orange-900/30 border-l-orange-500 dark:border-l-orange-400',
  gray: 'bg-gray-100/80 dark:bg-gray-800/50 border-l-gray-400 dark:border-l-gray-500',
};

function HighlightCardComponent({ highlight, isDragging: isDraggingProp = false, onClick }: HighlightCardProps) {
  const { t } = useTranslation('pdf');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `highlight-${highlight.id}`,
    data: {
      type: 'highlight',
      highlight,
    },
    disabled: !highlight.id,
  });

  const dragging = isDragging || isDraggingProp;

  // Apply drag transform
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleClick = () => {
    if (!dragging && onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: dragging ? 0.5 : 1,
        y: 0,
        scale: dragging ? 1.02 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: dragging ? 1.02 : 1.01 }}
      onClick={handleClick}
      className={`
        p-3 rounded-lg border-l-4 shadow-sm cursor-grab active:cursor-grabbing
        hover:shadow-md transition-all duration-200
        ${colorClasses[highlight.color]}
        ${dragging ? 'ring-2 ring-[var(--accent-color)] shadow-lg z-50' : ''}
        bg-[var(--bg-card)]
      `}
      data-testid={`highlight-card-${highlight.id}`}
    >
      {/* Priority Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {t(`highlight.priority.labels.${highlight.color}`)}
        </span>
        {highlight.pageNumber && (
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
            {t('notebook.highlights.page', { page: highlight.pageNumber })}
          </span>
        )}
      </div>

      {/* Highlight Text */}
      <p className="text-sm text-[var(--text-primary)] line-clamp-3 leading-relaxed">
        {highlight.text}
      </p>

      {/* Footer: Timestamp */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-light)]">
        <p className="text-xs text-[var(--text-muted)]">
          {new Date(highlight.createdAt).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {highlight.note && (
          <span className="text-xs text-[var(--accent-color)] flex items-center gap-1">
            {t('notebook.highlights.hasNote')}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Memo comparison function for performance
const areEqual = (prevProps: HighlightCardProps, nextProps: HighlightCardProps) => {
  return (
    prevProps.highlight.id === nextProps.highlight.id &&
    prevProps.highlight.text === nextProps.highlight.text &&
    prevProps.highlight.color === nextProps.highlight.color &&
    prevProps.highlight.createdAt === nextProps.highlight.createdAt &&
    prevProps.highlight.pageNumber === nextProps.highlight.pageNumber &&
    prevProps.highlight.note === nextProps.highlight.note &&
    prevProps.isDragging === nextProps.isDragging
  );
};

export default memo(HighlightCardComponent, areEqual);
