import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxies: the browser calls these same-origin paths and Vite forwards the
// request server-side, where CORS does not apply. OpenSky and AirLabs only send
// CORS headers for their own origins, so direct browser calls are blocked —
// these proxies are what make live data work during `npm run dev`.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/osky-auth': {
        target: 'https://auth.opensky-network.org',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/osky-auth/, ''),
      },
      '/osky': {
        target: 'https://opensky-network.org/api',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/osky/, ''),
      },
      '/airlabs': {
        target: 'https://airlabs.co/api/v9',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/airlabs/, ''),
      },
    },
  },
})
