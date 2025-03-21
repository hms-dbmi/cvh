import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";
import { useAuth0 } from "@auth0/auth0-react";
import Box from "@mui/material/Box";

import ProjectsList, {
  PublicProjectsList,
} from "../features/projects/components/ProjectsList";
import PublishedVisualizationsList from "../features/visualizations/components/PublishedVisualizationsList";
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
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr',  lg: 'repeat(3, 1fr)' },
      gap: 2,
      padding: 2,
    }}>
      <ProjectsList queryOptions={{ params: { query: { limit: 5 } } }} />
      <PublicProjectsList />
      <DatasetsList queryOptions={{ params: { query: { limit: 5 } } }} />
    </Box>
  );
}

function UnauthenticatedRouteComponent() {
  return (
    <Stack
      direction="row"
      spacing={10}
      height="100%"
      justifyContent="center"
      alignItems="center"
    >
      <Stack spacing={2}>
        <Typography variant="h5" component="p">
          Log in to view projects, data sources and visualizations.
        </Typography>
        <Box>
          <LoginButton variant="contained" color="primary" />
        </Box>
      </Stack>
      <Stack direction="row" spacing={4}>
        <PublishedVisualizationsList
          queryOptions={{ params: { query: { limit: 5 } } }}
        />
      </Stack>
    </Stack>
  );
}
