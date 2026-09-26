import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // src, ../locales altındaki çeviri dosyalarını içe aktarıyor
    fs: { allow: ['..'] },
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    // FiveM'in gömülü Chromium sürümü için
    target: 'chrome90',
    cssTarget: 'chrome90',
  },
});
