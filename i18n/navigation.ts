/**
 * next-intl 导航配置
 * 创建支持国际化的导航组件
 */

import { createNavigation } from 'next-intl/navigation';

import { locales } from './config';

/**
 * 导出支持国际化的导航组件
 * 
 * 使用方式:
 * ```tsx
 * import { Link, useRouter, usePathname } from '@/i18n/navigation';
 * 
 * // 链接会自动添加locale前缀
 * <Link href="/about">关于</Link>
 * 
 * // 程序化导航
 * const router = useRouter();
 * router.push('/about');
 * router.replace('/about');
 * ```
 */
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
});

/**
 * 生成带locale的路径
 */
export function getLocalizedPath(path: string, locale: string): string {
  if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
    return path;
  }
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${cleanPath}`;
}

/**
 * 移除路径中的locale前缀
 */
export function getUnlocalizedPath(path: string, locale: string): string {
  const prefix = `/${locale}`;
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length) || '/';
  }
  return path;
}
