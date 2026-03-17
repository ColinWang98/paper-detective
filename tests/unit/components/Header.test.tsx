import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import Header from '@/components/Header';

jest.mock('@/lib/store', () => ({
  usePaperStore: jest.fn(() => ({
    undo: jest.fn().mockResolvedValue(undefined),
    redo: jest.fn().mockResolvedValue(undefined),
    canUndo: true,
    canRedo: true,
  })),
}));

describe('Header', () => {
  it('calls the mode toggle handler', () => {
    const onToggleMode = jest.fn();

    render(
      <Header caseNumber={142} activeMode="notes" onToggleMode={onToggleMode} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'B 模式：AI 简报' }));

    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });
});
