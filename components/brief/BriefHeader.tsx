'use client';

import React, { memo } from 'react';

import { motion } from 'framer-motion';
import { FileText, Calendar, User, Tag, Download, RefreshCw, AlertCircle } from 'lucide-react';

import { formatDate } from '@/lib/utils/format';
import type { IntelligenceBrief } from '@/types/ai.types';

interface BriefHeaderProps {
  brief: IntelligenceBrief;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

/**
 * BriefHeader Component
 * Displays paper metadata and brief generation status
 *
 * @component
 * @example
 * ```tsx
 * <BriefHeader
 *   brief={intelligenceBrief}
 *   onRegenerate={handleRegenerate}
 *   isRegenerating={false}
 * />
 * ```
 */
export const BriefHeader = memo(({
  brief,
  onRegenerate,
  isRegenerating = false,
  className = '',
}: BriefHeaderProps) => {
  const { paperId, caseFile, generatedAt, source, cost } = brief;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`bg-gradient-to-br from-newspaper-cream to-white border-b-2 border-newspaper-border p-4 shadow-sm ${className}`}
      role="region"
      aria-label="案件档案信息"
    >
      {/* Header Title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-newspaper-accent" aria-hidden="true" />
            <h1 className="text-lg font-bold text-gray-900">
              案件档案 #{paperId}
            </h1>
            {source === 'ai-generated' && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                AI 生成
              </span>
            )}
          </div>

          {/* Paper Title */}
          <h2 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">
            {caseFile.title || '未知论文'}
          </h2>

          {/* Authors */}
          {caseFile.authors && caseFile.authors.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="line-clamp-1">
                {caseFile.authors.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating || !onRegenerate}
            className="p-2 text-gray-600 hover:text-newspaper-accent hover:bg-newspaper-accent/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="重新生成情报简报"
            title="重新生成"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Publication Date */}
        {caseFile.publicationDate && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <span>{formatDate(caseFile.publicationDate)}</span>
          </div>
        )}

        {/* Tags */}
        {caseFile.tags && caseFile.tags.length > 0 && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Tag className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <span className="line-clamp-1">
              {caseFile.tags.slice(0, 3).join(', ')}
              {caseFile.tags.length > 3 && ` +${caseFile.tags.length - 3}`}
            </span>
          </div>
        )}

        {/* Generated At */}
        <div className="flex items-center gap-1.5 text-gray-600">
          <Calendar className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
          <span>生成于 {formatDate(generatedAt)}</span>
        </div>

        {/* Cost */}
        {cost && (
          <div className="flex items-center gap-1.5 text-green-600">
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>${(cost * 100).toFixed(2)}¢</span>
          </div>
        )}
      </div>

      {/* Warning for Demo Data */}
      {source === 'demo-data' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-yellow-800">
            此为演示数据。请配置 Claude API 密钥以生成真实的 AI 分析结果。
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});
