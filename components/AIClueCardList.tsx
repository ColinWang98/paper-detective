'use client';

import React, { useMemo, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown } from 'lucide-react';

import { usePaperStore } from '@/lib/store';
import type { AIClueCard } from '@/types';

import AIClueCardComponent from './AIClueCard';

interface AIClueCardListProps {
  onDelete?: (cardId: number) => void;
  onCardClick?: (card: AIClueCard) => void;
  onCardEdit?: (card: AIClueCard) => void;
  onHighlightClick?: (highlightId: number) => void;
}

type SortOption = 'date' | 'confidence' | 'type';
type FilterType = 'all' | 'question' | 'method' | 'finding' | 'limitation';

export default function AIClueCardList({
  onDelete,
  onCardClick,
  onCardEdit,
  onHighlightClick,
}: AIClueCardListProps) {
  const { aiClueCards, highlights } = usePaperStore();
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter cards
  const filteredCards = useMemo(() => {
    if (filterType === 'all') {return aiClueCards;}
    return aiClueCards.filter(card => card.type === filterType);
  }, [aiClueCards, filterType]);

  // Sort cards
  const sortedCards = useMemo(() => {
    const sorted = [...filteredCards];
    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'confidence':
        return sorted.sort((a, b) => b.confidence - a.confidence);
      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      default:
        return sorted;
    }
  }, [filteredCards, sortBy]);

  if (aiClueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-lg font-bold text-newspaper-ink mb-2">
          暂无 AI 线索
        </h3>
        <p className="text-sm text-newspaper-faxed mb-4 max-w-md">
          点击下方按钮生成 AI 摘要和结构化信息，快速理解论文核心内容
        </p>
        <div className="text-xs text-newspaper-faxed bg-newspaper-cream px-4 py-2 rounded border border-newspaper-border">
          💡 AI 分析成本约为 $0.01-0.02/篇
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Sort Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-newspaper-cream rounded-lg hover:bg-newspaper-sepia transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>筛选和排序</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="text-xs text-newspaper-faxed">
          {sortedCards.length} 个线索
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-newspaper-cream border border-newspaper-border rounded-lg p-4 space-y-3"
          >
            {/* Type Filter */}
            <div role="group" aria-labelledby="filter-type-label">
              <span id="filter-type-label" className="text-xs font-bold text-newspaper-ink mb-2 block">
                类型筛选
              </span>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'question', 'method', 'finding', 'limitation'] as FilterType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-xs rounded-lg border-2 transition-all ${
                      filterType === type
                        ? 'bg-newspaper-accent text-white border-newspaper-accent'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-newspaper-accent'
                    }`}
                  >
                    {type === 'all' ? '全部' :
                     type === 'question' ? '🔴 问题' :
                     type === 'method' ? '🔵 方法' :
                     type === 'finding' ? '🟢 发现' : '🟡 局限'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div role="group" aria-labelledby="sort-by-label">
              <span id="sort-by-label" className="text-xs font-bold text-newspaper-ink mb-2 block">
                排序方式
              </span>
              <div className="flex gap-2 flex-wrap">
                {(['date', 'confidence', 'type'] as SortOption[]).map(sort => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort)}
                    className={`px-3 py-1.5 text-xs rounded-lg border-2 transition-all ${
                      sortBy === sort
                        ? 'bg-newspaper-accent text-white border-newspaper-accent'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-newspaper-accent'
                    }`}
                  >
                    {sort === 'date' ? '📅 日期' : sort === 'confidence' ? '📊 可信度' : '🏷️ 类型'}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedCards.map((card) => (
            <div key={card.id}>
              <AIClueCardComponent
                card={card}
                highlights={highlights}
                onClick={() => onCardClick?.(card)}
                onEdit={onCardEdit}
                onDelete={onDelete}
                onHighlightClick={onHighlightClick}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
