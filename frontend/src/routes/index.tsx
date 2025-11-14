import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useAuth0 } from "@auth0/auth0-react";

import { LoginButton } from "../features/navigation/components/AuthButtons";
import { Typography } from "@mui/material";
import PublishedVisualizationGrid from "../features/visualizations/components/PublishedVisualizationGrid";
import UpperGridSVG from "../assets/homepage/background-grid-upper.svg";
import { ArrowBendUpRight } from "@phosphor-icons/react";
import { Link } from "../features/navigation/components/Links";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function Images() {
  return (
    <Stack direction="row" spacing={4} marginTop="50px" marginBottom="125px">
      <Box>
        <Box
          component="img"
          sx={{
            backgroundColor: "#fff",
            borderRadius: "16px 16px 0 16px",
            padding: 1,
          }}
          height={270}
          width={470}
          src={`${import.meta.env.VITE_CLOUDFRONT_URL}/hic_3d.png`}
        />

        <Stack
          sx={{
            borderRadius: "0 0 8px 8px",
            backgroundColor: "#fff",
            padding: "8px 12px ",
            float: "right",
            border: "1px solid #C8CCCE",
          }}
          direction="row"
          spacing={3}
        >
          <Typography
            variant="button"
            component={Link}
            to="/visualizations/0628ce1c-b287-44b9-b643-0f83f4c0e832"
            sx={{ textDecoration: "none" }}
          >
            View Visualization
          </Typography>
          <ArrowBendUpRight color="#4E5A63" size={20} />
        </Stack>
      </Box>
      <Box>
        <Box
          component="img"
          sx={{
            backgroundColor: "#fff",
            borderRadius: "16px 16px 0 16px",
            padding: 1,
          }}
          height={270}
          width={470}
          src={`${import.meta.env.VITE_CLOUDFRONT_URL}/corces.png`}
        />
        <Stack
          sx={{
            borderRadius: " 0 0 8px 8px",
            backgroundColor: "#fff",
            padding: "8px 12px",
            float: "right",
            border: "1px solid #C8CCCE",
          }}
          direction="row"
          spacing={1}
        >
          <Typography
            variant="button"
            component={Link}
            to="/visualizations/ed8bd474-b29f-4754-9592-c1c0e5e1c847"
            sx={{ textDecoration: "none" }}
          >
            View Visualization
          </Typography>
          <ArrowBendUpRight color="#4E5A63" size={20} />
        </Stack>
      </Box>
    </Stack>
  );
}

function RouteComponent() {
  const { isAuthenticated, isLoading } = useAuth0();

  return (
    <Box height="100%" width="100%" marginBottom="100px">
      <Stack height="100%" width="100%" alignItems="center">
        <Stack
          alignItems="center"
          sx={{ backgroundImage: `url(${UpperGridSVG})` }}
          width="100%"
        >
          <Stack spacing={2} marginY={8} alignItems="center">
            <Typography
              variant="h1"
              component="h1"
              textAlign="center"
              maxWidth={650}
              sx={{ fontSize: "45px", fontWeight: 500, lineHeight: "52px" }}
            >
              Create and Share Interactive Genomics Data Visualizations
            </Typography>
            <Typography
              variant="h2"
              component="p"
              sx={{ fontWeight: 300, lineHeight: "36px" }}
              maxWidth={800}
            >
              Join our community of researchers and data scientists to explore,
              visualize and collaborate on complex datasets.
            </Typography>
          </Stack>
          <Images />
        </Stack>
        <Stack spacing={5} width="100%" alignItems="center">
          <Box width="90%">
            <PublishedVisualizationGrid />
          </Box>
          {!isAuthenticated && !isLoading && (
            <Stack
              sx={{ backgroundColor: "black" }}
              paddingX={7}
              paddingY={8}
              width="90%"
              borderRadius="16px"
              direction="column"
              spacing={4}
            >
              <Box>
                <Typography variant="h1" component="p" color="#fff">
                  Ready to dive in?
                </Typography>
                <Typography variant="h1" component="p" color="#fff">
                  Start visualizing today.
                </Typography>
              </Box>
              <Typography
                color="#fff"
                component="p"
                variant="h4"
                fontWeight={400}
              >
                Join our community of researchers and scientist to discover,
                create and share biological data visualizations
              </Typography>
              <Box>
                <LoginButton
                  sx={{
                    backgroundColor: "#fff",
                    paddingX: "22px",
                    paddingY: "16px",
                    borderRadius: "10px",
                  }}
                />
              </Box>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
