import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
// ★ 追加：プラグインをインポート
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  // ★ 修正：プラグインの配列に cssInjectedByJsPlugin() を追加
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    outDir: 'dist',
    // cssCodeSplitはデフォルト設定のままでOK
    rollupOptions: {
      input: path.resolve(__dirname, 'src/js/config.js'),
      output: {
        entryFileNames: 'js/config.js',
        format: 'umd',
        name: 'KintoneSumifPlugin',
        // この設定はシンプルでOK
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
});
