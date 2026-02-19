import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // MVP 后端 API
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // 如果你的图片/文件是从 MVP 的 /files/** 出来的，也一起代理（推荐）
      "/files": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // 可选：如果你还有 /d/** 下载页（DeliveryController）也加上
      "/d": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
