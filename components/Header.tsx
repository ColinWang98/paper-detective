import React from 'react';

import { Keyboard, Redo, RotateCcw } from 'lucide-react';

import { usePaperStore } from '@/lib/store';

interface HeaderProps {
  caseNumber: number;
  activeMode?: 'notes' | 'brief';
  onToggleMode?: () => void;
  toggleDisabled?: boolean;
}

export default function Header({
  caseNumber,
  activeMode = 'notes',
  onToggleMode,
  toggleDisabled = false,
}: HeaderProps) {
  const { undo, redo, canUndo, canRedo } = usePaperStore();

  return (
    <header className="border-b-4 border-double border-newspaper-accent bg-gradient-to-r from-newspaper-cream to-newspaper-aged shadow-paper">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="typography-headline text-3xl md:text-4xl text-newspaper-ink">
              Paper Detective
            </h1>
            <p className="mt-1 font-mono text-sm text-newspaper-faded">
              Vol.2024 - No.{caseNumber}
            </p>
          </div>

          <div className="flex-1 text-center">
            <div className="ornament-corner inline-block px-8 py-2">
              <p className="text-lg font-bold tracking-wider text-newspaper-accent">
                Case File #{caseNumber}
              </p>
              <p className="mt-1 text-xs text-newspaper-faded">CASE FILE</p>
            </div>
          </div>

          <div className="flex flex-1 justify-end gap-2">
            <div className="mr-2 flex items-center gap-1">
              <button
                onClick={() => {
                  void undo();
                }}
                disabled={!canUndo}
                className="flex items-center gap-1 rounded border-2 border-gray-300 px-3 py-2 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                title="撤销 (Ctrl+Z)"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-xs">撤销</span>
              </button>
              <button
                onClick={() => {
                  void redo();
                }}
                disabled={!canRedo}
                className="flex items-center gap-1 rounded border-2 border-gray-300 px-3 py-2 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                title="重做 (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
                <span className="text-xs">重做</span>
              </button>
            </div>

            <button className="rounded bg-newspaper-accent px-4 py-2 text-sm text-white shadow transition-colors hover:bg-red-900">
              导出报告
            </button>
            <button
              onClick={onToggleMode}
              disabled={toggleDisabled}
              className="rounded border-2 border-newspaper-accent px-4 py-2 text-sm text-newspaper-accent transition-colors hover:bg-newspaper-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {activeMode === 'notes' ? 'B 模式：AI 简报' : 'A 模式：侦探笔记'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-newspaper-accent">
          <span className="text-2xl">❧</span>
          <div className="h-px flex-1 bg-newspaper-accent" />
          <div className="flex items-center gap-2 text-xs text-newspaper-faded">
            <Keyboard className="h-3 w-3" />
            <span>Ctrl+Z 撤销</span>
            <span className="mx-1">|</span>
            <span>Ctrl+Y 重做</span>
          </div>
          <div className="h-px flex-1 bg-newspaper-accent" />
          <span className="text-sm tracking-widest">PAPER DETECTIVE</span>
          <div className="h-px flex-1 bg-newspaper-accent" />
          <span className="text-2xl">❧</span>
        </div>
      </div>
    </header>
  );
}
