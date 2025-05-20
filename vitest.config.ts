
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    environmentMatchGlobs: [
      // Use node environment for API tests
      ['**/api/**', 'node'],
      // Use jsdom for component tests
      ['**/components/**', 'jsdom']
    ]
  }
});
