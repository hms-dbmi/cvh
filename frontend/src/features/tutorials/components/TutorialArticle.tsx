import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Tutorial } from "../tutorials";
import {
  resolveTutorialImageSrc,
  resolveTutorialMarkdown,
  slugify,
} from "../tutorials";

const HEADING_COLOR = "#111827";
const BODY_COLOR = "#374151";
const MONO_FONT_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

// Body text tokens shared by <p> and <ul>. <li> inherits font/color/
// line-height via CSS from its <ul> parent, so it needs no handler.
const BODY_SX = {
  fontSize: 15,
  lineHeight: "26.25px",
  color: BODY_COLOR,
} as const;

// Common heading defaults: `letterSpacing: 0` and `textTransform: "none"`
// guard against MUI Typography's default body1 leaking in (0.5px, none)
// and any inherited uppercase from ancestors. `scrollMarginTop` offsets
// linked H2/H3 anchors so they land below the sticky rail top.
const HEADING_COMMON_SX = {
  letterSpacing: 0,
  textTransform: "none",
  color: HEADING_COLOR,
  scrollMarginTop: 16,
} as const;

const slugFromChildren = (children: React.ReactNode): string | undefined =>
  typeof children === "string" ? slugify(children) : undefined;

// Slugged heading factory used by H2 and H3 — both derive an anchor id
// from their text (`#track-templates` deep links) and only differ in
// visual sx. H1 doesn't use this: it's the article title, not a link
// target, and the right-rail TOC lists H2s only.
const makeHeading = (level: "h2" | "h3", sx: SxProps<Theme>) => {
  const Heading = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      id={slugFromChildren(children)}
      component={level}
      sx={{ ...HEADING_COMMON_SX, ...sx }}
      {...props}
    >
      {children}
    </Typography>
  );
  return Heading;
};

// react-markdown lets us swap each HTML element it emits for a custom
// component. Doing this here (rather than styling via a CSS file) keeps
// the tutorial layout in sync with MUI tokens and existing colors.
const componentsMap = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h1"
      sx={{
        ...HEADING_COMMON_SX,
        fontSize: 32,
        fontWeight: 700,
        lineHeight: "40px",
        pt: 3,
        pb: 2,
      }}
      {...props}
    />
  ),
  h2: makeHeading("h2", {
    fontSize: 21.6,
    fontWeight: 700,
    lineHeight: "29.7px",
    pt: 4,
    pb: 1.5,
  }),
  h3: makeHeading("h3", {
    fontSize: 16.5,
    fontWeight: 700,
    lineHeight: "24px",
    pt: 2.5,
    pb: 1,
  }),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <Typography component="p" sx={{ ...BODY_SX, py: 0.5 }} {...props} />
  ),
  // Tailwind Preflight (loaded globally via ./tailwind.css → main.tsx)
  // resets `ol, ul, menu { list-style: none; }`, so browser-default
  // bullets don't render anywhere. Force `listStyleType: "disc"` back
  // on for tutorial lists specifically.
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <Box
      component="ul"
      sx={{ ...BODY_SX, pl: 3, my: 1, listStyleType: "disc" }}
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <Box component="li" sx={BODY_SX} {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <Box
      component="a"
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: BODY_COLOR,
        textDecoration: "underline",
        "&:hover": { color: "#010101" },
      }}
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <Box component="strong" sx={{ fontWeight: 700 }} {...props} />
  ),
  // Inline monospace for spec identifiers and values (`mark`, `rect`,
  // `viridis`). UI labels stay bold — the distinction is "something you
  // type or read in a spec" vs "something you click". No `pre` handler
  // yet, so this styles inline code only; fenced blocks would need one.
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <Box
      component="code"
      sx={{
        fontFamily: MONO_FONT_STACK,
        fontSize: "0.875em",
        bgcolor: "#F1F4F6",
        border: "1px solid #E5E7EB",
        borderRadius: "3px",
        px: 0.5,
        py: "1px",
        color: HEADING_COLOR,
      }}
      {...props}
    />
  ),
};

// Screenshots are docs assets — full width, border, subtle background
// so lighter-toned UI captures don't blend into the page background.
// The handler is a factory closed over the tutorial slug so bare
// relative markdown paths (`example-data-sources.webp`) resolve against
// the tutorial's own asset directory in CloudFront — see
// `resolveTutorialImageSrc`.
const makeImg =
  (slug: string) =>
  ({ src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <Box
      component="img"
      src={resolveTutorialImageSrc(src, slug)}
      loading="lazy"
      sx={{
        display: "block",
        width: "100%",
        my: 2,
        border: "1px solid #CAD5DA",
        borderRadius: "4px",
        bgcolor: "#F5F7FA",
      }}
      {...props}
    />
  );

export default function TutorialArticle({ tutorial }: { tutorial: Tutorial }) {
  const components = useMemo(
    () => ({ ...componentsMap, img: makeImg(tutorial.slug) }),
    [tutorial.slug],
  );
  return (
    <Box sx={{ maxWidth: 720 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {resolveTutorialMarkdown(tutorial.markdown)}
      </ReactMarkdown>
    </Box>
  );
}
