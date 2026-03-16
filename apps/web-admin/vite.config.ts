import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function resolveApiProxyTarget(): string {
  const rawValue = process.env.VITE_API_URL?.trim();
  if (!rawValue) {
    return 'http://localhost:3000';
  }

  try {
    const parsed = new URL(rawValue);
    return parsed.origin;
  } catch {
    return rawValue.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3000';
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@medical-portal/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 3002,
    proxy: {
      '/api/v1': {
        target: resolveApiProxyTarget(),
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@medical-portal/shared'],
  },
});
