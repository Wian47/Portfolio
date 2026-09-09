import { defineConfig } from 'vitest/config';

/** The pure core only. Nothing under components/ is tested here; it has no DOM. */
export default defineConfig({
  test: {
    include: ['trip/**/*.test.ts'],
    environment: 'node'
  }
});
