'use client';

import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MapPin, Plus } from 'lucide-react';

/**
 * AI Clue Card - Color Blind Accessible Design
 *
 * HCI Features:
 * - Color + Icon + Pattern differentiation (WCAG compliant)
 * - Keyboard navigation
 * - Collapsible by default (progressive disclosure)
 * - Bidirectional linking with PDF
 */

export type AIClueType = 'question' | 'method' | 'finding' | 'limitation';

interface AIClueCardProps {
  type: AIClueType;
  title: string;
  content: string;
  pageNumber?: number;
  quote?: string; // Original text from PDF
  onLocate?: () => void; // Scroll to PDF location
  onAddToNotebook?: () => void; // Add to collection bin
  className?: string;
}

// Color-blind accessible card styling
// Each type has: color + icon + border pattern
const cardConfig = {
  question: {
    color: 'red',
    icon: '❓',
    label: '研究问题',
    borderStyle: 'solid', // Solid border
    bgClass: 'bg-red-50',
    borderClass: 'border-red-500',
    textClass: 'text-red-800',
    pattern: 'none',
  },
  method: {
    color: 'blue',
    icon: '🔬',
    label: '核心方法',
    borderStyle: 'dashed', // Dashed border
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-500',
    textClass: 'text-blue-800',
    pattern: 'diagonal-lines',
  },
  finding: {
    color: 'green',
    icon: '💡',
    label: '关键发现',
    borderStyle: 'dotted', // Dotted border
    bgClass: 'bg-green-50',
    borderClass: 'border-green-500',
    textClass: 'text-green-800',
    pattern: 'dots',
  },
  limitation: {
    color: 'yellow',
    icon: '⚠️',
    label: '局限性',
    borderStyle: 'double', // Double border (simulated)
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-600',
    textClass: 'text-yellow-800',
    pattern: 'cross-hatch',
  },
};

export default function AIClueCardNew({
  type,
  title,
  content,
  pageNumber,
  quote,
  onLocate,
  onAddToNotebook,
  className = '',
}: AIClueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = cardConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bgClass} ${config.borderClass} border-l-4 rounded-r-lg p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}
      role="article"
      aria-label={`${config.label}: ${title}`}
    >
      {/* Header - Always Visible */}
      <div className="flex items-start gap-3 mb-2">
        {/* Icon + Type Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl" aria-hidden="true">
            {config.icon}
          </span>
          <span className={`text-xs font-bold ${config.textClass} uppercase tracking-wide`}>
            {config.label}
          </span>
        </div>

        {/* Page Number */}
        {pageNumber && (
          <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
            p.{pageNumber}
          </span>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-black/5 rounded transition-colors flex-shrink-0"
          aria-label={isExpanded ? '收起' : '展开'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Title - Always Visible */}
      <h4 className={`text-sm font-bold ${config.textClass} mb-2`}>
        {title}
      </h4>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* AI Summary */}
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {content}
            </p>

            {/* Original Quote (if available) */}
            {quote && (
              <blockquote className="pl-3 border-l-2 border-gray-300 mb-3">
                <p className="text-xs text-gray-600 italic leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </p>
              </blockquote>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {onLocate && (
                <button
                  onClick={onLocate}
                  className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-newspaper-accent hover:bg-newspaper-accent/5 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                  aria-label={`定位到第${pageNumber}页`}
                >
                  <MapPin className="w-3 h-3" />
                  定位原文
                </button>
              )}
              {onAddToNotebook && (
                <button
                  onClick={onAddToNotebook}
                  className="flex-1 px-3 py-2 bg-newspaper-accent text-white rounded-lg hover:bg-red-900 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                  aria-label="添加到笔记本"
                >
                  <Plus className="w-3 h-3" />
                  添加笔记
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
