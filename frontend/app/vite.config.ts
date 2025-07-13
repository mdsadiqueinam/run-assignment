import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import devtoolsJson from "vite-plugin-devtools-json";
import AutoImport from "unplugin-auto-import/vite";
import topLevelAwait from "vite-plugin-top-level-await";
import { fileURLToPath } from "url";
import "dotenv/config";

let proxy: Record<string, any> = {};
if (process.env?.VITE_PROXY_GRAPHQL_TARGET) {
  proxy["^(/graphql).*"] = {
    target: process.env.VITE_PROXY_GRAPHQL_TARGET,
    changeOrigin: true,
    secure: true,
    ws: true,
  };
}
if (process.env?.VITE_PROXY_AUTH_TARGET) {
  proxy["^(/auth|/oauth2|/services|/files).*"] = {
    target: process.env.VITE_PROXY_AUTH_TARGET,
    changeOrigin: true,
    secure: true,
    ws: true,
  };
}

export default defineConfig({
  plugins: [
    topLevelAwait(),
    devtoolsJson(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    AutoImport({
      imports: ["react", "react-router", "ahooks"],
      dirs: ["app/components", "app/hooks", "app/utils"],
    }),
  ],
  server: {
    port: 5174,
    proxy,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
