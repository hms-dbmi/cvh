import { useAuth0 } from "@auth0/auth0-react";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { createFileRoute } from "@tanstack/react-router";
import UpperGridSVG from "../assets/homepage/background-grid-upper.svg";
import Features from "../features/landing/components/Features";
import Footer from "../features/landing/components/Footer";
import HeroImages from "../features/landing/components/HeroImages";
import LandingPageBackground from "../features/landing/components/LandingPageBackground";
import { LoginButton } from "../features/navigation/components/AuthButtons";
import FeaturedVisualizationsGrid from "../features/visualizations/components/FeaturedVisualizationsGrid";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

// Vertical offset of the grid backdrop in the lower section. The grid SVG
// renders at its natural 1422×1085 dimensions (same look as the upper hero
// grid). This offset shifts it so the top of the grid lands around halfway
// through the featured images. Nudge as section heights drift.
const LOWER_GRID_TOP_OFFSET_PX = 400;

function RouteComponent() {
  const { isAuthenticated, isLoading } = useAuth0();

  return (
    <LandingPageBackground>
      <Stack height="100%" width="100%" alignItems="center">
        <Stack
          alignItems="center"
          sx={{
            backgroundImage: `url(${UpperGridSVG})`,
            pb: { xs: 6, md: 10 },
          }}
          width="100%"
        >
          <Stack spacing={3} marginY={5} alignItems="center">
            <Typography
              component="h1"
              textAlign="center"
              sx={{
                fontSize: "clamp(24px, 3.2vw, 32px)",
                fontWeight: 500,
                lineHeight: 1.4,
                color: "#010101",
                maxWidth: "60ch",
              }}
            >
              Create and Share Interactive Genomics Data Visualizations
            </Typography>
            <Typography
              component="p"
              textAlign="center"
              sx={{
                fontSize: "20px",
                fontWeight: 400,
                lineHeight: 1.8,
                letterSpacing: "1px",
                color: "#010101",
                maxWidth: "70ch",
              }}
            >
              Join our community of researchers and data scientists to explore,
              visualize and collaborate on complex datasets.
            </Typography>
          </Stack>
          <Box width="90%">
            <HeroImages />
          </Box>
        </Stack>
        <Features />
        <Stack
          spacing={8}
          width="100%"
          alignItems="center"
          mt={6}
          sx={{
            backgroundImage: `url(${UpperGridSVG})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: `center ${LOWER_GRID_TOP_OFFSET_PX}px`,
          }}
        >
          <Box width="90%">
            <FeaturedVisualizationsGrid />
          </Box>
          {!isAuthenticated && !isLoading && (
            <Stack
              sx={{
                backgroundColor: "black",
                px: { xs: 4, md: 8 },
                py: { xs: 5, md: 7 },
                width: "90%",
                borderRadius: "16px",
                boxShadow: "0px 4px 24.4px 2px rgba(17, 72, 0, 0.1)",
              }}
              direction="column"
              spacing={3.5}
              alignItems="flex-start"
            >
              <Typography
                component="h2"
                sx={{
                  color: "#fff",
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 500,
                  lineHeight: 1.2,
                  textTransform: "none",
                  m: 0,
                }}
              >
                <Box component="span" display="block">
                  Ready to dive in?
                </Box>
                <Box component="span" display="block">
                  Start visualizing today.
                </Box>
              </Typography>
              <Typography
                component="p"
                sx={{
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: 400,
                  lineHeight: 1.2,
                  maxWidth: "55ch",
                }}
              >
                Join our community of researchers and scientist to discover,
                create and share biological data visualizations
              </Typography>
              <Box>
                <LoginButton
                  sx={{
                    backgroundColor: "#fff",
                    color: "#000",
                    paddingX: "22px",
                    paddingY: "16px",
                    borderRadius: "10px",
                  }}
                />
              </Box>
            </Stack>
          )}
        </Stack>
        <Box sx={{ width: "100%" }}>
          <Footer />
        </Box>
      </Stack>
    </LandingPageBackground>
  );
}
