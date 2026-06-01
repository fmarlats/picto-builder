import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// Loads vite-ssg's `declare module 'vite'` augmentation so `ssgOptions` typechecks here.
import type {} from 'vite-ssg'

export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    port: 5174
  },
  preview: {
    port: 4174
  },
  resolve: {
  },
  // vite-ssg: emit dist/popular/index.html (not popular.html) so /popular/ resolves
  // to a 200 on Scaleway object storage and matches the sitemap's trailing-slash URL.
  ssgOptions: {
    dirStyle: 'nested',
  },
})