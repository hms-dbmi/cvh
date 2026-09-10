import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import type { Plugin } from "vite";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

// Injects the CFDE-required Google Analytics (gtag.js) snippet into the
// built HTML. Only fires when `VITE_GA_MEASUREMENT_ID` is set at build
// time — dev / prod deploys pass the env's Measurement ID via the
// workflow, and local `npm run dev` stays silent unless the developer
// sets the var themselves. We do not add manual `gtag('event', ...)`
// anywhere; the config call handles the pageview / session tracking
// CFDE requires, and TanStack Router route changes are picked up by
// GA4's Enhanced Measurement (History API listener) automatically.
const gaTagPlugin = (): Plugin => ({
  name: "inject-google-analytics",
  transformIndexHtml() {
    const id = process.env.VITE_GA_MEASUREMENT_ID;
    if (!id) return;
    return [
      {
        tag: "script",
        attrs: {
          async: true,
          src: `https://www.googletagmanager.com/gtag/js?id=${id}`,
        },
        injectTo: "head",
      },
      {
        tag: "script",
        children: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`,
        injectTo: "head",
      },
    ];
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    svgr(),
    tailwindcss(),
    gaTagPlugin(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // e2e/ holds Playwright specs — Vitest must not pick them up.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  server: {
    fs: {
      // Allow reads one level above the frontend workspace so
      // `src/routes/changelog.tsx` can `?raw`-import the monorepo-root
      // `CHANGELOG.md`. Vite's default `strict: true` would reject this.
      allow: [path.resolve(__dirname, "..")],
    },
  },
});
