import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.browser.test.ts'],
    environment: 'node',
    typecheck: {
      enabled: false,
      include: ['packages/*/src/**/*.test-d.ts'],
      tsconfig: './tsconfig.typecheck.json'
    }
  }
});
