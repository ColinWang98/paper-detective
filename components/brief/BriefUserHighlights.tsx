'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Highlighter, Search } from 'lucide-react';

import type { Highlight } from '@/types';
import type { UserHighlightsAnalysis } from '@/types/ai.types';

interface BriefUserHighlightsProps {
  userHighlights: UserHighlightsAnalysis;
  className?: string;
}

const PRIORITY_COLORS = {
  high: { label: '高优先级', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
  medium: { label: '中优先级', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
  low: { label: '低优先级', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
  info: { label: '参考', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-300' },
} as const;

type Priority = keyof typeof PRIORITY_COLORS;

// Map from HighlightPriority to Priority
function mapPriority(priority: Highlight['priority']): Priority {
  switch (priority) {
    case 'critical':
      return 'high';
    case 'important':
      return 'medium';
    case 'interesting':
      return 'low';
    case 'archived':
      return 'info';
    default:
      return 'info';
  }
}

/**
 * BriefUserHighlights Component
 * Displays user highlights grouped by priority
 *
 * @component
 * @example
 * ```tsx
 * <BriefUserHighlights
 *   highlights={brief.userHighlights}
 * />
 * ```
 */
export const BriefUserHighlights = memo(({
  userHighlights,
  className = '',
}: BriefUserHighlightsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<Set<Priority>>(
    new Set<Priority>(['high', 'medium'])
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const togglePriority = useCallback((priority: Priority) => {
    setSelectedPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(priority)) {
        if (next.size > 1) {
          next.delete(priority);
        }
      } else {
        next.add(priority);
      }
      return next;
    });
  }, []);

  const filteredHighlights = useMemo(() => {
    return userHighlights.topHighlights.filter((highlight) => {
      const mappedPriority = mapPriority(highlight.priority);
      const matchesPriority = selectedPriorities.has(mappedPriority);
      const matchesSearch = searchQuery === '' ||
        highlight.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPriority && matchesSearch;
    });
  }, [userHighlights.topHighlights, selectedPriorities, searchQuery]);

  const groupedHighlights = useMemo(() => {
    return filteredHighlights.reduce((acc, highlight) => {
      const mappedPriority = mapPriority(highlight.priority);
      if (!acc[mappedPriority]) {
        acc[mappedPriority] = [];
      }
      acc[mappedPriority].push(highlight);
      return acc;
    }, {} as Record<Priority, Highlight[]>);
  }, [filteredHighlights]);

  const stats = useMemo(() => {
    return userHighlights.topHighlights.reduce((acc, highlight) => {
      const mappedPriority = mapPriority(highlight.priority);
      acc[mappedPriority] = (acc[mappedPriority] || 0) + 1;
      return acc;
    }, {} as Record<Priority, number>);
  }, [userHighlights.topHighlights]);

  if (userHighlights.topHighlights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white border border-dashed border-newspaper-border rounded-lg p-4 ${className}`}
        role="region"
        aria-label="用户高亮"
      >
        <div className="text-center text-gray-500">
          <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
          <p className="text-sm">暂无用户高亮</p>
          <p className="text-xs mt-1">在PDF中选择文本添加高亮</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`bg-white border border-newspaper-border rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-labelledby="user-highlights-title"
    >
      {/* Header */}
      <div className="p-3 border-b border-newspaper-border">
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={isExpanded}
          aria-controls="user-highlights-content"
        >
          <div className="flex items-center gap-2">
            <Highlighter className="w-4 h-4 text-newspaper-accent" aria-hidden="true" />
            <h3 id="user-highlights-title" className="text-sm font-bold text-gray-900">
              用户高亮
            </h3>
            <span className="text-xs text-gray-500">
              ({filteredHighlights.length}/{userHighlights.topHighlights.length})
            </span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />
          </motion.div>
        </button>

        {/* Filters & Search (visible when expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-2"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索高亮文本或笔记..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-newspaper-border rounded-lg focus:outline-none focus:ring-2 focus:ring-newspaper-accent focus:border-transparent"
                  aria-label="搜索高亮"
                />
              </div>

              {/* Priority Filters */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(PRIORITY_COLORS) as Priority[]).map(priority => {
                  const config = PRIORITY_COLORS[priority];
                  const count = stats[priority] || 0;
                  const isSelected = selectedPriorities.has(priority);

                  return (
                    <button
                      key={priority}
                      onClick={() => togglePriority(priority)}
                      disabled={count === 0}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                        transition-all disabled:opacity-30 disabled:cursor-not-allowed
                        ${isSelected
                          ? `${config.bgColor} text-${config.color}-800 ${config.borderColor} border`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                      aria-pressed={isSelected}
                      aria-label={`筛选${config.label}`}
                    >
                      <span>{config.label}</span>
                      <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Highlights List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="user-highlights-content"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredHighlights.length > 0 ? (
                (Object.keys(PRIORITY_COLORS) as Priority[]).map(priority => {
                  const highlightsInGroup = groupedHighlights[priority];
                  if (!highlightsInGroup || highlightsInGroup.length === 0) {return null;}

                  const config = PRIORITY_COLORS[priority];

                  return (
                    <div key={priority} className="space-y-2">
                      {/* Priority Header */}
                      <div className={`px-2 py-1 ${config.bgColor} ${config.borderColor} border-l-2 rounded`}>
                        <span className={`text-xs font-semibold text-${config.color}-800`}>
                          {config.label} ({highlightsInGroup.length})
                        </span>
                      </div>

                      {/* Highlights */}
                      {highlightsInGroup.map((highlight: Highlight, index: number) => (
                        <motion.div
                          key={highlight.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          className={`p-2 ${config.bgColor} border ${config.borderColor} rounded-lg`}
                        >
                          <p className="text-sm text-gray-800 mb-1 line-clamp-3">
                            {highlight.text}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>第 {highlight.pageNumber} 页</span>
                            {highlight.note && (
                              <span className="italic">有笔记</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p className="text-sm">没有符合条件的高亮</p>
                  <p className="text-xs mt-1">请调整筛选条件或搜索关键词</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
