import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/quality/output-quality.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/resources/**'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
    testTimeout: 10000,
  },
});
