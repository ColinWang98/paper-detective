import type { AIModel } from '@/types/ai.types';

export type AIProvider = 'bigmodel' | 'openrouter' | 'deepseek';

export type ProviderModelMap = {
  bigmodel: Extract<AIModel, 'glm-4.7-flash' | 'glm-4.6'>;
  openrouter: Extract<AIModel, 'minimax/minimax-m2.5:free'>;
  deepseek: Extract<AIModel, 'deepseek-chat'>;
};

export const AI_PROVIDER_MODELS: Record<AIProvider, readonly AIModel[]> = {
  bigmodel: ['glm-4.7-flash', 'glm-4.6'],
  openrouter: ['minimax/minimax-m2.5:free'],
  deepseek: ['deepseek-chat'],
} as const;

export const AI_PROVIDER_CONFIG: {
  [K in AIProvider]: {
    id: K;
    label: string;
    apiUrl: string;
    model: AIModel;
    models: readonly AIModel[];
    helpLink: string;
  };
} = {
  bigmodel: {
    id: 'bigmodel',
    label: 'BigModel',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4.7-flash',
    models: AI_PROVIDER_MODELS.bigmodel,
    helpLink: 'https://open.bigmodel.cn/',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'minimax/minimax-m2.5:free',
    models: AI_PROVIDER_MODELS.openrouter,
    helpLink: 'https://openrouter.ai/',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    models: AI_PROVIDER_MODELS.deepseek,
    helpLink: 'https://platform.deepseek.com/',
  },
} as const;

export const DEFAULT_AI_PROVIDER: AIProvider = 'deepseek';
export const BIGMODEL_API_URL = AI_PROVIDER_CONFIG.bigmodel.apiUrl;
export const DEFAULT_AI_MODEL = AI_PROVIDER_CONFIG.deepseek.model;
export const DEFAULT_PROVIDER_MODELS: { [K in AIProvider]: ProviderModelMap[K] } = {
  bigmodel: 'glm-4.7-flash',
  openrouter: 'minimax/minimax-m2.5:free',
  deepseek: 'deepseek-chat',
};

export function inferProviderFromApiKey(apiKey: string): AIProvider {
  if (apiKey.startsWith('sk-or-v1-')) {
    return 'openrouter';
  }
  if (apiKey.startsWith('sk-')) {
    return 'deepseek';
  }
  return 'bigmodel';
}

export function getProviderConfig(provider: AIProvider) {
  return AI_PROVIDER_CONFIG[provider];
}

export function isValidProviderModel(
  provider: AIProvider,
  model: string
): model is ProviderModelMap[typeof provider] {
  return AI_PROVIDER_MODELS[provider].includes(model as never);
}
