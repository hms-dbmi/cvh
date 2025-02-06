import Button from "@mui/material/Button";
import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <Button
      sx={(theme) => ({ color: theme.palette.common.white })}
      onClick={() => loginWithRedirect()}
    >
      Log In
    </Button>
  );
};

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <Button
      sx={(theme) => ({ color: theme.palette.common.white })}
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
    >
      Log Out
    </Button>
  );
};

export { LoginButton, LogoutButton };
