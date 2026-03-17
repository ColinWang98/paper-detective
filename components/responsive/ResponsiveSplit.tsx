'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface ResponsiveSplitProps {
  primarySection: React.ReactNode;
  secondarySection: React.ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryIcon?: React.ReactNode;
  secondaryIcon?: React.ReactNode;
}

/**
 * 响应式分屏组件
 * 
 * 根据屏幕宽度自动切换布局模式：
 * - 桌面端 (>1024px): 左右分栏
 * - 平板端 (768px-1024px): 可切换标签页
 * - 移动端 (<768px): 堆叠布局，底部导航切换
 */
export default function ResponsiveSplit({
  primarySection,
  secondarySection,
  primaryLabel = 'PDF',
  secondaryLabel = '笔记本',
  primaryIcon = <FileText className="w-5 h-5" />,
  secondaryIcon = <BookOpen className="w-5 h-5" />,
}: ResponsiveSplitProps) {
  const [activeTab, setActiveTab] = useState<'primary' | 'secondary'>('primary');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // 监听窗口大小变化
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 桌面端：左右分栏
  if (!isMobile && !isTablet) {
    return (
      <DesktopSplit
        primarySection={primarySection}
        secondarySection={secondarySection}
      />
    );
  }

  // 平板端：标签页切换
  if (isTablet) {
    return (
      <TabletTabs
        primarySection={primarySection}
        secondarySection={secondarySection}
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        primaryIcon={primaryIcon}
        secondaryIcon={secondaryIcon}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    );
  }

  // 移动端：底部导航切换
  return (
    <MobileBottomNav
      primarySection={primarySection}
      secondarySection={secondarySection}
      primaryLabel={primaryLabel}
      secondaryLabel={secondaryLabel}
      primaryIcon={primaryIcon}
      secondaryIcon={secondaryIcon}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

/**
 * 桌面端分栏布局
 */
function DesktopSplit({
  primarySection,
  secondarySection,
}: {
  primarySection: React.ReactNode;
  secondarySection: React.ReactNode;
}) {
  return (
    <div className="h-full grid grid-cols-2 gap-6">
      <div className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm rounded-lg shadow-paper">
        {primarySection}
      </div>
      <div className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm rounded-lg shadow-paper">
        {secondarySection}
      </div>
    </div>
  );
}

/**
 * 平板端标签页布局
 */
function TabletTabs({
  primarySection,
  secondarySection,
  primaryLabel = 'PDF',
  secondaryLabel = 'Notes',
  primaryIcon = <FileText className="w-5 h-5" />,
  secondaryIcon = <BookOpen className="w-5 h-5" />,
  activeTab,
  setActiveTab,
}: ResponsiveSplitProps & {
  activeTab: 'primary' | 'secondary';
  setActiveTab: (tab: 'primary' | 'secondary') => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* 标签导航 */}
      <div className="bg-newspaper-aged border-b border-newspaper-border p-2">
        <div className="flex items-center gap-2">
          <TabButton
            active={activeTab === 'primary'}
            onClick={() => setActiveTab('primary')}
            icon={primaryIcon}
            label={primaryLabel}
          />
          <TabButton
            active={activeTab === 'secondary'}
            onClick={() => setActiveTab('secondary')}
            icon={secondaryIcon}
            label={secondaryLabel}
          />
          
          {/* 切换按钮 */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setActiveTab(activeTab === 'primary' ? 'secondary' : 'primary')}
              className="flex items-center gap-1 px-3 py-2 text-sm text-newspaper-faded hover:text-newspaper-accent transition-colors touch-target"
            >
              <span>切换到{activeTab === 'primary' ? secondaryLabel : primaryLabel}</span>
              {activeTab === 'primary' ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'primary' ? (
            <motion.div
              key="primary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {primarySection}
            </motion.div>
          ) : (
            <motion.div
              key="secondary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {secondarySection}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * 移动端底部导航布局
 */
function MobileBottomNav({
  primarySection,
  secondarySection,
  primaryLabel = 'PDF',
  secondaryLabel = 'Notes',
  primaryIcon = <FileText className="w-5 h-5" />,
  secondaryIcon = <BookOpen className="w-5 h-5" />,
  activeTab,
  setActiveTab,
}: ResponsiveSplitProps & {
  activeTab: 'primary' | 'secondary';
  setActiveTab: (tab: 'primary' | 'secondary') => void;
}) {
  return (
    <div className="h-full flex flex-col bg-newspaper-cream">
      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'primary' ? (
            <motion.div
              key="primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {primarySection}
            </motion.div>
          ) : (
            <motion.div
              key="secondary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {secondarySection}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部导航栏 */}
      <nav className="bg-white border-t border-newspaper-border shadow-mobile-nav safe-area-x safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <NavButton
            active={activeTab === 'primary'}
            onClick={() => setActiveTab('primary')}
            icon={primaryIcon}
            label={primaryLabel}
          />
          <NavButton
            active={activeTab === 'secondary'}
            onClick={() => setActiveTab('secondary')}
            icon={secondaryIcon}
            label={secondaryLabel}
          />
        </div>
      </nav>
    </div>
  );
}

/**
 * 标签按钮组件
 */
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all touch-target ${
        active
          ? 'bg-newspaper-accent text-white shadow-md'
          : 'bg-white text-newspaper-ink hover:bg-newspaper-cream'
      }`}
      aria-pressed={active}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * 底部导航按钮组件
 */
function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors ${
        active
          ? 'text-newspaper-accent bg-newspaper-cream'
          : 'text-newspaper-faded hover:text-newspaper-ink'
      }`}
      aria-pressed={active}
    >
      {icon}
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
}

/**
 * 响应式可见性包装器
 */
export function ResponsiveVisibility({
  children,
  showOn = ['desktop'],
}: {
  children: React.ReactNode;
  showOn?: Array<'mobile' | 'tablet' | 'desktop'>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setVisible(
        (showOn.includes('mobile') && isMobile) ||
        (showOn.includes('tablet') && isTablet) ||
        (showOn.includes('desktop') && isDesktop)
      );
    };

    checkVisibility();
    window.addEventListener('resize', checkVisibility);
    return () => window.removeEventListener('resize', checkVisibility);
  }, [showOn]);

  if (!visible) return null;

  return <>{children}</>;
}

/**
 * 响应式容器
 * 根据屏幕大小自动调整内边距
 */
export function ResponsiveContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-4 sm:px-6 lg:px-8 xl:px-12 ${className}`}>
      {children}
    </div>
  );
}
