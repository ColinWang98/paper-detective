'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AlertCircle, CheckCircle, ExternalLink, Eye, EyeOff, Key, Loader2 } from 'lucide-react';

import {
  clearAPIKey,
  getActiveModel,
  getActiveProvider,
  getAPIKey,
  getAPIKeyHelpText,
  getProviderOptions,
  hasAPIKey,
  saveAPIKey,
  setActiveModel,
  setActiveProvider,
  testAPIKey,
  validateAPIKeyFormat,
} from '@/services/apiKeyManager';
import type { AIProvider } from '@/services/aiProvider';
import type { AIModel } from '@/types/ai.types';

import { useToast } from './Toast';

export interface APIKeyManagerProps {
  onSaved?: () => void;
}

export default function APIKeyManager({ onSaved }: APIKeyManagerProps) {
  const [provider, setProvider] = useState<AIProvider>('deepseek');
  const [model, setModel] = useState<AIModel>('deepseek-chat');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const initialProvider = getActiveProvider();
    setProvider(initialProvider);
    setModel(getActiveModel(initialProvider));
    const savedKey = getAPIKey(initialProvider);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const providerOptions = useMemo(() => getProviderOptions(), []);
  const providerMeta = providerOptions.find((option) => option.value === provider) ?? providerOptions[0];
  const saved = hasAPIKey(provider);
  const helpText = getAPIKeyHelpText(provider);

  const handleProviderChange = useCallback((nextProvider: AIProvider) => {
    setProvider(nextProvider);
    setActiveProvider(nextProvider);
    setModel(getActiveModel(nextProvider));
    const nextKey = getAPIKey(nextProvider) ?? '';
    setApiKey(nextKey);
    setTestResult(null);
    if (!nextKey) {
      setFormatError(null);
      return;
    }

    const validation = validateAPIKeyFormat(nextKey, nextProvider);
    setFormatError(validation.valid ? null : validation.error || null);
  }, []);

  const handleModelChange = useCallback((nextModel: AIModel) => {
    setModel(nextModel);
    setActiveModel(nextModel, provider);
    setTestResult(null);
  }, [provider]);

  const handleKeyChange = useCallback((value: string) => {
    setApiKey(value);
    setTestResult(null);

    if (!value) {
      setFormatError(null);
      return;
    }

    const validation = validateAPIKeyFormat(value, provider);
    setFormatError(validation.valid ? null : validation.error || null);
  }, [provider]);

  const handleSave = useCallback(() => {
    if (!apiKey.trim()) {
      showToast('请输入 API Key', 'error');
      return;
    }

    const validation = validateAPIKeyFormat(apiKey, provider);
    if (!validation.valid) {
      showToast(validation.error || 'API Key 格式不正确', 'error');
      return;
    }

    try {
      saveAPIKey(apiKey, provider);
      setActiveModel(model, provider);
      showToast('API Key 已加密保存', 'success');
      setTestResult(null);
      onSaved?.();
    } catch {
      showToast('保存失败，请重试', 'error');
    }
  }, [apiKey, model, onSaved, provider, showToast]);

  const handleTest = useCallback(async () => {
    if (!apiKey.trim()) {
      showToast('请先输入 API Key', 'error');
      return;
    }

    const validation = validateAPIKeyFormat(apiKey, provider);
    if (!validation.valid) {
      showToast(validation.error || 'API Key 格式不正确', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testAPIKey(provider);
      setTestResult(result);
      showToast(result.message, result.success ? 'success' : 'error');
    } catch (error) {
      const message = error instanceof Error ? error.message : '连接测试失败';
      setTestResult({ success: false, message });
      showToast(message, 'error');
    } finally {
      setIsTesting(false);
    }
  }, [apiKey, provider, showToast]);

  const handleDelete = useCallback(() => {
    if (!confirm('确定要删除当前 Provider 的 API Key 吗？')) {
      return;
    }

    clearAPIKey(provider);
    setApiKey('');
    setTestResult(null);
    setFormatError(null);
    showToast('API Key 已删除', 'info');
  }, [provider, showToast]);

  return (
    <div className="max-w-2xl rounded-lg border-2 border-newspaper-accent bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-newspaper-accent/10 p-2">
          <Key className="h-6 w-6 text-newspaper-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">AI Provider & API Key</h3>
          <p className="text-sm text-gray-600">
            当前模型 `{model}` · {saved ? '已配置' : '未配置'}
          </p>
        </div>
        {saved ? (
          <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            已保存
          </div>
        ) : null}
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-2 text-sm text-blue-800">
          <span className="mt-0.5">1</span>
          <div className="flex-1">
            <p className="mb-1 font-bold">隐私与安全</p>
            <ul className="space-y-1 text-blue-700">
              <li>使用 AES 加密保存在本地浏览器</li>
              <li>不会上传到项目自己的服务端存储</li>
              <li>仅在调用所选 AI Provider 时使用</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <label htmlFor="provider-select" className="mb-2 block text-sm font-bold text-gray-700">
            Provider
          </label>
          <select
            id="provider-select"
            value={provider}
            onChange={(event) => handleProviderChange(event.target.value as AIProvider)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-newspaper-accent focus:ring-2 focus:ring-newspaper-accent/20"
            aria-label="Select AI provider"
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} · {option.model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="model-select" className="mb-2 block text-sm font-bold text-gray-700">
            Model
          </label>
          <select
            id="model-select"
            value={model}
            onChange={(event) => handleModelChange(event.target.value as AIModel)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-newspaper-accent focus:ring-2 focus:ring-newspaper-accent/20"
            aria-label="Select AI model"
          >
            {providerMeta.models.map((optionModel: AIModel) => (
              <option key={optionModel} value={optionModel}>
                {optionModel}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="api-key-input" className="mb-2 block text-sm font-bold text-gray-700">
            API Key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={
                  provider === 'openrouter'
                    ? '输入 OpenRouter API Key'
                    : provider === 'deepseek'
                      ? '输入 DeepSeek API Key'
                      : '输入 BigModel API Key'
                }
                className={`w-full rounded-lg border-2 px-4 py-3 pr-12 font-mono text-sm outline-none transition-all focus:ring-2 ${
                  formatError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-newspaper-accent focus:ring-newspaper-accent/20'
                }`}
                aria-label="输入 API Key"
                aria-invalid={Boolean(formatError)}
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition-colors hover:bg-gray-100"
                aria-label={showKey ? '隐藏密钥' : '显示密钥'}
              >
                {showKey ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          {formatError ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {formatError}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              {provider === 'openrouter'
                ? 'OpenRouter API Key 需要以 sk-or-v1- 开头。'
                : provider === 'deepseek'
                  ? 'DeepSeek API Key 需要以 sk- 开头。'
                  : 'BigModel API Key 通常是一段较长字符串，建议直接从控制台复制。'}
            </p>
          )}
        </div>
      </div>

      {testResult ? (
        <div
          className={`mb-6 flex items-center gap-3 rounded-lg border-2 p-4 ${
            testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}
          role="alert"
          aria-live="polite"
        >
          {testResult.success ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          )}
          <span className="flex-1 text-sm font-medium">{testResult.message}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!apiKey || Boolean(formatError)}
          className="flex items-center gap-2 rounded-lg bg-newspaper-accent px-6 py-2.5 font-medium text-white transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Key className="h-4 w-4" />
          保存密钥
        </button>

        <button
          type="button"
          onClick={() => {
            void handleTest();
          }}
          disabled={isTesting || !apiKey || Boolean(formatError)}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              测试中...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              测试连接
            </>
          )}
        </button>

        {saved ? (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg px-6 py-2.5 font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            删除密钥
          </button>
        ) : null}
      </div>

      <details className="group mt-6 border-t border-gray-200 pt-6">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-newspaper-accent hover:underline">
          <span>如何获取 API Key？</span>
          <ExternalLink className="h-4 w-4" />
        </summary>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <ol className="list-inside list-decimal space-y-2">
            {helpText.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-1 font-medium">模型信息</p>
            <p className="text-gray-600">{helpText.costExample}</p>
          </div>
          <a
            href={helpText.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-medium text-newspaper-accent hover:underline"
          >
            前往 Provider 控制台
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </details>
    </div>
  );
}
