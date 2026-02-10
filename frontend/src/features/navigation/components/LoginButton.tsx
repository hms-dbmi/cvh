import { useAuth0 } from "@auth0/auth0-react";
import Button, { type ButtonProps } from "@mui/material/Button";

const LoginButton = (props: Partial<ButtonProps>) => {
  const { loginWithRedirect } = useAuth0();

  return (
    <Button color="primary" onClick={() => loginWithRedirect()} {...props}>
      Log In
    </Button>
  );
};

export default LoginButton;
