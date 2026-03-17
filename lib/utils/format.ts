/**
 * Format utility functions
 * Handles date formatting, number formatting, and other common formatting needs
 */

/**
 * Format date to readable string
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: 'zh-CN')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  locale: string = 'zh-CN'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '无效日期';
    }

    // Format: 2026年2月10日
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '日期格式错误';
  }
}

/**
 * Format date to relative time (e.g., "3 hours ago")
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: 'zh-CN')
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: string | Date,
  locale: string = 'zh-CN'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return formatDate(dateObj, locale);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '时间格式错误';
  }
}

/**
 * Format cost in USD to cents display
 * @param cost - Cost in USD (e.g., 0.005)
 * @returns Formatted cost string (e.g., "0.50¢")
 */
export function formatCost(cost: number): string {
  try {
    const cents = cost * 100;
    return `${cents.toFixed(2)}¢`;
  } catch (error) {
    console.error('Error formatting cost:', error);
    return '0.00¢';
  }
}

/**
 * Format number with thousands separator
 * @param num - Number to format
 * @param locale - Locale for formatting (default: 'zh-CN')
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale: string = 'zh-CN'): string {
  try {
    return num.toLocaleString(locale);
  } catch (error) {
    console.error('Error formatting number:', error);
    return num.toString();
  }
}

/**
 * Format token count to readable string
 * @param tokens - Number of tokens
 * @returns Formatted token string (e.g., "1.5k tokens")
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k tokens`;
  }
  return `${tokens} tokens`;
}

/**
 * Truncate text to maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)  }...`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(pattern, '<mark>$1</mark>');
}

/**
 * Format confidence percentage to text
 * @param confidence - Confidence value (0-100)
 * @returns Confidence level text
 */
export function formatConfidence(confidence: number): string {
  if (confidence >= 80) {
    return '高可信';
  } else if (confidence >= 50) {
    return '中可信';
  } else {
    return '低可信';
  }
}

/**
 * Get confidence color class
 * @param confidence - Confidence value (0-100)
 * @returns Tailwind color class
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) {
    return 'text-green-600';
  } else if (confidence >= 50) {
    return 'text-yellow-600';
  } else {
    return 'text-red-600';
  }
}

/**
 * Get confidence background class
 * @param confidence - Confidence value (0-100)
 * @returns Tailwind background color class
 */
export function getConfidenceBgColor(confidence: number): string {
  if (confidence >= 80) {
    return 'bg-green-50';
  } else if (confidence >= 50) {
    return 'bg-yellow-50';
  } else {
    return 'bg-red-50';
  }
}
