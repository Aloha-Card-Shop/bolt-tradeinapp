import '@testing-library/jest-dom/vitest';

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor() {
    return {
      postMessage: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      close: () => {}
    };
  }
}

global.BroadcastChannel = MockBroadcastChannel;

// Mock Supabase auth
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: () => ({
        data: {
          session: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              user_metadata: { role: 'admin' }
            }
          }
        },
        error: null
      })
    }
  })
}));