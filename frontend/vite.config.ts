import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/drawings': {
        target: process.env.LIVE_DRAWINGS ? 'https://fishing.recurse.com' : 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:3002', // Explicit IPv4 address
        changeOrigin: true,
        secure: false,
      },
    },
  },
})