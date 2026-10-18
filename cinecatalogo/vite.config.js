import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/catalogo/' : '/',
  plugins: [react()],
  // A pasta public pertence ao Laravel, não ao React.
  publicDir: false,
  build: {
    outDir: 'public/catalogo',
    emptyOutDir: true,
  },
  server: {
    port: 5199,
    strictPort: true,
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/*.php', '**/*.sqlite*', '**/vendor/**', '**/storage/**'],
    },
  },
}));
