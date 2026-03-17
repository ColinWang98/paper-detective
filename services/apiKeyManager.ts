import CryptoJS from 'crypto-js';

import type { AIErrorCode } from '@/types/ai.types';

import { BIGMODEL_API_URL, DEFAULT_AI_MODEL } from './aiProvider';

const ENCRYPTION_KEY = 'paper-detective-v1-2026';

const STORAGE_KEYS = {
  API_KEY: 'bigmodel_api_key_encrypted',
  API_KEY_TEST: 'bigmodel_api_key_test_result',
} as const;

export function saveAPIKey(apiKey: string): void {
  try {
    const validation = validateAPIKeyFormat(apiKey);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid API Key format');
    }

    const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY);
    localStorage.setItem(STORAGE_KEYS.API_KEY, encrypted.toString());
    localStorage.removeItem(STORAGE_KEYS.API_KEY_TEST);
  } catch (error) {
    console.error('Failed to save API Key:', error);
    throw new Error('Failed to save API Key');
  }
}

export function getAPIKey(): string | null {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (!encrypted) {
      return null;
    }

    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    const apiKey = decrypted.toString(CryptoJS.enc.Utf8);
    const validation = validateAPIKeyFormat(apiKey);

    if (!validation.valid) {
      clearAPIKey();
      return null;
    }

    return apiKey;
  } catch (error) {
    console.error('Failed to decrypt API Key:', error);
    clearAPIKey();
    return null;
  }
}

export function clearAPIKey(): void {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  localStorage.removeItem(STORAGE_KEYS.API_KEY_TEST);
}

export function hasAPIKey(): boolean {
  return getAPIKey() !== null;
}

export async function testAPIKey(): Promise<{
  success: boolean;
  error?: AIErrorCode;
  message: string;
}> {
  const apiKey = getAPIKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'API_KEY_MISSING',
      message: '请先输入API Key',
    };
  }

  try {
    const response = await fetch(BIGMODEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_AI_MODEL,
        stream: false,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    localStorage.setItem(
      STORAGE_KEYS.API_KEY_TEST,
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
      })
    );

    return {
      success: true,
      message: 'API Key验证成功',
    };
  } catch (error: unknown) {
    const candidate = error as Error & { status?: number };
    let errorCode: AIErrorCode = 'UNKNOWN_ERROR';
    let message = '连接失败，请检查网络';

    if (candidate.status === 401) {
      errorCode = 'INVALID_API_KEY';
      message = 'API Key无效，请检查输入';
    } else if (candidate.status === 429) {
      errorCode = 'RATE_LIMIT';
      message = '请求过于频繁，请稍后再试';
    } else if (candidate.name === 'NetworkError' || candidate.message?.toLowerCase().includes('network')) {
      errorCode = 'NETWORK_ERROR';
      message = '网络连接失败，请检查网络设置';
    }

    localStorage.setItem(
      STORAGE_KEYS.API_KEY_TEST,
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

export function getLastTestResult(): {
  success: boolean | null;
  timestamp?: string;
} {
  const result = localStorage.getItem(STORAGE_KEYS.API_KEY_TEST);
  if (!result) {
    return { success: null };
  }

  try {
    return JSON.parse(result);
  } catch {
    return { success: null };
  }
}

export function validateAPIKeyFormat(apiKey: string): {
  valid: boolean;
  error?: string;
} {
  if (!apiKey) {
    return { valid: false, error: 'API Key不能为空' };
  }

  if (apiKey.trim().length < 20) {
    return {
      valid: false,
      error: 'API Key长度不足，请检查是否完整',
    };
  }

  return { valid: true };
}

export function getAPIKeyHelpText(): {
  steps: string[];
  link: string;
  costExample: string;
} {
  return {
    steps: [
      '访问 BigModel 开放平台控制台',
      '登录并创建 API Key',
      '确保账户已开通模型调用权限',
      '复制 API Key 并粘贴到下方输入框',
    ],
    link: 'https://open.bigmodel.cn/',
    costExample: '当前使用模型: glm-4.7-flash（官方标注免费）',
  };
}
