/**
 * API Key Manager Unit Tests
 * 测试API密钥管理服务
 */

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
import type { AIErrorCode } from '@/types/ai.types';

// Mock CryptoJS
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

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

const CryptoJS = require('crypto-js');
const MockAnthropic = require('@anthropic-ai/sdk').default;

describe('API Key Manager', () => {
  const validAPIKey = 'sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyz';
  const invalidAPIKey = 'invalid-key-format';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Setup default mocks
    (CryptoJS.AES.encrypt as jest.Mock).mockReturnValue({
      toString: () => 'encrypted-string',
    });

    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
      toString: (enc: any) => validAPIKey,
    });

    // Mock successful API test
    MockAnthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          id: 'test-id',
          content: [],
        }),
      },
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveAPIKey', () => {
    it('should encrypt and save API key', () => {
      saveAPIKey(validAPIKey);

      expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(
        validAPIKey,
        'paper-detective-v1-2026'
      );
      expect(localStorage.getItem('anthropic_api_key_encrypted')).toBe('encrypted-string');
    });

    it('should clear previous test result', () => {
      localStorage.setItem('anthropic_api_key_test_result', JSON.stringify({ success: false }));

      saveAPIKey(validAPIKey);

      expect(localStorage.getItem('anthropic_api_key_test_result')).toBeNull();
    });

    it('should throw error for invalid format', () => {
      expect(() => saveAPIKey(invalidAPIKey)).toThrow('Invalid API Key format');
    });

    it('should throw error for empty string', () => {
      expect(() => saveAPIKey('')).toThrow('Invalid API Key format');
    });

    it('should throw error for key without sk-ant- prefix', () => {
      expect(() => saveAPIKey('sk-test123')).toThrow('Invalid API Key format');
    });

    it('should not throw for valid sk-ant- key', () => {
      expect(() => saveAPIKey(validAPIKey)).not.toThrow();
    });

    it('should handle encryption errors', () => {
      (CryptoJS.AES.encrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      expect(() => saveAPIKey(validAPIKey)).toThrow('Failed to save API Key');
    });
  });

  describe('getAPIKey', () => {
    it('should decrypt and return API key', () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      const result = getAPIKey();

      expect(CryptoJS.AES.decrypt).toHaveBeenCalledWith(
        'encrypted-string',
        'paper-detective-v1-2026'
      );
      expect(result).toBe(validAPIKey);
    });

    it('should return null when no key is saved', () => {
      const result = getAPIKey();

      expect(result).toBeNull();
    });

    it('should return null and clear corrupted data', () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'corrupted-data');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'invalid-key',
      });

      const result = getAPIKey();

      expect(result).toBeNull();
      expect(localStorage.getItem('anthropic_api_key_encrypted')).toBeNull();
    });

    it('should return null and clear invalid format data', () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'invalid-format-key',
      });

      const result = getAPIKey();

      expect(result).toBeNull();
      expect(localStorage.getItem('anthropic_api_key_encrypted')).toBeNull();
    });

    it('should handle decryption errors gracefully', () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = getAPIKey();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to decrypt API Key:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearAPIKey', () => {
    it('should remove API key from storage', () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');
      localStorage.setItem('anthropic_api_key_test_result', JSON.stringify({ success: true }));

      clearAPIKey();

      expect(localStorage.getItem('anthropic_api_key_encrypted')).toBeNull();
      expect(localStorage.getItem('anthropic_api_key_test_result')).toBeNull();
    });

    it('should not throw when storage is empty', () => {
      expect(() => clearAPIKey()).not.toThrow();
    });
  });

  describe('hasAPIKey', () => {
    it('should return true when API key is saved', () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => validAPIKey,
      });

      expect(hasAPIKey()).toBe(true);
    });

    it('should return false when API key is not saved', () => {
      expect(hasAPIKey()).toBe(false);
    });

    it('should return false for invalid saved key', () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'invalid-key',
      });

      expect(hasAPIKey()).toBe(false);
    });
  });

  describe('testAPIKey', () => {
    it('should return success for valid API key', async () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => validAPIKey,
      });

      const result = await testAPIKey();

      expect(result).toEqual({
        success: true,
        message: 'API Key验证成功',
      });

      // Should save test result
      const testResult = JSON.parse(localStorage.getItem('anthropic_api_key_test_result')!);
      expect(testResult.success).toBe(true);
      expect(testResult.timestamp).toBeDefined();
    });

    it('should return error when no API key', async () => {
      const result = await testAPIKey();

      expect(result).toEqual({
        success: false,
        error: 'API_KEY_MISSING',
        message: '请先输入API Key',
      });
    });

    it('should handle 401 unauthorized error', async () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => validAPIKey,
      });

      const mockClient = {
        messages: {
          create: jest.fn().mockRejectedValue({
            status: 401,
          }),
        },
      };
      MockAnthropic.mockImplementation(() => mockClient);

      const result = await testAPIKey();

      expect(result).toEqual({
        success: false,
        error: 'INVALID_API_KEY',
        message: 'API Key无效,请检查输入',
      });
    });

    it('should handle 429 rate limit error', async () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => validAPIKey,
      });

      const mockClient = {
        messages: {
          create: jest.fn().mockRejectedValue({
            status: 429,
          }),
        },
      };
      MockAnthropic.mockImplementation(() => mockClient);

      const result = await testAPIKey();

      expect(result).toEqual({
        success: false,
        error: 'RATE_LIMIT',
        message: '请求过于频繁,请稍后再试',
      });
    });

    it('should handle network errors', async () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => validAPIKey,
      });

      const mockClient = {
        messages: {
          create: jest.fn().mockRejectedValue({
            name: 'NetworkError',
            message: 'Network error',
          }),
        },
      };
      MockAnthropic.mockImplementation(() => mockClient);

      const result = await testAPIKey();

      expect(result).toEqual({
        success: false,
        error: 'NETWORK_ERROR',
        message: '网络连接失败,请检查网络设置',
      });
    });

    it('should save failed test result', async () => {
      localStorage.setItem('anthropic_api_key_encrypted', 'encrypted-string');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => validAPIKey,
      });

      const mockClient = {
        messages: {
          create: jest.fn().mockRejectedValue({
            status: 401,
          }),
        },
      };
      MockAnthropic.mockImplementation(() => mockClient);

      await testAPIKey();

      const testResult = JSON.parse(localStorage.getItem('anthropic_api_key_test_result')!);
      expect(testResult.success).toBe(false);
      expect(testResult.error).toBe('INVALID_API_KEY');
      expect(testResult.timestamp).toBeDefined();
    });
  });

  describe('getLastTestResult', () => {
    it('should return last test result', () => {
      const testResult = {
        success: true,
        timestamp: '2026-02-10T10:00:00Z',
      };
      localStorage.setItem('anthropic_api_key_test_result', JSON.stringify(testResult));

      const result = getLastTestResult();

      expect(result).toEqual(testResult);
    });

    it('should return null when no test result', () => {
      const result = getLastTestResult();

      expect(result.success).toBeNull();
    });

    it('should handle corrupted test result', () => {
      localStorage.setItem('anthropic_api_key_test_result', 'invalid-json');

      const result = getLastTestResult();

      expect(result.success).toBeNull();
    });
  });

  describe('validateAPIKeyFormat', () => {
    it('should validate correct format', () => {
      const result = validateAPIKeyFormat(validAPIKey);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty string', () => {
      const result = validateAPIKeyFormat('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API Key不能为空');
    });

    it('should reject non-sk-ant prefix', () => {
      const result = validateAPIKeyFormat('sk-test123');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('sk-ant-');
    });

    it('should reject short keys', () => {
      const result = validateAPIKeyFormat('sk-ant-123');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('长度不足');
    });

    it('should accept valid length keys', () => {
      const longKey = 'sk-ant-' + 'a'.repeat(50);
      const result = validateAPIKeyFormat(longKey);

      expect(result.valid).toBe(true);
    });
  });

  describe('getAPIKeyHelpText', () => {
    it('should return help information', () => {
      const help = getAPIKeyHelpText();

      expect(help.steps).toBeInstanceOf(Array);
      expect(help.steps.length).toBeGreaterThan(0);
      expect(help.link).toContain('anthropic.com');
      expect(help.costExample).toContain('$');
    });

    it('should include all required steps', () => {
      const help = getAPIKeyHelpText();

      expect(help.steps[0]).toContain('Anthropic');
      expect(help.steps[1]).toContain('注册');
      expect(help.steps.some(s => s.includes('API Keys'))).toBe(true);
      expect(help.steps.some(s => s.includes('Create Key'))).toBe(true);
    });

    it('should include console link', () => {
      const help = getAPIKeyHelpText();

      expect(help.link).toBe('https://console.anthropic.com/');
    });

    it('should include cost example', () => {
      const help = getAPIKeyHelpText();

      expect(help.costExample).toContain('100篇');
      expect(help.costExample).toContain('$6');
    });
  });

  describe('Security', () => {
    it('should always encrypt before saving', () => {
      saveAPIKey(validAPIKey);

      const savedValue = localStorage.getItem('anthropic_api_key_encrypted');
      expect(savedValue).not.toBe(validAPIKey);
      expect(savedValue).toBe('encrypted-string');
    });

    it('should never store plain text key', () => {
      saveAPIKey(validAPIKey);

      const allValues = Object.values(localStorage);
      expect(allValues).not.toContain(validAPIKey);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle save -> retrieve -> clear flow', () => {
      // Save
      saveAPIKey(validAPIKey);
      expect(hasAPIKey()).toBe(true);

      // Retrieve
      const retrieved = getAPIKey();
      expect(retrieved).toBe(validAPIKey);

      // Clear
      clearAPIKey();
      expect(hasAPIKey()).toBe(false);
      expect(getAPIKey()).toBeNull();
    });

    it('should handle save -> test -> result flow', async () => {
      // Save
      saveAPIKey(validAPIKey);

      // Test
      const testResult = await testAPIKey();
      expect(testResult.success).toBe(true);

      // Get result
      const lastResult = getLastTestResult();
      expect(lastResult.success).toBe(true);
      expect(lastResult.timestamp).toBeDefined();
    });
  });

  describe('Error recovery', () => {
    it('should recover from corrupted storage', () => {
      // Save corrupted data
      localStorage.setItem('anthropic_api_key_encrypted', 'corrupted');

      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      // getAPIKey should clear corrupted data and return null
      const result = getAPIKey();
      expect(result).toBeNull();
      expect(localStorage.getItem('anthropic_api_key_encrypted')).toBeNull();
    });

    it('should allow retry after clear', async () => {
      // Save invalid key
      localStorage.setItem('anthropic_api_key_encrypted', 'invalid');

      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue({
        toString: () => 'invalid',
      });

      expect(getAPIKey()).toBeNull();

      // Clear and retry
      clearAPIKey();
      saveAPIKey(validAPIKey);

      expect(hasAPIKey()).toBe(true);
    });
  });
});
