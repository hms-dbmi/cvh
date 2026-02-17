// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import Snackbar from "../components/Snackbar/Snackbar";
import Header from "../features/navigation/components/Header";

function C() {
  return (
    <Stack height="100%">
      <Box>
        <Header />
      </Box>
      <Box flexGrow={1}>
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
