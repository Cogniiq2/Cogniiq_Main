import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // The SSR build (npm run build:ssr -> dist-ssr/) exists only to produce the
  // prerenderer's module graph. It must not copy public/ — those assets belong
  // to the client build in dist/, and duplicating them into a temporary
  // directory would make dist-ssr look deployable and risk a stale second copy
  // of _redirects, _headers, robots.txt and sitemap.xml. The client build is
  // unaffected: publicDir keeps its default there.
  publicDir: isSsrBuild ? false : 'public',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
