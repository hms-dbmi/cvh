import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { Files, ProjectorScreenChart, Scan } from "@phosphor-icons/react";
import type { ReactNode } from "react";

const ICON_SIZE = 32;

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const cfdeIconSrc = `${import.meta.env.VITE_CLOUDFRONT_URL}/icons/cfde-logo.png`;

const FEATURES: Feature[] = [
  {
    icon: (
      <ProjectorScreenChart size={ICON_SIZE} color="#2E90B2" weight="regular" />
    ),
    title: "Interactive Genomics",
    description:
      "Create linked, multi-view genomics visualizations through an intuitive interface powered by leading visualization tools.",
  },
  {
    icon: <Scan size={ICON_SIZE} color="#2E90B2" weight="regular" />,
    title: "Collaborative Workspaces",
    description:
      "Author, save, and share visualization projects with integrated authentication and reusable workspace configurations.",
  },
  {
    icon: (
      <Box
        component="img"
        src={cfdeIconSrc}
        alt="CFDE Logo"
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          objectFit: "contain",
        }}
      />
    ),
    title: "Metadata-Driven Discovery",
    description:
      "Query metadata and browse cloud-hosted datasets across various Common Fund Data Ecosystem (CFDE) Data Coordinating Center catalogs.",
  },
  {
    icon: <Files size={ICON_SIZE} color="#2E90B2" weight="regular" />,
    title: "Guided Authoring",
    description:
      "Create expressive genomic visualizations without extensive programming experience using guided authoring tools.",
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        padding: 2,
        color: "#010101",
        flex: "1 1 240px",
        maxWidth: 320,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {feature.icon}
        <Typography
          component="h3"
          variant="subtitle1"
          sx={{ color: "inherit", m: 0 }}
        >
          {feature.title}
        </Typography>
      </Stack>
      <Typography component="p" variant="body1" color="#4E5A63">
        {feature.description}
      </Typography>
    </Stack>
  );
}

function Features() {
  return (
    <Box
      component="section"
      aria-labelledby="features-heading"
      sx={{
        width: "100%",
        backgroundColor: "#F5F7FA",
        borderTop: "1px solid #CAD5DA",
        borderBottom: "1px solid #CAD5DA",
        py: 2,
      }}
    >
      <Typography component="h2" id="features-heading" sx={visuallyHidden}>
        Features
      </Typography>
      <Stack
        direction="row"
        gap={4}
        justifyContent="center"
        flexWrap="wrap"
        sx={{ maxWidth: 1422, mx: "auto", px: 2 }}
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} feature={f} />
        ))}
      </Stack>
    </Box>
  );
}

export default Features;
