import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The backend's CORS_ORIGIN allows http://localhost:3000, so the dev server must use
    // exactly that port. strictPort: fail instead of silently moving to 3001 (which CORS would block).
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
});
