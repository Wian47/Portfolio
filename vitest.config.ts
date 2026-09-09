import { defineConfig } from 'vitest/config';

/**
 * The pure modules. `components/trip/dnd.ts` is in because it holds the drag
 * arithmetic and imports no React; nothing that renders is tested here.
 */
export default defineConfig({
  test: {
    include: ['trip/**/*.test.ts', 'components/trip/*.test.ts'],
    environment: 'node'
  }
});
