import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  root: '.',
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Falha alto se a 5173 já estiver ocupada, em vez de migrar para 5174 em
    // silêncio (o túnel Cloudflare aponta fixo para a 5173). Evita "split-brain"
    // de instâncias duplicadas servindo código obsoleto.
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        // Configurável via env para evitar conflito de porta local (ex.: Firebird ocupa a 3050)
        target: process.env.VITE_API_PROXY || 'http://localhost:3050',
        changeOrigin: true,
      },
    },
  },
  // Produção: `vite preview` serve o dist/client buildado na 5173 e proxia /api
  // para o backend (o client usa caminhos /api relativos). Usado pelo systemd
  // (serviço caseg-front).
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:3050',
        changeOrigin: true,
      },
    },
  },
});
