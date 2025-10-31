import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Necesario para Docker
    port: 3001,
    strictPort: true,
    proxy: {
      // Redirige CUALQUIER llamada que empiece con /api
      // al servicio 'api-gateway' en el puerto 3000
      '/api': {
        target: 'http://api-gateway:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})