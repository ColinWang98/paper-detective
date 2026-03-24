'use client';

import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MapPin, Plus } from 'lucide-react';

export type AIClueType = 'question' | 'method' | 'finding' | 'limitation';

interface AIClueCardProps {
  type: AIClueType;
  title: string;
  content: string;
  pageNumber?: number;
  quote?: string;
  onLocate?: () => void;
  onAddToNotebook?: () => void;
  className?: string;
}

const cardConfig = {
  question: {
    icon: '❓',
    label: '研究问题',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-500',
    textClass: 'text-red-800',
  },
  method: {
    icon: '🧪',
    label: '核心方法',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-500',
    textClass: 'text-blue-800',
  },
  finding: {
    icon: '🔍',
    label: '关键发现',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-500',
    textClass: 'text-green-800',
  },
  limitation: {
    icon: '⚠️',
    label: '局限性',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-600',
    textClass: 'text-yellow-800',
  },
} as const;

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
      <div className="mb-2 flex items-start gap-3">
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            {config.icon}
          </span>
          <span className={`text-xs font-bold uppercase tracking-wide ${config.textClass}`}>
            {config.label}
          </span>
        </div>

        {pageNumber && (
          <span className="ml-auto flex-shrink-0 text-xs text-gray-500">
            p.{pageNumber}
          </span>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 rounded p-1 transition-colors hover:bg-black/5"
          aria-label={isExpanded ? '收起' : '展开'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      <h4 className={`mb-2 text-sm font-bold ${config.textClass}`}>{title}</h4>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mb-3 text-sm leading-relaxed text-gray-700">{content}</p>

            {quote && (
              <blockquote className="mb-3 border-l-2 border-gray-300 pl-3">
                <p className="text-xs italic leading-relaxed text-gray-600">
                  &ldquo;{quote}&rdquo;
                </p>
              </blockquote>
            )}

            <div className="flex gap-2">
              {onLocate && (
                <button
                  onClick={onLocate}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-xs font-medium transition-colors hover:border-newspaper-accent hover:bg-newspaper-accent/5"
                  aria-label={pageNumber ? `定位到第${pageNumber}页` : '定位原文'}
                >
                  <MapPin className="h-3 w-3" />
                  定位原文
                </button>
              )}
              {onAddToNotebook && (
                <button
                  onClick={onAddToNotebook}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-newspaper-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-900"
                  aria-label="添加到笔记本"
                >
                  <Plus className="h-3 w-3" />
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
