import CryptoJS from 'crypto-js';

import type { AIErrorCode, AIModel } from '@/types/ai.types';

import {
  AI_PROVIDER_CONFIG,
  DEFAULT_AI_PROVIDER,
  DEFAULT_PROVIDER_MODELS,
  getProviderConfig,
  inferProviderFromApiKey,
  isValidProviderModel,
  type AIProvider,
} from './aiProvider';

const ENCRYPTION_KEY = 'paper-detective-v1-2026';

const STORAGE_KEYS = {
  ACTIVE_PROVIDER: 'ai_active_provider',
  ACTIVE_MODELS: {
    bigmodel: 'ai_active_model_bigmodel',
    openrouter: 'ai_active_model_openrouter',
    deepseek: 'ai_active_model_deepseek',
  },
  API_KEYS: {
    bigmodel: 'bigmodel_api_key_encrypted',
    openrouter: 'openrouter_api_key_encrypted',
    deepseek: 'deepseek_api_key_encrypted',
  },
  API_KEY_TEST: {
    bigmodel: 'bigmodel_api_key_test_result',
    openrouter: 'openrouter_api_key_test_result',
    deepseek: 'deepseek_api_key_test_result',
  },
} as const;

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function getStoredKeyName(provider: AIProvider): string {
  return STORAGE_KEYS.API_KEYS[provider];
}

function getStoredTestName(provider: AIProvider): string {
  return STORAGE_KEYS.API_KEY_TEST[provider];
}

function getStoredModelName(provider: AIProvider): string {
  return STORAGE_KEYS.ACTIVE_MODELS[provider];
}

export function getActiveProvider(): AIProvider {
  if (!hasLocalStorage()) {
    return DEFAULT_AI_PROVIDER;
  }

  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROVIDER);
  return stored === 'openrouter' || stored === 'bigmodel' || stored === 'deepseek'
    ? stored
    : DEFAULT_AI_PROVIDER;
}

export function setActiveProvider(provider: AIProvider): void {
  if (!hasLocalStorage()) {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, provider);
}

export function getActiveModel(provider: AIProvider = getActiveProvider()): AIModel {
  if (!hasLocalStorage()) {
    return DEFAULT_PROVIDER_MODELS[provider];
  }

  const stored = localStorage.getItem(getStoredModelName(provider));
  if (stored && isValidProviderModel(provider, stored)) {
    return stored;
  }

  return DEFAULT_PROVIDER_MODELS[provider];
}

export function setActiveModel(
  model: AIModel,
  provider: AIProvider = getActiveProvider()
): void {
  if (!hasLocalStorage()) {
    return;
  }

  if (!isValidProviderModel(provider, model)) {
    return;
  }

  localStorage.setItem(getStoredModelName(provider), model);
}

export function getActiveProviderConfig() {
  const provider = getActiveProvider();
  return {
    ...getProviderConfig(provider),
    model: getActiveModel(provider),
  };
}

export function saveAPIKey(apiKey: string, provider: AIProvider = getActiveProvider()): void {
  try {
    if (!hasLocalStorage()) {
      throw new Error('localStorage is not available');
    }

    const validation = validateAPIKeyFormat(apiKey, provider);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid API Key format');
    }

    const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY);
    localStorage.setItem(getStoredKeyName(provider), encrypted.toString());
    localStorage.removeItem(getStoredTestName(provider));
    setActiveProvider(provider);
  } catch (error) {
    console.error('Failed to save API Key:', error);
    throw new Error('Failed to save API Key');
  }
}

export function getAPIKey(provider: AIProvider = getActiveProvider()): string | null {
  try {
    if (!hasLocalStorage()) {
      return null;
    }

    const encrypted = localStorage.getItem(getStoredKeyName(provider));
    if (!encrypted) {
      return null;
    }

    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const apiKey = decrypted.toString(CryptoJS.enc.Utf8);
    const validation = validateAPIKeyFormat(apiKey, provider);

    if (!validation.valid) {
      clearAPIKey(provider);
      return null;
    }

    return apiKey;
  } catch (error) {
    console.error('Failed to decrypt API Key:', error);
    if (hasLocalStorage()) {
      clearAPIKey(provider);
    }
    return null;
  }
}

export function clearAPIKey(provider: AIProvider = getActiveProvider()): void {
  if (!hasLocalStorage()) {
    return;
  }

  localStorage.removeItem(getStoredKeyName(provider));
  localStorage.removeItem(getStoredTestName(provider));
}

export function hasAPIKey(provider?: AIProvider): boolean {
  return getAPIKey(provider) !== null;
}

