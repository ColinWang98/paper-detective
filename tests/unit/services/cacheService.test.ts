/**
 * Cache Service Unit Tests
 * 测试AI分析结果缓存服务
 */

import { CacheService, cacheService } from '@/services/cacheService';
import { db } from '@/lib/db';
import type { AIAnalysis } from '@/types/ai.types';

// Mock database
jest.mock('@/lib/db');

const mockDB = db as jest.Mocked<typeof db>;

describe('CacheService', () => {
  let service: CacheService;

  const mockPaperId = 1;
  const mockAnalysis: AIAnalysis = {
    paperId: mockPaperId,
    summary: 'This paper introduces transformers',
    researchQuestion: 'How to improve NLP performance?',
    methods: ['Self-attention', 'Parallel processing'],
    findings: ['Transformers achieve SOTA results'],
    limitations: ['Requires large datasets'],
    tokenUsage: { input: 5000, output: 2000, total: 7000 },
    estimatedCost: 0.06,
    createdAt: '2026-02-10T10:00:00Z',
    model: 'glm-4.7-flash',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CacheService();

    // Setup default database mocks
    mockDB.aiAnalysis = {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      first: jest.fn(),
      delete: jest.fn(),
      put: jest.fn(),
      update: jest.fn(),
      clear: jest.fn(),
      toArray: jest.fn(),
      bulkDelete: jest.fn(),
    } as any;
  });

  describe('getAnalysis', () => {
    it('should return cached analysis if found and not expired', async () => {
      const recentDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const cachedResult = { ...mockAnalysis, id: 1, createdAt: recentDate.toISOString() };

      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockResolvedValue(cachedResult);

      const result = await service.getAnalysis(mockPaperId);

      expect(result).toEqual(cachedResult);
    });

    it('should return null if no cached analysis exists', async () => {
      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockResolvedValue(undefined);

      const result = await service.getAnalysis(mockPaperId);

      expect(result).toBeNull();
    });

    it('should return null and delete expired cache', async () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      const expiredResult = { ...mockAnalysis, id: 1, createdAt: oldDate.toISOString() };

      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockResolvedValue(expiredResult);

      const result = await service.getAnalysis(mockPaperId);

      expect(result).toBeNull();
      expect(mockDB.aiAnalysis.delete).toHaveBeenCalledWith(1);
    });

    it('should handle database errors gracefully', async () => {
      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getAnalysis(mockPaperId);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Cache read error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveAnalysis', () => {
    it('should save analysis to database', async () => {
      mockDB.aiAnalysis.put = jest.fn().mockResolvedValue(1);

      await service.saveAnalysis(mockPaperId, mockAnalysis);

      expect(mockDB.aiAnalysis.put).toHaveBeenCalledWith(
        expect.objectContaining({
          paperId: mockPaperId,
          summary: mockAnalysis.summary,
        })
      );
    });

    it('should not throw error if save fails', async () => {
      mockDB.aiAnalysis.put = jest.fn().mockRejectedValue(new Error('Save failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.saveAnalysis(mockPaperId, mockAnalysis)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Cache write error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateAnalysis', () => {
    it('should update existing cached analysis', async () => {
      const existing = { ...mockAnalysis, id: 1 };
      const updates = { summary: 'Updated summary' };

      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockResolvedValue(existing);

      await service.updateAnalysis(mockPaperId, updates);

      expect(mockDB.aiAnalysis.update).toHaveBeenCalledWith(1, updates);
    });

    it('should not call update if no existing analysis', async () => {
      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockResolvedValue(undefined);

      await service.updateAnalysis(mockPaperId, { summary: 'Updated' });

      expect(mockDB.aiAnalysis.update).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.updateAnalysis(mockPaperId, { summary: 'Updated' })
      ).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteAnalysis', () => {
    it('should delete cached analysis', async () => {
      const existing = { ...mockAnalysis, id: 1 };

      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockResolvedValue(existing);

      await service.deleteAnalysis(mockPaperId);

      expect(mockDB.aiAnalysis.delete).toHaveBeenCalledWith(1);
    });

    it('should not call delete if no existing analysis', async () => {
      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockResolvedValue(undefined);

      await service.deleteAnalysis(mockPaperId);

      expect(mockDB.aiAnalysis.delete).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.deleteAnalysis(mockPaperId)
      ).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cached analyses', async () => {
      await service.clearAllCache();

      expect(mockDB.aiAnalysis.clear).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockDB.aiAnalysis.clear = jest.fn().mockRejectedValue(new Error('Clear failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.clearAllCache()).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Cache clear error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getCacheStats', () => {
    it('should return stats when cache has entries', async () => {
      const analyses = [
        { ...mockAnalysis, createdAt: '2026-02-01T10:00:00Z' },
        { ...mockAnalysis, paperId: 2, createdAt: '2026-02-10T12:00:00Z' },
      ];

      mockDB.aiAnalysis.toArray = jest.fn().mockResolvedValue(analyses);

      const stats = await service.getCacheStats();

      expect(stats).toEqual({
        count: 2,
        totalSize: expect.any(Number),
        oldest: '2026-02-01T10:00:00.000Z',
        newest: '2026-02-10T12:00:00.000Z',
      });
    });

    it('should return empty stats when cache is empty', async () => {
      mockDB.aiAnalysis.toArray = jest.fn().mockResolvedValue([]);

      const stats = await service.getCacheStats();

      expect(stats).toEqual({
        count: 0,
        totalSize: 0,
        oldest: null,
        newest: null,
      });
    });

    it('should estimate total size based on JSON string length', async () => {
      const analyses = [
        { ...mockAnalysis, createdAt: '2026-02-10T10:00:00Z' },
      ];

      mockDB.aiAnalysis.toArray = jest.fn().mockResolvedValue(analyses);

      const stats = await service.getCacheStats();

      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.totalSize).toBe(JSON.stringify(analyses).length);
    });

    it('should handle errors gracefully', async () => {
      mockDB.aiAnalysis.toArray = jest.fn().mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const stats = await service.getCacheStats();

      expect(stats).toEqual({
        count: 0,
        totalSize: 0,
        oldest: null,
        newest: null,
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanExpiredCache', () => {
    it('should delete expired cache entries', async () => {
      const now = Date.now();
      const expired = { ...mockAnalysis, id: 1, createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString() };
      const valid = { ...mockAnalysis, id: 2, paperId: 2, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString() };

      mockDB.aiAnalysis.toArray = jest.fn().mockResolvedValue([expired, valid]);

      const count = await service.cleanExpiredCache();

      expect(count).toBe(1);
      expect(mockDB.aiAnalysis.bulkDelete).toHaveBeenCalledWith([1]);
    });

    it('should return 0 when no expired entries', async () => {
      const now = Date.now();
      const valid = { ...mockAnalysis, id: 1, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString() };

      mockDB.aiAnalysis.toArray = jest.fn().mockResolvedValue([valid]);

      const count = await service.cleanExpiredCache();

      expect(count).toBe(0);
      expect(mockDB.aiAnalysis.bulkDelete).not.toHaveBeenCalled();
    });

    it('should return 0 when cache is empty', async () => {
      mockDB.aiAnalysis.toArray = jest.fn().mockResolvedValue([]);

      const count = await service.cleanExpiredCache();

      expect(count).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockDB.aiAnalysis.toArray = jest.fn().mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const count = await service.cleanExpiredCache();

      expect(count).toBe(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cache Duration', () => {
    it('should use 7 days for analysis cache', () => {
      const service = new CacheService();
      const privateDuration = (service as any).CACHE_DURATION;

      expect(privateDuration.ANALYSIS).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should use Infinity for summary cache', () => {
      const service = new CacheService();
      const privateDuration = (service as any).CACHE_DURATION;

      expect(privateDuration.SUMMARY).toBe(Infinity);
    });
  });

  describe('Singleton export', () => {
    it('should export singleton instance', () => {
      expect(cacheService).toBeInstanceOf(CacheService);
    });

    it('should export a usable cacheService object across imports', () => {
      const { cacheService: cacheService2 } = require('@/services/cacheService');
      expect(cacheService2).toBeDefined();
      expect(typeof cacheService2.getAnalysis).toBe('function');
    });
  });

  describe('Performance', () => {
    it('should retrieve cache quickly (< 50ms)', async () => {
      const cachedResult = { ...mockAnalysis, id: 1, createdAt: new Date().toISOString() };

      (mockDB.aiAnalysis.where('paperId').equals(mockPaperId).first as jest.Mock)
        .mockImplementation(async () => {
          // Simulate fast database read
          await new Promise(resolve => setTimeout(resolve, 10));
          return cachedResult;
        });

      const startTime = performance.now();
      await service.getAnalysis(mockPaperId);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
    });
  });
});
