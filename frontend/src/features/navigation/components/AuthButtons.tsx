import { useAuth0 } from "@auth0/auth0-react";
import Button, { type ButtonProps } from "@mui/material/Button";

const LoginButton = (props: Partial<ButtonProps>) => {
  const { loginWithRedirect } = useAuth0();

  return (
    <Button onClick={() => loginWithRedirect()} {...props}>
      Log In
    </Button>
  );
};

const LogoutButton = (props: Partial<ButtonProps>) => {
  const { logout } = useAuth0();

  return (
    <Button
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
