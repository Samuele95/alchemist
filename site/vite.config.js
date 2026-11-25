import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Relative base: GitHub Pages serves the site under /<repo>/, so absolute asset paths would 404.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), skill: resolve(import.meta.dirname, 'skill.html'), loop: resolve(import.meta.dirname, 'loop.html') } },
  },
});
