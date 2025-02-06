import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { useAuth0 } from "@auth0/auth0-react";

import { LoginButton, LogoutButton } from "./AuthButtons";
import { Link } from "./Links";

export default function Header() {
  const { isAuthenticated } = useAuth0();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Link to="/" sx={(theme) => ({ color: theme.palette.common.white })}>
            CVH
          </Link>
          {!isAuthenticated && <LoginButton />}
          {isAuthenticated && <LogoutButton />}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
