// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Outlet, createRootRoute } from "@tanstack/react-router";

import Snackbar from "../components/Snackbar/Snackbar";
import Header from "../features/navigation/components/Header";
export const Route = createRootRoute({
	component: () => (
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
	),
});
