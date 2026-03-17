/**
 * MSW (Mock Service Worker) Server Setup
 *
 * Provides mock API server for testing
 * Usage: Import in test files and use with server.listen()/server.close()
 */

import { setupServer } from 'msw/node';
import { allHandlers } from './handlers';

// Create MSW server with all handlers
export const server = setupServer(...allHandlers);

// Server lifecycle helpers for tests
export const setupMockServer = () => {
  beforeAll(() => server.listen({
    onUnhandledRequest: 'warn',
  }));

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());
};

// Export for use in individual test files
export default server;
