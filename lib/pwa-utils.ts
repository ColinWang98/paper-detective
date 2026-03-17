/**
 * PWA Utility Functions
 * Helper functions for PWA functionality
 */

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Get cache storage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    
    return {
      usage,
      quota,
      percentUsed: quota ? (usage / quota) * 100 : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<boolean> {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear specific cache
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  if (!('caches' in window)) return false;

  try {
    return await caches.delete(cacheName);
  } catch {
    return false;
  }
}

// ============================================================================
// Service Worker Utilities
// ============================================================================

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Check if service worker is registered
 */
export async function isServiceWorkerRegistered(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    return !!registration.active;
  } catch {
    return false;
  }
}

/**
 * Get service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(
  message: Record<string, unknown>
): Promise<unknown> {
  const controller = isServiceWorkerSupported()
    ? navigator.serviceWorker.controller
    : null;

  if (!controller) {
    throw new Error('Service Worker not available');
  }

  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      if (event.data?.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    controller.postMessage(message, [channel.port2]);
  });
}

// ============================================================================
// Network Utilities
// ============================================================================

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get connection info
 */
export function getConnectionInfo(): {
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
} | null {
  const connection = (navigator as { connection?: NetworkInformation }).connection;
  
  if (!connection) return null;

  return {
    type: connection.type || 'unknown',
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 50,
    saveData: connection.saveData || false,
  };
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  const connection = getConnectionInfo();
  if (!connection) return false;
  
  return connection.effectiveType === '2g' || 
         connection.effectiveType === 'slow-2g' ||
         connection.saveData;
}

// ============================================================================
// Install Prompt
// ============================================================================

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Initialize install prompt listener
 */
export function initInstallPrompt(): () => void {
  const handler = (e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    deferredPrompt = e;
  };

  window.addEventListener('beforeinstallprompt', handler);

  return () => {
    window.removeEventListener('beforeinstallprompt', handler);
  };
}

/**
 * Get deferred install prompt
 */
export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/**
 * Clear deferred prompt
 */
export function clearDeferredPrompt(): void {
  deferredPrompt = null;
}

// ============================================================================
// PWA Detection
// ============================================================================

/**
 * Check if running as installed PWA
 */
export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as { standalone?: boolean }).standalone === true;
}

/**
 * Check if iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
         !(window as { MSStream?: unknown }).MSStream;
}

/**
 * Check if Safari
 */
export function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Check if can install PWA
 */
export function canInstallPWA(): boolean {
  return isServiceWorkerSupported() && !isInstalledPWA();
}

// ============================================================================
// Background Sync
// ============================================================================

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return 'sync' in ServiceWorkerRegistration.prototype;
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (!isBackgroundSyncSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Periodic Background Sync
// ============================================================================

/**
 * Check if periodic background sync is supported
 */
export function isPeriodicSyncSupported(): boolean {
  return 'periodicSync' in ServiceWorkerRegistration.prototype;
}

/**
 * Request periodic sync permission
 */
export async function requestPeriodicSyncPermission(): Promise<boolean> {
  if (!isPeriodicSyncSupported()) return false;

  try {
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as PermissionName,
    });
    return status.state === 'granted';
  } catch {
    return false;
  }
}

// ============================================================================
// Push Notifications
// ============================================================================

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return 'PushManager' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return await Notification.requestPermission();
}

/**
 * Show notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  new Notification(title, options);
}

// ============================================================================
// Types
// ============================================================================

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

export default {
  getStorageEstimate,
  formatBytes,
  clearAllCaches,
  clearCache,
  isServiceWorkerSupported,
  isServiceWorkerRegistered,
  getServiceWorkerRegistration,
  sendMessageToSW,
  isOnline,
  getConnectionInfo,
  isSlowConnection,
  initInstallPrompt,
  getDeferredPrompt,
  clearDeferredPrompt,
  isInstalledPWA,
  isIOS,
  isSafari,
  canInstallPWA,
  isBackgroundSyncSupported,
  registerBackgroundSync,
  isPeriodicSyncSupported,
  requestPeriodicSyncPermission,
  isPushSupported,
  requestNotificationPermission,
  showNotification,
};
