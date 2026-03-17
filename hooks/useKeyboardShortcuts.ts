'use client';

import { useEffect, useCallback } from 'react';

import { usePaperStore } from '@/lib/store';

/**
 * Keyboard shortcuts hook for undo/redo functionality
 *
 * Supports:
 * - Ctrl+Z or Cmd+Z: Undo
 * - Ctrl+Y or Cmd+Shift+Z or Cmd+Y: Redo
 */
export function useKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = usePaperStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA' ||
                          target.isContentEditable;

    if (isInputField) {return;}

    // Check for undo (Ctrl+Z or Cmd+Z)
    const isUndo = (event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey;

    // Check for redo (Ctrl+Y or Cmd+Shift+Z or Cmd+Y)
    const isRedo = ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
                   ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
                   (event.metaKey && event.key === 'y');

    if (isUndo && canUndo) {
      event.preventDefault();
      undo();
    } else if (isRedo && canRedo) {
      event.preventDefault();
      redo();
    }
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
