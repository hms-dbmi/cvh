import {
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import Header from "../features/navigation/components/Header";
import Snackbar from "../components/Snackbar/Snackbar";

function C() {
  return (
    <Stack height="100%">
      <Box>
        <Header />
      </Box>
      <Box p={2} flexGrow={1}>
        <Outlet />
        <Snackbar />
      </Box>
      {/* <TanStackRouterDevtools />*/}
    </Stack>
  );
}

export const Route = createRootRoute({
  component: () => <C />,
});
