'use client';

import React, { useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info' | 'default';
  showCloseButton?: boolean;
}

/**
 * Modal Component
 * Supports both confirmation dialogs and custom content
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="新建分组"
 * >
 *   <form onSubmit={handleSubmit}>
 *     <input ... />
 *   </form>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel = '确定',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
  variant = 'default',
  showCloseButton = true,
}: ModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose?.();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  const variantStyles = {
    danger: {
      confirmBg: 'bg-red-600 hover:bg-red-700',
      confirmText: 'text-white',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    },
    warning: {
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      confirmText: 'text-white',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    },
    info: {
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      confirmText: 'text-white',
      icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
    },
    default: {
      confirmBg: 'bg-red-600 hover:bg-red-700',
      confirmText: 'text-white',
      icon: null,
    },
  };

  // Extract onCancel to variable to avoid JSX parsing issue
  const hasOnCancel = typeof onCancel !== 'undefined';
  const showCloseButtonInHeader = showCloseButton && onClose && !hasOnCancel;

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {styles.icon && <div className="flex-shrink-0">{styles.icon}</div>}
                  <h3
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {title}
                  </h3>
                </div>
                {showCloseButtonInHeader && (
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="关闭"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {children}
              </div>

              {/* Footer */}
              {(onConfirm || onClose || onCancel) && (
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                  {showCloseButtonInHeader && (
                    <button
                      onClick={() => onClose?.()}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                      aria-label="关闭"
                    >
                      {cancelLabel}
                    </button>
                  )}
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                      {cancelLabel}
                    </button>
                  )}
                  {onConfirm && (
                    <button
                      onClick={onConfirm}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium ${styles.confirmBg} ${styles.confirmText}`}
                    >
                      {confirmLabel}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Modal;
