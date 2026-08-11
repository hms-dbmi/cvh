import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@/features/navigation/components/Links";
import { TUTORIALS } from "../tutorials";

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
        spacing={0.25}
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
        {TUTORIALS.map((t) => {
          const active = t.slug === activeSlug;
          return (
            <Link
              key={t.slug}
              to="/tutorials/{-$slug}"
              params={{ slug: t.slug }}
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
                {t.title}
              </Typography>
            </Link>
          );
        })}
      </Stack>
    </Box>
  );
}
