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
      // Solo medir el código que controlamos — excluir generated, config, entry points
      include: ['src/domain/**', 'src/application/**'],
      // Ports y DTOs son solo interfaces/types — sin código ejecutable, no se pueden testear
      exclude: [
        'src/generated/**',
        'src/env.ts',
        'src/index.ts',
        'src/domain/ports/**',
        'src/application/dtos/**',
      ],
      // Thresholds que se validan en cada run — si bajan de aquí, el comando falla
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
