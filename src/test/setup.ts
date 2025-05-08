
import '@testing-library/jest-dom/vitest';

// Mock BroadcastChannel
global.BroadcastChannel = class MockBroadcastChannel {
  name: string;
  constructor(name: string) {
    this.name = name;
    return {
      postMessage: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      close: () => {}
    };
  }
} as unknown as typeof BroadcastChannel;

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
