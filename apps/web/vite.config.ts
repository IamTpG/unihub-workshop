import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,  // listen on 0.0.0.0 so LAN devices can reach the dev server
    https: true, // self-signed cert — required for getUserMedia() (camera) on non-localhost
    proxy: {
      // Forward /api requests to the local API server.
      // This keeps everything on one HTTPS origin so the browser never
      // sees a mixed-content (HTTPS page → HTTP API) error.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
