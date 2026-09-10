// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  createRootRoute,
  ErrorComponent,
  Outlet,
} from "@tanstack/react-router";
import posthog from "@/posthog";
import Snackbar from "../components/Snackbar/Snackbar";
import Header from "../features/navigation/components/Header";

function C() {
  return (
    <Stack height="100%">
      <Box>
        <Header />
      </Box>
      <Box flexGrow={1} overflow="auto" minHeight={0}>
        <Outlet />
        <Snackbar />
      </Box>
      {/* <TanStackRouterDevtools />*/}
    </Stack>
  );
}

export const Route = createRootRoute({
  component: () => <C />,
  errorComponent: ({ error }) => {
    posthog.captureException(error);
    return <ErrorComponent error={error} />;
  },
});
