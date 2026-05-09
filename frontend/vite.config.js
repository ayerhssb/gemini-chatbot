import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api -> backend during dev so we don't fight CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
