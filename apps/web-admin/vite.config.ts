import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    proxy: {
      '/api/v1': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@medical-portal/shared'],
  },
});
