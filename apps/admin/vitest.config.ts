import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['app/**', 'lib/**', 'components/**'],
      exclude: ['**/*.d.ts', 'test/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@ephraimcare/types': path.resolve(__dirname, '../../packages/types/src'),
      '@ephraimcare/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@ephraimcare/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
