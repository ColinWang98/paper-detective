'use client';

import React, { useState, useEffect, useRef } from 'react';

import { useRouter, usePathname } from 'next/navigation';
import { Globe, Check } from 'lucide-react';

import { Locale, locales, localeNames } from '@/i18n/config';
import { saveLocaleToStorage } from '@/i18n/locale';

interface LanguageSwitcherProps {
  /** 当前语言 */
  currentLocale: Locale;
  /** 下拉菜单位置 */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 语言切换组件
 * 支持下拉选择和路由切换
 */
export default function LanguageSwitcher({
  currentLocale,
  position = 'bottom-right',
  showLabel = false,
  className = '',
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  /**
   * 切换语言
   * 构建新路径并导航
   */
  const switchLanguage = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // 保存到本地存储
    saveLocaleToStorage(newLocale);

    // 构建新路径
    // 移除当前locale前缀
    const currentPrefix = `/${currentLocale}`;
    let newPath = pathname;
    
    if (pathname.startsWith(currentPrefix)) {
      newPath = pathname.slice(currentPrefix.length) || '/';
    }
    
    // 添加新locale前缀
    const targetPath = `/${newLocale}${newPath === '/' ? '' : newPath}`;
    
    // 导航到新路径
    router.push(targetPath);
    router.refresh();
    
    setIsOpen(false);
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
          <Globe className="w-4 h-4" />
          {showLabel && <span className="text-sm">Language</span>}
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
        aria-label="切换语言"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        {showLabel && (
          <span className="text-sm">{localeNames[currentLocale]}</span>
        )}
        <span className="text-xs uppercase font-medium text-[var(--text-muted)]">
          {currentLocale}
        </span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className={`absolute ${positionClasses[position]} z-50 min-w-[140px] rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg overflow-hidden`}
          role="listbox"
          aria-label="选择语言"
        >
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLanguage(locale)}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 text-sm
                transition-colors text-left
                ${currentLocale === locale 
                  ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]' 
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }
              `}
              role="option"
              aria-selected={currentLocale === locale}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {locale === 'zh' ? '🇨🇳' : '🇬🇧'}
                </span>
                <span>{localeNames[locale]}</span>
              </div>
              {currentLocale === locale && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 简化的语言切换按钮
 * 仅显示当前语言图标，点击循环切换
 */
export function SimpleLanguageSwitcher({
  currentLocale,
  className = '',
}: {
  currentLocale: Locale;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const currentIndex = locales.indexOf(currentLocale);
    const nextIndex = (currentIndex + 1) % locales.length;
    const newLocale = locales[nextIndex];

    // 保存到本地存储
    saveLocaleToStorage(newLocale);

    // 构建新路径
    const currentPrefix = `/${currentLocale}`;
    let newPath = pathname;
    
    if (pathname.startsWith(currentPrefix)) {
      newPath = pathname.slice(currentPrefix.length) || '/';
    }
    
    const targetPath = `/${newLocale}${newPath === '/' ? '' : newPath}`;
    
    router.push(targetPath);
    router.refresh();
  };

  if (!mounted) {
    return (
      <button
        className={`p-2 rounded-lg border border-border-color opacity-50 ${className}`}
        disabled
      >
        <Globe className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors touch-target ${className}`}
      aria-label={`切换语言，当前: ${localeNames[currentLocale]}`}
      title={`当前语言: ${localeNames[currentLocale]}`}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium uppercase">{currentLocale}</span>
    </button>
  );
}
