import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This sets the base path for XAMPP. 
  // If you rename your folder in htdocs to something else, change this too.
  base: '/intramail/', 
  server: {
    proxy: {
      // Proxy API requests to XAMPP during development
      '/intramail/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});