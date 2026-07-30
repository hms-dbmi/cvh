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
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        borderRight: "1px solid #E5E7EB",
        py: 2,
        px: 1,
      }}
    >
      <Stack spacing={0.25}>
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
