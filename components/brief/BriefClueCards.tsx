'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Target, Beaker, Lightbulb, AlertTriangle, Filter, SlidersHorizontal } from 'lucide-react';

import AIClueCardComponent from '@/components/AIClueCard';
import type { AIClueCard } from '@/types/ai.types';

interface BriefClueCardsProps {
  cards: AIClueCard[];
  className?: string;
}

type CardType = AIClueCard['type'];

const TYPE_CONFIG = {
  'question': {
    label: '研究问题',
    icon: Target,
    color: 'blue',
  },
  'method': {
    label: '方法论',
    icon: Beaker,
    color: 'purple',
  },
  'finding': {
    label: '发现',
    icon: Lightbulb,
    color: 'yellow',
  },
  'limitation': {
    label: '局限性',
    icon: AlertTriangle,
    color: 'red',
  },
};

/**
 * BriefClueCards Component
 * Displays AI clue cards with filtering and sorting
 *
 * @component
 * @example
 * ```tsx
 * <BriefClueCards
 *   cards={brief.clueCards}
 * />
 * ```
 */
export const BriefClueCards = memo(({
  cards,
  className = '',
}: BriefClueCardsProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<Set<CardType>>(
    new Set(['question', 'method', 'finding', 'limitation'])
  );
  const [sortBy, setSortBy] = useState<'confidence' | 'type'>('confidence');

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const toggleType = useCallback((type: CardType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Don't allow deselecting all types
        if (next.size > 1) {
          next.delete(type);
        }
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards.filter(card => selectedTypes.has(card.type));

    // Sort by confidence (high to low) or type
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'confidence') {
        return b.confidence - a.confidence;
      } else {
        return a.type.localeCompare(b.type);
      }
    });

    return filtered;
  }, [cards, selectedTypes, sortBy]);

  const stats = useMemo(() => {
    return cards.reduce((acc, card) => {
      acc[card.type] = (acc[card.type] || 0) + 1;
      return acc;
    }, {} as Record<CardType, number>);
  }, [cards]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`bg-white border border-newspaper-border rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-labelledby="clue-cards-title"
    >
      {/* Header */}
      <div className="p-3 border-b border-newspaper-border">
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={isExpanded}
          aria-controls="clue-cards-content"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-newspaper-accent" aria-hidden="true" />
            <h3 id="clue-cards-title" className="text-sm font-bold text-gray-900">
              AI 线索卡片
            </h3>
            <span className="text-xs text-gray-500">
              ({filteredAndSortedCards.length}/{cards.length})
            </span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />
          </motion.div>
        </button>

        {/* Filter & Sort Bar (visible when expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-2"
            >
              {/* Type Filters */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TYPE_CONFIG).map(([type, config]) => {
                  const count = stats[type as CardType] || 0;
                  const isSelected = selectedTypes.has(type as CardType);
                  const Icon = config.icon;

                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type as CardType)}
                      disabled={count === 0}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                        transition-all disabled:opacity-30 disabled:cursor-not-allowed
                        ${isSelected
                          ? `bg-${config.color}-100 text-${config.color}-800 border border-${config.color}-300`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                      aria-pressed={isSelected}
                      aria-label={`筛选${config.label}`}
                    >
                      <Icon className="w-3 h-3" aria-hidden="true" />
                      <span>{config.label}</span>
                      <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                <span className="text-xs text-gray-600">排序:</span>
                <div className="flex gap-1">
                  {(
                    [
                      { value: 'confidence' as const, label: '置信度' },
                      { value: 'type' as const, label: '类型' },
                    ]
                  ).map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`
                        px-2 py-0.5 rounded text-xs font-medium transition-colors
                        ${sortBy === option.value
                          ? 'bg-newspaper-accent text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                      aria-pressed={sortBy === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cards List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="clue-cards-content"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filteredAndSortedCards.length > 0 ? (
                filteredAndSortedCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <AIClueCardComponent card={card} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p className="text-sm">没有符合条件的线索卡片</p>
                  <p className="text-xs mt-1">请调整筛选条件</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
