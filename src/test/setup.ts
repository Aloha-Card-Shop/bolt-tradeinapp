
// Fix test/setup.ts implementation
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null;
  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null;

  constructor(name: string) {
    this.name = name;
  }
  
  postMessage(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  close(): void {}
  dispatchEvent(): boolean { return true; }
}

// Assign the mock class to global
(global as any).BroadcastChannel = MockBroadcastChannel;

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
