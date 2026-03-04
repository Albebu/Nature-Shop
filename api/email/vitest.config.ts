import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@domain': resolve(__dirname, 'src/domain'),
      '@application': resolve(__dirname, 'src/application'),
      '@infrastructure': resolve(__dirname, 'src/infrastructure'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/application/**'],
      exclude: ['src/env.ts', 'src/index.ts', 'src/domain/ports/**'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
      reporter: ['text', 'lcov'],
    },
  },
});
