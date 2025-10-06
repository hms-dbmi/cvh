import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";
import { useAuth0 } from "@auth0/auth0-react";
import Box from "@mui/material/Box";

import ProjectsList, {
  PublicProjectsList,
} from "../features/projects/components/ProjectsList";
import DatasetsList from "../features/datasets/components/DatasetsList";
import { LoginButton } from "../features/navigation/components/AuthButtons";
import { Typography } from "@mui/material";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuth0();

  if (isAuthenticated) {
    return <AuthenticatedRouteComponent />;
  }

  return <UnauthenticatedRouteComponent />;
}

function AuthenticatedRouteComponent() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
        gap: 2,
        padding: 2,
      }}
    >
      <ProjectsList queryOptions={{ params: { query: { limit: 5 } } }} />
      <PublicProjectsList />
      <DatasetsList queryOptions={{ params: { query: { limit: 5 } } }} />
    </Box>
  );
}

function UnauthenticatedRouteComponent() {
  return (
    <Stack height="100%" justifyContent="center" alignItems="center">
      <Stack spacing={5}>
        <Stack spacing={2} maxWidth={1000}>
          <Typography variant="h4" component="h1">
            Create and Share Interactive Genomics Data Visualizations
          </Typography>
          <Typography variant="h5" component="p">
            Join our community of researchers and data scientists to explore,
            visualize and collaborate on complex datasets.
          </Typography>
          <Box>
            <LoginButton variant="contained" color="primary" />
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}
