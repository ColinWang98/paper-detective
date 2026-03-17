'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * PWA Hook
 * Provides easy access to PWA functionality
 */

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  serviceWorkerRegistered: boolean;
  updateAvailable: boolean;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    isStandalone: false,
    serviceWorkerRegistered: false,
    updateAvailable: false,
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check initial states
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as { standalone?: boolean }).standalone === true;
    
    setState(prev => ({
      ...prev,
      isOnline: navigator.onLine,
      isStandalone,
      isInstalled: isStandalone,
    }));

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
        isStandalone: true,
      }));
    };

    // Listen for network changes
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        isStandalone: e.matches,
        isInstalled: e.matches,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setState(prev => ({ ...prev, serviceWorkerRegistered: true }));
      });

      // Listen for updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Prompt installation
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setState(prev => ({ ...prev, isInstallable: false }));
    
    return outcome === 'accepted';
  }, [deferredPrompt]);

  // Dismiss install prompt
  const dismissInstall = useCallback(() => {
    setDeferredPrompt(null);
    setState(prev => ({ ...prev, isInstallable: false }));
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return false;
    
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    
    const hasUpdate = registration.waiting !== null;
    setState(prev => ({ ...prev, updateAvailable: hasUpdate }));
    
    return hasUpdate;
  }, []);

  // Apply update
  const applyUpdate = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    
    const registration = await navigator.serviceWorker.ready;
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, []);

  // Get storage estimate
  const getStorageEstimate = useCallback(async () => {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentUsed: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
      };
    } catch {
      return null;
    }
  }, []);

  // Request persistent storage
  const requestPersistentStorage = useCallback(async () => {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      return false;
    }

    try {
      const isPersistent = await navigator.storage.persist();
      return isPersistent;
    } catch {
      return false;
    }
  }, []);

  // Check if persistent storage is granted
  const isStoragePersistent = useCallback(async () => {
    if (!('storage' in navigator) || !('persisted' in navigator.storage)) {
      return false;
    }

    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    promptInstall,
    dismissInstall,
    checkForUpdates,
    applyUpdate,
    getStorageEstimate,
    requestPersistentStorage,
    isStoragePersistent,
  };
}

export default usePWA;
