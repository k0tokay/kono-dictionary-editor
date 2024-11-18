import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/kono-dictionary-editor/",
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    }
  }
})