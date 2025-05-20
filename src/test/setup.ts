
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

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

// Mock environment variables that might be needed for tests
process.env.SUPABASE_URL = 'https://qgsabaicokoynabxgdco.supabase.co';
if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
}
