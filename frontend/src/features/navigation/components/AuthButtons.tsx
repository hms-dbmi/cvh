import Button, { ButtonProps } from "@mui/material/Button";
import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = (props: Partial<ButtonProps>) => {
  const { loginWithRedirect } = useAuth0();

  return (
    <Button
      sx={(theme) => ({ color: theme.palette.common.white })}
      onClick={() => loginWithRedirect()}
      {...props}
    >
      Log In
    </Button>
  );
};

const LogoutButton = (props: Partial<ButtonProps>) => {
  const { logout } = useAuth0();

  return (
    <Button
      sx={(theme) => ({ color: theme.palette.common.white })}
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
      {...props}
    >
      Log Out
    </Button>
  );
};

export { LoginButton, LogoutButton };
