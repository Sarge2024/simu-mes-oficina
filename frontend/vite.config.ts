import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5001,
    proxy: {
      '/api/django': {
        target: 'http://127.0.0.1:5012',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/django/, ''),
      },
      '/api/fastapi': {
        target: 'http://127.0.0.1:5013',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fastapi/, ''),
      },
    },
  },
})
