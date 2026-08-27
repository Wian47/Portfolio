import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    // GitHub Pages serves this from /Portfolio/; Vercel serves it from the domain
    // root, so keying off Vercel's build-time env var keeps both deployments valid.
    base: process.env.VERCEL ? '/' : '/Portfolio/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
