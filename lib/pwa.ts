/**
 * PWA Module
 * Centralized exports for PWA functionality
 */

// Export hooks
export { usePWA } from '@/hooks/usePWA';
export { useSync, type SyncState, type SyncOperation, type SyncConflict } from '@/lib/sync/backgroundSync';

// Export utilities
export {
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
} from '@/lib/pwa-utils';

// Export service worker utilities
export { swManager, useServiceWorker, initServiceWorker } from '@/app/sw-register';

// Re-export types
export type { BeforeInstallPromptEvent } from '@/lib/pwa-utils';
