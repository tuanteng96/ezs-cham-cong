import path from 'path';
import react from '@vitejs/plugin-react';
import browserslistToEsbuild from 'browserslist-to-esbuild';
// import { manualChunksPlugin } from 'vite-plugin-webpackchunkname'

const SRC_DIR = path.resolve(__dirname, './src');
const PUBLIC_DIR = path.resolve(__dirname, './public');
const BUILD_DIR = path.resolve(__dirname, './www', );

const BASE = 'https://spa1.ezs.vn/AppCore/';

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
    ],
    root: SRC_DIR,
    base: BASE,
    publicDir: PUBLIC_DIR,
    build: {
      target: browserslistToEsbuild(['>0.2%', 'not dead', 'not op_mini all']),
      minify: true,
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: false,
        output: {
          // manualChunks(id) {
          //   if (id.includes('node_modules')) {
          //     return id.toString().split('node_modules/')[1].split('/')[0].toString();
          //   }
          // },
          assetFileNames: (assetInfo) => {
            if (/\.css$/.test(assetInfo.name)) {
              return 'assets/css/[name][extname]'
            }
            return `assets/[name][extname]`;
          },
          chunkFileNames: 'assets/js/[name].js',
          entryFileNames: 'assets/js/[name].js',
        },
      },
    },
    resolve: {
      alias: {
        '@': SRC_DIR,
      },
    },
    server: {
      host: true,
      port: 5001,
    }
  };
}