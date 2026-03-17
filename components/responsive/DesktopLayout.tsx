'use client';

import React from 'react';

interface DesktopLayoutProps {
  leftSection: React.ReactNode;
  rightSection: React.ReactNode;
  leftWidth?: string;
  rightWidth?: string;
  gap?: string;
}

/**
 * 桌面端布局组件
 * 
 * 特性：
 * - 左右分栏布局
 * - 可配置的宽度比例
 * - 响应式间距
 */
export default function DesktopLayout({
  leftSection,
  rightSection,
  leftWidth = '50%',
  rightWidth = '50%',
  gap = '1.5rem',
}: DesktopLayoutProps) {
  return (
    <div 
      className="h-full flex"
      style={{ gap }}
    >
      {/* 左侧区域 - PDF查看器 */}
      <div 
        className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm"
        style={{ width: leftWidth, minWidth: '400px' }}
      >
        {leftSection}
      </div>

      {/* 右侧区域 - 笔记本 */}
      <div 
        className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm flex-1"
        style={{ width: rightWidth, minWidth: '350px' }}
      >
        {rightSection}
      </div>
    </div>
  );
}

/**
 * 可调整大小的桌面布局
 * 允许用户拖拽调整左右面板宽度
 */
export function ResizableDesktopLayout({
  leftSection,
  rightSection,
  initialLeftWidth = 55,
}: {
  leftSection: React.ReactNode;
  rightSection: React.ReactNode;
  initialLeftWidth?: number;
}) {
  const [leftWidth, setLeftWidth] = React.useState(initialLeftWidth);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // 限制最小和最大宽度
      const clampedWidth = Math.max(30, Math.min(70, newWidth));
      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="h-full flex">
      {/* 左侧区域 */}
      <div 
        className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm"
        style={{ width: `${leftWidth}%` }}
      >
        {leftSection}
      </div>

      {/* 调整大小的手柄 */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-4 -ml-2 cursor-col-resize flex items-center justify-center z-10 group ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        role="separator"
        aria-label="调整面板大小"
      >
        <div className={`w-1 h-12 rounded-full transition-all ${
          isDragging 
            ? 'bg-newspaper-accent h-20' 
            : 'bg-newspaper-border group-hover:bg-newspaper-accent group-hover:h-16'
        }`} />
      </div>

      {/* 右侧区域 */}
      <div 
        className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm flex-1"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightSection}
      </div>
    </div>
  );
}

/**
 * 三栏桌面布局
 * 适用于更复杂的界面需求
 */
export function ThreeColumnLayout({
  leftSection,
  centerSection,
  rightSection,
  leftWidth = '20%',
  centerWidth = '55%',
  rightWidth = '25%',
}: {
  leftSection: React.ReactNode;
  centerSection: React.ReactNode;
  rightSection: React.ReactNode;
  leftWidth?: string;
  centerWidth?: string;
  rightWidth?: string;
}) {
  return (
    <div className="h-full flex gap-4">
      {/* 左侧边栏 */}
      <div 
        className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm hidden lg:block"
        style={{ width: leftWidth, minWidth: '200px' }}
      >
        {leftSection}
      </div>

      {/* 中间主要内容 */}
      <div 
        className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm flex-1"
        style={{ minWidth: '400px' }}
      >
        {centerSection}
      </div>

      {/* 右侧边栏 */}
      <div 
        className="h-full overflow-hidden newspaper-border bg-white/80 backdrop-blur-sm hidden xl:block"
        style={{ width: rightWidth, minWidth: '250px' }}
      >
        {rightSection}
      </div>
    </div>
  );
}
