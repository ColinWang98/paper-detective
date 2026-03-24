/**
 * Jest Configuration for Paper Detective
 *
 * Configures Jest for:
 * - TypeScript + React testing
 * - Next.js project structure
 * - Path aliases (@/ imports)
 * - Coverage reporting
 * - MSW (Mock Service Worker)
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Module name mapper for path aliases and mocks
  moduleNameMapper: {
    // Handle path aliases (matches tsconfig.json)
    '^@/(.*)$': '<rootDir>/$1',

    // Mock Next.js server components
    '^next/server$': '<rootDir>/tests/__mocks__/next.ts',
    '^next/navigation$': '<rootDir>/tests/__mocks__/next-navigation.ts',
    '^next-intl$': '<rootDir>/tests/__mocks__/next-intl.ts',
    '^next-intl/server$': '<rootDir>/tests/__mocks__/next-intl-server.ts',

    // Handle CSS modules (identity-obj-proxy returns empty object)
    '^.+\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',

    // Handle static asset imports
    '^(\\\\..*/|.+/).*\\.(css|less|scss|sass|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'services/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    // Exclude files that shouldn't be tested
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/*.config.{js,ts}',
    '!**/stories/**',
    '!**/__tests__/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    // Higher coverage for critical P0 features
    './components/brief/**/*.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './services/intelligenceBriefService.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
  ],

  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
  ],

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Clear mocks automatically between tests
  clearMocks: true,

  // Reset modules automatically between tests
  resetModules: true,

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],

  // Verbose output
  verbose: true,

  // Max workers (useful for CI/CD)
  maxWorkers: '50%',

  // Test timeout (milliseconds)
  testTimeout: 10000,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig);
