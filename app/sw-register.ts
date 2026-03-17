'use client';

/**
 * Service Worker Registration Module
 * Handles SW registration, updates, and user notifications
 */

interface SWRegistrationResult {
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
  updateAvailable: boolean;
}

type UpdateCallback = () => void;
type StatusCallback = (status: string) => void;

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallbacks: UpdateCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private isOnline: boolean = true;

  /**
   * Register the Service Worker
   */
  async register(): Promise<SWRegistrationResult> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return {
        registration: null,
        error: new Error('Service Worker not supported'),
        updateAvailable: false,
      };
    }

    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports',
      });

      console.log('[SW] Registered:', this.registration.scope);
      this.notifyStatus('Service Worker 已注册');

      // Handle updates
      this.setupUpdateHandling();

      // Setup online/offline detection
      this.setupNetworkDetection();

      // Listen for messages from SW
      this.setupMessageHandling();

      // Check for updates periodically
      this.startUpdateChecks();

      return {
        registration: this.registration,
        error: null,
        updateAvailable: false,
      };
    } catch (error) {
      console.error('[SW] Registration failed:', error);
      this.notifyStatus('Service Worker 注册失败');
      return {
        registration: null,
        error: error as Error,
        updateAvailable: false,
      };
    }
  }

  /**
   * Setup handling for SW updates
   */
  private setupUpdateHandling(): void {
    if (!this.registration) return;

    // Handle new service worker waiting
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[SW] Update available');
            this.notifyUpdateAvailable();
          }
        });
      }
    });

    // Listen for controlling changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading...');
      this.notifyStatus('应用已更新，刷新中...');
      window.location.reload();
    });
  }

  /**
   * Setup network online/offline detection
   */
  private setupNetworkDetection(): void {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;
      this.notifyStatus(this.isOnline ? '已连接到网络' : '已离线');
      
      // Notify all clients about network status
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NETWORK_STATUS',
          isOnline: this.isOnline,
        });
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial status
    updateOnlineStatus();
  }

  /**
   * Setup message handling from Service Worker
   */
  private setupMessageHandling(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (!event.data) return;

      switch (event.data.type) {
        case 'SW_ACTIVATED':
          console.log('[SW] Activated version:', event.data.version);
          this.notifyStatus('Service Worker 已激活');
          break;

        case 'SYNC_COMPLETED':
          console.log('[SW] Background sync completed');
          this.notifyStatus('离线数据已同步');
          break;

        case 'UPDATE_READY':
          this.notifyUpdateAvailable();
          break;
      }
    });
  }

  /**
   * Start periodic update checks
   */
  private startUpdateChecks(): void {
    // Check for updates every 5 minutes
    setInterval(() => {
      this.checkForUpdates();
    }, 5 * 60 * 1000);

    // Check on visibility change (when user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });
  }

  /**
   * Check for Service Worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return this.registration.waiting !== null;
    } catch (error) {
      console.error('[SW] Update check failed:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate new Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    // Send message to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Update is available - notify callbacks
   */
  private notifyUpdateAvailable(): void {
    this.updateCallbacks.forEach((callback) => callback());
  }

  /**
   * Notify status callbacks
   */
  private notifyStatus(status: string): void {
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  /**
   * Subscribe to update notifications
   */
  onUpdateAvailable(callback: UpdateCallback): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to status notifications
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Check if app is online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<boolean> {
    const controller = navigator.serviceWorker.controller;
    if (!controller) return false;

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data?.success || false);
      };
      
      controller.postMessage(
        { type: 'CLEAR_CACHES' },
        [channel.port2]
      );
    });
  }

  /**
   * Get Service Worker version
   */
  async getVersion(): Promise<string | null> {
    const controller = navigator.serviceWorker.controller;
    if (!controller) return null;

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data?.version || null);
      };
      
      controller.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );
    });
  }

  /**
   * Unregister the Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    const result = await this.registration.unregister();
    this.registration = null;
    return result;
  }
}

// Export singleton instance
export const swManager = new ServiceWorkerManager();

/**
 * React hook for Service Worker
 */
export function useServiceWorker() {
  return {
    register: () => swManager.register(),
    checkForUpdates: () => swManager.checkForUpdates(),
    skipWaiting: () => swManager.skipWaiting(),
    clearCaches: () => swManager.clearCaches(),
    getVersion: () => swManager.getVersion(),
    unregister: () => swManager.unregister(),
    getIsOnline: () => swManager.getIsOnline(),
    onUpdateAvailable: (callback: UpdateCallback) => swManager.onUpdateAvailable(callback),
    onStatusChange: (callback: StatusCallback) => swManager.onStatusChange(callback),
  };
}

/**
 * Initialize Service Worker on app load
 */
export function initServiceWorker(): Promise<SWRegistrationResult> {
  return swManager.register();
}

export default swManager;
