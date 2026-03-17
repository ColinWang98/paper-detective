'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, CheckCircle } from 'lucide-react';
import PWAInstallPrompt from './PWAInstallPrompt';
import OfflineIndicator from './OfflineIndicator';

/**
 * PWA Provider Component
 * Wraps the app with PWA functionality
 */

interface PWAProviderProps {
  children: React.ReactNode;
}

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

function UpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <div>
            <p className="font-medium">新版本可用</p>
            <p className="text-sm text-blue-100">更新以获取最新功能和改进</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUpdate}
            className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            立即更新
          </button>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="忽略"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        setSwRegistration(registration);
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                setShowUpdate(true);
              }
            });
          }
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // Delay registration to not block page load
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  // Handle update
  const handleUpdate = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  // Handle dismiss
  const handleDismiss = () => {
    setShowUpdate(false);
  };

  return (
    <>
      {/* Update Notification */}
      <AnimatePresence>
        {showUpdate && (
          <UpdateNotification onUpdate={handleUpdate} onDismiss={handleDismiss} />
        )}
      </AnimatePresence>

      {/* Main Content */}
      {children}

      {/* PWA Components */}
      <PWAInstallPrompt />
      <OfflineIndicator />
    </>
  );
}

/**
 * Hook to check if PWA features are available
 */
export function usePWAAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(
      typeof window !== 'undefined' &&
      ('serviceWorker' in navigator) &&
      ('caches' in window)
    );
  }, []);

  return available;
}
