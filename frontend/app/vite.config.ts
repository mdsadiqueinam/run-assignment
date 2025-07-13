import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import devtoolsJson from "vite-plugin-devtools-json";
import AutoImport from "unplugin-auto-import/vite";

export default defineConfig({
  plugins: [
    devtoolsJson(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    AutoImport({
      imports: ["react", "react-router", "ahooks"],
      dirs: ["app/components", "app/hooks", "app/utils"],
    }),
  ],
});
