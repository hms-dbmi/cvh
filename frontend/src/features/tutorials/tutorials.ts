// Vite's `?raw` suffix inlines the file's UTF-8 contents as a string at
// build time — no runtime fetch. Adding a new tutorial is: drop a .md
// file in ./content/, import it here, add an entry to TUTORIALS.
import addingData from "./content/adding-data.md?raw";
import buildingACustomGenomeBrowser from "./content/building-a-custom-genome-browser.md?raw";
import creatingAMultiViewVisualization from "./content/creating-a-multi-view-visualization.md?raw";
import gettingStarted from "./content/getting-started.md?raw";
import loadingAVitessceConfig from "./content/loading-a-vitessce-config.md?raw";
import reusingAnExistingGoslingSpec from "./content/reusing-an-existing-gosling-spec.md?raw";
import yourFirstVisualization from "./content/your-first-visualization.md?raw";

export interface Tutorial {
  slug: string;
  title: string;
  markdown: string;
  // Sidebar group label. Entries without one sit at the top of the
  // sidebar, above the first group heading.
  section?: string;
}

// Order here is the order shown in the sidebar. First entry is the
// default landing when a user visits /tutorials without a slug.
// Entries sharing a `section` must be contiguous — the sidebar emits a
// group heading each time the value changes.
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
  {
    slug: "your-first-visualization",
    title: "Your first visualization",
    markdown: yourFirstVisualization,
    section: "Gosling",
  },
  {
    slug: "creating-a-multi-view-visualization",
    title: "Creating a multi-view visualization",
    markdown: creatingAMultiViewVisualization,
    section: "Gosling",
  },
  {
    slug: "building-a-custom-genome-browser",
    title: "Building a custom genome browser",
    markdown: buildingACustomGenomeBrowser,
    section: "Gosling",
  },
  {
    slug: "reusing-an-existing-gosling-spec",
    title: "Reusing an existing Gosling spec",
    markdown: reusingAnExistingGoslingSpec,
    section: "Gosling",
  },
  {
    slug: "loading-a-vitessce-config",
    title: "Loading a Vitessce config",
    markdown: loadingAVitessceConfig,
    section: "Vitessce",
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
  // `String.replaceAll` is ES2021; tsconfig.app.json targets ES2020,
  // so use the split/join form to stay lib-compat.
  return markdown.split("%CLOUDFRONT_URL%").join(cloudfrontUrl);
}

/**
 * Stable id for an in-page anchor derived from a heading's text.
 * `#Creating a Workspace` → `creating-a-workspace`. Kept consistent
 * with GitHub's slug rules for markdown headings so links written
 * out-of-band still work.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export interface Heading {
  text: string;
  slug: string;
}

/**
 * Extract H2 headings from a tutorial markdown string so the right-rail
 * TOC can render them as anchor links. Only H2s — H1 is the article
 * title (rendered once at the top), and H3s are deliberately left out
 * to keep the rail one level deep.
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  for (const line of markdown.split("\n")) {
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (match) {
      const text = match[1];
      headings.push({ text, slug: slugify(text) });
    }
  }
  return headings;
}
