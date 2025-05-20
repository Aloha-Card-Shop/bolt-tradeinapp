
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom'; // Add jest-dom matchers

// Add missing process.env globals for tests
if (!global.process) {
  global.process = {
    env: {
      SUPABASE_URL: 'https://qgsabaicokoynabxgdco.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      NODE_ENV: 'test'
    }
  } as any;
}

// Mock console.error to avoid cluttering test output with expected errors
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Only log console errors if they're not part of expected test failures
    if (
      args[0]?.includes('Warning:') || 
      args[0]?.includes('Error:') ||
      args[0]?.includes('Supabase query error:')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Reset all mocks after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock fetch for API tests
vi.stubGlobal('fetch', vi.fn());
