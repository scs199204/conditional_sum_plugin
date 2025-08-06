import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'src/js/config.js'),
      output: {
        entryFileNames: 'js/config.js',
        format: 'umd',
        name: 'KintoneConditionalSumPlugin',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
});
