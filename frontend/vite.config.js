import { defineConfig } from "vite";
import { resolve } from "node:path";

function publicRouteRewrites() {
  return {
    name: "kc-public-routes",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split("?")[0] || "";
        if (url === "/explore") req.url = "/explore.html";
        else if (/^\/s\/[^/]+/.test(url)) req.url = "/storefront.html";
        else if (/^\/verify\/[^/]+/.test(url)) req.url = "/verify.html";
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [publicRouteRewrites()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app.html"),
        explore: resolve(__dirname, "explore.html"),
        storefront: resolve(__dirname, "storefront.html"),
        verify: resolve(__dirname, "verify.html"),
      },
    },
  },
});
