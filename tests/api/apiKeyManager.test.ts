import CryptoJS from 'crypto-js';

import {
  clearAPIKey,
  getAPIKey,
  getAPIKeyHelpText,
  getLastTestResult,
  hasAPIKey,
  saveAPIKey,
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

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Hi',
            },
          },
        ],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('saveAPIKey', () => {
    it('encrypts and stores the API key', () => {
      (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue({
        toString: () => 'encrypted-key',
      });

      saveAPIKey('glm-valid-key-12345678901234567890');

      expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(
        'glm-valid-key-12345678901234567890',
        expect.any(String)
      );
      expect(localStorage.getItem('bigmodel_api_key_encrypted')).toBe('encrypted-key');
    });

    it('rejects invalid key format', () => {
      expect(() => saveAPIKey('invalid-key')).toThrow('Failed to save API Key');
    });
  });

  describe('getAPIKey', () => {
    it('decrypts and returns the stored API key', () => {
      localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-key');
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'glm-valid-key-12345678901234567890',
      });

      expect(getAPIKey()).toBe('glm-valid-key-12345678901234567890');
      expect(CryptoJS.AES.decrypt).toHaveBeenCalledWith('encrypted-key', expect.any(String));
    });

    it('returns null and clears storage for invalid decrypted content', () => {
      localStorage.setItem('bigmodel_api_key_encrypted', 'bad-encrypted-key');
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'not-an-api-key',
      });

      expect(getAPIKey()).toBeNull();
      expect(localStorage.getItem('bigmodel_api_key_encrypted')).toBeNull();
    });

    it('returns null when decryption throws', () => {
      localStorage.setItem('bigmodel_api_key_encrypted', 'bad-encrypted-key');
      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('decrypt failed');
      });

      expect(getAPIKey()).toBeNull();
    });
  });

  describe('clearAPIKey and hasAPIKey', () => {
    it('clears stored data', () => {
      localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-key');
      localStorage.setItem('bigmodel_api_key_test_result', '{"success":true}');

      clearAPIKey();

      expect(localStorage.getItem('bigmodel_api_key_encrypted')).toBeNull();
      expect(localStorage.getItem('bigmodel_api_key_test_result')).toBeNull();
    });

    it('reports whether a key exists', () => {
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'glm-valid-key-12345678901234567890',
      });

      expect(hasAPIKey()).toBe(false);

      localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-key');
      expect(hasAPIKey()).toBe(true);
    });
  });

  describe('validateAPIKeyFormat', () => {
    it('accepts a valid key', () => {
      expect(
        validateAPIKeyFormat('glm-valid-key-12345678901234567890').valid
      ).toBe(true);
    });

    it('rejects missing prefix', () => {
      expect(validateAPIKeyFormat('bad-key')).toEqual({
        valid: false,
        error: expect.any(String),
      });
    });

    it('rejects too-short keys', () => {
      expect(validateAPIKeyFormat('glm-short')).toEqual({
        valid: false,
        error: expect.any(String),
      });
    });
  });

  describe('testAPIKey', () => {
    it('returns missing-key error when no key is stored', async () => {
      const result = await testAPIKey();

      expect(result.success).toBe(false);
      expect(result.error).toBe('API_KEY_MISSING');
    });

    it('tests a stored key successfully and persists the result', async () => {
      localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-key');
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'glm-valid-key-12345678901234567890',
      });

      const result = await testAPIKey();

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer glm-valid-key-12345678901234567890',
          }),
        })
      );
      expect(getLastTestResult().success).toBe(true);
    });

    it('maps authentication failures to INVALID_API_KEY', async () => {
      localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-key');
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'glm-valid-key-12345678901234567890',
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await testAPIKey();

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_API_KEY');
      expect(getLastTestResult().success).toBe(false);
    });

    it('maps network failures to NETWORK_ERROR', async () => {
      localStorage.setItem('bigmodel_api_key_encrypted', 'encrypted-key');
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'glm-valid-key-12345678901234567890',
      });

      fetchMock.mockRejectedValueOnce(new Error('network down'));

      const result = await testAPIKey();

      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
    });
  });

  describe('getAPIKeyHelpText', () => {
    it('returns BigModel-specific help text', () => {
      const help = getAPIKeyHelpText();

      expect(help.link).toContain('bigmodel.cn');
      expect(help.steps.join(' ')).toContain('BigModel');
      expect(help.costExample).toContain('glm-4.7-flash');
    });
  });
});
