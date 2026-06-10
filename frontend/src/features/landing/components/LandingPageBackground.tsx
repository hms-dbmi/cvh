import Box from "@mui/material/Box";
import type { PropsWithChildren } from "react";

function LandingPageBackground({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        backgroundImage: "linear-gradient(to bottom, #EFF3F5, #FFFFFF)",
      }}
    >
      {children}
    </Box>
  );
}

export default LandingPageBackground;
