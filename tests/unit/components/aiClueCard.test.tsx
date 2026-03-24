import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import AIClueCard from '@/components/AIClueCard';
import AIClueCardNew, { AIClueType } from '@/components/AIClueCardNew';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AIClueCard', () => {
  const createMockCard = (overrides = {}) => ({
    id: 1,
    type: 'question' as AIClueType,
    title: 'Test Title',
    content: 'Test content for the clue card',
    confidence: 85,
    source: 'ai-generated' as const,
    pageNumber: undefined as number | undefined,
    createdAt: new Date().toISOString(),
    paperId: 1,
    ...overrides,
  });

  it('renders translated label, icon, content, and page number', () => {
    const { container } = render(<AIClueCard card={createMockCard({ pageNumber: 5 })} />);

    expect(container).toHaveTextContent('研究问题');
    expect(screen.getByText('❓')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    expect(container).toHaveTextContent('Test content for the clue card');
    expect(container).toHaveTextContent('p.5');
  });

  it('applies type-specific border styling', () => {
    const { container } = render(<AIClueCard card={createMockCard({ type: 'limitation' })} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-l-4');
    expect(card.className).toContain('border-yellow-500');
  });

  it('shows associated highlights after expanding', () => {
    render(
      <AIClueCard
        card={createMockCard({ highlightIds: [7] })}
        highlights={[{ id: 7, text: 'Important quote', pageNumber: 2 } as any]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开' }));

    expect(screen.getByRole('button', { name: /Important quote/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Important quote/ })).toHaveTextContent('p.2');
    expect(screen.getByRole('button', { name: /Important quote/ }).parentElement?.parentElement).toHaveTextContent('关联高亮 (1)');
  });
});

describe('AIClueCardNew', () => {
  const defaultProps = {
    type: 'question' as AIClueType,
    title: 'Research Question',
    content: 'This paper addresses the challenge of training deep models with limited data.',
  };

  it('renders collapsed by default and toggles expanded state', () => {
    render(<AIClueCardNew {...defaultProps} />);

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', '研究问题: Research Question');
    expect(
      screen.queryByText('This paper addresses the challenge of training deep models with limited data.')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '展开' }));
    expect(article).toHaveTextContent('This paper addresses the challenge of training deep models with limited data.');

    fireEvent.click(screen.getByRole('button', { name: '收起' }));
    expect(
      screen.queryByText('This paper addresses the challenge of training deep models with limited data.')
    ).not.toBeInTheDocument();
  });

  it('renders type-specific icon and styles', () => {
    const { container } = render(<AIClueCardNew {...defaultProps} type="finding" />);

    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('关键发现')).toBeInTheDocument();

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-green-50');
    expect(card.className).toContain('border-green-500');
  });

  it('renders quote and action buttons when expanded', () => {
    const onLocate = jest.fn();
    const onAddToNotebook = jest.fn();

    render(
      <AIClueCardNew
        {...defaultProps}
        pageNumber={7}
        quote="Original text from the PDF"
        onLocate={onLocate}
        onAddToNotebook={onAddToNotebook}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开' }));

    const article = screen.getByRole('article');
    expect(article).toHaveTextContent('p.7');
    expect(article).toHaveTextContent('Original text from the PDF');

    fireEvent.click(screen.getByRole('button', { name: '定位到第7页' }));
    fireEvent.click(screen.getByRole('button', { name: '添加到笔记本' }));

    expect(onLocate).toHaveBeenCalledTimes(1);
    expect(onAddToNotebook).toHaveBeenCalledTimes(1);
  });

  it('falls back to a safe locate label when page number is missing', () => {
    render(<AIClueCardNew {...defaultProps} onLocate={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '展开' }));

    expect(screen.getByRole('button', { name: '定位原文' })).toBeInTheDocument();
  });
});
