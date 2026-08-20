import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@/features/navigation/components/Links";
import { TUTORIAL_SECTIONS, type Tutorial } from "../tutorials";

const SECTION_HEADING_SX = {
  fontSize: 11.5,
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "#6B7280",
  px: 1,
  pt: 2,
  pb: 0.5,
} as const;

function TutorialLink({
  tutorial,
  active,
}: {
  tutorial: Tutorial;
  active: boolean;
}) {
  return (
    <Link
      to="/tutorials/{-$slug}"
      params={{ slug: tutorial.slug }}
      sx={{
        display: "block",
        px: 1,
        py: 0.75,
        borderRadius: "4px",
        textDecoration: "none",
        bgcolor: active ? "#EFF3F5" : "transparent",
        "&:hover": {
          bgcolor: active ? "#EFF3F5" : "#F5F7FA",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 13.5,
          fontWeight: active ? 500 : 400,
          lineHeight: "18.5px",
          color: active ? "#010101" : "#374151",
        }}
      >
        {tutorial.title}
      </Typography>
    </Link>
  );
}

export default function TutorialSidebar({
  activeSlug,
}: {
  activeSlug: string;
}) {
  return (
    // Two layers: outer wrapper stretches to full row height and owns
    // the right border so the divider spans the whole article length;
    // inner nav is sticky so it stays put on scroll.
    <Box sx={{ width: 280, flexShrink: 0, borderRight: "1px solid #E5E7EB" }}>
      <Stack
        component="nav"
        aria-label="Tutorials"
        sx={{
          // Header uses position="static" so it scrolls out of view.
          // Rails stick 16px from the top of the viewport.
          position: "sticky",
          top: 16,
          maxHeight: "calc(100vh - 16px)",
          overflowY: "auto",
          py: 2,
          px: 1,
        }}
      >
        {TUTORIAL_SECTIONS.map((section) => (
          <Stack key={section.name ?? "__root__"} spacing={0.25}>
            {section.name && (
              <Typography sx={SECTION_HEADING_SX}>{section.name}</Typography>
            )}
            {section.tutorials.map((t) => (
              <TutorialLink
                key={t.slug}
                tutorial={t}
                active={t.slug === activeSlug}
              />
            ))}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
