'use client';

import React, { useState, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Edit2, Check, X, Link2, TrendingUp } from 'lucide-react';

import type { AIClueCard, Highlight } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface AIClueCardProps {
  card: AIClueCard;
  highlights?: Highlight[];
  onClick?: () => void;
  onEdit?: (card: AIClueCard) => void;
  onDelete?: (cardId: number) => void;
  onHighlightClick?: (highlightId: number) => void;
  isDragging?: boolean;
}

export default function AIClueCardComponent({
  card,
  highlights = [],
  onClick: _onClick,
  onEdit,
  onDelete: _onDelete,
  onHighlightClick,
  isDragging = false,
}: AIClueCardProps) {
  const { t } = useTranslation('ai');
  const [isExpanded, setIsExpanded] = useState(card.isExpanded ?? false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState({ title: card.title, content: card.content });
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Card type styles (newspaper + detective theme) - updated for dark mode
  const getCardStyles = (type: AIClueCard['type']) => {
    switch (type) {
      case 'question':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-500 dark:border-red-400',
          accent: 'bg-red-500 dark:bg-red-400',
          labelColor: 'text-red-700 dark:text-red-300',
        };
      case 'method':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-500 dark:border-blue-400',
          accent: 'bg-blue-500 dark:bg-blue-400',
          labelColor: 'text-blue-700 dark:text-blue-300',
        };
      case 'finding':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-500 dark:border-green-400',
          accent: 'bg-green-500 dark:bg-green-400',
          labelColor: 'text-green-700 dark:text-green-300',
        };
      case 'limitation':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-500 dark:border-yellow-400',
          accent: 'bg-yellow-500 dark:bg-yellow-400',
          labelColor: 'text-yellow-700 dark:text-yellow-300',
        };
      default:
        return {
          bg: 'bg-[var(--bg-secondary)]',
          border: 'border-[var(--border-color)]',
          accent: 'bg-[var(--accent-color)]',
          labelColor: 'text-[var(--text-secondary)]',
        };
    }
  };

  // Get confidence color - updated for dark mode
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) {return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';}
    if (confidence >= 50) {return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700';}
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
  };

  const styles = getCardStyles(card.type);
  const confidenceColor = getConfidenceColor(card.confidence);

  // Handle edit save
  const handleSaveEdit = () => {
    onEdit?.({ ...card, title: editedCard.title, content: editedCard.content });
    setIsEditing(false);
  };

  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditedCard({ title: card.title, content: card.content });
    setIsEditing(false);
  };

  // Get associated highlights
  const associatedHighlights = highlights.filter(h => h.id !== undefined && card.highlightIds?.includes(h.id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        relative bg-[var(--bg-card)] border-l-4 ${styles.border} rounded-lg shadow-sm hover:shadow-md transition-all
        ${isDragging ? 'opacity-50 rotate-2' : ''}
      `}
    >
      {/* Card Header - Always Visible */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          {/* Left: Icon + Title + Type Label */}
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{t(`clueCard.icons.${card.type}`)}</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{card.title}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-xs font-medium ${styles.labelColor}`}>{t(`clueCard.types.${card.type}`)}</p>
                <span className="text-xs text-[var(--text-muted)]">•</span>
                <p className="text-xs text-[var(--text-muted)]">{t(`clueCard.sources.${card.source}`)}</p>
              </div>
            </div>
          </div>

          {/* Right: Confidence + Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Confidence Badge */}
            <div className={`px-2 py-0.5 rounded text-xs font-bold border ${confidenceColor} flex items-center gap-1`}>
              <TrendingUp className="w-3 h-3" />
              <span>{card.confidence}%</span>
            </div>

            {/* Page Number */}
            {card.pageNumber && (
              <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded">
                {t('clueCard.page')}.{card.pageNumber}
              </span>
            )}

            {/* Expand/Collapse Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
              aria-label={isExpanded ? t('clueCard.collapse') : t('clueCard.expand')}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>

            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
              aria-label={t('clueCard.edit')}
            >
              <Edit2 className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--accent-color)]" />
            </button>
          </div>
        </div>

        {/* Content Preview (collapsed state) */}
        {!isExpanded && !isEditing && (
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed pl-7">
            {card.content}
          </p>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {(isExpanded || isEditing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--border-light)]"
          >
            <div className="p-3 pt-2">
              {/* Edit Mode */}
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label htmlFor="clue-title" className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">{t('clueCard.title')}</label>
                    <input
                      id="clue-title"
                      type="text"
                      value={editedCard.title}
                      onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border-color)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <label htmlFor="clue-content" className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">{t('clueCard.content')}</label>
                    <textarea
                      id="clue-content"
                      ref={editInputRef}
                      value={editedCard.content}
                      onChange={(e) => setEditedCard({ ...editedCard, content: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border-color)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] min-h-[80px] resize-y bg-[var(--bg-card)] text-[var(--text-primary)]"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {t('clueCard.cancel')}
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--accent-color)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] rounded transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {t('clueCard.save')}
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-3">
                  {/* Full Content */}
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap pl-7">
                    {card.content}
                  </p>

                  {/* Associated Highlights */}
                  {associatedHighlights.length > 0 && (
                    <div className="pl-7">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Link2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <p className="text-xs font-bold text-[var(--text-secondary)]">
                          {t('clueCard.associatedHighlights')} ({associatedHighlights.length})
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {associatedHighlights.slice(0, isExpanded ? undefined : 2).map((highlight) => (
                          <button
                            key={highlight.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (highlight.id !== undefined) {
                                onHighlightClick?.(highlight.id);
                              }
                            }}
                            className="block w-full text-left p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] rounded border border-[var(--border-color)] transition-colors"
                          >
                            <p className="text-xs text-[var(--text-primary)] line-clamp-2">{highlight.text}</p>
                            {highlight.pageNumber && (
                              <p className="text-xs text-[var(--text-muted)] mt-1">p.{highlight.pageNumber}</p>
                            )}
                          </button>
                        ))}
                        {!isExpanded && associatedHighlights.length > 2 && (
                          <p className="text-xs text-[var(--text-muted)] pl-2">
                            {t('clueCard.moreHighlights', { count: associatedHighlights.length - 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pl-7 pt-2 border-t border-[var(--border-light)]">
                    <span>
                      {new Date(card.createdAt).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {card.cost && (
                      <span className="text-[var(--success-color)]">
                        ${(card.cost * 100).toFixed(2)}¢
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
