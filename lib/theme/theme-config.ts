/**
 * 主题配置
 * 定义CSS变量、主题模式和配色方案
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'paper-detective-theme';
export const LOCALE_STORAGE_KEY = 'paper-detective-locale';

/**
 * CSS变量定义
 * 与globals.css中的变量保持一致
 */
export const themeVariables = {
  light: {
    /* 背景 */
    '--bg-primary': '#f5f1e8',
    '--bg-secondary': '#e8e0d0',
    '--bg-card': '#ffffff',
    '--bg-overlay': 'rgba(0, 0, 0, 0.5)',
    
    /* 文字 */
    '--text-primary': '#2c2416',
    '--text-secondary': '#5a4a3a',
    '--text-muted': '#8a7a6a',
    '--text-inverse': '#f5f1e8',
    
    /* 边框 */
    '--border-color': '#d4c8b8',
    '--border-light': '#e8e0d0',
    
    /* 强调色 */
    '--accent-color': '#8b2635',
    '--accent-hover': '#6b1c28',
    '--accent-light': '#c43a4a',
    
    /* 功能色 */
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--error-color': '#ef4444',
    '--info-color': '#3b82f6',
    
    /* 阴影 */
    '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '--shadow-paper': '0 4px 6px -1px rgba(139, 38, 53, 0.1), 0 2px 4px -1px rgba(139, 38, 53, 0.06)',
    
    /* 滚动条 */
    '--scrollbar-track': '#e8e4d9',
    '--scrollbar-thumb': '#c4a77d',
    '--scrollbar-thumb-hover': '#a88c65',
    
    /* 选择文本 */
    '--selection-bg': '#fff3cd',
    '--selection-text': '#2c2c2c',
  },
  dark: {
    /* 背景 */
    '--bg-primary': '#1a1814',
    '--bg-secondary': '#252018',
    '--bg-card': '#2a2420',
    '--bg-overlay': 'rgba(0, 0, 0, 0.7)',
    
    /* 文字 */
    '--text-primary': '#e8e0d0',
    '--text-secondary': '#b8a898',
    '--text-muted': '#887868',
    '--text-inverse': '#1a1814',
    
    /* 边框 */
    '--border-color': '#3a3430',
    '--border-light': '#2a2420',
    
    /* 强调色 */
    '--accent-color': '#c43a4a',
    '--accent-hover': '#d85060',
    '--accent-light': '#e86a7a',
    
    /* 功能色 */
    '--success-color': '#34d399',
    '--warning-color': '#fbbf24',
    '--error-color': '#f87171',
    '--info-color': '#60a5fa',
    
    /* 阴影 */
    '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
    '--shadow-paper': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    
    /* 滚动条 */
    '--scrollbar-track': '#252018',
    '--scrollbar-thumb': '#5a5048',
    '--scrollbar-thumb-hover': '#7a7068',
    
    /* 选择文本 */
    '--selection-bg': '#4a4038',
    '--selection-text': '#e8e0d0',
  },
};

/**
 * 应用CSS变量到文档根元素
 */
export function applyThemeVariables(mode: Exclude<ThemeMode, 'system'>): void {
  const root = document.documentElement;
  const variables = themeVariables[mode];
  
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // 设置data-theme属性用于CSS选择器
  root.setAttribute('data-theme', mode);
}

/**
 * 获取系统主题偏好
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

/**
 * 监听系统主题变化
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * 保存主题到本地存储
 */
export function saveTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (e) {
    console.warn('Failed to save theme:', e);
  }
}

/**
 * 从本地存储加载主题
 */
export function loadTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to load theme:', e);
  }
  
  return 'system';
}

/**
 * 获取有效的主题模式
 * 如果为system，则返回系统主题
 */
export function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}
