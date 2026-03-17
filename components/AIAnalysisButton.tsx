'use client';

import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { Wand2, Loader2, X, CheckCircle } from 'lucide-react';

/**
 * AI Analysis Button with Progress Indicator
 *
 * HCI Design:
 * - Clear status feedback
 * - Estimated time display
 * - Cancellable operation
 * - Streaming response support
 */

export type AIAnalysisStatus = 'idle' | 'extracting' | 'analyzing' | 'generating' | 'completed' | 'error';

interface AIAnalysisButtonProps {
  status: AIAnalysisStatus;
  progress?: number;
  estimatedTime?: number;
  onStart?: () => void;
  onCancel?: () => void;
  error?: string;
}

const stageMessages = {
  extracting: { text: '正在提取论文内容...', icon: '📄', duration: 2 },
  analyzing: { text: 'AI正在分析...', icon: '🤖', duration: 5 },
  generating: { text: '生成摘要和线索...', icon: '✨', duration: 3 },
};

export default function AIAnalysisButton({
  status,
  progress = 0,
  estimatedTime = 10,
  onStart,
  onCancel,
  error,
}: AIAnalysisButtonProps) {
  const [_isExpanded, _setIsExpanded] = useState(false);

  if (status === 'idle') {
    return (
      <button
        onClick={onStart}
        className="group relative px-6 py-3 bg-gradient-to-r from-newspaper-accent to-red-900 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-3 font-medium"
      >
        <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span>AI 智能分析</span>
        <span className="text-xs opacity-80">Clip</span>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          自动生成摘要和线索卡片
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </button>
    );
  }

  if (status === 'completed') {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="px-6 py-3 bg-green-100 text-green-800 rounded-lg border-2 border-green-300 flex items-center gap-3"
      >
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">分析完成</span>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg border-2 border-newspaper-accent p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {status === 'error' ? (
              <span className="text-2xl">⚠️</span>
            ) : (
              <Loader2 className="w-5 h-5 text-newspaper-accent animate-spin" />
            )}
            <span className="font-bold text-gray-900">
              {status === 'error' ? '分析失败' : 'AI 分析中'}
            </span>
          </div>
          {status !== 'error' && onCancel && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="取消分析"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {status === 'error' && error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Progress Stages */}
        {status !== 'error' && (
          <div className="space-y-3 mb-4">
            {Object.entries(stageMessages).map(([stage, info]) => {
              const isCurrentStage = status === stage;
              const isPastStage = !isCurrentStage && progress > getStageProgress(stage);

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isCurrentStage
                      ? 'bg-newspaper-accent/10 border-2 border-newspaper-accent'
                      : isPastStage
                      ? 'bg-green-50 border-2 border-green-300'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  <span className="text-xl">{info.icon}</span>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isCurrentStage ? 'text-newspaper-accent' : isPastStage ? 'text-green-700' : 'text-gray-600'
                      }`}
                    >
                      {info.text}
                    </p>
                    {isCurrentStage && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 mt-0.5"
                      >
                        预计还需 {estimatedTime} 秒...
                      </motion.p>
                    )}
                  </div>
                  {isPastStage && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {isCurrentStage && (
                    <Loader2 className="w-4 h-4 text-newspaper-accent animate-spin" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Bar */}
        {status !== 'error' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>总体进度</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-newspaper-accent to-red-900"
              />
            </div>
          </div>
        )}

        {/* Streaming Response Preview */}
        {status === 'generating' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-newspaper-cream border border-newspaper-accent/30 rounded-lg"
          >
            <p className="text-xs text-gray-600 mb-2 font-medium">AI 正在生成...</p>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-newspaper-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-newspaper-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-newspaper-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {status === 'error' && (
            <>
              <button
                onClick={onStart}
                className="flex-1 px-4 py-2 bg-newspaper-accent text-white rounded-lg hover:bg-red-900 transition-colors text-sm font-medium"
              >
                重试
              </button>
              <button
                onClick={() => _setIsExpanded(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                关闭
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Helper function to get progress threshold for each stage
function getStageProgress(stage: string): number {
  const thresholds = {
    extracting: 30,
    analyzing: 70,
    generating: 90,
  };
  return thresholds[stage as keyof typeof thresholds] || 0;
}
