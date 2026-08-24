import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// `?raw` inlines the file's contents as a string at build time — no runtime
// fetch. Vite's `server.fs.allow` (see vite.config.ts) is extended to the
// monorepo root so this traversal one level above `frontend/` resolves.
import changelogSource from "../../../CHANGELOG.md?raw";

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
});

// Set to "production" only in the prod deploy workflow. Absent (dev
// deploy + local dev) → show the [Unreleased] section so contributors
// and stakeholders can see what's landed on dev-not-prod.
const IS_PRODUCTION = import.meta.env.VITE_ENVIRONMENT === "production";

// Strip the [Unreleased] block on prod. The regex matches from the
// `## [Unreleased]` heading up to (but not including) the next
// `## [YYYY-MM-DD` heading, so released blocks below survive.
const UNRELEASED_BLOCK = /^## \[Unreleased\][\s\S]*?(?=^## \[\d{4})/m;

// Strip the contributor-oriented preamble (everything between the top-
// level `# Changelog` heading and the first version heading). It contains
// internal jargon about the dev-vs-prod release branching and a relative
// link to `python-client/CHANGELOG.md` that resolves to a broken URL in
// this route. The `# Changelog` heading itself stays as the page title.
const PREAMBLE = /^# Changelog\n[\s\S]*?(?=^## \[)/m;

const changelogMd = (IS_PRODUCTION
  ? changelogSource.replace(UNRELEASED_BLOCK, "")
  : changelogSource
).replace(PREAMBLE, "# Changelog\n\n");

// Minimal markdown → MUI mapping. Kept local to this route so it doesn't
// entangle with the tutorial article's renderer (which has its own
// heading anchors, scroll offsets, and figma-derived sizes). `ul` sets
// `listStyleType: "disc"` because Tailwind Preflight's global reset would
// otherwise render bullet-less lists.
const componentsMap = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h1"
      variant="h4"
      sx={{ mt: 2, mb: 2, fontWeight: 600 }}
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h2"
      variant="h5"
      sx={{ mt: 5, mb: 1.5, fontWeight: 600 }}
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h3"
      variant="subtitle1"
      sx={{ mt: 3, mb: 1, fontWeight: 700 }}
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <Typography component="p" variant="body2" sx={{ mb: 1.5 }} {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <Box
      component="ul"
      sx={{ pl: 3, mb: 2, listStyleType: "disc" }}
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <Typography component="li" variant="body2" sx={{ mb: 0.5 }} {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <Box
      component="code"
      sx={{
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: "0.875em",
        bgcolor: "#F1F4F6",
        border: "1px solid #E5E7EB",
        borderRadius: "3px",
        px: 0.5,
        py: "1px",
      }}
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <Box
      component="a"
      target="_blank"
      rel="noopener noreferrer"
      sx={{ color: "#3054A6", textDecoration: "underline" }}
      {...props}
    />
  ),
};

function ChangelogPage() {
  return (
    <Box sx={{ maxWidth: 820, mx: "auto", px: 3, py: 4 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentsMap}>
        {changelogMd}
      </ReactMarkdown>
    </Box>
  );
}
