'use client';

import React, { memo } from 'react';

import { motion } from 'framer-motion';
import { Calendar, Clock, DollarSign, FileText, TrendingUp } from 'lucide-react';

import { formatDate } from '@/lib/utils/format';
import type { IntelligenceBrief } from '@/types/ai.types';

interface BriefMetadataFooterProps {
  brief: IntelligenceBrief;
  className?: string;
}

/**
 * BriefMetadataFooter Component
 * Displays brief metadata and statistics
 *
 * @component
 * @example
 * ```tsx
 * <BriefMetadataFooter
 *   brief={intelligenceBrief}
 * />
 * ```
 */
export const BriefMetadataFooter = memo(({
  brief,
  className = '',
}: BriefMetadataFooterProps) => {
  const {
    generatedAt,
    cost,
    clipSummary,
    structuredInfo,
    clueCards,
    userHighlights,
    source,
    completeness,
  } = brief;

  // Calculate statistics
  const stats = {
    clipSummaryLength: typeof clipSummary === 'string' ? clipSummary.length : 0,
    structuredInfoSections: Object.keys(structuredInfo || {}).filter(
      key => structuredInfo && structuredInfo[key as keyof typeof structuredInfo]
    ).length,
    clueCardsCount: clueCards?.length || 0,
    userHighlightsCount: userHighlights?.total || 0,
    avgConfidence: clueCards && clueCards.length > 0
      ? Math.round(clueCards.reduce((sum, card) => sum + card.confidence, 0) / clueCards.length)
      : 0,
  };

  // Determine completeness level
  const completenessScore = typeof completeness === 'object' && completeness?.overall !== undefined
    ? completeness.overall
    : 0;
  const completenessLevel = completenessScore >= 80 ? 'high' : completenessScore >= 50 ? 'medium' : 'low';
  const completenessConfig = {
    high: { bg: 'bg-green-50', text: 'text-green-700', icon: '✓', label: '优秀' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '~', label: '良好' },
    low: { bg: 'bg-red-50', text: 'text-red-700', icon: '?', label: '待完善' },
  }[completenessLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`bg-gradient-to-br from-newspaper-cream to-white border-t-2 border-newspaper-border p-4 ${className}`}
      role="contentinfo"
      aria-label="情报简报元数据"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        {/* Generated At */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-medium">生成时间</span>
          </div>
          <span className="text-gray-800">{formatDate(generatedAt)}</span>
        </div>

        {/* Source */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-medium">数据来源</span>
          </div>
          <span className="text-gray-800">
            {source === 'ai-generated' ? 'AI 生成' : source === 'demo-data' ? '演示数据' : '未知'}
          </span>
        </div>

        {/* Cost */}
        {cost !== undefined && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-600">
              <DollarSign className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-medium">生成成本</span>
            </div>
            <span className="text-green-600 font-semibold">
              ${(cost * 100).toFixed(2)}¢
            </span>
          </div>
        )}

        {/* Clip Summary Length */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-medium">摘要长度</span>
          </div>
          <span className="text-gray-800">{stats.clipSummaryLength} 字符</span>
        </div>

        {/* Structured Info Sections */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-medium">结构化信息</span>
          </div>
          <span className="text-gray-800">{stats.structuredInfoSections}/4 部分</span>
        </div>

        {/* Clue Cards Count */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-600">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-medium">线索卡片</span>
          </div>
          <span className="text-gray-800">{stats.clueCardsCount} 张</span>
        </div>
      </div>

      {/* Completeness Badge */}
      {completeness !== undefined && completeness.overall !== undefined && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          className={`mt-3 p-2 ${completenessConfig.bg} border border-newspaper-border rounded-lg flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <span className={`font-bold ${completenessConfig.text}`} aria-hidden="true">
              {completenessConfig.icon}
            </span>
            <div>
              <span className={`text-xs font-semibold ${completenessConfig.text}`}>
                完整度评分
              </span>
              <span className={`text-xs ${completenessConfig.text} ml-2`}>
                {completenessConfig.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completenessScore}%` }}
                transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                className={`h-full ${completenessScore >= 80 ? 'bg-green-500' : completenessScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              />
            </div>
            <span className={`text-sm font-bold ${completenessConfig.text}`}>
              {completenessScore}%
            </span>
          </div>
        </motion.div>
      )}

      {/* Average Confidence (if applicable) */}
      {stats.avgConfidence > 0 && (
        <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
          <Clock className="w-3 h-3" aria-hidden="true" />
          <span>
            平均置信度: <span className="font-semibold">{stats.avgConfidence}%</span>
          </span>
        </div>
      )}
    </motion.div>
  );
});
