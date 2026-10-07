import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { version } from './package.json';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // shadcn and the Evilcharts registry import through the `@/` alias.
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  // package.json is the single source of truth for the version, so the value
  // shown in the app can never drift from the one published to npm.
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    cssMinify: false, // Disable CSS minification to avoid lightningcss @keyframes issue
  },
});
