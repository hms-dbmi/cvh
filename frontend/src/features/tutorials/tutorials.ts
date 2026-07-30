// Vite's `?raw` suffix inlines the file's UTF-8 contents as a string at
// build time — no runtime fetch. Adding a new tutorial is: drop a .md
// file in ./content/, import it here, add an entry to TUTORIALS.
import addingData from "./content/adding-data.md?raw";
import gettingStarted from "./content/getting-started.md?raw";

export interface Tutorial {
  slug: string;
  title: string;
  markdown: string;
}

// Order here is the order shown in the sidebar. First entry is the
// default landing when a user visits /tutorials without a slug.
export const TUTORIALS: readonly Tutorial[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    markdown: gettingStarted,
  },
  {
    slug: "adding-data",
    title: "Adding Data",
    markdown: addingData,
  },
] as const;

export function getTutorialBySlug(slug: string | undefined): Tutorial {
  return (
    TUTORIALS.find((t) => t.slug === slug) ?? TUTORIALS[0]
  );
}

/**
 * Tutorial markdown uses `%CLOUDFRONT_URL%/tutorials/...` placeholders
 * for images so a single env var swap re-points every screenshot.
 * Rewrite them at render time using the same VITE_CLOUDFRONT_URL the
 * rest of the app uses for featured images.
 */
export function resolveTutorialMarkdown(markdown: string): string {
  const cloudfrontUrl = import.meta.env.VITE_CLOUDFRONT_URL ?? "";
  return markdown.replaceAll("%CLOUDFRONT_URL%", cloudfrontUrl);
}
