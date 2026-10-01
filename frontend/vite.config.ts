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

// Injects the link-preview image tags into the built HTML. Unfurlers
// (Slack, Teams, iMessage, Bluesky) read this file as static HTML and run
// no JavaScript, so the URL has to be a literal in the output — but it is
// built here from `VITE_CLOUDFRONT_URL` rather than hard-coded, so dev and
// prod each advertise their own images distribution. The card itself lives
// on that distribution beside the tutorial screenshots; the repo tracks no
// raster images. Unset locally, so `npm run dev` emits no image tags and
// the text-only preview still works.
const ogImagePlugin = (): Plugin => ({
  name: "inject-og-image",
  transformIndexHtml() {
    const base = process.env.VITE_CLOUDFRONT_URL?.replace(/\/$/, "");
    if (!base) return;
    const url = `${base}/social/og-logo.png`;
    const meta = (attrs: Record<string, string>) => ({
      tag: "meta",
      attrs,
      injectTo: "head" as const,
    });
    return [
      meta({ property: "og:image", content: url }),
      meta({ property: "og:image:width", content: "1200" }),
      meta({ property: "og:image:height", content: "1200" }),
      meta({
        property: "og:image:alt",
        content: "The Community Visualization Hub logo",
      }),
      meta({ name: "twitter:image", content: url }),
      meta({ name: "twitter:card", content: "summary" }),
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
    ogImagePlugin(),
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
