'use client';

import React, { useState } from 'react';
import { FileText, BookOpen, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileLayoutProps {
  pdfSection: React.ReactNode;
  notebookSection: React.ReactNode;
}

type MobileTab = 'pdf' | 'notebook';

/**
 * 移动端布局组件
 * 
 * 特性：
 * - 底部导航栏切换PDF和笔记本
 * - 全屏内容区域
 * - 手势支持（可选）
 */
export default function MobileLayout({ pdfSection, notebookSection }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('pdf');
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-newspaper-cream safe-area-top safe-area-bottom">
      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'pdf' ? (
            <motion.div
              key="pdf"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {pdfSection}
            </motion.div>
          ) : (
            <motion.div
              key="notebook"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {notebookSection}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部导航栏 */}
      <nav className="bg-white border-t border-newspaper-border shadow-mobile-nav safe-area-x">
        <div className="flex items-center justify-around h-16">
          {/* PDF 标签 */}
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors ${
              activeTab === 'pdf'
                ? 'text-newspaper-accent bg-newspaper-cream'
                : 'text-newspaper-faded hover:text-newspaper-ink'
            }`}
            aria-label="查看PDF"
            aria-pressed={activeTab === 'pdf'}
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">论文</span>
          </button>

          {/* 快速操作按钮（中间） */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all touch-target ${
                showQuickActions
                  ? 'bg-newspaper-accent text-white rotate-180'
                  : 'bg-newspaper-accent text-white hover:bg-red-900'
              }`}
              aria-label="快速操作"
              aria-expanded={showQuickActions}
            >
              <ChevronUp className="w-6 h-6" />
            </button>

            {/* 快速操作菜单 */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl border border-newspaper-border p-2 min-w-[160px]"
                >
                  <QuickActionItem icon="📝" label="新建笔记" />
                  <QuickActionItem icon="🔖" label="添加书签" />
                  <QuickActionItem icon="📤" label="导出报告" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 笔记本 标签 */}
          <button
            onClick={() => setActiveTab('notebook')}
            className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors ${
              activeTab === 'notebook'
                ? 'text-newspaper-accent bg-newspaper-cream'
                : 'text-newspaper-faded hover:text-newspaper-ink'
            }`}
            aria-label="查看笔记本"
            aria-pressed={activeTab === 'notebook'}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">笔记</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

interface QuickActionItemProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

function QuickActionItem({ icon, label, onClick }: QuickActionItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-newspaper-cream rounded-lg transition-colors touch-target"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-newspaper-ink">{label}</span>
    </button>
  );
}

/**
 * 移动端页面指示器
 * 用于显示当前在多个页面中的位置
 */
export function MobilePageIndicator({ 
  current, 
  total 
}: { 
  current: number; 
  total: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all duration-300 ${
            index + 1 === current
              ? 'w-6 bg-newspaper-accent'
              : 'w-2 bg-newspaper-border'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * 移动端滑动手势包装器
 */
export function SwipeableContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.x < -50 && onSwipeLeft) {
          onSwipeLeft();
        } else if (info.offset.x > 50 && onSwipeRight) {
          onSwipeRight();
        }
      }}
      className="h-full touch-pan-y"
    >
      {children}
    </motion.div>
  );
}
