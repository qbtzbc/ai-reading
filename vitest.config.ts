import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        'public/',
        'docs/'
      ]
    },
    ui: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/content': resolve(__dirname, 'src/content'),
      '@/background': resolve(__dirname, 'src/background'),
      '@/popup': resolve(__dirname, 'src/popup'),
      '@/options': resolve(__dirname, 'src/options'),
      '@/styles': resolve(__dirname, 'src/styles'),
      '@/types': resolve(__dirname, 'src/types')
    }
  }
})