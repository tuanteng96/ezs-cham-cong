import path from "path";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const SRC_DIR = path.resolve(__dirname, "./src");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./www");

const BASE = "https://ids.ezs.vn/AppCoreV2/";

export default async () => {
  return {
    plugins: [
      react(),
      visualizer({
        //open: true, // Sau khi build sẽ mở dashboard để xem chunk nào nặng
        gzipSize: true,
        brotliSize: true,
      }),
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
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 5000,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: true,
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules") && !/\.css$/.test(id))
              return "vendor";
            const url = new URL(id, import.meta.url);
            const chunkName = url.searchParams.get("chunkName");
            if (chunkName) {
              return chunkName;
            }
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
    // optimizeDeps: {
    //   include: [
    //     "react",
    //     "react-dom",
    //     "framework7-react",
    //     "framer-motion",
    //     "react-hook-form",
    //     "yup",
    //     "firebase/app",
    //     "firebase/auth",
    //     "firebase/firestore",
    //     "firebase/messaging",
    //   ],
    // },
  };
};
