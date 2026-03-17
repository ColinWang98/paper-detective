'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

import { Locale, locales } from '@/i18n/config';
import { saveLocaleToStorage } from '@/i18n/locale';

/**
 * 命名空间类型
 */
type Namespace = 'common' | 'pdf' | 'notebook' | 'ai';

/**
 * 翻译Hook返回值
 */
interface UseTranslationReturn {
  /** 翻译函数 */
  t: ReturnType<typeof useTranslations>;
  /** 当前语言 */
  locale: Locale;
  /** 设置语言 */
  setLocale: (locale: Locale) => void;
  /** 所有可用语言 */
  availableLocales: readonly Locale[];
  /** 切换语言（循环） */
  toggleLocale: () => void;
}

/**
 * 简化翻译使用的Hook
 * 
 * 使用方式:
 * ```tsx
 * const { t, locale, setLocale } = useTranslation('common');
 * 
 * // 基础翻译
 * t('app.name')
 * 
 * // 带参数的翻译
 * t('header.caseFile', { caseNumber: 142 })
 * 
 * // 切换语言
 * setLocale('en')
 * ```
 * 
 * @param namespace 翻译命名空间
 */
export function useTranslation(namespace: Namespace = 'common'): UseTranslationReturn {
  const t = useTranslations(namespace);
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  /**
   * 设置语言
   */
  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // 保存到本地存储
    saveLocaleToStorage(newLocale);

    // 构建新路径
    const currentPrefix = `/${locale}`;
    let newPath = pathname;
    
    if (pathname.startsWith(currentPrefix)) {
      newPath = pathname.slice(currentPrefix.length) || '/';
    }
    
    const targetPath = `/${newLocale}${newPath === '/' ? '' : newPath}`;
    
    router.push(targetPath);
    router.refresh();
  };

  /**
   * 切换语言（循环）
   */
  const toggleLocale = () => {
    const currentIndex = locales.indexOf(locale);
    const nextIndex = (currentIndex + 1) % locales.length;
    setLocale(locales[nextIndex]);
  };

  return {
    t,
    locale,
    setLocale,
    availableLocales: locales,
    toggleLocale,
  };
}

/**
 * 多命名空间翻译Hook
 * 可以同时访问多个命名空间的翻译
 * 
 * 使用方式:
 * ```tsx
 * const { t } = useTranslationsMulti(['common', 'pdf']);
 * 
 * t.common('app.name')
 * t.pdf('viewer.title')
 * ```
 */
export function useTranslationsMulti<T extends Namespace>(namespaces: T[]) {
  const translations = {} as Record<T, ReturnType<typeof useTranslations>>;
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  // 动态创建翻译函数
  for (const ns of namespaces) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    translations[ns] = useTranslations(ns) as ReturnType<typeof useTranslations>;
  }

  /**
   * 设置语言
   */
  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    saveLocaleToStorage(newLocale);

    const currentPrefix = `/${locale}`;
    let newPath = pathname;
    
    if (pathname.startsWith(currentPrefix)) {
      newPath = pathname.slice(currentPrefix.length) || '/';
    }
    
    const targetPath = `/${newLocale}${newPath === '/' ? '' : newPath}`;
    
    router.push(targetPath);
    router.refresh();
  };

  return {
    t: translations,
    locale,
    setLocale,
    availableLocales: locales,
  };
}

/**
 * 获取格式化数字
 */
export function useFormattedNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const locale = useLocale();
  
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * 获取格式化日期
 */
export function useFormattedDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = useLocale();
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * 获取相对时间（如"2天前"）
 */
export function useRelativeTime(
  date: Date | string | number
): string {
  const locale = useLocale();
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}
