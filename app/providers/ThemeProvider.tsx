'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { 
  ThemeMode, 
  getSystemTheme, 
  watchSystemTheme, 
  saveTheme, 
  loadTheme, 
  getEffectiveTheme,
  applyThemeVariables,
} from '@/lib/theme/theme-config';

export type { ThemeMode } from '@/lib/theme/theme-config';

interface ThemeContextType {
  /** 当前主题模式 */
  theme: ThemeMode;
  /** 实际应用的主题（light/dark） */
  effectiveTheme: 'light' | 'dark';
  /** 设置主题 */
  setTheme: (mode: ThemeMode) => void;
  /** 切换主题 */
  toggleTheme: () => void;
  /** 是否已挂载（用于避免hydration不匹配） */
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

/**
 * Theme Provider
 * 管理主题状态，监听系统主题变化，应用CSS变量
 */
export function ThemeProvider({ 
  children, 
  defaultTheme = 'system' 
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // 初始化主题
  useEffect(() => {
    const stored = loadTheme();
    setThemeState(stored);
    setMounted(true);
  }, []);

  // 应用主题变量
  useEffect(() => {
    if (!mounted) return;
    
    const effective = getEffectiveTheme(theme);
    applyThemeVariables(effective);
    
    // 更新meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effective === 'dark' ? '#1a1814' : '#f5f1e8');
    }
  }, [theme, mounted]);

  // 监听系统主题变化（当模式为system时）
  useEffect(() => {
    if (!mounted || theme !== 'system') return;
    
    return watchSystemTheme((systemTheme) => {
      applyThemeVariables(systemTheme);
    });
  }, [theme, mounted]);

  // 设置主题
  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    saveTheme(mode);
  }, []);

  // 快速切换主题（循环: light -> dark -> system）
  const toggleTheme = useCallback(() => {
    setThemeState((prev: ThemeMode) => {
      const order: ThemeMode[] = ['light', 'dark', 'system'];
      const currentIndex = order.indexOf(prev);
      const nextIndex = (currentIndex + 1) % order.length;
      const next = order[nextIndex];
      saveTheme(next);
      return next;
    });
  }, []);

  const effectiveTheme = getEffectiveTheme(theme);

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 使用主题的Hook
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * 使用有效主题（light/dark）的Hook
 * 用于需要根据主题做条件渲染的场景
 */
export function useEffectiveTheme(): 'light' | 'dark' {
  const { effectiveTheme } = useTheme();
  return effectiveTheme;
}
