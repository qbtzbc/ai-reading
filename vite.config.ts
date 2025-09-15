import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 添加这行来修复Chrome扩展的路径问题
  plugins: [
    vue(),
    crx({ manifest })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/content': resolve(__dirname, 'src/content'),
      '@/background': resolve(__dirname, 'src/background'),
      '@/popup': resolve(__dirname, 'src/popup'),
      '@/options': resolve(__dirname, 'src/options'),
      '@/styles': resolve(__dirname, 'src/styles'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/composables': resolve(__dirname, 'src/composables')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false // 保留 console 用于调试
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/_variables.scss";
          @import "@/styles/_mixins.scss";
        `
      }
    }
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },
  server: {
    port: 3000,
    hmr: {
      port: 3001
    }
  }
})