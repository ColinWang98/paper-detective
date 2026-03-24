import {
  saveAPIKey,
  getAPIKey,
  clearAPIKey,
  hasAPIKey,
  testAPIKey,
  getLastTestResult,
  validateAPIKeyFormat,
  getAPIKeyHelpText,
} from '@/services/apiKeyManager';

jest.mock('crypto-js', () => {
  const originalModule = jest.requireActual('crypto-js');
  return {
    ...originalModule,
    AES: {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  };
});

const CryptoJS = require('crypto-js');

describe('apiKeyManager', () => {
  const validAPIKey = 'glm-test-' + 'a'.repeat(32);
  const deepseekKey = 'sk-' + 'b'.repeat(32);

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch = jest.fn();

    (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue({
      toString: () => 'encrypted-string',
    });
    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
      toString: () => validAPIKey,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('encrypts and stores the API key using the BigModel storage key', () => {
    saveAPIKey(validAPIKey, 'bigmodel');

    expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(validAPIKey, 'paper-detective-v1-2026');
    expect(localStorage.getItem('bigmodel_api_key_encrypted')).toBe('encrypted-string');
  });

  it('decrypts and returns the saved key', () => {
    localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-string');
    localStorage.setItem('ai_active_provider', 'bigmodel');

    expect(getAPIKey('bigmodel')).toBe(validAPIKey);
    expect(hasAPIKey('bigmodel')).toBe(true);
  });

  it('clears invalid decrypted values from storage', () => {
    localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-string');
    localStorage.setItem('ai_active_provider', 'bigmodel');
    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
      toString: () => 'short-key',
    });

    expect(getAPIKey('bigmodel')).toBeNull();
    expect(localStorage.getItem('bigmodel_api_key_encrypted')).toBeNull();
  });

  it('clears stored values', () => {
    localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-string');
    localStorage.setItem('bigmodel_api_key_test_result', JSON.stringify({ success: true }));
    localStorage.setItem('ai_active_provider', 'bigmodel');

    clearAPIKey('bigmodel');

    expect(localStorage.getItem('bigmodel_api_key_encrypted')).toBeNull();
    expect(localStorage.getItem('bigmodel_api_key_test_result')).toBeNull();
  });

  it('tests a valid key through the current HTTP API path', async () => {
    localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-string');
    localStorage.setItem('ai_active_provider', 'bigmodel');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ choices: [] }),
    });

    const result = await testAPIKey('bigmodel');

    expect(result).toEqual({
      success: true,
      message: 'API Key 验证成功',
    });
    expect(global.fetch).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('bigmodel_api_key_test_result') || '{}').success).toBe(true);
  });

  it('maps a 401 response to INVALID_API_KEY', async () => {
    localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-string');
    localStorage.setItem('ai_active_provider', 'bigmodel');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await testAPIKey('bigmodel');

    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_API_KEY');
  });

  it('validates format by length rather than Anthropic prefix', () => {
    expect(validateAPIKeyFormat(validAPIKey, 'bigmodel')).toEqual({ valid: true });
    expect(validateAPIKeyFormat(deepseekKey, 'deepseek')).toEqual({ valid: true });
    expect(validateAPIKeyFormat('', 'bigmodel')).toEqual({
      valid: false,
      error: 'API Key 不能为空',
    });
    expect(validateAPIKeyFormat('short-key', 'bigmodel').valid).toBe(false);
  });

  it('returns BigModel-specific help text', () => {
    const help = getAPIKeyHelpText('bigmodel');

    expect(help.link).toBe('https://open.bigmodel.cn/');
    expect(help.steps.length).toBeGreaterThan(0);
    expect(help.costExample).toContain('glm-4.7-flash');
  });

  it('returns the stored last test result', () => {
    localStorage.setItem(
      'bigmodel_api_key_test_result',
      JSON.stringify({ success: true, timestamp: '2026-03-17T12:00:00Z' })
    );
    localStorage.setItem('ai_active_provider', 'bigmodel');

    expect(getLastTestResult('bigmodel')).toEqual({
      success: true,
      timestamp: '2026-03-17T12:00:00Z',
    });
  });
});
