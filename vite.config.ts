import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Generate unique version for cache busting
const BUILD_VERSION = Date.now().toString();

export default defineConfig({
  base: './',
  plugins: [
    react(),
VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'mask-icon.svg'
      ],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/en\/spot\//, /^\/zh\/spot\//, /^\/en\/guidebook\//, /^\/zh\/guidebook\//],
        // Add version to cache names to force cache refresh on new deploys
        cacheId: `mop-okinawa-v${BUILD_VERSION}`,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/s3geojsonnew\.s3\.ap-southeast-2\.amazonaws\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: `geojson-cache-v${BUILD_VERSION}`,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: /^https:\/\/.*\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `map-tiles-cache-v${BUILD_VERSION}`,
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'leaflet', 'react-leaflet'],
        },
      },
    },
  },
  server: {
    headers: {
      'Cache-Control': 'no-store',
    },
  },
});