import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Tutorial } from "../tutorials";
import { resolveTutorialMarkdown } from "../tutorials";

// react-markdown lets us swap each HTML element it emits for a custom
// component. Doing this here (rather than styling via a CSS file) keeps
// the tutorial layout in sync with MUI tokens and existing colors.
const componentsMap = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h1"
      sx={{
        fontSize: 32,
        fontWeight: 700,
        lineHeight: "40px",
        color: "#111827",
        pt: 3,
        pb: 2,
      }}
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Typography
      component="h2"
      sx={{
        fontSize: 21.6,
        fontWeight: 700,
        lineHeight: "29.7px",
        color: "#111827",
        pt: 4,
        pb: 1.5,
      }}
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <Typography
      component="p"
      sx={{
        fontSize: 15,
        lineHeight: "26.25px",
        color: "#374151",
        py: 0.5,
      }}
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <Box
      component="ul"
      sx={{
        pl: 3,
        my: 1,
        fontSize: 15,
        lineHeight: "26.25px",
        color: "#374151",
      }}
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <Box
      component="li"
      sx={{ fontSize: 15, lineHeight: "26.25px", color: "#374151" }}
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <Box
      component="a"
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: "#374151",
        textDecoration: "underline",
        "&:hover": { color: "#010101" },
      }}
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <Box component="strong" sx={{ fontWeight: 700 }} {...props} />
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // Screenshots are docs assets — full width, border, subtle
    // background so lighter-toned UI captures don't blend into the
    // page background.
    <Box
      component="img"
      alt={props.alt}
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
  ),
};

export default function TutorialArticle({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Box sx={{ maxWidth: 720 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={componentsMap}
      >
        {resolveTutorialMarkdown(tutorial.markdown)}
      </ReactMarkdown>
    </Box>
  );
}
