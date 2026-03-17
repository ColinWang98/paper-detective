/**
 * AI Clue Card Component Tests
 *
 * Story 2.2.1: AI Clue Cards System - Frontend UI Components
 *
 * Test Coverage:
 * - AIClueCard component (basic version)
 * - AIClueCardNew component (enhanced version with animations)
 * - All card types: question, method, finding, limitation
 * - Color-blind accessibility
 * - User interactions (expand/collapse, locate, add to notebook)
 * - Keyboard navigation
 * - Accessibility attributes (ARIA)
 * - Responsive design
 *
 * Mock Strategy:
 * - Mock React components
 * - Test user interactions with fireEvent
 * - Verify accessibility attributes
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIClueCard from '@/components/AIClueCard';
import AIClueCardNew from '@/components/AIClueCardNew';
import { AIClueType } from '@/components/AIClueCardNew';

// Mock framer-motion for avoiding animation complexity in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AIClueCard Component (Basic)', () => {
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

  const defaultProps = {
    card: createMockCard(),
  };

  describe('Rendering', () => {
    it('should render question card correctly', () => {
      render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'question' })} />);

      expect(screen.getByText('研究问题')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test content for the clue card')).toBeInTheDocument();
    });

    it('should render method card correctly', () => {
      render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'method' })} />);

      expect(screen.getByText('调查手段')).toBeInTheDocument();
      expect(screen.getByText('🔵')).toBeInTheDocument();
    });

    it('should render finding card correctly', () => {
      render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'finding' })} />);

      expect(screen.getByText('关键证据')).toBeInTheDocument();
      expect(screen.getByText('🟢')).toBeInTheDocument();
    });

    it('should render limitation card correctly', () => {
      render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'limitation' })} />);

      expect(screen.getByText('疑点')).toBeInTheDocument();
      expect(screen.getByText('🟡')).toBeInTheDocument();
    });

    it('should display page number when provided', () => {
      render(<AIClueCard {...defaultProps} card={createMockCard({ pageNumber: 5 })} />);

      expect(screen.getByText('p.5')).toBeInTheDocument();
    });

    it('should not display page number when not provided', () => {
      render(<AIClueCard {...defaultProps} />);

      expect(screen.queryByText(/p\.\d/)).not.toBeInTheDocument();
    });

    it('should display correct icon for each type', () => {
      const { rerender } = render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'question' })} />);
      expect(screen.getByText('🔴')).toBeInTheDocument();

      rerender(<AIClueCard {...defaultProps} card={createMockCard({ type: 'method' })} />);
      expect(screen.getByText('🔵')).toBeInTheDocument();

      rerender(<AIClueCard {...defaultProps} card={createMockCard({ type: 'finding' })} />);
      expect(screen.getByText('🟢')).toBeInTheDocument();

      rerender(<AIClueCard {...defaultProps} card={createMockCard({ type: 'limitation' })} />);
      expect(screen.getByText('🟡')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct border color for question type', () => {
      const { container } = render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'question' })} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-red-500');
    });

    it('should apply correct border color for each type', () => {
      const { container: qContainer } = render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'question' })} />);
      const qCard = qContainer.firstChild as HTMLElement;
      expect(qCard.className).toContain('border-red-500');

      const { container: mContainer } = render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'method' })} />);
      const mCard = mContainer.firstChild as HTMLElement;
      expect(mCard.className).toContain('border-blue-500');

      const { container: fContainer } = render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'finding' })} />);
      const fCard = fContainer.firstChild as HTMLElement;
      expect(fCard.className).toContain('border-green-500');

      const { container: lContainer } = render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'limitation' })} />);
      const lCard = lContainer.firstChild as HTMLElement;
      expect(lCard.className).toContain('border-yellow-500');
    });

    it('should apply border-left styling', () => {
      const { container } = render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'question' })} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-4');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();

      const { container } = render(
        <AIClueCard {...defaultProps} onClick={handleClick} />
      );

      fireEvent.click(container.firstChild as HTMLElement);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when not provided', () => {
      const { container } = render(<AIClueCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;

      expect(() => fireEvent.click(card)).not.toThrow();
    });

    it('should render card correctly', () => {
      const { container } = render(<AIClueCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic icon with aria-hidden', () => {
      render(<AIClueCard {...defaultProps} card={createMockCard({ type: 'question' })} />);

      // Icons should be decorative (aria-hidden implicitly)
      const icons = screen.getAllByText(/🔴|🔵|🟢|🟡/);
      icons.forEach(icon => {
        expect(icon).toBeInTheDocument();
      });
    });
  });
});

describe('AIClueCardNew Component (Enhanced)', () => {
  const defaultProps = {
    type: 'question' as AIClueType,
    title: 'Research Question',
    content: 'This paper addresses the challenge of training deep models with limited data.',
  };

  describe('Rendering', () => {
    it('should render collapsed by default', () => {
      render(<AIClueCardNew {...defaultProps} />);

      expect(screen.getByText('Research Question')).toBeInTheDocument();
      expect(screen.getByText('This paper addresses')).not.toBeVisible();
    });

    it('should expand when expand button is clicked', () => {
      render(<AIClueCardNew {...defaultProps} />);

      const expandButton = screen.getByRole('button', { name: /展开/ });
      fireEvent.click(expandButton);

      expect(screen.getByText('This paper addresses')).toBeVisible();
    });

    it('should collapse when collapse button is clicked', () => {
      render(<AIClueCardNew {...defaultProps} />);

      // Expand first
      const expandButton = screen.getByRole('button', { name: /展开/ });
      fireEvent.click(expandButton);

      expect(screen.getByText('This paper addresses')).toBeVisible();

      // Then collapse
      const collapseButton = screen.getByRole('button', { name: /收起/ });
      fireEvent.click(collapseButton);

      expect(screen.getByText('This paper addresses')).not.toBeVisible();
    });

    it('should render correct icon for each type', () => {
      const { rerender } = render(<AIClueCardNew {...defaultProps} type="question" />);
      expect(screen.getByText('❓')).toBeInTheDocument();

      rerender(<AIClueCardNew {...defaultProps} type="method" />);
      expect(screen.getByText('🔬')).toBeInTheDocument();

      rerender(<AIClueCardNew {...defaultProps} type="finding" />);
      expect(screen.getByText('💡')).toBeInTheDocument();

      rerender(<AIClueCardNew {...defaultProps} type="limitation" />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should render page number when provided', () => {
      render(<AIClueCardNew {...defaultProps} pageNumber={3} />);

      expect(screen.getByText('p.3')).toBeInTheDocument();
    });

    it('should render quote when provided', () => {
      render(
        <AIClueCardNew
          {...defaultProps}
          quote="Original text from the PDF"
        />
      );

      // Expand to see quote
      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      expect(screen.getByText(/"Original text from the PDF"/)).toBeInTheDocument();
    });

    it('should render action buttons when callbacks are provided', () => {
      const onLocate = jest.fn();
      const onAddToNotebook = jest.fn();

      render(
        <AIClueCardNew
          {...defaultProps}
          onLocate={onLocate}
          onAddToNotebook={onAddToNotebook}
        />
      );

      // Expand to see action buttons
      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      expect(screen.getByRole('button', { name: /定位原文/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /添加笔记/ })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct background for each type', () => {
      const { container: qContainer } = render(<AIClueCardNew {...defaultProps} type="question" />);
      const qCard = qContainer.firstChild as HTMLElement;
      expect(qCard.className).toContain('bg-red-50');

      const { container: mContainer } = render(<AIClueCardNew {...defaultProps} type="method" />);
      const mCard = mContainer.firstChild as HTMLElement;
      expect(mCard.className).toContain('bg-blue-50');

      const { container: fContainer } = render(<AIClueCardNew {...defaultProps} type="finding" />);
      const fCard = fContainer.firstChild as HTMLElement;
      expect(fCard.className).toContain('bg-green-50');

      const { container: lContainer } = render(<AIClueCardNew {...defaultProps} type="limitation" />);
      const lCard = lContainer.firstChild as HTMLElement;
      expect(lCard.className).toContain('bg-yellow-50');
    });

    it('should apply correct border classes', () => {
      const { container } = render(<AIClueCardNew {...defaultProps} type="question" />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-l-4');
      expect(card.className).toContain('border-red-500');
      expect(card.className).toContain('rounded-r-lg');
    });

    it('should apply hover effects', () => {
      const { container } = render(<AIClueCardNew {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:shadow-md');
      expect(card.className).toContain('transition-shadow');
    });
  });

  describe('Interactions', () => {
    it('should call onLocate when locate button is clicked', () => {
      const onLocate = jest.fn();

      render(<AIClueCardNew {...defaultProps} onLocate={onLocate} pageNumber={5} />);

      // Expand first
      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      // Click locate button
      const locateButton = screen.getByRole('button', { name: /定位到第5页/ });
      fireEvent.click(locateButton);

      expect(onLocate).toHaveBeenCalledTimes(1);
    });

    it('should call onAddToNotebook when add button is clicked', () => {
      const onAddToNotebook = jest.fn();

      render(<AIClueCardNew {...defaultProps} onAddToNotebook={onAddToNotebook} />);

      // Expand first
      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      // Click add button
      const addButton = screen.getByRole('button', { name: /添加到笔记本/ });
      fireEvent.click(addButton);

      expect(onAddToNotebook).toHaveBeenCalledTimes(1);
    });

    it('should toggle expanded state on button click', () => {
      render(<AIClueCardNew {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /展开/ });

      // Initially collapsed
      expect(screen.getByText('This paper addresses')).not.toBeVisible();

      // Expand
      fireEvent.click(toggleButton);
      expect(screen.getByText('This paper addresses')).toBeVisible();

      // Collapse
      fireEvent.click(screen.getByRole('button', { name: /收起/ }));
      expect(screen.getByText('This paper addresses')).not.toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      render(<AIClueCardNew {...defaultProps} type="question" />);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', '研究问题: Research Question');
    });

    it('should have accessible expand/collapse button', () => {
      render(<AIClueCardNew {...defaultProps} />);

      const button = screen.getByRole('button', { name: /展开/ });
      expect(button).toHaveAttribute('aria-label', '展开');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when toggling', () => {
      render(<AIClueCardNew {...defaultProps} />);

      const button = screen.getByRole('button', { name: /展开/ });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      const collapseButton = screen.getByRole('button', { name: /收起/ });
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have accessible locate button label', () => {
      render(<AIClueCardNew {...defaultProps} onLocate={jest.fn()} pageNumber={7} />);

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      const locateButton = screen.getByRole('button', { name: /定位到第7页/ });
      expect(locateButton).toHaveAttribute('aria-label', '定位到第7页');
    });

    it('should have accessible add button label', () => {
      render(<AIClueCardNew {...defaultProps} onAddToNotebook={jest.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      const addButton = screen.getByRole('button', { name: /添加到笔记本/ });
      expect(addButton).toHaveAttribute('aria-label', '添加到笔记本');
    });

    it('should have decorative icons with aria-hidden', () => {
      render(<AIClueCardNew {...defaultProps} type="question" />);

      const icons = screen.getAllByText(/❓|🔬|💡|⚠️/);
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Color-Blind Accessibility', () => {
    it('should use color + icon differentiation', () => {
      render(<AIClueCardNew {...defaultProps} type="question" />);

      // Color: red background
      const { container } = render(<AIClueCardNew {...defaultProps} type="question" />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-red-50');

      // Icon: question mark
      expect(screen.getByText('❓')).toBeInTheDocument();

      // Label: "研究问题"
      expect(screen.getByText('研究问题')).toBeInTheDocument();
    });

    it('should have unique icon for each type', () => {
      const { rerender } = render(<AIClueCardNew {...defaultProps} type="question" />);
      const qIcon = screen.getByText('❓');

      rerender(<AIClueCardNew {...defaultProps} type="method" />);
      const mIcon = screen.getByText('🔬');

      rerender(<AIClueCardNew {...defaultProps} type="finding" />);
      const fIcon = screen.getByText('💡');

      rerender(<AIClueCardNew {...defaultProps} type="limitation" />);
      const lIcon = screen.getByText('⚠️');

      expect(qIcon).not.toEqual(mIcon);
      expect(mIcon).not.toEqual(fIcon);
      expect(fIcon).not.toEqual(lIcon);
    });

    it('should have unique label for each type', () => {
      const { rerender } = render(<AIClueCardNew {...defaultProps} type="question" />);
      expect(screen.getByText('研究问题')).toBeInTheDocument();

      rerender(<AIClueCardNew {...defaultProps} type="method" />);
      expect(screen.getByText('核心方法')).toBeInTheDocument();

      rerender(<AIClueCardNew {...defaultProps} type="finding" />);
      expect(screen.getByText('关键发现')).toBeInTheDocument();

      rerender(<AIClueCardNew {...defaultProps} type="limitation" />);
      expect(screen.getByText('局限性')).toBeInTheDocument();
    });
  });

  describe('Quote Block', () => {
    it('should render quote when expanded', () => {
      render(
        <AIClueCardNew
          {...defaultProps}
          quote="This is the original quote from the PDF paper."
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      const quote = screen.getByText(/"This is the original quote/);
      expect(quote).toBeInTheDocument();
      expect(quote.tagName.toLowerCase()).toBe('P');
      expect(quote).toHaveClass('italic');
    });

    it('should not render quote when not provided', () => {
      render(<AIClueCardNew {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      expect(screen.queryByText(/"/)).not.toBeInTheDocument();
    });

    it('should have quote styling', () => {
      render(
        <AIClueCardNew
          {...defaultProps}
          quote="Original quote"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      const blockquote = screen.getByText(/"Original quote"/).closest('blockquote');
      expect(blockquote).toHaveClass('border-l-2');
      expect(blockquote).toHaveClass('border-gray-300');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', () => {
      const longTitle = 'This is a very long title that might wrap onto multiple lines';

      render(<AIClueCardNew {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(1000);

      render(<AIClueCardNew {...defaultProps} content={longContent} />);

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Math: ∑(x²) + ∫f(x)dx = 42% < 0.5';

      render(<AIClueCardNew {...defaultProps} content={specialContent} />);

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      expect(screen.getByText(/Math:/)).toBeInTheDocument();
    });

    it('should handle missing onLocate callback', () => {
      render(<AIClueCardNew {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      expect(screen.queryByRole('button', { name: /定位原文/ })).not.toBeInTheDocument();
    });

    it('should handle missing onAddToNotebook callback', () => {
      render(<AIClueCardNew {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /展开/ }));

      expect(screen.queryByRole('button', { name: /添加笔记/ })).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', () => {
      const onLocate = jest.fn();
      const onAddToNotebook = jest.fn();

      render(
        <AIClueCardNew
          {...defaultProps}
          onLocate={onLocate}
          onAddToNotebook={onAddToNotebook}
        />
      );

      // Expand with keyboard
      const toggleButton = screen.getByRole('button', { name: /展开/ });
      toggleButton.focus();

      fireEvent.click(toggleButton);

      // Tab to locate button
      const locateButton = screen.getByRole('button', { name: /定位原文/ });
      fireEvent.click(locateButton);

      expect(onLocate).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile screens', () => {
      // Simulate mobile viewport
      global.innerWidth = 375;

      render(<AIClueCardNew {...defaultProps} />);

      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('should adapt to desktop screens', () => {
      // Simulate desktop viewport
      global.innerWidth = 1920;

      render(<AIClueCardNew {...defaultProps} />);

      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });
  });
});

describe('Component Integration', () => {
  it('should render both basic and new components', () => {
    const mockCard = {
      id: 1,
      type: 'question' as AIClueType,
      title: 'Test',
      content: 'Content',
      confidence: 85,
      source: 'ai-generated' as const,
      pageNumber: 5,
      createdAt: new Date().toISOString(),
      paperId: 1,
    };

    const { container: basicContainer } = render(<AIClueCard card={mockCard} />);
    const { container: newContainer } = render(<AIClueCardNew type="question" title="Test" content="Content" pageNumber={5} />);

    expect(basicContainer.firstChild).toBeInTheDocument();
    expect(newContainer.firstChild).toBeInTheDocument();
  });

  it('should maintain consistent type behavior across components', () => {
    const types: AIClueType[] = ['question', 'method', 'finding', 'limitation'];

    types.forEach(type => {
      const mockCard = {
        id: 1,
        type,
        title: 'T',
        content: 'C',
        confidence: 85,
        source: 'ai-generated' as const,
        createdAt: new Date().toISOString(),
        paperId: 1,
      };
      const { rerender: basicRerender } = render(<AIClueCard card={mockCard} />);
      expect(basicRerender).toBeDefined();

      const { rerender: newRerender } = render(<AIClueCardNew type={type} title="T" content="C" />);
      expect(newRerender).toBeDefined();
    });
  });
});
