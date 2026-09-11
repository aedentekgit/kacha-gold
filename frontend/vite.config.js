import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/kacha-gold/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/goodreturns': {
        target: 'https://www.goodreturns.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/goodreturns/, '/gold-rates/'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
})

