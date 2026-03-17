/**
 * Jest Setup Verification Test
 *
 * Verifies that Jest is properly configured for Sprint 4 testing
 */

// Import React Testing Library at the top level (not inside tests)
import { render, screen } from '@testing-library/react';

describe('Jest Infrastructure Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should support TypeScript', () => {
    const add = (a: number, b: number): number => a + b;
    expect(add(1, 2)).toBe(3);
  });

  it('should support React Testing Library', () => {
    // Verify the imports work
    expect(render).toBeDefined();
    expect(screen).toBeDefined();
  });

  it('should support fake-indexeddb', () => {
    expect(indexedDB).toBeDefined();
  });

  it('should support localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.removeItem('test');
    expect(localStorage.getItem('test')).toBeNull();
  });

  it('should support matchMedia mock', () => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    expect(mediaQuery).toBeDefined();
    expect(mediaQuery.matches).toBe(false);
  });

  it('should support IntersectionObserver mock', () => {
    const observer = new IntersectionObserver(() => {});
    expect(observer).toBeDefined();
    expect(observer.observe).toBeDefined();
    expect(observer.disconnect).toBeDefined();
  });

  it('should support ResizeObserver mock', () => {
    const observer = new ResizeObserver(() => {});
    expect(observer).toBeDefined();
    expect(observer.observe).toBeDefined();
    expect(observer.disconnect).toBeDefined();
  });
});
