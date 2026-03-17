'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  Smartphone, 
  CheckCircle,
  Share,
  PlusSquare
} from 'lucide-react';

// Extend Window interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

interface InstallPromptState {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export default function PWAInstallPrompt() {
  const [state, setState] = useState<InstallPromptState>({
    canInstall: false,
    isInstalled: false,
    isIOS: false,
    deferredPrompt: null,
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check installation status
  useEffect(() => {
    // Check if already dismissed
    const hasDismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissTime = hasDismissed ? parseInt(hasDismissed, 10) : 0;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    if (hasDismissed && Date.now() - dismissTime < oneWeek) {
      setDismissed(true);
      return;
    }

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as { standalone?: boolean }).standalone === true;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream;

    setState(prev => ({
      ...prev,
      isInstalled: isStandalone,
      isIOS,
    }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      setState(prev => ({
        ...prev,
        canInstall: true,
        deferredPrompt: e,
      }));

      // Show prompt after a delay
      setTimeout(() => {
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        canInstall: false,
        isInstalled: true,
        deferredPrompt: null,
      }));
      setShowPrompt(false);
      
      // Track installation
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'PWA Installation',
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if we can show iOS instructions
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed]);

  // Handle install button click
  const handleInstall = useCallback(async () => {
    if (state.isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!state.deferredPrompt) return;

    // Show the install prompt
    await state.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await state.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      handleDismiss();
    }

    // Clear the deferredPrompt
    setState(prev => ({ ...prev, deferredPrompt: null }));
  }, [state.deferredPrompt, state.isIOS]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // Don't show if installed or no install capability
  if (state.isInstalled || dismissed) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && !showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">安装 Paper Detective</h3>
                    <p className="text-sm text-gray-400">添加到主屏幕，快速访问</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="关闭"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>离线访问已缓存的文献</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>更快的启动速度</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>独立的应用体验</span>
                </div>
              </div>

              {/* Install Button */}
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Smartphone className="w-5 h-5" />
                {state.isIOS ? '查看安装指南' : '立即安装'}
              </button>

              {/* Dismiss link */}
              <button
                onClick={handleDismiss}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                暂不安装
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Installation Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowIOSInstructions(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">iOS 安装指南</h3>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">点击分享按钮</p>
                    <p className="text-sm text-gray-400">在 Safari 底部工具栏点击</p>
                    <Share className="w-5 h-5 text-blue-400 mt-2" />
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">添加到主屏幕</p>
                    <p className="text-sm text-gray-400">在分享菜单中找到并点击</p>
                    <PlusSquare className="w-5 h-5 text-green-400 mt-2" />
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">确认添加</p>
                    <p className="text-sm text-gray-400">点击"添加"完成安装</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full mt-6 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Google Analytics type declaration
declare const gtag: (
  type: string,
  eventName: string,
  params?: Record<string, unknown>
) => void;
