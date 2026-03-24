import CryptoJS from 'crypto-js';

import {
  clearAPIKey,
  getAPIKey,
  getAPIKeyHelpText,
  getActiveProvider,
  getLastTestResult,
  hasAPIKey,
  saveAPIKey,
  setActiveProvider,
  testAPIKey,
  validateAPIKeyFormat,
} from '@/services/apiKeyManager';

jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  enc: {
    Utf8: 'utf8',
  },
}));

describe('apiKeyManager', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let fetchMock: jest.Mock;

  const bigmodelKey = 'glm-valid-key-12345678901234567890';
  const openrouterKey = 'sk-or-v1-' + 'a'.repeat(32);
  const deepseekKey = 'sk-' + 'b'.repeat(32);

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ choices: [{ message: { content: 'Hi' } }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('stores the selected provider as active', () => {
    setActiveProvider('openrouter');
    expect(getActiveProvider()).toBe('openrouter');
  });

  it('defaults to DeepSeek when no provider has been stored yet', () => {
    expect(getActiveProvider()).toBe('deepseek');
  });

  it('encrypts and stores BigModel keys in provider-specific storage', () => {
    (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue({ toString: () => 'encrypted-bigmodel' });

    saveAPIKey(bigmodelKey, 'bigmodel');

    expect(localStorage.getItem('bigmodel_api_key_encrypted')).toBe('encrypted-bigmodel');
    expect(getActiveProvider()).toBe('bigmodel');
  });

  it('encrypts and stores OpenRouter keys in provider-specific storage', () => {
    (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue({ toString: () => 'encrypted-openrouter' });

    saveAPIKey(openrouterKey, 'openrouter');

    expect(localStorage.getItem('openrouter_api_key_encrypted')).toBe('encrypted-openrouter');
    expect(getActiveProvider()).toBe('openrouter');
  });

  it('encrypts and stores DeepSeek keys in provider-specific storage', () => {
    (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue({ toString: () => 'encrypted-deepseek' });

    saveAPIKey(deepseekKey, 'deepseek');

    expect(localStorage.getItem('deepseek_api_key_encrypted')).toBe('encrypted-deepseek');
    expect(getActiveProvider()).toBe('deepseek');
  });

  it('decrypts and returns the key for the active provider', () => {
    localStorage.setItem('ai_active_provider', 'openrouter');
    localStorage.setItem('openrouter_api_key_encrypted', 'encrypted-openrouter');
    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
      toString: () => openrouterKey,
    });

    expect(getAPIKey()).toBe(openrouterKey);
    expect(hasAPIKey()).toBe(true);
  });

  it('clears stored values for the selected provider only', () => {
    localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-bigmodel');
    localStorage.setItem('openrouter_api_key_encrypted', 'encrypted-openrouter');

    clearAPIKey('openrouter');

    expect(localStorage.getItem('bigmodel_api_key_encrypted')).toBe('encrypted-bigmodel');
    expect(localStorage.getItem('openrouter_api_key_encrypted')).toBeNull();
  });

  it('tests a BigModel key against the BigModel endpoint', async () => {
    localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-bigmodel');
    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({ toString: () => bigmodelKey });

    const result = await testAPIKey('bigmodel');

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      expect.objectContaining({
        body: expect.stringContaining('"model":"glm-4.7-flash"'),
      })
    );
  });

  it('tests an OpenRouter key against the proxy endpoint', async () => {
    localStorage.setItem('openrouter_api_key_encrypted', 'encrypted-openrouter');
    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({ toString: () => openrouterKey });

    const result = await testAPIKey('openrouter');

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/provider-proxy',
      expect.objectContaining({
        body: expect.stringContaining('"provider":"openrouter"'),
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/provider-proxy',
      expect.objectContaining({
        body: expect.stringContaining('"model":"minimax/minimax-m2.5:free"'),
      })
    );
  });

  it('tests a DeepSeek key against the proxy endpoint', async () => {
    localStorage.setItem('deepseek_api_key_encrypted', 'encrypted-deepseek');
    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({ toString: () => deepseekKey });

    const result = await testAPIKey('deepseek');

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/provider-proxy',
      expect.objectContaining({
        body: expect.stringContaining('"provider":"deepseek"'),
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/provider-proxy',
      expect.objectContaining({
        body: expect.stringContaining('"model":"deepseek-chat"'),
      })
    );
  });

  it('validates OpenRouter key prefix', () => {
    expect(validateAPIKeyFormat(openrouterKey, 'openrouter')).toEqual({ valid: true });
    expect(validateAPIKeyFormat(bigmodelKey, 'openrouter')).toEqual({
      valid: false,
      error: 'OpenRouter API Key 应以 sk-or-v1- 开头',
    });
  });

  it('validates DeepSeek key prefix', () => {
    expect(validateAPIKeyFormat(deepseekKey, 'deepseek')).toEqual({ valid: true });
    expect(validateAPIKeyFormat(bigmodelKey, 'deepseek')).toEqual({
      valid: false,
      error: 'DeepSeek API Key 应以 sk- 开头',
    });
  });

  it('returns provider-specific help text', () => {
    expect(getAPIKeyHelpText('bigmodel').link).toContain('bigmodel.cn');
    expect(getAPIKeyHelpText('openrouter').link).toContain('openrouter.ai');
    expect(getAPIKeyHelpText('deepseek').link).toContain('deepseek.com');
  });

  it('returns the stored last test result for the selected provider', () => {
    localStorage.setItem(
      'openrouter_api_key_test_result',
      JSON.stringify({ success: true, timestamp: '2026-03-20T12:00:00Z' })
    );

    expect(getLastTestResult('openrouter')).toEqual({
      success: true,
      timestamp: '2026-03-20T12:00:00Z',
    });
  });
});
