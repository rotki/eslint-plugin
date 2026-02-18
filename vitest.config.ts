import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    reporters: 'dot',
    exclude: ['tests/fixtures/**'],
    include: ['tests/**/*.ts'],
  },
});
