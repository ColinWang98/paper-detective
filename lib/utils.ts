import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名的工具函数
 * 
 * 使用 clsx 进行条件类名合并，然后使用 tailwind-merge 解决冲突
 * 
 * @example
 * cn('text-red-500', 'bg-blue-500') // 'text-red-500 bg-blue-500'
 * cn('px-2', 'px-4') // 'px-4' (后者覆盖前者)
 * cn({ 'text-red-500': true, 'bg-blue-500': false }) // 'text-red-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default cn;
