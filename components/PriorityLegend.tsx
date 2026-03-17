'use client';

import React, { useState } from 'react';

import { HelpCircle, X } from 'lucide-react';

/**
 * Priority Legend Component
 * Shows a help tooltip with the 4-color priority system explanation
 *
 * HCI Design: Helps new users understand the color semantics
 */
export default function PriorityLegend() {
  const [isOpen, setIsOpen] = useState(false);

  const priorities = [
    {
      color: 'red',
      bg: 'bg-red-100 border-red-500',
      icon: '🔴',
      name: '关键',
      description: '必须记住 - 论文核心观点',
      example: '研究问题、主要发现、创新点',
    },
    {
      color: 'yellow',
      bg: 'bg-yellow-100 border-yellow-500',
      icon: '🟡',
      name: '重要',
      description: '值得记录 - 支持性信息',
      example: '方法细节、数据结果、参考文献',
    },
    {
      color: 'orange',
      bg: 'bg-orange-100 border-orange-500',
      icon: '🟠',
      name: '有趣',
      description: '可能相关 - 潜在有用',
      example: '相关研究、未来工作、讨论点',
    },
    {
      color: 'gray',
      bg: 'bg-gray-100 border-gray-400',
      icon: '⚪',
      name: '存档',
      description: '备用信息 - 暂时保留',
      example: '背景知识、定义、补充说明',
    },
  ];

  return (
    <div className="relative">
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-newspaper-cream rounded transition-colors"
        aria-label="显示优先级说明"
        aria-expanded={isOpen}
      >
        <HelpCircle className="w-5 h-5 text-newspaper-accent" />
      </button>

      {/* Legend Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border-2 border-newspaper-accent z-20 overflow-hidden"
            role="dialog"
            aria-labelledby="legend-title"
          >
            {/* Header */}
            <div className="bg-newspaper-accent text-white px-4 py-3 flex items-center justify-between">
              <h3 id="legend-title" className="font-bold text-sm">
                📊 优先级系统说明
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="关闭说明"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
              <p className="text-xs text-gray-600 mb-4">
                使用4色系统标记文本重要程度,帮助快速定位关键信息
              </p>

              {priorities.map((priority) => (
                <div
                  key={priority.color}
                  className={`p-3 rounded border-l-4 ${priority.bg}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{priority.icon}</span>
                    <span className="font-bold text-sm">{priority.name}</span>
                  </div>
                  <p className="text-xs text-gray-700 mb-1">
                    {priority.description}
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    例如: {priority.example}
                  </p>
                </div>
              ))}

              {/* Keyboard Shortcuts */}
              <div className="mt-4 p-3 bg-newspaper-cream rounded">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  ⌨️ 快捷键
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><kbd className="px-1.5 py-0.5 bg-white border rounded">1</kbd> 关键</div>
                  <div><kbd className="px-1.5 py-0.5 bg-white border rounded">2</kbd> 重要</div>
                  <div><kbd className="px-1.5 py-0.5 bg-white border rounded">3</kbd> 有趣</div>
                  <div><kbd className="px-1.5 py-0.5 bg-white border rounded">4</kbd> 存档</div>
                </div>
              </div>

              {/* Workflow Tip */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-bold text-blue-800 mb-1">
                  💡 使用建议
                </p>
                <p className="text-xs text-blue-700">
                  先收集所有重要信息到收集箱,再统一整理到不同分组。不要过度使用&ldquo;关键&rdquo;级别。
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
