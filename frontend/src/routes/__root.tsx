// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  createRootRoute,
  ErrorComponent,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import posthog from "@/posthog";
import PageContainer from "../components/PageContainer";
import Snackbar from "../components/Snackbar/Snackbar";
import Footer from "../features/landing/components/Footer";
import Header from "../features/navigation/components/Header";

/**
 * Per-route layout opt-outs, declared as `staticData` on the route.
 *
 * Defaults give a content page what it almost always wants — content held to
 * the page boundary, with the footer below — so a new route gets the right
 * layout without doing anything. App-shell routes opt out explicitly:
 *
 * - `fullBleed`: skip the boundary. For routes that fill the viewport (the
 *   workspace, the visualization viewer) or that manage their own
 *   full-bleed bands and apply `PageContainer` internally (the landing page).
 * - `hideFooter`: for routes where a footer below the fold makes no sense.
 */
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    fullBleed?: boolean;
    hideFooter?: boolean;
  }
}

function C() {
  const matches = useMatches();
  const fullBleed = matches.some((m) => m.staticData?.fullBleed);
  const hideFooter = matches.some((m) => m.staticData?.hideFooter);

  const body = fullBleed ? (
    <Outlet />
  ) : (
    <PageContainer>
      <Outlet />
    </PageContainer>
  );

  return (
    <Stack height="100%">
      <Box>
        <Header />
      </Box>
      <Box flexGrow={1} overflow="auto" minHeight={0}>
        {hideFooter ? (
          // No wrapper at all: the workspace fills this scroll container and
          // its inner `height: 100%` chain needs a definite height to
          // resolve against, which an intermediate flex wrapper would break.
          body
        ) : (
          // One page surface for the whole route, so a page never paints
          // its own background and never has to reach past the boundary to
          // make the edges match.
          <Stack minHeight="100%" sx={{ bgcolor: "background.paper" }}>
            <Box flexGrow={1}>{body}</Box>
            <Footer />
          </Stack>
        )}
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
