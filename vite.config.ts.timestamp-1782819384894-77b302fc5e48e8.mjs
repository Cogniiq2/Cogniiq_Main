// vite.config.ts
import path from "path";
import { createRequire } from "module";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/home/project";
var __vite_injected_original_import_meta_url = "file:///home/project/vite.config.ts";
var require2 = createRequire(__vite_injected_original_import_meta_url);
var vitePluginPrerender = require2("vite-plugin-prerender");
var ALL_ROUTES = [
  "/",
  "/leistungen",
  "/ueber-uns",
  "/faq",
  "/kontakt",
  "/ki-telefonassistent",
  "/ki-telefonassistent/demo",
  "/webdesign",
  "/prozessautomatisierung",
  "/deutschland",
  "/bayern",
  "/bayern/ki-telefonassistent",
  "/referenzen",
  "/bewertungen",
  "/scan",
  "/blog",
  "/kosten-webdesign",
  "/kosten-ki-telefonassistent",
  "/kosten-automatisierung",
  "/webdesign-agentur-deutschland",
  "/ki-agentur-deutschland",
  "/automatisierung-unternehmen",
  "/webdesign-arzt",
  "/webdesign-gastronomie",
  "/webdesign-immobilien",
  "/webdesign-hotel",
  "/webdesign-sport",
  "/ki-telefonassistent-arzt",
  "/ki-telefonassistent-restaurant",
  "/ki-telefonassistent-hotel",
  "/ki-telefonassistent-praxis",
  "/automatisierung-restaurant",
  "/automatisierung-arzt",
  "/automatisierung-immobilien",
  "/automatisierung-sport",
  "/verpasste-anrufe-verlust",
  "/keine-anfragen-website",
  "/keine-terminbuchung-online",
  "/zu-viel-manuelle-arbeit",
  "/digitale-automatisierung-unternehmen",
  // City landing pages
  "/bayreuth",
  "/muenchen",
  "/regensburg",
  // City webdesign pages
  "/bayreuth/webdesign",
  "/muenchen/webdesign",
  "/regensburg/webdesign",
  // City cluster pages
  "/bayreuth/webdesign-kosten",
  "/bayreuth/website-erstellen",
  "/bayreuth/landingpage",
  "/bayreuth/website-relaunch",
  "/bayreuth/lokales-seo",
  "/muenchen/webdesign-kosten",
  "/muenchen/website-erstellen",
  "/muenchen/landingpage",
  "/muenchen/website-relaunch",
  "/muenchen/lokales-seo",
  "/regensburg/webdesign-kosten",
  "/regensburg/website-erstellen",
  "/regensburg/landingpage",
  "/regensburg/website-relaunch",
  "/regensburg/lokales-seo",
  // City × service pages
  "/bayreuth/ki-telefonassistent",
  "/bayreuth/automatisierung",
  "/muenchen/ki-telefonassistent",
  "/muenchen/automatisierung",
  "/regensburg/ki-telefonassistent",
  "/regensburg/automatisierung",
  // City × industry pages
  "/webdesign-arzt-bayreuth",
  "/webdesign-gastronomie-bayreuth",
  "/webdesign-immobilien-bayreuth",
  "/webdesign-arzt-muenchen",
  "/webdesign-gastronomie-muenchen",
  "/webdesign-immobilien-muenchen",
  "/webdesign-arzt-regensburg",
  "/webdesign-gastronomie-regensburg",
  "/webdesign-immobilien-regensburg"
];
var vite_config_default = defineConfig({
  plugins: [
    react(),
    vitePluginPrerender({
      staticDir: path.join(__vite_injected_original_dirname, "dist"),
      routes: ALL_ROUTES,
      postProcess(renderedRoute) {
        if (renderedRoute.route.startsWith("/admin")) {
          renderedRoute.html = "";
        }
        return renderedRoute;
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNyZWF0ZVJlcXVpcmUgfSBmcm9tICdtb2R1bGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuXG5jb25zdCByZXF1aXJlID0gY3JlYXRlUmVxdWlyZShpbXBvcnQubWV0YS51cmwpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbmNvbnN0IHZpdGVQbHVnaW5QcmVyZW5kZXIgPSByZXF1aXJlKCd2aXRlLXBsdWdpbi1wcmVyZW5kZXInKTtcblxuY29uc3QgQUxMX1JPVVRFUyA9IFtcbiAgJy8nLFxuICAnL2xlaXN0dW5nZW4nLFxuICAnL3VlYmVyLXVucycsXG4gICcvZmFxJyxcbiAgJy9rb250YWt0JyxcbiAgJy9raS10ZWxlZm9uYXNzaXN0ZW50JyxcbiAgJy9raS10ZWxlZm9uYXNzaXN0ZW50L2RlbW8nLFxuICAnL3dlYmRlc2lnbicsXG4gICcvcHJvemVzc2F1dG9tYXRpc2llcnVuZycsXG4gICcvZGV1dHNjaGxhbmQnLFxuICAnL2JheWVybicsXG4gICcvYmF5ZXJuL2tpLXRlbGVmb25hc3Npc3RlbnQnLFxuICAnL3JlZmVyZW56ZW4nLFxuICAnL2Jld2VydHVuZ2VuJyxcbiAgJy9zY2FuJyxcbiAgJy9ibG9nJyxcbiAgJy9rb3N0ZW4td2ViZGVzaWduJyxcbiAgJy9rb3N0ZW4ta2ktdGVsZWZvbmFzc2lzdGVudCcsXG4gICcva29zdGVuLWF1dG9tYXRpc2llcnVuZycsXG4gICcvd2ViZGVzaWduLWFnZW50dXItZGV1dHNjaGxhbmQnLFxuICAnL2tpLWFnZW50dXItZGV1dHNjaGxhbmQnLFxuICAnL2F1dG9tYXRpc2llcnVuZy11bnRlcm5laG1lbicsXG4gICcvd2ViZGVzaWduLWFyenQnLFxuICAnL3dlYmRlc2lnbi1nYXN0cm9ub21pZScsXG4gICcvd2ViZGVzaWduLWltbW9iaWxpZW4nLFxuICAnL3dlYmRlc2lnbi1ob3RlbCcsXG4gICcvd2ViZGVzaWduLXNwb3J0JyxcbiAgJy9raS10ZWxlZm9uYXNzaXN0ZW50LWFyenQnLFxuICAnL2tpLXRlbGVmb25hc3Npc3RlbnQtcmVzdGF1cmFudCcsXG4gICcva2ktdGVsZWZvbmFzc2lzdGVudC1ob3RlbCcsXG4gICcva2ktdGVsZWZvbmFzc2lzdGVudC1wcmF4aXMnLFxuICAnL2F1dG9tYXRpc2llcnVuZy1yZXN0YXVyYW50JyxcbiAgJy9hdXRvbWF0aXNpZXJ1bmctYXJ6dCcsXG4gICcvYXV0b21hdGlzaWVydW5nLWltbW9iaWxpZW4nLFxuICAnL2F1dG9tYXRpc2llcnVuZy1zcG9ydCcsXG4gICcvdmVycGFzc3RlLWFucnVmZS12ZXJsdXN0JyxcbiAgJy9rZWluZS1hbmZyYWdlbi13ZWJzaXRlJyxcbiAgJy9rZWluZS10ZXJtaW5idWNodW5nLW9ubGluZScsXG4gICcvenUtdmllbC1tYW51ZWxsZS1hcmJlaXQnLFxuICAnL2RpZ2l0YWxlLWF1dG9tYXRpc2llcnVuZy11bnRlcm5laG1lbicsXG4gIC8vIENpdHkgbGFuZGluZyBwYWdlc1xuICAnL2JheXJldXRoJyxcbiAgJy9tdWVuY2hlbicsXG4gICcvcmVnZW5zYnVyZycsXG4gIC8vIENpdHkgd2ViZGVzaWduIHBhZ2VzXG4gICcvYmF5cmV1dGgvd2ViZGVzaWduJyxcbiAgJy9tdWVuY2hlbi93ZWJkZXNpZ24nLFxuICAnL3JlZ2Vuc2J1cmcvd2ViZGVzaWduJyxcbiAgLy8gQ2l0eSBjbHVzdGVyIHBhZ2VzXG4gICcvYmF5cmV1dGgvd2ViZGVzaWduLWtvc3RlbicsXG4gICcvYmF5cmV1dGgvd2Vic2l0ZS1lcnN0ZWxsZW4nLFxuICAnL2JheXJldXRoL2xhbmRpbmdwYWdlJyxcbiAgJy9iYXlyZXV0aC93ZWJzaXRlLXJlbGF1bmNoJyxcbiAgJy9iYXlyZXV0aC9sb2thbGVzLXNlbycsXG4gICcvbXVlbmNoZW4vd2ViZGVzaWduLWtvc3RlbicsXG4gICcvbXVlbmNoZW4vd2Vic2l0ZS1lcnN0ZWxsZW4nLFxuICAnL211ZW5jaGVuL2xhbmRpbmdwYWdlJyxcbiAgJy9tdWVuY2hlbi93ZWJzaXRlLXJlbGF1bmNoJyxcbiAgJy9tdWVuY2hlbi9sb2thbGVzLXNlbycsXG4gICcvcmVnZW5zYnVyZy93ZWJkZXNpZ24ta29zdGVuJyxcbiAgJy9yZWdlbnNidXJnL3dlYnNpdGUtZXJzdGVsbGVuJyxcbiAgJy9yZWdlbnNidXJnL2xhbmRpbmdwYWdlJyxcbiAgJy9yZWdlbnNidXJnL3dlYnNpdGUtcmVsYXVuY2gnLFxuICAnL3JlZ2Vuc2J1cmcvbG9rYWxlcy1zZW8nLFxuICAvLyBDaXR5IFx1MDBENyBzZXJ2aWNlIHBhZ2VzXG4gICcvYmF5cmV1dGgva2ktdGVsZWZvbmFzc2lzdGVudCcsXG4gICcvYmF5cmV1dGgvYXV0b21hdGlzaWVydW5nJyxcbiAgJy9tdWVuY2hlbi9raS10ZWxlZm9uYXNzaXN0ZW50JyxcbiAgJy9tdWVuY2hlbi9hdXRvbWF0aXNpZXJ1bmcnLFxuICAnL3JlZ2Vuc2J1cmcva2ktdGVsZWZvbmFzc2lzdGVudCcsXG4gICcvcmVnZW5zYnVyZy9hdXRvbWF0aXNpZXJ1bmcnLFxuICAvLyBDaXR5IFx1MDBENyBpbmR1c3RyeSBwYWdlc1xuICAnL3dlYmRlc2lnbi1hcnp0LWJheXJldXRoJyxcbiAgJy93ZWJkZXNpZ24tZ2FzdHJvbm9taWUtYmF5cmV1dGgnLFxuICAnL3dlYmRlc2lnbi1pbW1vYmlsaWVuLWJheXJldXRoJyxcbiAgJy93ZWJkZXNpZ24tYXJ6dC1tdWVuY2hlbicsXG4gICcvd2ViZGVzaWduLWdhc3Ryb25vbWllLW11ZW5jaGVuJyxcbiAgJy93ZWJkZXNpZ24taW1tb2JpbGllbi1tdWVuY2hlbicsXG4gICcvd2ViZGVzaWduLWFyenQtcmVnZW5zYnVyZycsXG4gICcvd2ViZGVzaWduLWdhc3Ryb25vbWllLXJlZ2Vuc2J1cmcnLFxuICAnL3dlYmRlc2lnbi1pbW1vYmlsaWVuLXJlZ2Vuc2J1cmcnLFxuXTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgdml0ZVBsdWdpblByZXJlbmRlcih7XG4gICAgICBzdGF0aWNEaXI6IHBhdGguam9pbihfX2Rpcm5hbWUsICdkaXN0JyksXG4gICAgICByb3V0ZXM6IEFMTF9ST1VURVMsXG4gICAgICBwb3N0UHJvY2VzcyhyZW5kZXJlZFJvdXRlKSB7XG4gICAgICAgIC8vIEVuc3VyZSBhZG1pbiByb3V0ZSBpcyBuZXZlciBwcmVyZW5kZXJlZFxuICAgICAgICBpZiAocmVuZGVyZWRSb3V0ZS5yb3V0ZS5zdGFydHNXaXRoKCcvYWRtaW4nKSkge1xuICAgICAgICAgIHJlbmRlcmVkUm91dGUuaHRtbCA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZW5kZXJlZFJvdXRlO1xuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sT0FBTyxVQUFVO0FBQzFPLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8sV0FBVztBQUNsQixTQUFTLG9CQUFvQjtBQUg3QixJQUFNLG1DQUFtQztBQUF5RixJQUFNLDJDQUEyQztBQUtuTCxJQUFNQSxXQUFVLGNBQWMsd0NBQWU7QUFFN0MsSUFBTSxzQkFBc0JBLFNBQVEsdUJBQXVCO0FBRTNELElBQU0sYUFBYTtBQUFBLEVBQ2pCO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sb0JBQW9CO0FBQUEsTUFDbEIsV0FBVyxLQUFLLEtBQUssa0NBQVcsTUFBTTtBQUFBLE1BQ3RDLFFBQVE7QUFBQSxNQUNSLFlBQVksZUFBZTtBQUV6QixZQUFJLGNBQWMsTUFBTSxXQUFXLFFBQVEsR0FBRztBQUM1Qyx3QkFBYyxPQUFPO0FBQUEsUUFDdkI7QUFDQSxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJyZXF1aXJlIl0KfQo=
