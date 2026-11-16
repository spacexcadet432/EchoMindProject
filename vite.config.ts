import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { handleNvidiaChat } from "./server/api/chat";

const localNvidiaApiPlugin: Plugin = {
  name: "local-nvidia-chat-api",
  configureServer(server) {
    server.middlewares.use("/api/chat", (req, res, next) => {
      void handleNvidiaChat(req, res).catch(next);
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use("/api/chat", (req, res, next) => {
      void handleNvidiaChat(req, res).catch(next);
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const name of ["NVIDIA_API_KEY", "NVIDIA_MODEL", "NVIDIA_API_URL"]) {
    if (env[name]) process.env[name] = env[name];
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      localNvidiaApiPlugin,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
