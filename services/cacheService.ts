/**
 * Cache Service - AI分析结果缓存
 * 使用IndexedDB缓存AI分析结果，避免重复调用
 */

import { db } from '@/lib/db';
import type { AIAnalysis } from '@/types/ai.types';

export class CacheService {
  /**
   * 缓存时长配置（毫秒）
   */
  private readonly CACHE_DURATION = {
    ANALYSIS: 7 * 24 * 60 * 60 * 1000, // 7天
    SUMMARY: Infinity, // 永久缓存
  };

  /**
   * 获取缓存的分析结果
   */
  async getAnalysis(paperId: number): Promise<AIAnalysis | null> {
    try {
      const cached = await db.aiAnalysis
        .where('paperId')
        .equals(paperId)
        .first();

      if (!cached) {
        return null;
      }

      // 检查是否过期
      const age = Date.now() - new Date(cached.createdAt).getTime();
      if (age > this.CACHE_DURATION.ANALYSIS) {
        // 过期则删除
        await db.aiAnalysis.delete(cached.id!);
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * 保存分析结果到缓存
   */
  async saveAnalysis(paperId: number, result: AIAnalysis): Promise<void> {
    try {
      await db.aiAnalysis.put(result);
    } catch (error) {
      console.error('Cache write error:', error);
      // 缓存失败不影响主流程
    }
  }

  /**
   * 更新现有缓存
   */
  async updateAnalysis(paperId: number, updates: Partial<AIAnalysis>): Promise<void> {
    try {
      const existing = await db.aiAnalysis
        .where('paperId')
        .equals(paperId)
        .first();

      if (existing) {
        await db.aiAnalysis.update(existing.id!, updates);
      }
    } catch (error) {
      console.error('Cache update error:', error);
    }
  }

  /**
   * 删除指定论文的缓存
   */
  async deleteAnalysis(paperId: number): Promise<void> {
    try {
      const existing = await db.aiAnalysis
        .where('paperId')
        .equals(paperId)
        .first();

      if (existing) {
        await db.aiAnalysis.delete(existing.id);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * 清除所有缓存
   */
  async clearAllCache(): Promise<void> {
    try {
      await db.aiAnalysis.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    count: number;
    totalSize: number;
    oldest: string | null;
    newest: string | null;
  }> {
    try {
      const all = await db.aiAnalysis.toArray();

      if (all.length === 0) {
        return { count: 0, totalSize: 0, oldest: null, newest: null };
      }

      const dates = all.map(a => new Date(a.createdAt).getTime());
      const oldest = new Date(Math.min(...dates)).toISOString();
      const newest = new Date(Math.max(...dates)).toISOString();

      // 估算大小（粗略）
      const totalSize = JSON.stringify(all).length;

      return {
        count: all.length,
        totalSize,
        oldest,
        newest,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { count: 0, totalSize: 0, oldest: null, newest: null };
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const all = await db.aiAnalysis.toArray();
      const now = Date.now();
      const expired = all.filter(
        a => now - new Date(a.createdAt).getTime() > this.CACHE_DURATION.ANALYSIS
      );

      if (expired.length > 0) {
        await db.aiAnalysis.bulkDelete(expired.map(e => e.id!));
      }

      return expired.length;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * 通用缓存存储（用于Clip摘要等临时数据）
   * 使用localStorage实现简单KV缓存
   */
  async set(key: string, value: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const item = {
        value,
        expires: Date.now() + ttl,
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * 通用缓存读取
   */
  async get(key: string): Promise<any | null> {
    try {
      const itemStr = localStorage.getItem(`cache_${key}`);
      if (!itemStr) {
        return null;
      }

      const item = JSON.parse(itemStr);

      // 检查是否过期
      if (Date.now() > item.expires) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * 删除指定缓存项
   */
  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
}

// 导出单例
export const cacheService = new CacheService();
