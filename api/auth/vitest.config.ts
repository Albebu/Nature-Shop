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
  },
});
