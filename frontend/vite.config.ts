import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In production, nginx proxies /api → backend. In `vite dev`, this proxy does
// the same so the browser always talks to a single origin (no CORS anywhere).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
