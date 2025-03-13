import { createRootRoute, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Box from "@mui/material/Box";

import Header from "../features/navigation/components/Header";
import Snackbar from "../components/Snackbar/Snackbar";
export const Route = createRootRoute({
  component: () => (
    <>
      <Header />
      <Box p={2}>
        <Outlet />
        <Snackbar />
      </Box>
      {/* <TanStackRouterDevtools />*/}
    </>
  ),
});
