import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const CFDE_URL = "https://commonfund.nih.gov/dataecosystem";

// "What is the Community Visualization Hub?" — an intro slab that sits
// between the hero and the features grid. Matches Features' banded
// container language (bg #F5F7FA, border-y #CAD5DA, 1422px content
// max-width) so consecutive banded sections feel like one strip.
function HubBlurb() {
  return (
    <Box
      component="section"
      aria-labelledby="hub-blurb-heading"
      sx={{
        width: "100%",
        backgroundColor: "#F5F7FA",
        borderTop: "1px solid #CAD5DA",
        borderBottom: "1px solid #CAD5DA",
        py: { xs: 6, md: 8 },
        px: { xs: 3, md: 4 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={4}
        alignItems={{ md: "flex-start" }}
        sx={{ maxWidth: 1422, mx: "auto" }}
      >
        <Typography
          variant="h2"
          component="h2"
          id="hub-blurb-heading"
          sx={{
            color: "#212121",
            m: 0,
            flexShrink: 0,
            // Defensive override — the same one the "Ready to dive in?"
            // H2 in `index.tsx` uses. Something upstream (MUI baseline
            // interaction, likely) uppercases <h2>s that don't opt out.
            textTransform: "none",
          }}
        >
          What is the Community Visualization Hub?
        </Typography>
        <Typography
          variant="body1"
          component="p"
          sx={{
            flex: 1,
            // Figma spec is 24px, but Figma's text engine renders looser
            // than browser Helvetica Neue at the same numeric line-height;
            // 1.6 (~25.6px) matches the visual density of the canvas.
            lineHeight: 1.6,
            letterSpacing: "0.48px",
            color: "#212121",
            m: 0,
            // Divider only renders on the md+ row layout; on xs the columns
            // stack and a vertical rule between them wouldn't make sense.
            borderLeft: { md: "1px solid #CAD5DA" },
            pl: { md: 4 },
          }}
        >
          The Community Visualization Hub gives computational biology labs,
          bioinformaticians, and biomedical researchers a practical shared
          environment for turning complex genomics, spatial biology, and
          single-cell datasets into interpretable evidence. Teams can bring
          together their own data with relevant public resources from the{" "}
          <Box
            component="a"
            href={CFDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#3054A6", textDecoration: "underline" }}
          >
            Common Fund Data Ecosystem
          </Box>{" "}
          and beyond, explore genome-scale, single-cell, spatial, and bioimaging
          measurements in linked interactive views, and move fluidly from broad
          patterns to individual loci, cells, or tissue regions. By saving,
          annotating, and sharing visualization workspaces privately or
          publicly, the Hub makes exploratory analysis more reproducible and
          collaborative — helping researchers interrogate model predictions,
          compare multimodal results, generate biologically grounded hypotheses,
          and communicate the reasoning behind a finding to collaborators,
          trainees, and the wider scientific community.
        </Typography>
      </Stack>
    </Box>
  );
}

export default HubBlurb;
