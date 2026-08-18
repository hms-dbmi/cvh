// Vite's `?raw` suffix inlines the file's UTF-8 contents as a string at
// build time — no runtime fetch. Adding a new tutorial is: drop a .md
// file in ./content/, import it here, add an entry to TUTORIALS.
import addingData from "./content/adding-data.md?raw";
import creatingAMultiViewVisualization from "./content/creating-a-multi-view-visualization.md?raw";
import gettingStarted from "./content/getting-started.md?raw";
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
    slug: "reusing-an-existing-gosling-spec",
    title: "Reusing an existing Gosling spec",
    markdown: reusingAnExistingGoslingSpec,
    section: "Gosling",
  },
] as const;

// The two Vitessce tutorials — `loading-a-vitessce-config` and
// `copying-a-spec-from-hubmap` — are written but still placeholder content,
// so they are left out of TUTORIALS rather than shipped half-finished. Their
// .md files live in ./content/. To list them, re-add the `?raw` imports and
// an entry each with `section: "Vitessce"` (entries sharing a section must
// stay contiguous).

export interface TutorialSection {
  // `undefined` for entries without a group label — those sit at the top
  // of the sidebar above the first named section.
  name: string | undefined;
  tutorials: Tutorial[];
}

// Groups contiguous same-`section` entries together, so the sidebar can
// render sections → tutorials in a nested loop instead of detecting
// section transitions mid-render. Contiguity of same-section entries in
// TUTORIALS is what makes this correct — see the comment above.
export const TUTORIAL_SECTIONS: readonly TutorialSection[] = TUTORIALS.reduce<
  TutorialSection[]
>((sections, tutorial) => {
  const last = sections[sections.length - 1];
  if (last && last.name === tutorial.section) {
    last.tutorials.push(tutorial);
  } else {
    sections.push({ name: tutorial.section, tutorials: [tutorial] });
  }
  return sections;
}, []);

export function getTutorialBySlug(slug: string | undefined): Tutorial {
  return TUTORIALS.find((t) => t.slug === slug) ?? TUTORIALS[0];
}

/**
 * Rewrites the legacy `%CLOUDFRONT_URL%` placeholder still used by
 * tutorials that reference images at flat `tutorials/xxx.png` paths
 * (getting-started, adding-data). Tutorials converted to per-slug
 * asset directories use bare relative filenames instead — those go
 * through `resolveTutorialImageSrc` at render time.
 */
export function resolveTutorialMarkdown(markdown: string): string {
  const cloudfrontUrl = import.meta.env.VITE_CLOUDFRONT_URL ?? "";
  // `String.replaceAll` is ES2021; tsconfig.app.json targets ES2020,
  // so use the split/join form to stay lib-compat.
  return markdown.split("%CLOUDFRONT_URL%").join(cloudfrontUrl);
}

/**
 * Resolves a tutorial image's `src` from the react-markdown img handler.
 * The convention for new tutorials is bare relative filenames
 * (`example-data-sources.webp`) — this prepends the tutorial's asset
 * directory (`${CLOUDFRONT_URL}/tutorials/${slug}/`) at render time so
 * the markdown doesn't have to repeat the slug and CDN URL for every
 * image, and moving a tutorial to a different slug touches zero image
 * references.
 *
 * Passthrough for absolute URLs (`http://`, `https://`) and for
 * already-resolved CloudFront URLs coming out of `resolveTutorialMarkdown`
 * — that keeps the legacy `%CLOUDFRONT_URL%/tutorials/xxx.png` pattern
 * working for the tutorials that haven't been migrated.
 */
export function resolveTutorialImageSrc(
  src: string | undefined,
  slug: string,
): string | undefined {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return src;
  const cloudfrontUrl = import.meta.env.VITE_CLOUDFRONT_URL ?? "";
  return `${cloudfrontUrl}/tutorials/${slug}/${src}`;
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
