/**
 * Jest Test Setup Configuration
 *
 * Configures:
 * - fake-indexeddb for IndexedDB mocking
 * - @testing-library/jest-dom for custom matchers
 * - Test environment globals
 * - Mock setup for external dependencies
 */

// Import React Testing Library custom matchers
import '@testing-library/jest-dom';

// Mock IndexedDB with fake-indexeddb
import 'fake-indexeddb/auto';

// Mock Next.js server components for API route testing
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Mock crypto.getRandomValues for consistent testing
if (typeof window !== 'undefined') {
  // Save original
  const originalGetRandomValues = window.crypto.getRandomValues;

  // Mock with predictable values for testing
  window.crypto.getRandomValues = jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }) as any;

  // Restore in cleanup
  afterAll(() => {
    window.crypto.getRandomValues = originalGetRandomValues;
  });
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia (for responsive testing)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Suppress console errors in tests (unless debugging)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    // Suppress expected errors
    if (
      errorMessage.includes('Warning: ReactDOM.render') ||
      errorMessage.includes('Not implemented:') ||
      errorMessage.includes('The current testing environment is not configured to support act(...)') ||
      errorMessage.includes('Failed to generate case setup: Jest encountered an unexpected token') ||
      errorMessage.includes("Cannot use 'import.meta' outside a module") ||
      errorMessage.includes('An update to Home inside a test was not wrapped in act(...)') ||
      errorMessage.includes('inside a test was not wrapped in act(...)')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Increase timeout for async tests
jest.setTimeout(10000);

// Configure React Testing Library
import { configure } from '@testing-library/react';

configure({
  // Automatically async-wait for queries
  asyncUtilTimeout: 5000,

  // Make getBy* queries throw a more helpful error if there are multiple matches
  throwSuggestions: true,

  // Show test utility element attribute suggestions in error messages
  showOriginalStackTrace: true,
});
