import type { Highlight, HighlightColor, HighlightPriority } from '@/types';

const COLOR_TO_PRIORITY: Record<HighlightColor, HighlightPriority> = {
  red: 'critical',
  yellow: 'important',
  orange: 'interesting',
  gray: 'archived',
};

export const PRIORITY_ORDER: Record<HighlightPriority, number> = {
  critical: 0,
  important: 1,
  interesting: 2,
  archived: 3,
};

export const PRIORITY_LABELS: Record<HighlightPriority, string> = {
  critical: 'Critical',
  important: 'Important',
  interesting: 'Interesting',
  archived: 'Archived',
};

export function getHighlightPriority(highlight: Highlight): HighlightPriority {
  return highlight.priority ?? COLOR_TO_PRIORITY[highlight.color];
}

export function getHighlightPriorityLabel(highlight: Highlight): string {
  return PRIORITY_LABELS[getHighlightPriority(highlight)];
}

export function getHighlightPriorityOrder(highlight: Highlight): number {
  return PRIORITY_ORDER[getHighlightPriority(highlight)];
}
