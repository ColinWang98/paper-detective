'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  WifiOff, 
  RefreshCw, 
  FileText, 
  BookOpen, 
  Clock,
  ChevronRight,
  Trash2,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { db, dbHelpers } from '@/lib/db';
import type { Paper, Highlight } from '@/types';

interface CachedContent {
  papers: Paper[];
  highlights: Highlight[];
  lastUpdated: Date;
}

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [cachedContent, setCachedContent] = useState<CachedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheSize, setCacheSize] = useState<string>('0 MB');

  // Check network status and load cached content
  useEffect(() => {
    const checkStatus = async () => {
      setIsOnline(navigator.onLine);
      
      try {
        // Load cached papers from IndexedDB
        const papers = await dbHelpers.getAllPapers();
        const highlights = await db.highlights.toArray();
        
        setCachedContent({
          papers: papers.slice(0, 5), // Show last 5 papers
          highlights: highlights.slice(0, 10), // Show last 10 highlights
          lastUpdated: new Date(),
        });

        // Estimate cache size
        await estimateCacheSize();
      } catch (error) {
        console.error('Failed to load cached content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Listen for network changes
    const handleOnline = () => {
      setIsOnline(true);
      router.refresh();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  // Estimate cache storage usage
  const estimateCacheSize = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const sizeInMB = (usage / (1024 * 1024)).toFixed(2);
        setCacheSize(`${sizeInMB} MB`);
      } catch (error) {
        console.error('Failed to estimate cache size:', error);
      }
    }
  };

  // Handle reconnection attempt
  const handleReconnect = () => {
    if (navigator.onLine) {
      router.push('/');
    } else {
      window.location.reload();
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    if (confirm('确定要清除所有缓存吗？这将删除离线数据。')) {
      try {
        // Clear Service Worker caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        setCacheSize('0 MB');
        alert('缓存已清除');
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  };

  // Navigate to paper
  const navigateToPaper = (paperId: number) => {
    router.push(`/?paper=${paperId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Paper Detective</h1>
                <p className="text-sm text-gray-400">文献侦探</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
              <WifiOff className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">离线模式</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Offline Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-10 h-10 text-rose-400" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">您当前处于离线状态</h2>
              <p className="text-gray-400 mb-4">
                无法连接到网络，但您仍然可以访问已缓存的内容和数据。
                所有更改将在网络恢复后自动同步。
              </p>
              
              <button
                onClick={handleReconnect}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                重新连接
              </button>
            </div>
          </div>
        </motion.div>

        {/* Cached Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Cached Papers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">已缓存的文献</h3>
              <span className="ml-auto text-sm text-gray-400">
                {cachedContent?.papers.length || 0} 篇
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : cachedContent?.papers.length ? (
              <div className="space-y-2">
                {cachedContent.papers.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => paper.id && navigateToPaper(paper.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <FileText className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{paper.title}</p>
                      <p className="text-xs text-gray-500">
                        {paper.authors?.[0] || '未知作者'} · {paper.year}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无缓存的文献</p>
              </div>
            )}
          </motion.div>

          {/* Recent Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold">最近的高亮</h3>
              <span className="ml-auto text-sm text-gray-400">
                {cachedContent?.highlights.length || 0} 条
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : cachedContent?.highlights.length ? (
              <div className="space-y-2">
                {cachedContent.highlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className={`p-3 rounded-xl bg-white/5 border-l-4 ${
                      highlight.color === 'red' ? 'border-l-red-500' :
                      highlight.color === 'yellow' ? 'border-l-yellow-500' :
                      highlight.color === 'orange' ? 'border-l-orange-500' :
                      'border-l-gray-500'
                    }`}
                  >
                    <p className="text-sm text-gray-300 line-clamp-2">{highlight.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {highlight.priority === 'critical' ? '🔴 关键' :
                       highlight.priority === 'important' ? '🟡 重要' :
                       highlight.priority === 'interesting' ? '🟠 有趣' : '⚪ 存档'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无高亮记录</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Cache Info & Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">缓存管理</h3>
                <p className="text-sm text-gray-400">
                  缓存大小: {cacheSize} · 最后更新: {cachedContent?.lastUpdated.toLocaleString('zh-CN')}
                </p>
              </div>
            </div>

            <button
              onClick={handleClearCache}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清除缓存
            </button>
          </div>

          {/* Offline Capabilities */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">离线功能</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: FileText, label: '查看文献', status: 'available' },
                { icon: BookOpen, label: '阅读高亮', status: 'available' },
                { icon: Clock, label: '后台同步', status: 'pending' },
                { icon: RefreshCw, label: '自动更新', status: 'pending' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    item.status === 'available' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
        >
          <h4 className="font-medium text-blue-400 mb-2">💡 离线使用提示</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• 离线时创建的高亮和笔记将在网络恢复后自动同步</li>
            <li>• 已缓存的PDF文件可以在离线状态下继续阅读</li>
            <li>• AI分析功能需要网络连接，但历史分析结果已缓存</li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}
