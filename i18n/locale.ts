/**
 * Client-safe locale utilities.
 */

import { Locale, defaultLocale, locales, isValidLocale } from './config';

/**
 * Client: read locale from localStorage.
 */
export function getLocaleFromStorage(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  try {
    const stored = localStorage.getItem('locale');
    if (stored && isValidLocale(stored)) {
      return stored as Locale;
    }
  } catch (error) {
    console.warn('Failed to read locale from localStorage:', error);
  }

  return defaultLocale;
}

/**
 * Client: persist locale to localStorage.
 */
export function saveLocaleToStorage(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('locale', locale);
  } catch (error) {
    console.warn('Failed to save locale to localStorage:', error);
  }
}

/**
 * Get localized display name for a locale.
 */
export function getLocaleDisplayName(locale: Locale, displayLocale?: Locale): string {
  const names: Record<Locale, Record<Locale, string>> = {
    zh: { zh: '中文', en: 'Chinese' },
    en: { zh: '英文', en: 'English' },
  };

  return names[locale][displayLocale ?? locale];
}

/**
 * Get locale switcher options for UI rendering.
 */
export function getLocaleSwitchOptions(currentLocale: Locale): Array<{
  value: Locale;
  label: string;
  isActive: boolean;
}> {
  return locales.map((locale) => ({
    value: locale,
    label: getLocaleDisplayName(locale, currentLocale),
    isActive: locale === currentLocale,
  }));
}