export async function testAPIKey(
  provider: AIProvider = getActiveProvider()
): Promise<{
  success: boolean;
  error?: AIErrorCode;
  message: string;
}> {
  const apiKey = getAPIKey(provider);
  if (!apiKey) {
    return {
      success: false,
      error: 'API_KEY_MISSING',
      message: '请先输入 API Key',
    };
  }

  const config = getProviderConfig(provider);
  const model = getActiveModel(provider);

  try {
    const response = await fetch(
      (provider === 'openrouter' || provider === 'deepseek') && hasLocalStorage()
        ? '/api/ai/provider-proxy'
        : config.apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((provider === 'openrouter' || provider === 'deepseek') && hasLocalStorage()
            ? {}
            : { Authorization: `Bearer ${apiKey}` }),
        },
        body: JSON.stringify({
          ...((provider === 'openrouter' || provider === 'deepseek') && hasLocalStorage()
            ? { provider, apiKey }
            : {}),
          model,
          stream: false,
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Hi',
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    localStorage.setItem(
      getStoredTestName(provider),
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
      })
    );

    return {
      success: true,
      message: 'API Key 验证成功',
    };
  } catch (error: unknown) {
    const candidate = error as Error & { status?: number };
    let errorCode: AIErrorCode = 'UNKNOWN_ERROR';
    let message = '连接失败，请检查网络';

    if (candidate.status === 401) {
      errorCode = 'INVALID_API_KEY';
      message = 'API Key 无效，请检查输入';
    } else if (candidate.status === 429) {
      errorCode = 'RATE_LIMIT';
      message = '请求过于频繁，请稍后再试';
    } else if (candidate.name === 'NetworkError' || candidate.message?.toLowerCase().includes('network')) {
      errorCode = 'NETWORK_ERROR';
      message = '网络连接失败，请检查网络设置';
    }

    localStorage.setItem(
      getStoredTestName(provider),
      JSON.stringify({
        success: false,
        error: errorCode,
        timestamp: new Date().toISOString(),
      })
    );

    return {
      success: false,
      error: errorCode,
      message,
    };
  }
}

export function getLastTestResult(provider: AIProvider = getActiveProvider()): {
  success: boolean | null;
  timestamp?: string;
} {
  if (!hasLocalStorage()) {
    return { success: null };
  }

  const result = localStorage.getItem(getStoredTestName(provider));
  if (!result) {
    return { success: null };
  }

  try {
    return JSON.parse(result);
  } catch {
    return { success: null };
  }
}

export function validateAPIKeyFormat(
  apiKey: string,
  provider: AIProvider = getActiveProvider()
): {
  valid: boolean;
  error?: string;
} {
  if (!apiKey) {
    return { valid: false, error: 'API Key 不能为空' };
  }

  if (apiKey.trim().length < 20) {
    return {
      valid: false,
      error: 'API Key 长度不足，请检查是否完整',
    };
  }

  if (provider === 'openrouter' && !apiKey.startsWith('sk-or-v1-')) {
    return {
      valid: false,
      error: 'OpenRouter API Key 应以 sk-or-v1- 开头',
    };
  }

  if (provider === 'deepseek' && !apiKey.startsWith('sk-')) {
    return {
      valid: false,
      error: 'DeepSeek API Key 应以 sk- 开头',
    };
  }

  return { valid: true };
}

export function getAPIKeyHelpText(provider: AIProvider = getActiveProvider()): {
  steps: string[];
  link: string;
  costExample: string;
} {
  const config = getProviderConfig(provider);
  const model = getActiveModel(provider);

  if (provider === 'openrouter') {
    return {
      steps: [
        '访问 OpenRouter 控制台',
        '登录并创建 API Key',
        '确认账户可调用免费模型',
        '复制 API Key 并粘贴到下方输入框',
      ],
      link: config.helpLink,
      costExample: `当前使用模型: ${model}`,
    };
  }

  if (provider === 'deepseek') {
    return {
      steps: [
        '访问 DeepSeek Platform 控制台',
        '登录并创建 API Key',
        '确认账户可以调用 DeepSeek API',
        '复制 API Key 并粘贴到下方输入框',
      ],
      link: config.helpLink,
      costExample: `当前使用模型: ${model}`,
    };
  }

  return {
    steps: [
      '访问 BigModel 开放平台控制台',
      '登录并创建 API Key',
      '确认账户已开通模型调用权限',
      '复制 API Key 并粘贴到下方输入框',
    ],
    link: config.helpLink,
    costExample: `当前使用模型: ${model}`,
  };
}

export function getProviderOptions() {
  return Object.values(AI_PROVIDER_CONFIG).map((config) => ({
    value: config.id,
    label: config.label,
    model: getActiveModel(config.id),
    models: config.models,
  }));
}

export function getProviderForApiKey(apiKey: string): AIProvider {
  return inferProviderFromApiKey(apiKey);
}
