import type React from 'react';

const messages: Record<string, string> = {
  'clueCard.icons.question': '❓',
  'clueCard.icons.method': '🧪',
  'clueCard.icons.finding': '🔍',
  'clueCard.icons.limitation': '⚠️',
  'clueCard.types.question': '研究问题',
  'clueCard.types.method': '核心方法',
  'clueCard.types.finding': '关键发现',
  'clueCard.types.limitation': '局限性',
  'clueCard.sources.ai-generated': 'AI生成',
  'clueCard.page': 'p',
  'clueCard.expand': '展开',
  'clueCard.collapse': '收起',
  'clueCard.edit': '编辑',
  'clueCard.title': '标题',
  'clueCard.content': '内容',
  'clueCard.cancel': '取消',
  'clueCard.save': '保存',
  'clueCard.associatedHighlights': '关联高亮',
  'clueCard.moreHighlights': '还有 {count} 条高亮',
};

export function useTranslations(_namespace?: string) {
  return (key: string, values?: Record<string, string | number>) => {
    const template = messages[key] ?? key;

    if (!values) {
      return template;
    }

    return Object.entries(values).reduce((message, [name, value]) => {
      return message.replace(new RegExp(`{${name}}`, 'g'), String(value));
    }, template);
  };
}

export function useLocale() {
  return 'zh';
}

export function NextIntlClientProvider({ children }: { children: React.ReactNode }) {
  return children;
}
