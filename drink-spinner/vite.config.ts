/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 部署在子路徑時（例如 GitHub Pages 的 /儲存庫名稱/）由 BASE_PATH 指定
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  server: { host: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
