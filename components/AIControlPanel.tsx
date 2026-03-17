'use client';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, FileText, Map, Sparkles, Settings, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';

import { usePaperStore } from '@/lib/store';
import { hasAPIKey } from '@/services/apiKeyManager';

import AIClueCardGenerator from './AIClueCardGenerator';
import APIKeyManager from './APIKeyManager';

type AIPanelTab = 'overview' | 'clueCards' | 'brief';

export default function AIControlPanel() {
  const { currentPaper, highlights, aiClueCards } = usePaperStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<AIPanelTab>('overview');
  const [isAPConfigured, setIsAPConfigured] = useState(false);
  const [_analysisProgress, _setAnalysisProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Check API key configuration
  useEffect(() => {
    setIsAPConfigured(hasAPIKey());
  }, []);

  // Count clue cards by type
  const clueCardStats = {
    total: aiClueCards.length,
    question: aiClueCards.filter(c => c.type === 'question').length,
    method: aiClueCards.filter(c => c.type === 'method').length,
    finding: aiClueCards.filter(c => c.type === 'finding').length,
    limitation: aiClueCards.filter(c => c.type === 'limitation').length,
  };

  if (!currentPaper) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-newspaper-border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-newspaper-accent to-red-900 p-4 cursor-pointer hover:opacity-95 transition-opacity"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">AI 智能分析</h3>
              <p className="text-white/80 text-sm">
                {clueCardStats.total > 0
                  ? `${clueCardStats.total} 条线索已生成`
                  : '生成摘要和线索卡片'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* API Status Indicator */}
            {isAPConfigured ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span className="text-xs text-green-200">已配置</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                <AlertCircle className="w-4 h-4 text-yellow-300" />
                <span className="text-xs text-yellow-200">需要配置</span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="AI设置"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>

            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-newspaper-border overflow-hidden"
          >
            <div className="p-4 bg-gray-50">
              <APIKeyManager />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Tab Navigation */}
            <div className="flex border-b border-newspaper-border bg-gray-50">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-white text-newspaper-accent border-b-2 border-newspaper-accent'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                概览
              </button>
              <button
                onClick={() => setActiveTab('clueCards')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'clueCards'
                    ? 'bg-white text-newspaper-accent border-b-2 border-newspaper-accent'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                <Map className="w-4 h-4 inline mr-2" />
                线索卡片
                {clueCardStats.total > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-newspaper-accent/10 text-newspaper-accent rounded-full text-xs">
                    {clueCardStats.total}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('brief')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'brief'
                    ? 'bg-white text-newspaper-accent border-b-2 border-newspaper-accent'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                <Wand2 className="w-4 h-4 inline mr-2" />
                情报简报
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 bg-newspaper-cream/30">
              {activeTab === 'overview' && (
                <OverviewTab
                  clueCardStats={clueCardStats}
                  highlightCount={highlights.length}
                  _isAPConfigured={isAPConfigured}
                />
              )}

              {activeTab === 'clueCards' && (
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <StatCard
                      label="🔴 问题"
                      count={clueCardStats.question}
                      color="red"
                    />
                    <StatCard
                      label="🔵 方法"
                      count={clueCardStats.method}
                      color="blue"
                    />
                    <StatCard
                      label="🟢 发现"
                      count={clueCardStats.finding}
                      color="green"
                    />
                    <StatCard
                      label="🟡 局限"
                      count={clueCardStats.limitation}
                      color="yellow"
                    />
                  </div>

                  {/* Clue Card Generator */}
                  <AIClueCardGenerator
                    pdfFile={null}
                    onComplete={() => {
                      // Refresh will happen automatically via store
                    }}
                  />
                </div>
              )}

              {activeTab === 'brief' && (
                <BriefTab
                  clueCardStats={clueCardStats}
                  highlightCount={highlights.length}
                  _isAPConfigured={isAPConfigured}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  clueCardStats,
  highlightCount,
  _isAPConfigured,
}: {
  clueCardStats: Record<string, number>;
  highlightCount: number;
  _isAPConfigured: boolean;
}) {
  const completenessScore = Math.min(
    100,
    clueCardStats.total * 10 + highlightCount * 2
  );

  return (
    <div className="space-y-4">
      {/* Completeness Score */}
      <div className="bg-white rounded-lg border border-newspaper-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-900">分析完整度</h4>
          <span className="text-2xl font-bold text-newspaper-accent">{completenessScore}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completenessScore}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-newspaper-accent to-red-900"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {clueCardStats.total > 0
            ? '继续收集更多证据以提高完整度'
            : '开始生成AI分析以获得完整报告'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-newspaper-border p-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-newspaper-accent" />
            <div>
              <p className="text-xs text-gray-500">用户高亮</p>
              <p className="font-bold text-gray-900">{highlightCount} 条</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-newspaper-border p-3">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-newspaper-accent" />
            <div>
              <p className="text-xs text-gray-500">AI线索</p>
              <p className="font-bold text-gray-900">{clueCardStats.total} 条</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800 font-medium mb-1">💡 使用提示</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 先导入PDF并标记重要内容</li>
          <li>• 点击&ldquo;生成Clip摘要&rdquo;快速获取核心信息</li>
          <li>• 使用&ldquo;生成结构化信息&rdquo;获得详细分析</li>
        </ul>
      </div>
    </div>
  );
}

// Brief Tab Component
function BriefTab({
  clueCardStats,
  highlightCount,
  _isAPConfigured,
}: {
  clueCardStats: Record<string, number>;
  highlightCount: number;
  _isAPConfigured: boolean;
}) {
  const canGenerateBrief = clueCardStats.total >= 3 && highlightCount >= 1;

  return (
    <div className="space-y-4">
      {/* Readiness Indicator */}
      <div className={`rounded-lg border-2 p-4 ${
        canGenerateBrief
          ? 'bg-green-50 border-green-300'
          : 'bg-yellow-50 border-yellow-300'
      }`}>
        <div className="flex items-center gap-3">
          {canGenerateBrief ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-bold text-green-800">已准备好生成情报简报</p>
                <p className="text-sm text-green-700">
                  收集了 {clueCardStats.total} 条线索和 {highlightCount} 条高亮
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-bold text-yellow-800">继续收集线索</p>
                <p className="text-sm text-yellow-700">
                  需要至少 3 条AI线索和 1 条用户高亮
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Generate Brief Button */}
      <button
        disabled={!canGenerateBrief || !_isAPConfigured}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
          canGenerateBrief && _isAPConfigured
            ? 'bg-gradient-to-r from-newspaper-accent to-red-900 text-white hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Wand2 className="w-5 h-5" />
        生成完整情报简报
      </button>

      {!_isAPConfigured && (
        <p className="text-xs text-red-600 text-center">
          请先在设置中配置API密钥
        </p>
      )}

      {/* Brief Preview */}
      <div className="bg-white rounded-lg border border-newspaper-border p-4">
        <h4 className="font-bold text-gray-900 mb-3">📋 情报简报包含</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            案件档案信息
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            AI 3句话摘要
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            结构化研究信息
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            完整线索卡片集合
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            用户高亮分析
          </li>
        </ul>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: 'red' | 'blue' | 'green' | 'yellow';
}) {
  const colorClasses = {
    red: 'bg-red-100 text-red-800 border-red-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  return (
    <div className={`rounded-lg border p-3 text-center ${colorClasses[color]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-xl font-bold">{count}</p>
    </div>
  );
}
