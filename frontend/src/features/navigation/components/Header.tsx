import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Stack from "@mui/material/Stack";

import { useAuth0 } from "@auth0/auth0-react";

import { LoginButton, LogoutButton } from "./AuthButtons";
import { Link } from "./Links";

export default function Header() {
  const { isAuthenticated } = useAuth0();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Stack
            direction="row"
            alignItems="center"
            width="100%"
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2}>
              <Link
                to="/"
                sx={(theme) => ({ color: theme.palette.common.white })}
              >
                Home
              </Link>
              <Link
                to="/projects"
                sx={(theme) => ({ color: theme.palette.common.white })}
              >
                Projects
              </Link>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              {!isAuthenticated && <LoginButton />}
              {isAuthenticated && (
                <Link
                  to="/profile"
                  sx={(theme) => ({ color: theme.palette.common.white })}
                >
                  Profile
                </Link>
              )}
              {isAuthenticated && <LogoutButton />}
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
