'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  CloudOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { useSync, type SyncState } from '@/lib/sync/backgroundSync';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
}

export default function OfflineIndicator() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: 'unknown',
    effectiveType: '4g',
    downlink: 10,
  });
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const sync = useSync();

  // Initialize network status and sync subscription
  useEffect(() => {
    // Get initial network status
    const updateNetworkStatus = () => {
      const connection = (navigator as { connection?: NetworkInformation }).connection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 10,
      });
    };

    // Subscribe to sync state
    const unsubscribe = sync.subscribe((state) => {
      setSyncState(state);
    });

    // Listen for network changes
    const handleOnline = () => {
      updateNetworkStatus();
      // Trigger sync when coming back online
      sync.triggerSync();
    };

    const handleOffline = () => {
      updateNetworkStatus();
    };

    // Listen for connection changes (if supported)
    const connection = (navigator as { connection?: NetworkInformation }).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
      unsubscribe();
    };
  }, [sync]);

  // Handle manual reconnect
  const handleReconnect = useCallback(async () => {
    setIsReconnecting(true);
    
    try {
      // Try to fetch a small resource to verify connection
      const response = await fetch('/api/sync/status', { 
        method: 'GET',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        // Connection restored
        setNetworkStatus(prev => ({ ...prev, isOnline: true }));
        await sync.triggerSync();
      }
    } catch {
      // Still offline
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
    } finally {
      setIsReconnecting(false);
    }
  }, [sync]);

  // Get status indicator config
  const getStatusConfig = () => {
    // Sync in progress
    if (syncState?.status === 'syncing') {
      return {
        icon: Loader2,
        iconClass: 'animate-spin text-blue-400',
        bgClass: 'bg-blue-500/10 border-blue-500/30',
        text: '正在同步...',
        textClass: 'text-blue-400',
        showBadge: true,
        badgeCount: syncState.pendingCount,
      };
    }

    // Pending operations
    if (syncState && syncState.pendingCount > 0 && networkStatus.isOnline) {
      return {
        icon: ArrowUpDown,
        iconClass: 'text-yellow-400',
        bgClass: 'bg-yellow-500/10 border-yellow-500/30',
        text: `${syncState.pendingCount} 项待同步`,
        textClass: 'text-yellow-400',
        showBadge: true,
        badgeCount: syncState.pendingCount,
      };
    }

    // Offline
    if (!networkStatus.isOnline) {
      return {
        icon: CloudOff,
        iconClass: 'text-rose-400',
        bgClass: 'bg-rose-500/10 border-rose-500/30',
        text: '离线模式',
        textClass: 'text-rose-400',
        showBadge: false,
      };
    }

    // Online - all synced
      return {
        icon: CheckCircle2,
      iconClass: 'text-green-400',
      bgClass: 'bg-green-500/10 border-green-500/30',
      text: '已同步',
      textClass: 'text-green-400',
      showBadge: false,
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  // Don't show if everything is fine and no details requested
  if (networkStatus.isOnline && !syncState?.pendingCount && !showDetails) {
    return (
      <button
        onClick={() => setShowDetails(true)}
        className="fixed bottom-4 right-4 z-40 p-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
        title="点击显示网络状态"
      >
        <CheckCircle2 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-4 right-4 z-40 ${showDetails ? 'w-80' : 'auto'}`}
      >
        {/* Compact View */}
        {!showDetails && (
          <button
            onClick={() => setShowDetails(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${status.bgClass} backdrop-blur-sm transition-all hover:scale-105`}
          >
            <StatusIcon className={`w-4 h-4 ${status.iconClass}`} />
            <span className={`text-sm font-medium ${status.textClass}`}>
              {status.text}
            </span>
            {status.showBadge && (status.badgeCount ?? 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-current rounded-full text-slate-900">
                {status.badgeCount ?? 0}
              </span>
            )}
          </button>
        )}

        {/* Detailed View */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl border ${status.bgClass} backdrop-blur-sm overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${status.iconClass}`} />
                <span className={`font-medium ${status.textClass}`}>
                  {status.text}
                </span>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-gray-400 text-lg">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Network Status */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${networkStatus.isOnline ? 'bg-green-500/20' : 'bg-rose-500/20'}`}>
                  {networkStatus.isOnline ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {networkStatus.isOnline ? '网络已连接' : '网络已断开'}
                  </p>
                  {networkStatus.isOnline && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {networkStatus.effectiveType.toUpperCase()} · {networkStatus.downlink} Mbps
                    </p>
                  )}
                </div>
              </div>

              {/* Sync Status */}
              {syncState && (
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    syncState.status === 'syncing' ? 'bg-blue-500/20' :
                    syncState.pendingCount > 0 ? 'bg-yellow-500/20' :
                    'bg-green-500/20'
                  }`}>
                    <Database className={`w-4 h-4 ${
                      syncState.status === 'syncing' ? 'text-blue-400 animate-pulse' :
                      syncState.pendingCount > 0 ? 'text-yellow-400' :
                      'text-green-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {syncState.status === 'syncing' ? '正在同步数据...' :
                       syncState.pendingCount > 0 ? `${syncState.pendingCount} 项待同步` :
                       '数据已同步'}
                    </p>
                    {syncState.lastSyncTime && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        上次同步: {new Date(syncState.lastSyncTime).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {syncState?.error && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{syncState.error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {!networkStatus.isOnline && (
                  <button
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isReconnecting ? 'animate-spin' : ''}`} />
                    {isReconnecting ? '连接中...' : '重新连接'}
                  </button>
                )}

                {syncState && syncState.pendingCount > 0 && networkStatus.isOnline && (
                  <button
                    onClick={() => sync.triggerSync()}
                    disabled={syncState.status === 'syncing'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 rounded-lg text-sm font-medium text-blue-400 transition-colors"
                  >
                    {syncState.status === 'syncing' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        同步中...
                      </>
                    ) : (
                      <>
                        <ArrowUpDown className="w-4 h-4" />
                        立即同步
                      </>
                    )}
                  </button>
                )}

                {networkStatus.isOnline && syncState?.status !== 'syncing' && syncState?.pendingCount === 0 && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg text-sm font-medium text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    全部同步完成
                  </div>
                )}
              </div>

              {/* Conflicts Warning */}
              {syncState && syncState.conflicts.length > 0 && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">
                      {syncState.conflicts.length} 个同步冲突
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    某些数据在离线期间被修改。请访问同步页面解决冲突。
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Network Information API type
declare interface NetworkInformation extends EventTarget {
  readonly type: string;
  readonly effectiveType: string;
  readonly downlink: number;
  readonly rtt: number;
  readonly saveData: boolean;
  onchange: ((this: NetworkInformation, ev: Event) => unknown) | null;
}

declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
  }
}
