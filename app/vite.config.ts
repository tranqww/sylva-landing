import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves project sites from /<repo>/, so the base path is injected
// at build time (`VITE_BASE=/sylva/ npm run build`) and defaults to root for
// local dev and user/organisation pages.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Keep the animation runtime in its own chunk so the markup and the
        // React runtime are not invalidated every time a tween changes.
        manualChunks: (id) =>
          /node_modules[\\/](gsap|lenis)[\\/]/.test(id) ? 'motion' : undefined,
      },
    },
  },
})
