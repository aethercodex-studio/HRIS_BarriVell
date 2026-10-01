import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Vite config.
// - `base: './'` makes all asset URLs relative, so the built site works on
//   GitHub Pages under https://<user>.github.io/<repo>/ as well as on a root domain.
// - `@` resolves to /src so imports stay short and refactor-friendly.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
