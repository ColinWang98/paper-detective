# Jest Testing Infrastructure Setup Guide

**Created**: 2026-02-10 by test-architect-v2
**Purpose**: Complete guide for setting up automated testing infrastructure
**Estimated Setup Time**: 30-45 minutes

---

## 📋 Overview

This guide provides step-by-step instructions for setting up the complete testing infrastructure for Paper Detective Sprint 4.

**Testing Stack**:
- **Test Runner**: Jest 29.x
- **React Testing**: React Testing Library
- **API Mocking**: MSW (Mock Service Worker)
- **Coverage**: Built-in Jest coverage
- **E2E**: Playwright (optional, for future)

---

## 🔧 Step 1: Install Dependencies

Run the following command to install all testing dependencies:

```bash
npm install --save-dev jest @jest/globals @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest ts-jest msw identity-obj-proxy
```

**Package Descriptions**:
- `jest` - Test runner
- `@jest/globals` - Jest global types for TypeScript
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM
- `@testing-library/user-event` - User interaction simulation
- `jest-environment-jsdom` - JSDOM environment for Jest
- `@types/jest` - TypeScript type definitions
- `ts-jest` - TypeScript preprocessor for Jest
- `msw` - API mocking library
- `identity-obj-proxy` - CSS module mocking

---

## ⚙️ Step 2: Update package.json Scripts

Add the following scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "prepare": "husky install",

    // --- TESTING SCRIPTS (ADD THESE) ---
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## 📝 Step 3: Create Jest Configuration

Create `jest.config.js` in the project root:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Module paths
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you)
    '^@/(.*)$': '<rootDir>/$1',

    // Handle CSS modules
    '^.+\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',

    // Handle CSS files (without modules)
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',

    // Handle image files
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.(ts|tsx)',
    '**/tests/**/*.spec.(ts|tsx)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'services/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/tests/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    // Critical services have higher thresholds
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

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

---

## 🎭 Step 4: Create Mock Files

Create `tests/__mocks__/styleMock.js`:

```javascript
module.exports = {}
```

Create `tests/__mocks__/fileMock.js`:

```javascript
module.exports = 'test-file-stub'
```

---

## 🚀 Step 5: Create Test Setup File

Update or create `tests/setup.ts`:

```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock window.scrollTo
global.scrollTo = () => {}

// Suppress console errors in tests (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
```

---

## 🔌 Step 6: Configure MSW (Optional, for API mocking)

Create `tests/mocks/server.ts`:

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server
export const server = setupServer(...handlers)
```

Create `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock AI API endpoint
  http.post('/api/analyze', () => {
    return HttpResponse.json({
      summary: 'Test summary',
      structuredInfo: {
        researchQuestion: 'Test question',
        methods: [],
        findings: [],
        limitations: [],
      },
      clueCards: [],
    })
  }),

  // Mock Intelligence Brief endpoint
  http.post('/api/intelligence-brief', () => {
    return HttpResponse.json({
      caseFile: {
        caseNumber: 142,
        title: 'Test Paper',
        completenessScore: 85,
      },
      clipSummary: 'Test summary',
      structuredInfo: {},
      clueCards: [],
      userHighlights: {},
    })
  }),

  // Add more handlers as needed...
]
```

---

## ✅ Step 7: Verify Installation

Run the following commands to verify everything is set up correctly:

```bash
# Check Jest version
npm test -- --version

# Run tests (should find 0 tests initially)
npm test

# Run tests with coverage
npm run test:coverage
```

**Expected Output**:
```
PASS  tests/setup.ts
Test Suites: 1 passed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        2.456s
```

---

## 📊 Step 8: Create First Test

Create `tests/example.test.tsx` to verify everything works:

```typescript
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Example Test', () => {
  it('should render test correctly', () => {
    const { container } = render(<div>Hello World</div>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
```

Run the test:
```bash
npm test
```

---

## 🎯 Step 9: Configure CI/CD (Optional)

Add to `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 📚 Usage Examples

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Writing Component Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle button click', async () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
```

### Testing with Fixtures

```typescript
import singleHighlight from '../fixtures/highlights/single-highlight.json'

describe('Export Service', () => {
  it('should export single highlight', () => {
    const result = exportAsMarkdown(singleHighlight)
    expect(result).toContain('# Case File')
  })
})
```

---

## 🐛 Troubleshooting

### Issue: Jest cannot find module

**Solution**: Check `jest.config.js` `moduleNameMapper` configuration

### Issue: TypeScript errors in tests

**Solution**: Ensure `ts-jest` is configured correctly in `jest.config.js`

### Issue: CSS module errors

**Solution**: Verify `identity-obj-proxy` is installed and mapped correctly

### Issue: Tests timeout

**Solution**: Increase timeout in test: `it('test', async () => {}, { timeout: 10000 })`

---

## 📈 Next Steps

After setup is complete:

1. ✅ Run existing tests to verify baseline
2. ✅ Write unit tests for Intelligence Brief service
3. ✅ Write integration tests for export workflows
4. ✅ Set up MSW for API mocking
5. ✅ Configure coverage thresholds
6. ✅ Set up CI/CD pipeline

---

## 📞 Support

For issues or questions:
- Check Jest documentation: https://jestjs.io/
- Check React Testing Library: https://testing-library.com/react
- Contact test-architect-v2

---

**Last Updated**: 2026-02-10 by test-architect-v2
**Status**: Ready for implementation
**Estimated Setup Time**: 30-45 minutes
