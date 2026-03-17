'use client';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * Onboarding Component - 3-step walkthrough for new users
 *
 * HCI Design: Progressive disclosure of features
 * - Shows only once (localStorage flag)
 * - Can be skipped
 * - Can be shown again from Settings
 */

interface OnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('paper-detective-onboarding');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('paper-detective-onboarding', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('paper-detective-onboarding', 'true');
    setIsVisible(false);
    onSkip?.();
  };

  const steps = [
    {
      title: '欢迎来到 Paper Detective 🕵️‍♂️',
      icon: '📰',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            将论文阅读变成侦探破案! 每篇论文都是案发现场,关键信息就是你要收集的证据。
          </p>
          <div className="bg-newspaper-cream p-4 rounded-lg border-2 border-newspaper-accent">
            <p className="text-sm font-bold text-gray-800 mb-2">核心理念</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>📄 论文 = 案发现场</li>
              <li>🔍 高亮 = 收集证据</li>
              <li>📓 笔记本 = 侦探档案</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: '收集证据 - 高亮文本 🖍️',
      icon: '🎯',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            在PDF中选择文本,自动添加到收集箱。使用4色系统标记重要性:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-red-100 border-l-4 border-red-500 rounded">
              <span className="text-sm font-bold">🔴 关键</span>
              <p className="text-xs text-gray-600">必须记住</p>
            </div>
            <div className="p-2 bg-yellow-100 border-l-4 border-yellow-500 rounded">
              <span className="text-sm font-bold">🟡 重要</span>
              <p className="text-xs text-gray-600">值得记录</p>
            </div>
            <div className="p-2 bg-orange-100 border-l-4 border-orange-500 rounded">
              <span className="text-sm font-bold">🟠 有趣</span>
              <p className="text-xs text-gray-600">可能相关</p>
            </div>
            <div className="p-2 bg-gray-100 border-l-4 border-gray-400 rounded">
              <span className="text-sm font-bold">⚪ 存档</span>
              <p className="text-xs text-gray-600">备用信息</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">
            💡 快捷键: 选择文本后按 1-4 数字键
          </p>
        </div>
      ),
    },
    {
      title: '整理证据 - 分组管理 📁',
      icon: '🗂️',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            所有高亮自动进入收集箱,之后拖拽到不同分组整理:
          </p>
          <div className="bg-newspaper-cream p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 p-2 bg-white border-2 border-dashed border-gray-300 rounded text-center text-sm">
                📥 收集箱
              </div>
              <span className="text-gray-400">→</span>
              <div className="flex-1 p-2 bg-white border-2 border-newspaper-accent rounded text-center text-sm">
                📁 分组
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>✅ 创建自定义分组(如&ldquo;研究方法&rdquo;)</p>
              <p>✅ 拖拽高亮到分组</p>
              <p>✅ 添加笔记和标签</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">
            💡 建议先收集,再统一整理
          </p>
        </div>
      ),
    },
    {
      title: '准备就绪! 🎉',
      icon: '🚀',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            你已经了解了Paper Detective的核心功能。现在开始你的侦探之旅吧!
          </p>
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <p className="text-sm font-bold text-green-800 mb-2">快速上手</p>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>导入一篇PDF论文</li>
              <li>选择文本进行高亮</li>
              <li>拖拽到分组整理</li>
              <li>导出你的侦探报告</li>
            </ol>
          </div>
          <p className="text-xs text-gray-500">
            需要帮助? 点击右上角的 ? 按钮查看详细说明
          </p>
        </div>
      ),
    },
  ];

  if (!isVisible) {return null;}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-newspaper-accent to-red-900 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{steps[currentStep].icon}</span>
              <h2 id="onboarding-title" className="text-xl font-bold">
                {steps[currentStep].title}
              </h2>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="跳过教程"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-4 flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-white'
                    : index < currentStep
                    ? 'bg-white/60'
                    : 'bg-white/30'
                }`}
                aria-label={`步骤 ${index + 1} / ${steps.length}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            跳过教程
          </button>

          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">
              {currentStep + 1} / {steps.length}
            </p>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 text-sm font-medium text-white bg-newspaper-accent hover:bg-red-900 rounded-lg transition-colors flex items-center gap-2"
              >
                下一步
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                开始使用
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Hook to programmatically show onboarding
 * Can be used in Settings to "Show tutorial again"
 */
export function useOnboarding() {
  const showOnboarding = () => {
    localStorage.removeItem('paper-detective-onboarding');
    window.location.reload(); // Reload to trigger onboarding
  };

  const hasSeenOnboarding = () => {
    return localStorage.getItem('paper-detective-onboarding') === 'true';
  };

  return { showOnboarding, hasSeenOnboarding };
}
