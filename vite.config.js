import path from "path";
import react from "@vitejs/plugin-react";
import { splitVendorChunkPlugin } from "vite";

const SRC_DIR = path.resolve(__dirname, "./src");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./www");

const BASE = "https://ids.ezs.vn/AppCore/";

export default async () => {
  return {
    plugins: [
      react(),
      // legacy({
      //   modernPolyfills: [
      //     "es.global-this",
      //   ],
      //   renderLegacyChunks: false,
      // }),
      //manualChunksPlugin()
      //splitVendorChunkPlugin()
    ],
    root: SRC_DIR,
    base: BASE,
    publicDir: PUBLIC_DIR,
    experimental: {
      // renderBuiltUrl(filename, {
      //   hostType
      // }) {
      //   if (hostType === 'js') {
      //     return {
      //       runtime: `window.cdnUrl(${JSON.stringify(filename)})`
      //     };
      //   }
      //   return {
      //     relative: true
      //   }
      // }
    },
    build: {
      target: ["es2020", "edge88", "firefox78", "chrome87", "safari12"],
      minify: true,
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: false,
        output: {
          manualChunks: (id) => {
            const url = new URL(id, import.meta.url);
            const chunkName = url.searchParams.get("chunkName");
            if (chunkName) {
              return chunkName;
            }
            // return void will invoke the built-in `viteManualChunks`
          },
          assetFileNames: (assetInfo) => {
            if (/\.css$/.test(assetInfo.name)) {
              return "assets/css/[name][extname]";
            }
            return `assets/[name][extname]`;
          },
          chunkFileNames: "assets/js/[name].js",
          entryFileNames: "assets/js/[name].js",
        },
      },
    },
    resolve: {
      alias: {
        "@": SRC_DIR,
      },
    },
    server: {
      host: true,
      port: 5001,
    },
  };
};
