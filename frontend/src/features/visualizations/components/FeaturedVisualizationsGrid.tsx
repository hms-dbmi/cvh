import { useAuth0 } from "@auth0/auth0-react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowBendUpRight } from "@phosphor-icons/react";
import { Link } from "@/features/navigation/components/Links";
import {
  type FeaturedVisualization,
  useFeaturedVisualizations,
} from "../api/useFeaturedVisualizations";

function FeaturedTile({
  visualization,
}: {
  visualization: FeaturedVisualization;
}) {
  const { uuid, image, label } = visualization;
  const src = `${import.meta.env.VITE_CLOUDFRONT_URL}/${image}`;

  return (
    <Box>
      <Box
        component="img"
        src={src}
        alt={label ?? "Featured visualization"}
        sx={{
          backgroundColor: "#fff",
          borderRadius: "16px 16px 0 16px",
          padding: 1,
          width: "100%",
          aspectRatio: "1.8 / 1",
          objectFit: "contain",
          display: "block",
        }}
      />
      <Box
        sx={{
          borderRadius: "0 0 8px 8px",
          backgroundColor: "#fff",
          padding: "8px 12px",
          float: "right",
          border: "1px solid #C8CCCE",
        }}
      >
        <Typography
          variant="button"
          component={Link}
          to={`/visualizations/${uuid}`}
          sx={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          View Visualization
          <ArrowBendUpRight color="#4E5A63" size={20} />
        </Typography>
      </Box>
    </Box>
  );
}

function FeaturedVisualizationsGrid() {
  const { data: featured } = useFeaturedVisualizations();
  const { isAuthenticated, isLoading } = useAuth0();

  if (!featured?.length) {
    return null;
  }

  // First two entries render as a hero row of half-width tiles; the rest
  // flow into rows of three third-width tiles. Anything past the first
  // two grows the grid downward without being truncated.
  const heroRow = featured.slice(0, 2);
  const remaining = featured.slice(2);
  const trailingRows: FeaturedVisualization[][] = [];
  for (let i = 0; i < remaining.length; i += 3) {
    trailingRows.push(remaining.slice(i, i + 3));
  }

  // When the CTA below is hidden (authenticated users), extend the bottom
  // padding so the grid background behind this section remains visible
  // through the area where the CTA would have lived.
  const noCtaBelow = isAuthenticated && !isLoading;

  return (
    <Stack
      spacing={5}
      width="100%"
      pt={6}
      pb={noCtaBelow ? { xs: 14, md: 22 } : 6}
    >
      <Stack spacing={2}>
        <Typography
          component="h2"
          variant="h1"
          sx={{
            fontSize: "32px",
            fontWeight: 500,
            lineHeight: "52px",
            letterSpacing: 0,
            color: "#010101",
            textTransform: "none",
            m: 0,
          }}
        >
          View Featured Visualizations
        </Typography>
        <Typography
          component="p"
          sx={{
            fontSize: "20px",
            fontWeight: 300,
            lineHeight: "36px",
            letterSpacing: "1px",
            color: "#010101",
            maxWidth: "75ch",
          }}
        >
          Interact with published visualization configurations powered by
          Gosling and Vitessce. Featured examples combine harmonized metadata,
          linked views, and public datasets for exploratory analysis.
        </Typography>
      </Stack>
      {heroRow.length > 0 && (
        <Grid container spacing={4}>
          {heroRow.map((v) => (
            <Grid key={v.uuid} size={6}>
              <FeaturedTile visualization={v} />
            </Grid>
          ))}
        </Grid>
      )}
      {trailingRows.map((row) => (
        <Grid container spacing={4} key={row.map((v) => v.uuid).join("|")}>
          {row.map((v) => (
            <Grid key={v.uuid} size={4}>
              <FeaturedTile visualization={v} />
            </Grid>
          ))}
        </Grid>
      ))}
    </Stack>
  );
}

export default FeaturedVisualizationsGrid;
