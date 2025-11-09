import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useAuth0 } from "@auth0/auth0-react";

import { LoginButton } from "../features/navigation/components/AuthButtons";
import { Typography } from "@mui/material";
import PublishedVisualizationGrid from "../features/visualizations/components/PublishedVisualizationGrid";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuth0();

  return (
    <Box height="100%" width="100%">
      <Stack height="100%" width="100%" alignItems="center">
        <Stack spacing={2} maxWidth={1000} marginY={8}>
          <Typography variant="h1" component="h1">
            Create and Share Interactive Genomics Data Visualizations
          </Typography>
          <Typography variant="h2" component="p" sx={{ fontWeight: 300 }}>
            Join our community of researchers and data scientists to explore,
            visualize and collaborate on complex datasets.
          </Typography>
        </Stack>
        <Stack spacing={5} width="100%" alignItems="center">
          <Box width="90%">
          <PublishedVisualizationGrid />
          </Box>
          {!isAuthenticated && (
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
