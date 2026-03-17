'use client';

import React, { useEffect, useCallback } from 'react';

import { Sun, Moon, Monitor, Check } from 'lucide-react';

import { useTheme, ThemeMode } from '@/app/providers/ThemeProvider';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: '浅色', icon: <Sun className="w-4 h-4" />, shortcut: 'L' },
  { value: 'dark', label: '暗色', icon: <Moon className="w-4 h-4" />, shortcut: 'D' },
  { value: 'system', label: '跟随系统', icon: <Monitor className="w-4 h-4" />, shortcut: 'S' },
];

interface ThemeSwitcherProps {
  /** 下拉菜单位置 */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 主题切换组件
 * 支持下拉选择和键盘快捷键
 */
export default function ThemeSwitcher({
  position = 'bottom-right',
  showLabel = false,
  className = '',
}: ThemeSwitcherProps) {
  const { theme, setTheme, mounted } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 键盘快捷键：Cmd/Ctrl+Shift+L 切换主题
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 切换主题快捷键: Cmd/Ctrl+Shift+L
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'L') {
      event.preventDefault();
      // 循环切换
      const currentIndex = themeOptions.findIndex((o) => o.value === theme);
      const nextIndex = (currentIndex + 1) % themeOptions.length;
      setTheme(themeOptions[nextIndex].value);
    }
  }, [theme, setTheme]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 获取当前主题的图标
  const getCurrentIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
    }
  };

  // 获取当前主题的标签
  const getCurrentLabel = () => {
    return themeOptions.find((o) => o.value === theme)?.label || '主题';
  };

  // 下拉菜单位置样式
  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
  };

  // 防止hydration不匹配
  if (!mounted) {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-color bg-bg-card text-text-primary opacity-50"
          disabled
        >
          <Sun className="w-4 h-4" />
          {showLabel && <span className="text-sm">主题</span>}
        </button>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors touch-target"
        aria-label="切换主题"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getCurrentIcon()}
        {showLabel && <span className="text-sm">{getCurrentLabel()}</span>}
        <span className="text-xs text-[var(--text-muted)] ml-1 hidden sm:inline">
          ⌘⇧L
        </span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className={`absolute ${positionClasses[position]} z-50 min-w-[160px] rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg overflow-hidden`}
          role="listbox"
          aria-label="选择主题"
        >
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setTheme(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 text-sm
                transition-colors text-left
                ${theme === option.value 
                  ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]' 
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }
              `}
              role="option"
              aria-selected={theme === option.value}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
              {theme === option.value && <Check className="w-4 h-4" />}
            </button>
          ))}
          
          {/* 快捷键提示 */}
          <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <p className="text-xs text-[var(--text-muted)]">
              快捷键: ⌘/Ctrl+Shift+L
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 简单的主题切换按钮
 * 仅用于明暗切换
 */
export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, setTheme, effectiveTheme, mounted } = useTheme();

  const toggle = () => {
    if (effectiveTheme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  if (!mounted) {
    return (
      <button
        className={`p-2 rounded-lg border border-border-color opacity-50 ${className}`}
        disabled
      >
        <Sun className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors touch-target ${className}`}
      aria-label={effectiveTheme === 'light' ? '切换到暗色模式' : '切换到浅色模式'}
      title={effectiveTheme === 'light' ? '切换到暗色模式' : '切换到浅色模式'}
    >
      {effectiveTheme === 'light' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
