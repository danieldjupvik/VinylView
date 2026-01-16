import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts'
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']]
      }
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'VinylView',
        short_name: 'VinylView',
        description: 'Browse your Discogs vinyl collection',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.discogs\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'discogs-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          {
            urlPattern: /^https:\/\/i\.discogs\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'discogs-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/__tests__/**', 'src/components/ui/**']
    }
  }
})
