import { cookies, headers } from 'next/headers';

import { Locale, defaultLocale, isValidLocale } from './config';

const COOKIE_NAME = 'NEXT_LOCALE';

export async function getLocaleFromHeaders(): Promise<Locale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  if (!acceptLanguage) {
    return defaultLocale;
  }

  const preferredLocales = acceptLanguage
    .split(',')
    .map((lang: string) => {
      const [code, quality] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0],
        quality: quality ? parseFloat(quality) : 1,
      };
    })
    .sort(
      (a: { code: string; quality: number }, b: { code: string; quality: number }) =>
        b.quality - a.quality
    );

  for (const { code } of preferredLocales) {
    if (isValidLocale(code)) {
      return code as Locale;
    }
  }

  return defaultLocale;
}

export async function getLocaleFromCookie(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(COOKIE_NAME)?.value;

  if (locale && isValidLocale(locale)) {
    return locale as Locale;
  }

  return null;
}

export async function getCurrentLocale(): Promise<Locale> {
  const cookieLocale = await getLocaleFromCookie();
  if (cookieLocale) {
    return cookieLocale;
  }

  return getLocaleFromHeaders();
}

export async function setLocaleCookie(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale, {
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
    sameSite: 'strict',
  });
}
