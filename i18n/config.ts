/**
 * next-intl 配置
 * 国际化支持
 */

import { getRequestConfig } from 'next-intl/server';

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};

export const localePrefixes: Record<Locale, string> = {
  zh: '/zh',
  en: '/en',
};

/**
 * 加载翻译文件
 */
export default getRequestConfig(async ({ locale, requestLocale }) => {
  const resolvedLocale = locale ?? (await requestLocale) ?? defaultLocale;
  const validLocale = isValidLocale(resolvedLocale) ? resolvedLocale : defaultLocale;

  const messages = {
    ...(await import(`./locales/${validLocale}/common.json`)).default,
    ...(await import(`./locales/${validLocale}/pdf.json`)).default,
    ...(await import(`./locales/${validLocale}/notebook.json`)).default,
    ...(await import(`./locales/${validLocale}/ai.json`)).default,
  };

  return {
    locale: validLocale,
    messages,
    timeZone: 'Asia/Shanghai',
    now: new Date(),
  };
});

/**
 * 验证locale是否有效
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * 获取备用locale
 */
export function getFallbackLocale(locale: string): Locale {
  if (isValidLocale(locale)) {
    return locale;
  }
  return defaultLocale;
}
