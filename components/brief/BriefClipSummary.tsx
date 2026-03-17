'use client';

import React, { useState, useCallback, memo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Scissors, Copy, Check } from 'lucide-react';

interface BriefClipSummaryProps {
  clipSummary: string; // 3-sentence summary string
  className?: string;
}

/**
 * BriefClipSummary Component
 * Displays the 3-sentence AI-generated clip summary with expand/collapse
 *
 * @component
 * @example
 * ```tsx
 * <BriefClipSummary
 *   clipSummary={brief.clipSummary}
 * />
 * ```
 */
export const BriefClipSummary = memo(({
  clipSummary,
  className = '',
}: BriefClipSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const copyToClipboard = useCallback(() => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(clipSummary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    })();
  }, [clipSummary]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`bg-white border border-newspaper-border rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-labelledby="clip-summary-title"
    >
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-3 hover:bg-newspaper-cream/50 transition-colors text-left"
        aria-expanded={isExpanded}
        aria-controls="clip-summary-content"
      >
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-newspaper-accent" aria-hidden="true" />
          <h3 id="clip-summary-title" className="text-sm font-bold text-gray-900">
            Clip 摘要
          </h3>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="clip-summary-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* Summary Text */}
              <div className="p-3 bg-newspaper-cream border border-newspaper-border rounded-lg">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {clipSummary}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  3句话核心摘要
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    copyToClipboard();
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-newspaper-accent hover:bg-newspaper-accent/10 rounded transition-colors"
                  aria-label="复制摘要"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
