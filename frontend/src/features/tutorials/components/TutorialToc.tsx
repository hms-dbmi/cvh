import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Heading } from "../tutorials";

/**
 * Right-rail table of contents. One anchor link per H2 in the current
 * tutorial; scroll-target ids are stamped onto the H2s by
 * TutorialArticle so #slug scrolls to the matching section.
 *
 * The left border matches the Figma spec (thin vertical rule between
 * the article and the TOC).
 */
export default function TutorialToc({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;

  return (
    // Border lives on the sticky inner nav so the divider tracks the
    // length of the TOC content (rather than spanning the whole
    // article's length). Hidden on narrower viewports where the top
    // sidebar covers navigation.
    <Box
      sx={{
        display: { xs: "none", md: "block" },
        width: 240,
        flexShrink: 0,
      }}
    >
      <Stack
        component="nav"
        aria-label="On this page"
        spacing={1.5}
        sx={{
          // Header uses position="static" so it scrolls out of view.
          // Rails stick 16px from the top of the viewport.
          position: "sticky",
          top: 16,
          maxHeight: "calc(100vh - 16px)",
          overflowY: "auto",
          pl: 3,
          py: 2,
          borderLeft: "1px solid #E5E7EB",
        }}
      >
        {headings.map((h) => (
          <Typography
            key={h.slug}
            component="a"
            href={`#${h.slug}`}
            sx={{
              fontSize: 14,
              lineHeight: "20px",
              color: "#374151",
              textDecoration: "none",
              "&:hover": { color: "#010101" },
            }}
          >
            {h.text}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
