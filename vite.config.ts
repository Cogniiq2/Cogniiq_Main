import path from 'path';
import { createRequire } from 'module';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const vitePluginPrerender = require('vite-plugin-prerender');

const ALL_ROUTES = [
  '/',
  '/leistungen',
  '/ueber-uns',
  '/faq',
  '/kontakt',
  '/ki-telefonassistent',
  '/ki-telefonassistent/demo',
  '/webdesign',
  '/prozessautomatisierung',
  '/deutschland',
  '/bayern',
  '/bayern/ki-telefonassistent',
  '/referenzen',
  '/bewertungen',
  '/scan',
  '/blog',
  '/kosten-webdesign',
  '/kosten-ki-telefonassistent',
  '/kosten-automatisierung',
  '/webdesign-agentur-deutschland',
  '/ki-agentur-deutschland',
  '/automatisierung-unternehmen',
  '/webdesign-arzt',
  '/webdesign-gastronomie',
  '/webdesign-immobilien',
  '/webdesign-hotel',
  '/webdesign-sport',
  '/ki-telefonassistent-arzt',
  '/ki-telefonassistent-restaurant',
  '/ki-telefonassistent-hotel',
  '/ki-telefonassistent-praxis',
  '/automatisierung-restaurant',
  '/automatisierung-arzt',
  '/automatisierung-immobilien',
  '/automatisierung-sport',
  '/verpasste-anrufe-verlust',
  '/keine-anfragen-website',
  '/keine-terminbuchung-online',
  '/zu-viel-manuelle-arbeit',
  '/digitale-automatisierung-unternehmen',
  // City landing pages
  '/bayreuth',
  '/muenchen',
  '/regensburg',
  // City webdesign pages
  '/bayreuth/webdesign',
  '/muenchen/webdesign',
  '/regensburg/webdesign',
  // City cluster pages
  '/bayreuth/webdesign-kosten',
  '/bayreuth/website-erstellen',
  '/bayreuth/landingpage',
  '/bayreuth/website-relaunch',
  '/bayreuth/lokales-seo',
  '/muenchen/webdesign-kosten',
  '/muenchen/website-erstellen',
  '/muenchen/landingpage',
  '/muenchen/website-relaunch',
  '/muenchen/lokales-seo',
  '/regensburg/webdesign-kosten',
  '/regensburg/website-erstellen',
  '/regensburg/landingpage',
  '/regensburg/website-relaunch',
  '/regensburg/lokales-seo',
  // City × service pages
  '/bayreuth/ki-telefonassistent',
  '/bayreuth/automatisierung',
  '/muenchen/ki-telefonassistent',
  '/muenchen/automatisierung',
  '/regensburg/ki-telefonassistent',
  '/regensburg/automatisierung',
  // City × industry pages
  '/webdesign-arzt-bayreuth',
  '/webdesign-gastronomie-bayreuth',
  '/webdesign-immobilien-bayreuth',
  '/webdesign-arzt-muenchen',
  '/webdesign-gastronomie-muenchen',
  '/webdesign-immobilien-muenchen',
  '/webdesign-arzt-regensburg',
  '/webdesign-gastronomie-regensburg',
  '/webdesign-immobilien-regensburg',
];

export default defineConfig({
  plugins: [
    react(),
    vitePluginPrerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: ALL_ROUTES,
      postProcess(renderedRoute) {
        // Ensure admin route is never prerendered
        if (renderedRoute.route.startsWith('/admin')) {
          renderedRoute.html = '';
        }
        return renderedRoute;
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
