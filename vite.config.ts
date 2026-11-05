import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// GitHub Pages bir alt klasörde yayınlar (ör. /ruzgarla-dans/).
// İş akışı BASE_PATH ortam değişkenini ayarlar; yerelde "/" kullanılır.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { anthropic: ['@anthropic-ai/sdk'], react: ['react', 'react-dom'], dexie: ['dexie', 'dexie-react-hooks'] },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rüzgârla Dans',
        short_name: 'Rüzgârla Dans',
        description: 'Hikâye anlatımını adım adım, kendi malzemenle öğren.',
        lang: 'tr',
        dir: 'ltr',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#14110f',
        theme_color: '#14110f',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Uygulamanın tamamı (yazı tipleri dâhil) önbelleğe alınır: uçak modunda tam çalışır.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Türkçe için latin + latin-ext yeter; kiril, Yunan ve Vietnam alt kümeleri önbelleğe alınmaz.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
